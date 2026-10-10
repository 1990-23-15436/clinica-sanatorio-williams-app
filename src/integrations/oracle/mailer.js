import nodemailer from 'nodemailer';
import { EMAIL, URLS } from '../constantes.js';
import path from 'path';
import fs from 'fs';

// =========================================================================
// CORREO DE LA EMPRESA (Configura aquí la dirección simulada de la empresa)
// =========================================================================
export const COMPANY_EMAIL = 'felipediaz.customer.service@gmail.com'; 

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL.EU,
    pass: EMAIL.EP,
  },
});

export const transporterCustomer = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL.ECU,
    pass: EMAIL.ECP,
  },
});

// 1. Correo de verificación para el usuario/médico que se registra
export async function sendVerificationEmail(to, token, nombres) {
  const verificationLink = `${URLS.FRONTEND}/verificar?token=${encodeURIComponent(token)}`; // Cambiado de URLS.BACKEND a URLS.FRONTEND para redirigir al frontend
  const mailOptions = {
    from: EMAIL.EMAIL_USER,
    to: to,
    subject: 'Verificación de correo',
    html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>¡Bienvenido, ${nombres}!</h2>
          <p>Para activar tu correo electrónico, por favor haz clic en el botón de abajo:</p>
          <a href="${verificationLink}" 
             style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            Confirmar mi cuenta
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Si no creaste esta cuenta, puedes ignorar este correo.
          </p>
        </div>
      `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo de verificación:', error);
    } else {
      console.log('Correo de verificación enviado:', info.response);
    }
  });
}

// 2. Correo de autorización para la empresa
export async function sendAdminAuthorizationEmail(companyEmail, token, doctorData) {
  const authorizationLink = `${URLS.FRONTEND}/api/authorize-profile?token=${encodeURIComponent(token)}`;
  const mailOptions = {
    from: EMAIL.EMAIL_USER,
    to: companyEmail,
    subject: 'Solicitud de Autorización para Nuevo Médico / Personal',
    html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Solicitud de Autorización de Registro</h2>
          <p>Se ha registrado un nuevo usuario con rol de <strong>${doctorData.role}</strong> y requiere aprobación para acceder al sistema:</p>
          <ul>
            <li><strong>Nombre Completo:</strong> ${doctorData.names} ${doctorData.lastnames}</li>
            <li><strong>DPI:</strong> ${doctorData.dpi}</li>
            <li><strong>Correo Electrónico:</strong> ${doctorData.email}</li>
            <li><strong>Teléfono:</strong> ${doctorData.phone}</li>
          </ul>
          <p>Haz clic en el siguiente botón para autorizar el ingreso de este profesional al sistema:</p>
          <div style="text-align: center; margin-top: 25px;">
            <a href="${authorizationLink}" 
               style="background-color: #28a745; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Autorizar Registro de Médico
            </a>
          </div>
        </div>
      `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo de autorización a la empresa:', error);
    } else {
      console.log('Correo de autorización enviado a la empresa:', info.response);
    }
  });
}

export async function sendPasswordResetEmail(to, token, nombres) {
  const resetLink = `${URLS.BACKEND}/reset-password?token=${token}`;
  const mailOptions = {
    from: EMAIL.EMAIL_USER,
    to: to,
    subject: 'Restablecimiento de contraseña',
    html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>Restablecimiento de contraseña</h2>
          <p>Hola, ${nombres}!</p>
          <p>Para restablecer tu contraseña, por favor haz clic en el botón de abajo:</p>
          <a href="${resetLink}" 
             style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            Restablecer contraseña
          </a>
        </div>
      `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
    }
  });
}

export async function sendAppointmentEmail(email, to, nombre_p, nombre_d, date, time) {
  const logoPath = path.join('./assets/Logo (Sin Fondo).png');

  if (!fs.existsSync(logoPath)) {
      console.error("❌ ERROR: No se encontró el logo en:", logoPath);
  }
  const mailOptions = {
    from: email,
    to: to,
    subject: 'Recordatorio de cita médica',
    html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>Recordatorio de cita médica</h2>
          <p>Hola, ${nombre_p}!</p>
          <p>Te recordamos que tienes una cita programada para el ${date} a las ${time}.</p>
          <p>Att. Dr. ${nombre_d}</p>
        </div>
      `,
    attachments: [
      {
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo_sanatorio'
      }
    ]
  };

  const mailDoctor = {
    from: email,
    to: EMAIL.ECU,
    subject: 'Recordatorio de cita médica',
    html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>Recordatorio de cita médica</h2>
          <p>Hola, ${nombre_d}!</p>
          <p>Te recordamos que tienes una cita programada para el ${date} a las ${time} horas con el paciente ${nombre_p}.</p>
        </div>
      `,
    attachments: [
      {
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo_sanatorio'
      }
    ]
  };

  transporterCustomer.sendMail(mailOptions, (error, info) => {
    if (error) console.error('Error al enviar correo:', error);
  });

  transporter.sendMail(mailDoctor, (error, info) => {
    if (error) console.error('Error al enviar correo:', error);
  });
}

transporter.verify().then(() => {
  console.log('Mailer is ready to send emails');
});