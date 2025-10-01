import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // o tu SMTP
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const enviarMailConQR = async (destinatario, qrBase64, nombreCliente) => {
  const mailOptions = {
    from: `"Soporte Chatbot" <${process.env.MAIL_USER}>`,
    to: destinatario,
    subject: `QR de conexión WhatsApp - ${nombreCliente}`,
    html: `
      <p>Hola ${nombreCliente},</p>
      <p>Adjuntamos tu código QR para vincular el chatbot a WhatsApp:</p>
      <br>
      <img src="cid:qrimage" alt="QR" />
      <p>⚠️ Recordá que este QR expira a los pocos segundos, abrí WhatsApp Web y escanealo rápidamente.</p>
    `,
    attachments: [
      {
        filename: "qr.png",
        content: qrBase64.split("base64,")[1],
        encoding: "base64",
        cid: "qrimage",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📩 Mail con QR enviado a ${destinatario}`);
  } catch (err) {
    console.error("❌ Error enviando mail:", err);
  }
};

export { enviarMailConQR };
