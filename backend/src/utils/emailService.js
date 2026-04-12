import nodemailer from 'nodemailer';
import * as configuracaoService from '../modules/configuracao/configuracao.service.js';

export const sendEmail = async ({ to, subject, html }) => {
  const config = await configuracaoService.getConfig();
  
  if (!config || !config.smtpHost) {
    throw new Error('Configuração SMTP não encontrada no banco de dados.');
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    // Automatic logic: 
    // - Port 465 is secure (SMTPS)
    // - Port 587 is NOT 'secure' in Nodemailer terms (it uses STARTTLS)
    secure: config.smtpPort === 465, 
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    // Adding timeout and better TLS options for stability
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] E-mail enviado para ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[SMTP ERROR] Falha ao enviar e-mail para ${to}:`, error);
    throw error;
  }
};
