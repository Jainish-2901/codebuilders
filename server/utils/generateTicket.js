const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

// --- Design Constants ---
const COLORS = {
   primary: "#3730a3", // Deep Indigo
   textDark: "#111827", // Near Black
   textGray: "#6b7280", // Medium Gray
   border: "#e5e7eb",   // Light Gray
};

const generateTicketPDF = async (registration, event) => {
   return new Promise(async (resolve, reject) => {
      try {
         // --- 🛡️ Validation & Fallbacks ---
         if (!registration || !event) {
            console.error("[generateTicketPDF] Missing registration or event data");
            return reject(new Error("Missing registration or event data"));
         }

         const safeTitle = event.title || "Event Ticket";
         const safeVenue = event.venue || "Venue TBD";
         const safeUserName = registration.userName || "Guest";
         const safeTokenId = registration.tokenId || "N/A";

         // Date Safety
         let dateStr = "Date TBA";
         if (event.dateTime) {
            const d = new Date(event.dateTime);
            if (!isNaN(d.getTime())) {
               dateStr = d.toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'full',
                  timeStyle: 'short'
               });
            }
         }

         // Setup: A5 Landscape
         const doc = new PDFDocument({
            size: "A5",
            layout: "landscape",
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            autoFirstPage: true
         });

         const buffers = [];
         doc.on("data", (buffer) => buffers.push(buffer));
         doc.on("end", () => resolve(Buffer.concat(buffers)));
         doc.on("error", (err) => reject(err));

         const width = doc.page.width;
         const height = doc.page.height;
         const margin = 25;

         // --- 1. Background Border ---
         doc.lineWidth(2)
            .strokeColor(COLORS.border)
            .rect(margin, margin, width - (margin * 2), height - (margin * 2))
            .stroke();

         // --- 2. Header Strip ---
         const headerHeight = 70;
         doc.rect(margin, margin, width - (margin * 2), headerHeight)
            .fill(COLORS.primary);

         // "EVENT TICKET" Title
         doc.fillColor("#FFFFFF")
            .font("Helvetica-Bold")
            .fontSize(24)
            .text("EVENT TICKET", margin + 20, margin + 22, { baseline: 'top' });

         // --- LOGO & COMMUNITY NAME ---
         const logoPath = path.join(__dirname, "../logo.png");
         const logoSize = 30;
         const textX = width - margin - 20;

         if (fs.existsSync(logoPath)) {
            try {
               const logoX = textX - 160;
               doc.image(logoPath, logoX, margin + 20, { width: logoSize });
               doc.fontSize(12)
                  .font("Helvetica")
                  .opacity(0.9)
                  .text("CodeBuilders Community", logoX + logoSize + 10, margin + 28);
            } catch (e) {
               console.error("Logo Load Error:", e);
            }
         } else {
            doc.fontSize(12)
               .font("Helvetica")
               .opacity(0.9)
               .text("CodeBuilders Community", margin, margin + 28, { align: 'right', width: width - (margin * 2) - 20 });
         }

         doc.opacity(1.0);

         // --- 3. Main Layout ---
         const contentTop = margin + headerHeight + 35;
         const leftColX = margin + 25;
         const rightColX = width * 0.65;

         // === LEFT SIDE: DETAILS ===
         doc.fillColor(COLORS.textDark);

         // Title
         doc.font("Helvetica-Bold").fontSize(20)
            .text(safeTitle, leftColX, contentTop, { width: 300, lineGap: 5 });

         const afterTitleY = doc.y + 15;

         // Date Block
         doc.font("Helvetica").fontSize(9).fillColor(COLORS.textGray)
            .text("DATE & TIME", leftColX, afterTitleY);
         doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.textDark)
            .text(dateStr, leftColX, doc.y + 4);

         // Venue Block
         doc.font("Helvetica").fontSize(9).fillColor(COLORS.textGray)
            .text("VENUE", leftColX, doc.y + 15);
         doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.textDark)
            .text(safeVenue, leftColX, doc.y + 4);

         // Attendee Block
         doc.font("Helvetica").fontSize(9).fillColor(COLORS.textGray)
            .text("ATTENDEE", leftColX, doc.y + 15);
         doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.primary)
            .text(safeUserName, leftColX, doc.y + 4);

         // === RIGHT SIDE: QR CODE ===
         const qrBoxSize = 140;
         const qrY = contentTop + 10;

         try {
            const qrBuffer = await QRCode.toBuffer(safeTokenId, {
               margin: 1,
               width: qrBoxSize,
               color: { dark: COLORS.textDark, light: '#0000' }
            });

            doc.image(qrBuffer, rightColX, qrY, { width: qrBoxSize });

            doc.font("Courier-Bold").fontSize(10).fillColor(COLORS.textDark)
               .text(safeTokenId, rightColX, qrY + qrBoxSize + 5, {
                  width: qrBoxSize,
                  align: 'center'
               });

         } catch (err) { console.error("QR Error", err); }

         // --- 4. Footer ---
         doc.fontSize(8).fillColor(COLORS.textGray)
            .text(
               "Please present this ticket at the event entrance. One-time use only.",
               margin,
               height - margin - 20,
               { width: width - (margin * 2), align: 'center' }
            );

         doc.end();

      } catch (error) {
         console.error("Generate Ticket PDF Error:", error);
         reject(error);
      }
   });
};

module.exports = { generateTicketPDF };