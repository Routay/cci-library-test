import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration SMTP réel (Ex: Gmail)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('✉️ Mailer configuré avec le SMTP réel');

export const sendReminderEmail = async (user, book, daysLeft) => {
  if (!transporter) return;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f7f9fc; padding: 20px; text-align: center; border-bottom: 2px solid #b8985c;">
        <h2 style="color: #333; margin: 0;">CCI Bibliothèque</h2>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #555;">Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
        <p style="font-size: 16px; color: #555;">Ceci est un rappel concernant votre emprunt à la bibliothèque de la CCI.</p>
        <div style="background-color: #fcf8f2; border-left: 4px solid #b8985c; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #b8985c;">${book.title}</h3>
          <p style="margin: 0; color: #555;"><strong>Date d'échéance :</strong> ${new Date(book.dueDate || Date.now()).toLocaleDateString('fr-FR')} (Dans ${daysLeft} jours)</p>
        </div>
        <p style="font-size: 16px; color: #555;">Merci de bien vouloir rapporter ce livre avant la date limite afin d'éviter toute pénalité de retard.</p>
        <br />
        <p style="font-size: 14px; color: #999; margin-bottom: 0;">Cordialement,</p>
        <p style="font-size: 14px; color: #999; margin-top: 0;"><strong>L'équipe CCI Bibliothèque</strong></p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"CCI Bibliothèque" <admin@cci.sn>',
      to: user.email,
      subject: `Rappel d'emprunt : ${book.title}`,
      text: `Bonjour ${user.prenom}, votre emprunt du livre "${book.title}" expire dans ${daysLeft} jours.`,
      html: htmlContent,
    });
    console.log(`[EMAIL] Rappel envoyé à ${user.email}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Échec de l'envoi :", error);
  }
};

export const sendOverdueEmail = async (user, book) => {
  if (!transporter) return;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #fff0f0; padding: 20px; text-align: center; border-bottom: 2px solid #e53e3e;">
        <h2 style="color: #c53030; margin: 0;">Avis de retard - CCI Bibliothèque</h2>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #555;">Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
        <p style="font-size: 16px; color: #555;">Nous constatons que la date limite de retour pour le livre suivant est <strong>dépassée</strong> :</p>
        <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #e53e3e;">${book.title}</h3>
          <p style="margin: 0; color: #555;"><strong>Date d'échéance dépassée :</strong> ${new Date(book.dueDate || Date.now()).toLocaleDateString('fr-FR')}</p>
        </div>
        <p style="font-size: 16px; color: #555;">Veuillez restituer cet ouvrage dans les plus brefs délais ou contacter l'administration de la bibliothèque.</p>
        <br />
        <p style="font-size: 14px; color: #999; margin-bottom: 0;">Cordialement,</p>
        <p style="font-size: 14px; color: #999; margin-top: 0;"><strong>L'équipe CCI Bibliothèque</strong></p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"CCI Bibliothèque" <admin@cci.sn>',
      to: user.email,
      subject: `URGENT - Retard : ${book.title}`,
      text: `Bonjour ${user.prenom}, la date de retour de votre emprunt pour "${book.title}" est dépassée.`,
      html: htmlContent,
    });
    console.log(`[EMAIL] Avis de retard envoyé à ${user.email}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Échec de l'envoi du retard :", error);
  }
};

