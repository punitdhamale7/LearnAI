const PDFDocument = require('pdfkit');

function generateCertificate(userData, courseData, callback) {
    try {
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            callback(null, pdfBuffer);
        });

        const W = doc.page.width;   // ~841.89
        const H = doc.page.height;  // ~595.28

        // ─── BACKGROUND ─────────────────────────────────────────────────────────
        // Deep navy base
        doc.rect(0, 0, W, H).fill('#0f0c29');

        // Subtle purple gradient overlay via stacked rects
        doc.rect(0, 0, W, H / 2).fill('#1a1640');
        doc.rect(0, H / 2, W, H / 2).fill('#0f0c29');

        // ─── OUTER BORDER (gold double-line) ────────────────────────────────────
        doc.lineWidth(6).strokeColor('#c9a84c')
           .rect(18, 18, W - 36, H - 36).stroke();
        doc.lineWidth(1.5).strokeColor('#e8c97a')
           .rect(26, 26, W - 52, H - 52).stroke();

        // ─── CORNER ORNAMENTS ───────────────────────────────────────────────────
        const corners = [[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]];
        corners.forEach(([cx, cy]) => {
            doc.circle(cx, cy, 8).fill('#c9a84c');
            doc.circle(cx, cy, 5).fill('#0f0c29');
            doc.circle(cx, cy, 2).fill('#c9a84c');
        });

        // ─── TOP DECORATIVE RIBBON BAR ──────────────────────────────────────────
        doc.rect(0, 0, W, 48).fill('#1e1a4a');
        doc.lineWidth(1).strokeColor('#c9a84c')
           .moveTo(0, 48).lineTo(W, 48).stroke();

        // ─── PLATFORM NAME IN RIBBON ────────────────────────────────────────────
        doc.fontSize(18)
           .fillColor('#c9a84c')
           .font('Helvetica-Bold')
           .text('L E A R N  A I  —  PLATFORM CERTIFICATE', 0, 14, { align: 'center', width: W });

        // ─── STAR MEDAL ICON (drawn with circles + lines) ───────────────────────
        const starX = W / 2;
        const starY = 112;
        const outerR = 32, innerR = 14;
        const spikes = 8;
        let starPath = '';
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (Math.PI / spikes) * i - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            const px = starX + r * Math.cos(angle);
            const py = starY + r * Math.sin(angle);
            starPath += (i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
        }
        starPath += ' Z';
        doc.path(starPath).fill('#c9a84c');
        // inner circle
        doc.circle(starX, starY, 14).fill('#1e1a4a');
        doc.circle(starX, starY, 8).fill('#c9a84c');

        // Horizontal lines flanking the star
        doc.lineWidth(1).strokeColor('#c9a84c')
           .moveTo(60, starY).lineTo(starX - 50, starY).stroke();
        doc.lineWidth(1).strokeColor('#c9a84c')
           .moveTo(starX + 50, starY).lineTo(W - 60, starY).stroke();

        // ─── MAIN HEADING ────────────────────────────────────────────────────────
        doc.fontSize(46)
           .fillColor('#e8c97a')
           .font('Helvetica-Bold')
           .text('CERTIFICATE', 0, 145, { align: 'center', width: W, characterSpacing: 6 });

        doc.fontSize(14)
           .fillColor('#a89bcc')
           .font('Helvetica')
           .text('O F   C O M P L E T I O N', 0, 198, { align: 'center', width: W, characterSpacing: 3 });

        // Thin gold divider
        const divY = 222;
        doc.lineWidth(0.8).strokeColor('#c9a84c')
           .moveTo(W / 2 - 160, divY).lineTo(W / 2 + 160, divY).stroke();

        // ─── BODY TEXT ──────────────────────────────────────────────────────────
        doc.fontSize(13)
           .fillColor('#c0b8e8')
           .font('Helvetica')
           .text('This is to proudly certify that', 0, 240, { align: 'center', width: W });

        // Student name — highlighted
        const nameY = 268;
        // name underline bar
        const nameTextWidth = Math.min((userData.fullName || 'Student').length * 22, W - 200);
        doc.rect(W / 2 - nameTextWidth / 2, nameY + 40, nameTextWidth, 3).fill('#c9a84c');

        doc.fontSize(38)
           .fillColor('#ffffff')
           .font('Helvetica-BoldOblique')
           .text(userData.fullName || 'Student', 0, nameY, { align: 'center', width: W });

        doc.fontSize(13)
           .fillColor('#c0b8e8')
           .font('Helvetica')
           .text('has successfully completed the course', 0, 322, { align: 'center', width: W });

        // ─── COURSE NAME ────────────────────────────────────────────────────────
        doc.fontSize(22)
           .fillColor('#e8c97a')
           .font('Helvetica-Bold')
           .text(courseData.title || 'Course', 60, 348, { align: 'center', width: W - 120 });

        // ─── COMPLETION DATE ────────────────────────────────────────────────────
        const completionDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        doc.fontSize(11)
           .fillColor('#a89bcc')
           .font('Helvetica')
           .text(`Completed on  ${completionDate}`, 0, 385, { align: 'center', width: W });

        // ─── BOTTOM SECTION SEPARATOR ────────────────────────────────────────────
        doc.rect(60, 410, W - 120, 0.8).fill('#3b3560');

        // ─── SIGNATURE BLOCKS ────────────────────────────────────────────────────
        const sigY = 420;
        const leftSigX  = 120;
        const rightSigX = W - 290;
        const sigW      = 160;

        // Left: Instructor
        // Stylised signature with curves
        doc.save();
        doc.strokeColor('#e8c97a').lineWidth(1.2)
           .moveTo(leftSigX + 10, sigY + 18)
           .bezierCurveTo(leftSigX + 40, sigY - 8, leftSigX + 100, sigY + 8, leftSigX + sigW - 10, sigY + 8)
           .stroke();
        doc.restore();
        // Underline
        doc.moveTo(leftSigX, sigY + 26).lineTo(leftSigX + sigW, sigY + 26)
           .strokeColor('#c9a84c').lineWidth(1).stroke();
        doc.fontSize(11).fillColor('#e8c97a').font('Helvetica-Bold')
           .text(courseData.instructor_name || 'LearnAI Team', leftSigX, sigY + 32, { width: sigW, align: 'center' });
        doc.fontSize(9).fillColor('#8b82b8').font('Helvetica')
           .text('Course Instructor', leftSigX, sigY + 48, { width: sigW, align: 'center' });

        // Right: Platform Director
        doc.save();
        doc.strokeColor('#e8c97a').lineWidth(1.2)
           .moveTo(rightSigX + 10, sigY + 18)
           .bezierCurveTo(rightSigX + 40, sigY - 6, rightSigX + 100, sigY + 10, rightSigX + sigW - 10, sigY + 6)
           .stroke();
        doc.restore();
        doc.moveTo(rightSigX, sigY + 26).lineTo(rightSigX + sigW, sigY + 26)
           .strokeColor('#c9a84c').lineWidth(1).stroke();
        doc.fontSize(11).fillColor('#e8c97a').font('Helvetica-Bold')
           .text('LearnAI Platform', rightSigX, sigY + 32, { width: sigW, align: 'center' });
        doc.fontSize(9).fillColor('#8b82b8').font('Helvetica')
           .text('Platform Director', rightSigX, sigY + 48, { width: sigW, align: 'center' });

        // ─── CENTRAL SEAL ────────────────────────────────────────────────────────
        const sealX = W / 2;
        const sealY = sigY + 30;
        doc.circle(sealX, sealY, 34).fill('#1e1a4a').stroke();
        doc.lineWidth(1.5).strokeColor('#c9a84c')
           .circle(sealX, sealY, 34).stroke();
        doc.lineWidth(0.8).strokeColor('#e8c97a')
           .circle(sealX, sealY, 28).stroke();
        // Inner star
        const sealSpikes = 6, sealOuter = 14, sealInner = 6;
        let sealStarPath = '';
        for (let i = 0; i < sealSpikes * 2; i++) {
            const angle = (Math.PI / sealSpikes) * i - Math.PI / 2;
            const r = i % 2 === 0 ? sealOuter : sealInner;
            const px = sealX + r * Math.cos(angle);
            const py = sealY + r * Math.sin(angle);
            sealStarPath += (i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
        }
        sealStarPath += ' Z';
        doc.path(sealStarPath).fill('#c9a84c');
        doc.fontSize(6).fillColor('#1e1a4a').font('Helvetica-Bold')
           .text('VERIFY', sealX - 12, sealY - 4, { width: 24, align: 'center' });

        // ─── BOTTOM FOOTER ───────────────────────────────────────────────────────
        doc.rect(0, H - 40, W, 40).fill('#1e1a4a');
        doc.lineWidth(1).strokeColor('#c9a84c')
           .moveTo(0, H - 40).lineTo(W, H - 40).stroke();

        const certificateId = `LA-${userData.id}-${courseData.id}-${Date.now().toString(36).toUpperCase()}`;
        doc.fontSize(8).fillColor('#8b82b8').font('Helvetica')
           .text(`Certificate ID: ${certificateId}`, 0, H - 28, { align: 'center', width: W });
        doc.fontSize(8).fillColor('#5c5480')
           .text('Verify authenticity at: https://learnai.com/verify', 0, H - 16, { align: 'center', width: W });

        doc.end();

    } catch (error) {
        callback(error, null);
    }
}

module.exports = { generateCertificate };
