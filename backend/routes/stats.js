import express from 'express';
import Book    from '../models/Book.js';
import Loan    from '../models/Loan.js';
import User    from '../models/User.js';
import Visit   from '../models/Visit.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── POST /api/stats/visit ── Enregistrer une visite (public) ──
router.post('/visit', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await Visit.findOneAndUpdate(
      { date: today },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/stats/visits ── Visites des 30 derniers jours (admin) ──
router.get('/visits', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const visits = await Visit.find({ date: { $gte: startDate } }).sort({ date: 1 });

    // Remplir les jours manquants avec 0
    const result = [];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const found = visits.find(v => v.date === dateStr);
      result.push({
        date: dateStr,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        day: dayNames[d.getDay()],
        count: found ? found.count : 0,
      });
    }

    const totalVisits = result.reduce((s, r) => s + r.count, 0);
    const avgPerDay = result.length > 0 ? Math.round(totalVisits / result.length) : 0;

    res.json({ visits: result, totalVisits, avgPerDay });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/stats/public ── Statistiques publiques (Homepage) ──
router.get('/public', async (req, res) => {
  try {
    const [
      totalBooks,
      activeMembers,
      activeLoans,
      weeklyBook,
      categoriesCount,
      recentBooks,
    ] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments({ role: 'membre', actif: true }),
      Loan.countDocuments({ status: 'actif' }),
      Book.findOne({ isWeekly: true }),
      Book.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // 4 derniers livres ajoutés/modifiés
      Book.find({ stock: { $gt: 0 } })
        .sort({ updatedAt: -1 })
        .limit(4)
        .select('title author category stock cover'),
    ]);

    res.json({
      totalBooks,
      activeMembers,
      activeLoans,
      weeklyBook,
      categoriesCount,
      recentBooks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/stats/growth ── Analytics de croissance (Admin) ──
router.get('/growth', protect, adminOnly, async (req, res) => {
  try {
    const months  = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const now     = new Date();

    // Construire les 6 derniers mois (labels garantis même si pas de données)
    const slots = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      slots.push({ year: d.getFullYear(), month: d.getMonth() + 1, name: `${months[d.getMonth()]} ${d.getFullYear()}` });
    }

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Emprunts par mois
    const loansByMonth = await Loan.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    ]);

    // Nouveaux membres par mois
    const membersByMonth = await User.aggregate([
      { $match: { role: 'membre', createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    ]);

    // Fusionner les données sur les 6 slots garantis
    const formattedData = slots.map(slot => {
      const loan   = loansByMonth.find(l => l._id.year === slot.year && l._id.month === slot.month);
      const member = membersByMonth.find(m => m._id.year === slot.year && m._id.month === slot.month);
      return {
        name:     slot.name,
        emprunts: loan   ? loan.count   : 0,
        membres:  member ? member.count : 0,
      };
    });

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/stats/dashboard ── KPIs + données dashboard ──
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    // Met à jour les retards automatiquement
    await Loan.updateMany(
      { dueDate: { $lt: new Date() }, status: 'actif' },
      { status: 'retard' }
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBooks,
      activeLoans,
      pendingLoans,
      overdueLoans,
      totalMembers,
      recentLoans,
      lowStock,
      activeMembers,
      // Nouvelles métriques
      totalReturned,
      returnedOnTime,
      returnedThisMonth,
      topBooks,
      categoryBreakdown,
      criticalOverdue,
    ] = await Promise.all([
      Book.countDocuments(),
      Loan.countDocuments({ status: 'actif' }),
      Loan.countDocuments({ status: 'en_attente' }),
      Loan.countDocuments({ status: 'retard' }),
      User.countDocuments({ role: 'membre', actif: true }),
      Loan.find()
        .populate('member', 'nom prenom email')
        .populate('book',   'title')
        .sort({ createdAt: -1 })
        .limit(6),
      Book.find({ stock: { $lte: 1 } })
        .select('title stock')
        .limit(5),
      User.find({ role: 'membre', actif: true })
        .select('nom prenom email tel createdAt')
        .sort({ createdAt: -1 })
        .limit(10),

      // Total des emprunts rendus
      Loan.countDocuments({ status: 'rendu' }),
      // Rendus à temps (returnDate <= dueDate)
      Loan.countDocuments({
        status: 'rendu',
        returnDate: { $ne: null },
        $expr: { $lte: ['$returnDate', '$dueDate'] },
      }),
      // Rendus ce mois-ci
      Loan.countDocuments({
        status: 'rendu',
        returnDate: { $gte: startOfMonth },
      }),
      // Top 5 livres les plus empruntés
      Loan.aggregate([
        { $group: { _id: '$book', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookInfo',
          }
        },
        { $unwind: '$bookInfo' },
        { $project: {
            _id: 1,
            count: 1,
            title: '$bookInfo.title',
            author: '$bookInfo.author',
            category: '$bookInfo.category',
          }
        },
      ]),
      // Répartition des emprunts par catégorie de livre
      Loan.aggregate([
        { $lookup: {
            from: 'books',
            localField: 'book',
            foreignField: '_id',
            as: 'bookInfo',
          }
        },
        { $unwind: '$bookInfo' },
        { $group: {
            _id: '$bookInfo.category',
            count: { $sum: 1 },
          }
        },
        { $sort: { count: -1 } },
      ]),
      // Emprunts en retard critiques (> 7 jours)
      Loan.find({
        status: 'retard',
        dueDate: { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      })
        .populate('member', 'nom prenom email')
        .populate('book', 'title')
        .sort({ dueDate: 1 })
        .limit(10),
    ]);

    const returnRate = totalReturned > 0
      ? Math.round((returnedOnTime / totalReturned) * 100)
      : 100;

    res.json({
      kpis: {
        totalBooks,
        activeLoans,
        pendingLoans,
        overdueLoans,
        totalMembers,
        returnRate,
        returnedThisMonth,
      },
      recentLoans,
      lowStock,
      activeMembers,
      topBooks,
      categoryBreakdown,
      criticalOverdue,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;