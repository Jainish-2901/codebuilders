const CertificateQueue = require("../models/CertificateQueue");
const { generateCertificatePDF } = require("./generateCertificate");
const sendEmail = require("./sendEmail");

const processCertificateQueue = async () => {
    // 1. Fetch pending jobs (Limit 5 to prevent overload)
    const jobs = await CertificateQueue.find({ status: "pending" })
        .sort({ createdAt: 1 })
        .limit(5)
        .populate("eventId");

    if (jobs.length === 0) return;

    console.log(`[CertificateQueue] Processing ${jobs.length} certificates...`);

    // 2. Mark as processing
    const jobIds = jobs.map((job) => job._id);
    await CertificateQueue.updateMany(
        { _id: { $in: jobIds } },
        { $set: { status: "processing" } }
    );

    // 3. Process each job
    for (const job of jobs) {
        try {
            const { eventId: event, userName, userEmail } = job;

            // Generate PDF
            const pdfBuffer = await generateCertificatePDF(job, event);

            // Send Email
            const emailSubject = `Your Certificate for ${event.title}`;
            const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              
              <div style="background-color: #3b82f6; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Certificate of Participation</h1>
              </div>

              <div style="padding: 30px; color: #334155;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${userName}</strong>,</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                  Thank you for participating in <strong style="color: #3b82f6;">${event.title}</strong>!
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                  We truly appreciated your presence. Please find your official certificate of participation attached to this email.
                </p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #94a3b8;">
                  <p style="margin: 5px 0;">Best Regards,</p>
                  <p style="margin: 0; font-weight: bold; color: #3b82f6;">CodeBuilders Team</p>
                </div>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0;">© ${new Date().getFullYear()} CodeBuilders Community.</p>
              </div>
            </div>
            `;

            await sendEmail({
                email: userEmail,
                subject: emailSubject,
                html: emailHtml,
                message: "Thank you for participating! Your certificate is attached.",
                attachments: [
                    {
                        filename: `Certificate - ${userName}.pdf`,
                        content: pdfBuffer,
                        contentType: "application/pdf",
                    },
                ],
            });

            // Mark as completed
            job.status = "completed";
            await job.save();
            console.log(`[CertificateQueue] Sent to ${userEmail}`);

        } catch (error) {
            console.error(`[CertificateQueue] Failed for ${job.userEmail}:`, error.message);

            job.attempts += 1;
            if (job.attempts >= 3) {
                job.status = "failed";
                job.error = error.message;
            } else {
                job.status = "pending"; // Retry later
            }
            await job.save();
        }

        // Small delay
        await new Promise(r => setTimeout(r, 1000));
    }
};

module.exports = processCertificateQueue;
