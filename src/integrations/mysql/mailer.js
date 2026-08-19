import nodemailer from 'nodemailer';
import { EMAIL } from '../constantes.js';
import { URLS } from '../constantes.js';
import path from 'path';
import fs from 'fs';

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: EMAIL.EU, // generated ethereal user
    pass: EMAIL.EP, // generated ethereal password
  },
});

export const transporterCustomer = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: EMAIL.ECU, // generated ethereal user
    pass: EMAIL.ECP, // generated ethereal password
  },
});



export async function sendVerificationEmail(to, token, nombres) {
  const verificationLink = `${URLS.BACKEND}/api/verify-email?token=${token}`;
  const mailOptions = {
    from: EMAIL.EMAIL_USER,
    to: to,
    subject: 'Verificación de correo',
    html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <div className="overflow-hidden rounded-lg">
            <img 
              src="../assets/Logo (Sin Fondo).png" // Reemplaza con la ruta de tu imagen
              alt="Sanatorio Williams Logo" 
              className="h-32 w-auto object-contain" // Ajusta h-12 para cambiar el tamaño
            />
          </div>
          <h2>¡Bienvenido, ${nombres}!</h2>
          <p>Para activar tu cuenta, por favor haz clic en el botón de abajo:</p>
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
      console.error('Error al enviar correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
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
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Si no solicitaste este cambio, puedes ignorar este correo.
          </p>
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
      // Puedes decidir enviar el correo sin logo o detener el proceso
  }
  const mailOptions = {
    from: email,
    to: to,
    subject: 'Recordatorio de cita médica',
    html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <div className="overflow-hidden rounded-lg">
            <img 
              src="cid:logo_sanatorio" // Reemplaza con la ruta de tu imagen
              alt="Sanatorio Williams Logo" 
              className="h-32 w-auto object-contain" // Ajusta h-12 para cambiar el tamaño
            />
          </div>
          <h2>Recordatorio de cita médica</h2>
          <p>Hola, ${nombre_p}!</p>
          <p>Te recordamos que tienes una cita programada para el ${date} a las ${time}.</p>
          <p>Puedes contactarnos aqui: <br></p>
          <div class="x14z9mp xat24cr x1lziwak x1vvkbs xtlvy1s x126k92a"><div dir="auto" style="text-align: start;">
            <span class="html-span xexx8yu xyri2b x18d9i69 x1c1uobl x1hl2dhg x16tdsg8 x1vvkbs x3nfvp2 x1j61x8r x1fcty0u xdj266r xat24cr xm2jcoa x1mpyi22 xxymvpz xlup9mm x1kky2od">
              <img height="16" width="16" class="xz74otr x15mokao x1ga7v0g x16uus16 xbiv7yw" alt="📍" referrerpolicy="origin-when-cross-origin" src="https://static.xx.fbcdn.net/images/emoji.php/v9/t2d/1/16/1f4cd.png">
            </span> Visítanos en: 1ra Avenida 2-65 Zona 1, Chimaltenango.</div><div dir="auto" style="text-align: start;">
            <span class="html-span xexx8yu xyri2b x18d9i69 x1c1uobl x1hl2dhg x16tdsg8 x1vvkbs x3nfvp2 x1j61x8r x1fcty0u xdj266r xat24cr xm2jcoa x1mpyi22 xxymvpz xlup9mm x1kky2od">
              <img height="16" width="16" class="xz74otr x15mokao x1ga7v0g x16uus16 xbiv7yw" alt="📞" referrerpolicy="origin-when-cross-origin" src="https://static.xx.fbcdn.net/images/emoji.php/v9/t4d/1/16/1f4de.png">
            </span> Llámanos: 7962-7137</div><div dir="auto" style="text-align: start;"><span class="html-span xexx8yu xyri2b x18d9i69 x1c1uobl x1hl2dhg x16tdsg8 x1vvkbs x3nfvp2 x1j61x8r x1fcty0u xdj266r xat24cr xm2jcoa x1mpyi22 xxymvpz xlup9mm x1kky2od">
              <img height="16" width="16" class="xz74otr x15mokao x1ga7v0g x16uus16 xbiv7yw" alt="💬" referrerpolicy="origin-when-cross-origin" src="https://static.xx.fbcdn.net/images/emoji.php/v9/t6e/1/16/1f4ac.png">
            </span> WhatsApp: 3358-3139</div>
          </div>
          <p><br>Att. Dr. ${nombre_d}</p>

        </div>
      `,
    attachments: [
      {
        filename: 'logo.png',
        path: logoPath, // Ruta real en tu servidor
        cid: 'logo_sanatorio' // ESTO DEBE COINCIDIR CON EL SRC DEL HTML
      }
    ]
  };

  const mailDoctor = {
    from: email,
    to: EMAIL.ECU,
    subject: 'Recordatorio de cita médica',
    html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <div className="overflow-hidden rounded-lg">
            <img 
              src="cid:logo_sanatorio" // Reemplaza con la ruta de tu imagen
              alt="Sanatorio Williams Logo" 
              className="h-32 w-auto object-contain" // Ajusta h-12 para cambiar el tamaño
            />
          </div>
          <h2>Recordatorio de cita médica</h2>
          <p>Hola, ${nombre_d}!</p>
          <p>Te recordamos que tienes una cita programada para el ${date} a las ${time} horas, <br>
            con el paciente ${nombre_p}. 
          </p>
        </div>
      `,
    attachments: [
      {
        filename: 'logo.png',
        path: logoPath, // Ruta real en tu servidor
        cid: 'logo_sanatorio' // ESTO DEBE COINCIDIR CON EL SRC DEL HTML
      }
    ]
  };

  

  transporterCustomer.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
    }
  });

  transporter.sendMail(mailDoctor, (error, info) => {
    if (error) {
      console.error('Error al enviar correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
    }
  });
}

transporter.verify().then(() => {
  console.log('Mailer is ready to send emails');
})

