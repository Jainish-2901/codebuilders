const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const axios = require("axios"); // Import axios for font fetching

const generateCertificatePDF = async (registration, event) => {
   // 1. Fetch Remote Font (Great Vibes - Cursive)
   let fontBuffer = null;
   try {
      const fontUrl = "https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf";
      const response = await axios.get(fontUrl, { responseType: 'arraybuffer' });
      fontBuffer = response.data;
   } catch (err) {
      console.warn("Failed to load cursive font, falling back to Times-Italic:", err.message);
   }

   return new Promise((resolve, reject) => {
      try {
         // Landscape A4 or Letter
         const doc = new PDFDocument({
            layout: "landscape",
            size: "A4",
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            autoFirstPage: true,
         });

         // Register Font if loaded
         if (fontBuffer) {
            doc.registerFont('SignatureFont', fontBuffer);
         }

         const buffers = [];
         doc.on("data", (buffer) => buffers.push(buffer));
         doc.on("end", () => resolve(Buffer.concat(buffers)));
         doc.on("error", (err) => reject(err));

         const width = doc.page.width;
         const height = doc.page.height;

         // --- COLORS ---
         const MAROON = "#800000";
         const GOLD = "#C5A059"; // Gold-ish
         const DARK_GREY = "#333333";
         const PURPLE = "#6A1B9A";
         const NAVY_BLUE = "#000080"; // Official blue ink

         // --- BORDER ---
         // Outer Gold Border
         doc.lineWidth(5)
            .strokeColor(GOLD)
            .rect(20, 20, width - 40, height - 40)
            .stroke();

         // Inner Gold Border (Thinner)
         doc.lineWidth(2)
            .strokeColor(GOLD)
            .rect(28, 28, width - 56, height - 56)
            .stroke();

         // --- LOGO (Top Right) ---
         const logoPath = path.join(__dirname, "../logo.png");
         if (fs.existsSync(logoPath)) {
            // Proper size and padding
            doc.image(logoPath, width - 140, 50, { width: 90 });
         }

         // --- BADGE / SEAL (Top Left) ---
         doc.save();
         doc.translate(100, 95); // Position

         // 1. Ribbon Tails (Wider & Thicker)
         doc.path('M -20 35 L -45 95 L -25 75 L -10 95 L -5 35').fillColor(MAROON).fill();
         doc.path('M 20 35 L 45 95 L 25 75 L 10 95 L 5 35').fillColor(MAROON).fill();

         // 2. Scalloped Edge (Sunburst Seal)
         const points = [];
         const outerRadius = 50;
         const innerRadius = 45;
         const spikes = 40;
         for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const a = (Math.PI * i) / spikes;
            points.push([Math.cos(a) * r, Math.sin(a) * r]);
         }
         doc.polygon(...points).fillColor(GOLD).fill();

         // 3. Inner Circle
         doc.circle(0, 0, 40).fillColor(PURPLE).fill();

         // 4. Inner Ring
         doc.circle(0, 0, 36).lineWidth(1).strokeColor(GOLD).stroke();

         // 5. Text Content
         doc.font("Helvetica-Bold").fontSize(10).fillColor("#FFFFFF").text("CODE", -50, -15, { width: 100, align: "center" });
         doc.font("Helvetica-Bold").fontSize(10).fillColor("#FFFFFF").text("BUILDERS", -50, -5, { width: 100, align: "center" });

         doc.font("Helvetica").fontSize(8).fillColor(GOLD).text("VERIFIED", -50, 10, { width: 100, align: "center" });

         doc.restore();

         // --- HEADER ---
         // "CODE BUILDERS" Community Title
         doc.font("Helvetica-Bold")
            .fontSize(16)
            .fillColor(NAVY_BLUE)
            .text("COMMUNITY OF CODE BUILDERS", 0, 90, { align: "center", width: width, characterSpacing: 4 });

         // "CERTIFICATE"
         doc.font("Times-Bold")
            .fontSize(60)
            .fillColor(MAROON)
            .text("CERTIFICATE", 0, 120, { align: "center", width: width, characterSpacing: 2 });

         // "OF PARTICIPATION"
         doc.font("Helvetica-Bold")
            .fontSize(18)
            .fillColor(DARK_GREY)
            .text("OF PARTICIPATION", 0, 190, { align: "center", width: width, characterSpacing: 6 });

         // --- BODY ---
         doc.moveDown(1);

         // "This certificate is proudly presented to"
         doc.font("Times-Italic")
            .fontSize(16)
            .fillColor(DARK_GREY)
            .text("This certificate is proudly presented to", 0, 250, { align: "center", width: width });

         // ATTENDEE NAME
         doc.font("Times-BoldItalic")
            .fontSize(44)
            .fillColor(PURPLE)
            .text(registration.userName, 0, 285, { align: "center", width: width });

         // Underline
         doc.lineWidth(1.5)
            .strokeColor(DARK_GREY)
            .moveTo(width / 2 - 220, 335)
            .lineTo(width / 2 + 220, 335)
            .stroke();

         // DESCRIPTION
         const eventDate = new Date(event.dateTime).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric"
         });

         const descY = 360;
         doc.fontSize(16).fillColor(DARK_GREY).font("Times-Roman");

         // Line 1: Centered simple text
         doc.text(`For participating in the ${event.title}`, 0, descY, {
            align: "center", width: width
         });

         // Line 2: Centered simple text
         doc.text(`held by Code Builders on ${eventDate}.`, 0, descY + 25, {
            align: "center", width: width
         });

         // --- FOOTER DYNAMIC LAYOUT ---
         const footerY = height - 130;
         const marginX = 20;
         const usableWidth = width - (marginX * 2);

         // Define Footer Columns (Text Block + Signatures)
         // All items in this array will be spaced evenly based on array length.
         const footerColumns = [
            { type: 'text' }, // Column 1: Community Block
            { type: 'sig', name: "Kamesh Raval", role: "Director & HOD", slug: "kamesh_raval" },
            { type: 'sig', name: "Jainish Dabgar", role: "Speaker", slug: "jainish_dabgar" }
            // If you add a 4th item here, it will automatically become a 4-column layout.
         ];

         const colCount = footerColumns.length;
         const colWidth = usableWidth / colCount;

         footerColumns.forEach((col, i) => {
            // Find center of this column
            const centerX = marginX + (i * colWidth) + (colWidth / 2);

            if (col.type === 'text') {
               // Community Description (Centered in its Column)
               const textWidth = 280;
               doc.font("Times-Bold").fontSize(15).fillColor(NAVY_BLUE)
                  .text("CODE BUILDERS", centerX - (textWidth / 2), footerY + 15, { width: textWidth, align: "center" });

               doc.font("Times-Roman").fontSize(11).fillColor(DARK_GREY)
                  .text("Community of Som-Lalit Institute of\nComputer Applications (SLICA)\nNavrangpura, Ahmedabad-9", centerX - (textWidth / 2), footerY + 35, { width: textWidth, align: "center", lineGap: 4 });

            } else if (col.type === 'sig') {
               // Signature Block (Centered in its Column)
               const sigY = footerY;
               const sigYName = sigY + 50;
               const sigYRole = sigYName + 18;
               const sigBlockWidth = 200;

               const sigPath = path.join(__dirname, `../signatures/${col.slug}.png`);
               if (fs.existsSync(sigPath)) {
                  doc.image(sigPath, centerX - 70, sigY - 10, { fit: [140, 70], align: 'center' });
               } else {
                  if (fontBuffer) doc.font("SignatureFont").fontSize(28);
                  else doc.font("Times-Italic").fontSize(24);

                  doc.fillColor(NAVY_BLUE)
                     .text(col.name, centerX - (sigBlockWidth / 2), sigY + 10, { width: sigBlockWidth, align: "center" });
               }

               doc.font("Helvetica-Bold").fontSize(12).fillColor(DARK_GREY)
                  .text(col.name.toUpperCase(), centerX - (sigBlockWidth / 2), sigYName, { width: sigBlockWidth, align: "center" });

               doc.font("Helvetica").fontSize(10).fillColor(DARK_GREY)
                  .text(col.role, centerX - (sigBlockWidth / 2), sigYRole, { width: sigBlockWidth, align: "center" });
            }
         });

         doc.end();

      } catch (error) {
         reject(error);
      }
   });
};

module.exports = { generateCertificatePDF };
