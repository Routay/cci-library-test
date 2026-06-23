import cron from 'node-cron';
import Loan from '../models/Loan.js';
import { sendReminderEmail, sendOverdueEmail } from '../utils/mailer.js';

export const runLoanCheck = async () => {
  console.log('[CRON] Vérification des emprunts arrivant à échéance...');
  try {
    const today = new Date();
    
    // 1. Rappels avant échéance
    const targetDates = [
      { daysLeft: 5, date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000) },
      { daysLeft: 2, date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000) }
    ];

    for (const target of targetDates) {
      const startOfDay = new Date(target.date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(target.date.setHours(23, 59, 59, 999));

      const loansToRemind = await Loan.find({
        status: 'actif',
        dueDate: { $gte: startOfDay, $lte: endOfDay }
      }).populate('member').populate('book');

      for (const loan of loansToRemind) {
        if (loan.member && loan.book) {
          const bookInfo = { ...loan.book.toObject(), dueDate: loan.dueDate };
          await sendReminderEmail(loan.member, bookInfo, target.daysLeft);
        }
      }
    }

    // 2. Gestion des retards (statut passé en retard)
    // On trouve tous les emprunts actifs dont la date est dépassée et on les met en retard, 
    // puis on envoie un email si le statut vient de changer ou quotidiennement tant qu'il n'est pas rendu.
    // Pour éviter le spam, on peut ajouter une date de dernier rappel, mais pour simplifier ici, 
    // on va les notifier s'ils sont 'actif' et que la date est dépassée (on met à jour après l'envoi)
    
    const overdueLoans = await Loan.find({
      status: 'actif',
      dueDate: { $lt: new Date(today.setHours(0,0,0,0)) }
    }).populate('member').populate('book');

    for (const loan of overdueLoans) {
      if (loan.member && loan.book) {
        const bookInfo = { ...loan.book.toObject(), dueDate: loan.dueDate };
        await sendOverdueEmail(loan.member, bookInfo);
      }
      
      // Mettre le statut à retard
      loan.status = 'retard';
      await loan.save();
    }
    
  } catch (error) {
    console.error('[CRON ERROR]', error);
  }
};

export const startCronJobs = () => {
  // S'exécute tous les jours à 08:00
  cron.schedule('0 8 * * *', runLoanCheck);
  console.log('✅ Cron jobs planifiés');
};
