const getRegistrationEmailHtml = (userName, event, tokenId, ticketLink) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #3730a3; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0;">Registration Confirmed!</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
        <p>You are all set for <strong>${event.title}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;">📅 <strong>Date:</strong> ${new Date(event.dateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })}</p>
          <p style="margin: 5px 0;">📍 <strong>Venue:</strong> ${event.venue}</p>
          <p style="margin: 5px 0;">🎟️ <strong>Token ID:</strong> <span style="font-family: monospace;">${tokenId}</span></p>
        </div>
        <p>Your <strong>e-Ticket PDF</strong> is attached to this email. Please scan the QR code at the entrance.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${ticketLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Mobile Ticket</a>
        </div>
        <br/>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <div style="text-align: center; font-size: 12px; color: #888;">
          <p style="margin: 5px 0;">CodeBuilders Community Team</p>
        </div>
      </div>
    </div>
  `;
};

const getNewEventEmailHtml = (userName, event, eventLink) => {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background-color: #2563eb; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Event Alert! 🚀</h1>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #334155;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
          We just announced a new event: <strong>${event.title}</strong>!
        </p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b;">${event.title}</h3>
          <p style="margin: 4px 0; color: #64748b;">📅 ${new Date(event.dateTime).toLocaleDateString()}</p>
          <p style="margin: 4px 0; color: #64748b;">📍 ${event.venue}</p>
        </div>
        <div style="text-align: center;">
          <a href="${eventLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            View Event
          </a>
        </div>
        <p style="margin-top: 30px; font-size: 14px; color: #94a3b8; text-align: center;">
          Don't miss out! Spots are limited.
        </p>
      </div>
    </div>
  `;
};

const getExternalEventEmailHtml = (userName, event) => {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Update! 🚀</h1>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #334155;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
          We just shared a new opportunity/event: <strong>${event.title}</strong>!
        </p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #0f172a; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b;">${event.title}</h3>
          <p style="margin: 4px 0; color: #64748b;">📅 ${new Date(event.date).toLocaleDateString()}</p>
          <p style="margin: 4px 0; color: #64748b;">📍 ${event.venue || 'Online'}</p>
        </div>
        <div style="text-align: center;">
            <a href="${event.link}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            View Details
            </a>
        </div>
      </div>
    </div>
  `;
};

module.exports = { getRegistrationEmailHtml, getNewEventEmailHtml, getExternalEventEmailHtml };
