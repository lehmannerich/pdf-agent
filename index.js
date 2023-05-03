const express = require("express");
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
const app = express();

app.use(express.json());

app.post("/generate-pdf", async (req, res) => {
  const { email, content, subject, filename } = req.body;

  try {
    const pdfBuffer = await generatePDF(content, filename);
    await sendEmail(email, subject, pdfBuffer, filename);

    res.status(200).json({
      status: "success",
      message: "PDF generated and emailed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while processing your request",
    });
  }
});

async function generatePDF(content, filename) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(content, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
}

async function sendEmail(to, subject, pdfBuffer, filename) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text: "Here is the PDF you requested.",
    attachments: [
      {
        filename,
        content: pdfBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
