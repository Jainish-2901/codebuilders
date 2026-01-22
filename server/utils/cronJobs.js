const cron = require("node-cron");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const ExternalEvent = require("../models/ExternalEvent");
const sendEmail = require("./sendEmail");
const processEmailQueue = require("./emailQueueProcessor");
const processCertificateQueue = require("./certificateQueueProcessor");

const startCronJobs = () => {
  // 1. Daily Event Reminder (Fixed Time: 9:00 AM)
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running Daily Event Reminder Job...");

    try {
      // 1. Find events happening TOMORROW
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const upcomingEvents = await Event.find({
        date: { $gte: tomorrow, $lt: dayAfter }
      });

      if (upcomingEvents.length === 0) {
        console.log("No events tomorrow.");
        return;
      }

      // 2. For each event, find registrants and send email
      for (const event of upcomingEvents) {
        const registrations = await Registration.find({ event: event._id }).populate("user", "email name");

        console.log(`Sending reminders for: ${event.title} (${registrations.length} attendees)`);

        for (const reg of registrations) {
          if (!reg.user) continue;

          // 👇 STYLED HTML EMAIL TEMPLATE
          const htmlContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              
              <div style="background-color: #3b82f6; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Event Reminder</h1>
              </div>

              <div style="padding: 30px; color: #334155;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${reg.user.name}</strong>,</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                  We are excited to see you! This is a quick reminder that you are registered for the event happening tomorrow.
                </p>

                <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 20px;">${event.title}</h2>
                  
                  <div style="margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #64748b;">📍 Venue:</span>
                    <span style="color: #334155; margin-left: 5px;">${event.venue}</span>
                  </div>
                  
                  <div>
                    <span style="font-weight: bold; color: #64748b;">🕒 Time:</span>
                    <span style="color: #334155; margin-left: 5px;">${event.startTime}</span>
                  </div>
                </div>

                <p style="font-size: 16px; line-height: 1.6;">
                  Please arrive 15 minutes early for check-in. Have your ticket or QR code ready.
                </p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #94a3b8;">
                  <p style="margin: 5px 0;">See you there,</p>
                  <p style="margin: 0; font-weight: bold; color: #3b82f6;">CodeBuilders Team</p>
                </div>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0;">© ${new Date().getFullYear()} CodeBuilders Community.</p>
              </div>
            </div>
          `;

          try {
            await sendEmail({
              email: reg.user.email,
              subject: `Reminder: ${event.title} is Tomorrow!`,
              // Pass HTML to your mailer
              html: htmlContent,
              // Keep plain text as fallback for old devices/spam filters
              message: `Hi ${reg.user.name}, reminder for ${event.title} at ${event.venue} tomorrow at ${event.startTime}.`
            });
          } catch (err) {
            console.error(`Failed to email ${reg.user.email}`);
          }
        }
      }
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });

  // 2. Email Worker (Non-blocking / Recursive Timeout Pattern)
  const runEmailWorker = async () => {
    try {
      await processEmailQueue();
    } catch (error) {
      console.error("Email Worker Error:", error);
    } finally {
      setTimeout(runEmailWorker, 10000); // 10s delay
    }
  };
  runEmailWorker();

  // 3. Certificate Worker (Non-blocking / Recursive Timeout Pattern)
  const runCertWorker = async () => {
    try {
      await processCertificateQueue();
    } catch (error) {
      console.error("Certificate Worker Error:", error);
    } finally {
      setTimeout(runCertWorker, 15000); // 15s delay
    }
  };
  runCertWorker();
};

module.exports = startCronJobs;