export const sendValidationEmail = async (user, book) => {
  if (!transporter) return;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f0fdf4; padding: 20px; text-align: center; border-bottom: 2px solid #22c55e;">
        <h2 style="color: #166534; margin: 0;">Demande validée !</h2>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #555;">Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
        <p style="font-size: 16px; color: #555;">Excellente nouvelle ! Votre demande d'emprunt a été validée par l'administration.</p>
        <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0f766e;">${book.title}</h3>
          <p style="margin: 0; color: #555;">Vous pouvez passer récupérer ce livre à la salle CCI dès à présent.</p>
        </div>
        <p style="font-size: 16px; color: #555;">Nous vous rappelons que la durée de l'emprunt commence le jour de la validation.</p>
        <br />
        <p style="font-size: 14px; color: #999; margin-bottom: 0;">Bonne lecture !</p>
        <p style="font-size: 14px; color: #999; margin-top: 0;"><strong>L'équipe CCI Bibliothèque</strong></p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"CCI Bibliothèque" <admin@cci.sn>',
      to: user.email,
      subject: `Votre emprunt est validé : ${book.title}`,
      text: `Bonjour ${user.prenom}, votre demande pour "${book.title}" a été validée.`,
      html: htmlContent,
    });
    console.log(`[EMAIL] Validation envoyée à ${user.email}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Échec de l'envoi de validation :", error);
  }
};

export const sendAdminNewLoanNotification = async (admins, loan, borrower) => {
  if (!transporter) return;

  const bookTitle = loan.book?.title || 'Livre inconnu';
  const memberName = `${borrower.prenom} ${borrower.nom}`;
  const memberEmail = borrower.email;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #fef3c7; padding: 20px; text-align: center; border-bottom: 2px solid #b8985c;">
        <h2 style="color: #92400e; margin: 0;">📚 Nouvelle demande d'emprunt</h2>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #555;">Bonjour Administrateur,</p>
        <p style="font-size: 16px; color: #555;">Une nouvelle demande d'emprunt vient d'être soumise et nécessite votre <strong>validation</strong>.</p>
        <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #b45309;">📖 ${bookTitle}</h3>
          <p style="margin: 5px 0; color: #555;"><strong>Demandeur :</strong> ${memberName}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Email :</strong> ${memberEmail}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Date de la demande :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <p style="font-size: 16px; color: #555;">Veuillez vous connecter au tableau de bord pour valider ou refuser cette demande.</p>
        <br />
        <p style="font-size: 14px; color: #999; margin-bottom: 0;">Cordialement,</p>
        <p style="font-size: 14px; color: #999; margin-top: 0;"><strong>Système CCI Bibliothèque</strong></p>
      </div>
    </div>
  `;

  for (const admin of admins) {
    try {
      await transporter.sendMail({
        from: '"CCI Bibliothèque" <admin@cci.sn>',
        to: admin.email,
        subject: `Nouvelle demande d'emprunt : ${bookTitle} — ${memberName}`,
        text: `Nouvelle demande d'emprunt de ${memberName} pour "${bookTitle}". Connectez-vous pour valider.`,
        html: htmlContent,
      });
      console.log(`[EMAIL] Notification admin envoyée à ${admin.email}`);
    } catch (error) {
      console.error(`[EMAIL ERROR] Échec notification admin à ${admin.email}:`, error);
    }
  }
};

export const sendWelcomeEmail = async (user) => {
  if (!transporter) return;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; border-bottom: 2px solid #b8985c;">
        <h2 style="color: #f0e6d3; margin: 0; font-size: 22px;">Bienvenue à la CCI Bibliothèque !</h2>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #555;">Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
        <p style="font-size: 16px; color: #555;">Nous sommes ravis de vous accueillir parmi les membres de la bibliothèque du Centre Culturel Islamique.</p>
        <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0f766e;">Votre compte est actif ✓</h3>
          <p style="margin: 5px 0; color: #555;">Vous pouvez dès à présent emprunter des livres en passant à la bibliothèque ou en soumettant une demande en ligne.</p>
        </div>
        <p style="font-size: 16px; color: #555;">N'hésitez pas à explorer notre catalogue et à profiter de nos ressources.</p>
        <br />
        <p style="font-size: 14px; color: #999; margin-bottom: 0;">Bonne lecture !</p>
        <p style="font-size: 14px; color: #999; margin-top: 0;"><strong>L'équipe CCI Bibliothèque</strong></p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"CCI Bibliothèque" <admin@cci.sn>',
      to: user.email,
      subject: 'Bienvenue à la CCI Bibliothèque !',
      text: `Bonjour ${user.prenom}, bienvenue à la CCI Bibliothèque ! Votre compte est actif.`,
      html: htmlContent,
    });
    console.log(`[EMAIL] Bienvenue envoyé à ${user.email}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Échec de l'envoi de bienvenue :", error);
  }
};
