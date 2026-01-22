const nodemailer = require("nodemailer");
const EmailQueue = require("../models/EmailQueue");
const { generateTicketPDF } = require("./generateTicket");
const { getRegistrationEmailHtml, getNewEventEmailHtml, getExternalEventEmailHtml } = require("./emailTemplates");

// Configure Transporter once
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const processEmailQueue = async () => {
    // 1. Find pending jobs (process 5 at a time)
    const jobs = await EmailQueue.find({ status: "pending" })
        .sort({ createdAt: 1 })
        .limit(5);

    if (jobs.length === 0) return;

    console.log(`[EmailQueue] Processing ${jobs.length} emails...`);

    // 2. Mark as processing
    const jobIds = jobs.map((job) => job._id);
    await EmailQueue.updateMany(
        { _id: { $in: jobIds } },
        { $set: { status: "processing" } }
    );

    // 3. Process each job
    for (const job of jobs) {
        try {
            let subject = job.subject;
            let html = job.html;
            let attachments = job.attachments || [];

            // 🚀 DYNAMIC CONTENT GENERATION BASED ON TYPE
            if (job.type === 'REGISTRATION' && job.data) {
                const { userName, event, tokenId, ticketLink, registrationId } = job.data;

                // Generate PDF on the fly
                console.log(`[EmailQueue] Generating Ticket for: ${userName}`);

                // Validate Data
                if (!event || !event.title) throw new Error("Missing event title in job data");

                // We construct a mock registration object since generateTicketPDF expects structure
                const registrationMock = {
                    userName: userName || "Guest",
                    tokenId: tokenId || "UNKNOWN",
                    _id: registrationId // passing ID just in case needed
                };

                // Generate PDF
                const pdfBuffer = await generateTicketPDF(registrationMock, event);

                // Build Attachments
                attachments = [{
                    filename: `${event.title.replace(/[^a-z0-9]/gi, '_')}_Ticket.pdf`,
                    content: pdfBuffer, // Nodemailer handles Buffer directly
                    contentType: "application/pdf",
                }];

                // Generate HTML
                html = getRegistrationEmailHtml(userName, event, tokenId, ticketLink);
                if (!subject) subject = `Your Ticket: ${event.title}`;

            } else if (job.type === 'NEW_EVENT' && job.data) {
                const { userName, event, eventLink } = job.data;

                // Generate HTML
                html = getNewEventEmailHtml(userName, event, eventLink);
                if (!subject) subject = `New Event: ${event.title}`;

            } else if (job.type === 'EXTERNAL_EVENT_ALERT' && job.data) {
                const { userName, event } = job.data;
                html = getExternalEventEmailHtml(userName, event);
                subject = subject || `New Opportunity: ${event.title}`;
            }

            // Fallback validation
            if (!html) {
                throw new Error("No HTML content available for email");
            }

            await transporter.sendMail({
                from: '"CodeBuilders" <no-reply@codebuilders.com>',
                to: job.to,
                subject: subject,
                html: html,
                attachments: attachments,
                headers: {
                    "X-Priority": "3",
                    "X-MSMail-Priority": "Normal",
                    "X-Mailer": "Nodemailer",
                    "List-Unsubscribe": "<mailto:unsubscribe@codebuilders.com>",
                },
            });

            // Mark success
            job.status = "completed";
            // Clear data/html/attachments to save space after processing if desired? 
            // For now, let's keep the record but maybe clear large data if we want.
            // But strict requirement was "storing very high remove from it", which we solved by NOT storing it initially.
            // So we are good.
            await job.save();

        } catch (error) {
            console.error(`[EmailQueue] Failed job ${job._id}:`, error.message);

            job.attempts += 1;
            if (job.attempts >= 3) {
                job.status = "failed";
                job.error = error.message;
            } else {
                job.status = "pending";
            }
            await job.save();
        }
    }
};

module.exports = processEmailQueue;
