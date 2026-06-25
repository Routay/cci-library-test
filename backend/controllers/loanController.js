import Loan from '../models/Loan.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendValidationEmail, sendAdminNewLoanNotification } from '../utils/mailer.js';
import { runLoanCheck } from '../services/cron.js';

export const testCron = async (req, res) => {
  try {
    await runLoanCheck();
    res.json({ message: 'Vérification manuelle des emprunts et envoi d\'emails exécutés avec succès.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLoans = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'tous') {
      query.status = status;
    }

    // Met à jour automatiquement les emprunts en retard
    await Loan.updateMany(
      { dueDate: { $lt: new Date() }, status: 'actif' },
      { status: 'retard' }
    );

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
      .populate('member', 'nom prenom email')
      .populate('book', 'title author')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ loans, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createLoanAdmin = async (req, res) => {
  try {
    const { member, book, dueDate, notes } = req.body;

    const bookDoc = await Book.findById(book);
    if (!bookDoc) return res.status(404).json({ message: 'Livre introuvable' });
    if (bookDoc.stock <= 0) return res.status(400).json({ message: 'Livre non disponible (stock épuisé)' });

    const loan = await Loan.create({ member, book, dueDate, notes, status: 'actif' });
    await Book.findByIdAndUpdate(book, { $inc: { stock: -1 } });

    await loan.populate([
      { path: 'member', select: 'nom prenom email' },
      { path: 'book', select: 'title author' },
    ]);

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'CREATE',
      entity: 'Loan',
      details: `Création manuelle de l'emprunt pour le livre "${loan.book.title}" pour le membre "${loan.member.prenom} ${loan.member.nom}"`
    });

    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const requestPublicLoan = async (req, res) => {
  try {
    const { nom, prenom, email, tel, bookId, livre, date, note,
            etablissement, sexe, departement, logeCampus, chambre } = req.body;

    let member = await User.findOne({ email });
    if (!member) {
      member = await User.create({
        nom, prenom, email, telephone: tel,
        role: 'membre', password: 'password123',
        etablissement: etablissement || '',
        sexe: sexe || '',
        departement: departement || '',
        logeCampus: logeCampus || false,
        chambre: chambre || '',
      });
    } else {
      // Mettre à jour les infos du membre existant
      if (etablissement) member.etablissement = etablissement;
      if (sexe) member.sexe = sexe;
      if (departement) member.departement = departement;
      if (logeCampus !== undefined) member.logeCampus = logeCampus;
      if (chambre) member.chambre = chambre;
      if (tel) member.tel = tel;
      await member.save();
    }

    let bookDoc;
    if (bookId) {
      bookDoc = await Book.findById(bookId);
    } else if (livre) {
      bookDoc = await Book.findOne({ title: livre });
    }

    if (!bookDoc) return res.status(404).json({ message: 'Livre introuvable' });
    if (bookDoc.stock <= 0) return res.status(400).json({ message: 'Livre non disponible (stock épuisé)' });

    const loan = await Loan.create({
      member: member._id,
      book: bookDoc._id,
      dueDate: new Date(date),
      notes: note,
      status: 'en_attente',
    });

    await loan.populate([
      { path: 'member', select: 'nom prenom email' },
      { path: 'book', select: 'title author' },
    ]);

    // Notifier les super-admins de la nouvelle demande
    try {
      const superAdmins = await User.find({ role: { $in: ['super_admin', 'admin'] }, actif: true });
      if (superAdmins.length > 0) {
        await sendAdminNewLoanNotification(superAdmins, loan, member);
      }
    } catch (emailErr) {
      console.error('[EMAIL] Erreur notification admin:', emailErr);
    }

    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const markLoanReturned = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('book member');
    if (!loan) return res.status(404).json({ message: 'Emprunt introuvable' });

    loan.status = 'rendu';
    loan.returnDate = new Date();
    await loan.save();

    await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: 1 } });

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'RETURN',
      entity: 'Loan',
      details: `Retour de l'emprunt du livre "${loan.book.title}" par le membre "${loan.member.prenom} ${loan.member.nom}"`
    });

    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateLoan = async (req, res) => {
  try {
    const existing = await Loan.findById(req.params.id).populate('book member');
    if (!existing) return res.status(404).json({ message: 'Emprunt introuvable' });

    const newStatus = req.body.status;
    let validated = false;

    if (existing.status === 'en_attente' && newStatus === 'actif') {
      if (existing.book.stock <= 0) return res.status(400).json({ message: 'Stock épuisé' });
      await Book.findByIdAndUpdate(existing.book._id, { $inc: { stock: -1 } });
      validated = true;
    }

    const updates = { ...req.body };
    if (validated) updates.borrowDate = new Date();

    const loan = await Loan.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('member', 'nom prenom email')
      .populate('book', 'title author');

    if (validated) {
      await sendValidationEmail(loan.member, loan.book);
      await ActivityLog.create({
        adminId: req.user._id,
        action: 'VALIDATE',
        entity: 'Loan',
        details: `Validation de l'emprunt du livre "${loan.book.title}" pour le membre "${loan.member.prenom} ${loan.member.nom}"`
      });
    } else {
      await ActivityLog.create({
        adminId: req.user._id,
        action: 'UPDATE',
        entity: 'Loan',
        details: `Mise à jour de l'emprunt (${loan._id})`
      });
    }

    res.json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const extendLoan = async (req, res) => {
  try {
    const { days = 7 } = req.body;
    const loan = await Loan.findById(req.params.id).populate('book member');
    if (!loan) return res.status(404).json({ message: 'Emprunt introuvable' });
    if (loan.status === 'rendu') {
      return res.status(400).json({ message: 'Impossible de prolonger un emprunt déjà rendu' });
    }

    const oldDate = new Date(loan.dueDate);
    const newDate = new Date(oldDate);
    newDate.setDate(newDate.getDate() + Number(days));
    loan.dueDate = newDate;

    // Recalcul du statut
    if (loan.status === 'retard' && newDate > new Date()) {
      loan.status = 'actif';
    }
    await loan.save();

    await loan.populate([
      { path: 'member', select: 'nom prenom email' },
      { path: 'book', select: 'title author' },
    ]);

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'UPDATE',
      entity: 'Loan',
      details: `Prolongation de l'emprunt du livre "${loan.book.title}" pour "${loan.member.prenom} ${loan.member.nom}" (+${days} jours)`
    });

    res.json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('book member');
    if (!loan) return res.status(404).json({ message: 'Emprunt introuvable' });
    
    await Loan.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'DELETE',
      entity: 'Loan',
      details: `Suppression de l'emprunt du livre "${loan.book?.title || 'Inconnu'}" pour "${loan.member?.prenom || ''} ${loan.member?.nom || ''}"`
    });

    res.json({ message: 'Emprunt supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
