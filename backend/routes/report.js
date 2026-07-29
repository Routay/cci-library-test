import express from 'express';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel, ShadingType,
  TableLayoutType, VerticalAlign, convertInchesToTwip,
  Header, Footer, PageNumber, NumberFormat
} from 'docx';
import Book from '../models/Book.js';
import Loan from '../models/Loan.js';
import GrandHomme from '../models/GrandHomme.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── Helpers ─────────────────────────────────────────────
function getPreviousThursday(fromDate) {
  const d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun … 4=Thu
  const diff = (day >= 4) ? (day - 4) : (day + 3);
  d.setDate(d.getDate() - diff);
  return d;
}

function getThursdayBefore(thursday) {
  const d = new Date(thursday);
  d.setDate(d.getDate() - 7);
  return d;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtShort(d) {
  return new Date(d).toLocaleDateString('fr-FR');
}

// ── Color constants ─────────────────────────────────────
const COLORS = {
  primary:    '8B6914',   // dark gold
  primaryBg:  'FFF9E6',   // light gold bg
  green:      '16A34A',
  greenBg:    'F0FFF4',
  red:        'DC2626',
  redBg:      'FFF1F2',
  blue:       '2563EB',
  blueBg:     'EFF6FF',
  purple:     '7C3AED',
  purpleBg:   'F5F3FF',
  gray:       '6B7280',
  grayBg:     'F9FAFB',
  dark:       '1F2937',
  white:      'FFFFFF',
  border:     'E5E7EB',
};

// ── Build styled cells & rows ───────────────────────────
function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: COLORS.primary },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text,
            bold: true,
            color: COLORS.white,
            font: 'Calibri',
            size: 20,
          }),
        ],
      }),
    ],
  });
}

function dataCell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: text || '—',
            color: opts.color || COLORS.dark,
            font: 'Calibri',
            size: 19,
            bold: opts.bold || false,
            italics: opts.italics || false,
          }),
        ],
      }),
    ],
  });
}

function sectionTitle(text, emoji, color) {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({ text: `${emoji}  `, font: 'Segoe UI Emoji', size: 26 }),
      new TextRun({
        text,
        bold: true,
        color,
        font: 'Calibri',
        size: 26,
      }),
    ],
  });
}

function statusBadge(status) {
  const map = {
    en_attente: { label: 'En attente', color: 'D97706' },
    actif:      { label: 'Actif',      color: '16A34A' },
    retard:     { label: 'En retard',  color: 'DC2626' },
    rendu:      { label: 'Rendu',      color: '6B7280' },
  };
  const s = map[status] || { label: status, color: COLORS.gray };
  return new TextRun({ text: s.label, bold: true, color: s.color, font: 'Calibri', size: 19 });
}

function emptyMessage(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({
        text: `   ${text}`,
        italics: true,
        color: COLORS.gray,
        font: 'Calibri',
        size: 20,
      }),
    ],
  });
}

function separator() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
    },
    children: [],
  });
}

// ── Main route ──────────────────────────────────────────
router.get('/weekly-report', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const endThursday = getPreviousThursday(now);
    const startThursday = getThursdayBefore(endThursday);

    // End of the period = endThursday 23:59:59
    const endDate = new Date(endThursday);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(startThursday);

    // ── Fetch data ──────────────────────────────────────
    const [
      booksCreated,
      booksUpdated,
      grandsCreated,
      grandsUpdated,
      loansCreated,
      loansReturned,
      loansOverdue,
      weeklyBook,
    ] = await Promise.all([
      Book.find({ createdAt: { $gte: startDate, $lte: endDate } }).sort({ createdAt: -1 }),
      Book.find({
        updatedAt: { $gte: startDate, $lte: endDate },
        createdAt: { $lt: startDate },
      }).sort({ updatedAt: -1 }),
      GrandHomme.find({ createdAt: { $gte: startDate, $lte: endDate } }).sort({ createdAt: -1 }),
      GrandHomme.find({
        updatedAt: { $gte: startDate, $lte: endDate },
        createdAt: { $lt: startDate },
      }).sort({ updatedAt: -1 }),
      Loan.find({ createdAt: { $gte: startDate, $lte: endDate } })
        .populate('member', 'nom prenom')
        .populate('book', 'title')
        .sort({ createdAt: -1 }),
      Loan.find({ returnDate: { $gte: startDate, $lte: endDate }, status: 'rendu' })
        .populate('member', 'nom prenom')
        .populate('book', 'title')
        .sort({ returnDate: -1 }),
      Loan.find({ status: 'retard', dueDate: { $lte: endDate } })
        .populate('member', 'nom prenom')
        .populate('book', 'title')
        .sort({ dueDate: 1 }),
      Book.findOne({ isWeekly: true }),
    ]);

    // ── Build document ──────────────────────────────────
    const children = [];

    // ═══ HEADER ═══
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 40 },
        children: [
          new TextRun({
            text: 'BIBLIOTHÈQUE CCI',
            bold: true,
            color: COLORS.primary,
            font: 'Calibri',
            size: 36,
            allCaps: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: 'Rapport Hebdomadaire d\'Activités',
            bold: true,
            color: COLORS.dark,
            font: 'Calibri',
            size: 30,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `Du ${fmtDate(startDate)} au ${fmtDate(endDate)}`,
            color: COLORS.gray,
            font: 'Calibri',
            size: 22,
            italics: true,
          }),
        ],
      }),
    );

    // Résumé badge bar
    const summaryItems = [
      { label: 'Livres ajoutés', count: booksCreated.length, color: COLORS.green },
      { label: 'Livres modifiés', count: booksUpdated.length, color: COLORS.blue },
      { label: 'Emprunts', count: loansCreated.length, color: COLORS.purple },
      { label: 'Retours', count: loansReturned.length, color: COLORS.primary },
      { label: 'Retards', count: loansOverdue.length, color: COLORS.red },
    ];

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 60 },
        children: summaryItems.flatMap((item, i) => [
          ...(i > 0 ? [new TextRun({ text: '   |   ', color: COLORS.border, font: 'Calibri', size: 20 })] : []),
          new TextRun({ text: `${item.count}`, bold: true, color: item.color, font: 'Calibri', size: 24 }),
          new TextRun({ text: ` ${item.label}`, color: COLORS.gray, font: 'Calibri', size: 20 }),
        ]),
      }),
    );

    children.push(separator());

    // ═══ SECTION 1 — LIVRE DE LA SEMAINE ═══
    children.push(sectionTitle('Livre de la Semaine', '⭐', COLORS.primary));
    if (weeklyBook) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                headerCell('Titre', 35),
                headerCell('Auteur', 25),
                headerCell('Catégorie', 20),
                headerCell('Stock', 20),
              ],
            }),
            new TableRow({
              children: [
                dataCell(weeklyBook.title, 35, { bold: true }),
                dataCell(weeklyBook.author, 25),
                dataCell(weeklyBook.category, 20, { align: AlignmentType.CENTER }),
                dataCell(String(weeklyBook.stock), 20, { align: AlignmentType.CENTER }),
              ],
            }),
          ],
        }),
      );
    } else {
      children.push(emptyMessage('Aucun livre de la semaine sélectionné pour cette période.'));
    }

    children.push(separator());

    // ═══ SECTION 2 — LIVRES ═══
    children.push(sectionTitle('Livres — Nouveaux ajouts', '📚', COLORS.green));
    if (booksCreated.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                headerCell('Titre', 30),
                headerCell('Auteur', 22),
                headerCell('Catégorie', 18),
                headerCell('Stock', 10),
                headerCell('Ajouté le', 20),
              ],
            }),
            ...booksCreated.map((b, i) =>
              new TableRow({
                children: [
                  dataCell(b.title, 30, { bold: true, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(b.author, 22, { shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(b.category, 18, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(String(b.stock), 10, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(fmtShort(b.createdAt), 20, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                ],
              })
            ),
          ],
        }),
      );
    } else {
      children.push(emptyMessage('Aucun nouveau livre ajouté sur cette période.'));
    }

    // Livres modifiés
    children.push(sectionTitle('Livres — Modifications', '✏️', COLORS.blue));
    if (booksUpdated.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                headerCell('Titre', 35),
                headerCell('Auteur', 25),
                headerCell('Catégorie', 20),
                headerCell('Modifié le', 20),
              ],
            }),
            ...booksUpdated.map((b, i) =>
              new TableRow({
                children: [
                  dataCell(b.title, 35, { bold: true, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(b.author, 25, { shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(b.category, 20, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(fmtShort(b.updatedAt), 20, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                ],
              })
            ),
          ],
        }),
      );
    } else {
      children.push(emptyMessage('Aucune modification de livre sur cette période.'));
    }

    children.push(separator());

    // ═══ SECTION 3 — GRANDS HOMMES ═══
    children.push(sectionTitle('Grands Hommes — Nouveaux ajouts', '🏛️', COLORS.purple));
    if (grandsCreated.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                headerCell('Nom', 30),
                headerCell('Titre / Surnom', 30),
                headerCell('Époque', 20),
                headerCell('Ajouté le', 20),
              ],
            }),
            ...grandsCreated.map((g, i) =>
              new TableRow({
                children: [
                  dataCell(g.name, 30, { bold: true, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(g.title, 30, { shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(g.dates, 20, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(fmtShort(g.createdAt), 20, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                ],
              })
            ),
          ],
        }),
      );
    } else {
      children.push(emptyMessage('Aucun nouveau grand homme ajouté sur cette période.'));
    }

    children.push(sectionTitle('Grands Hommes — Modifications', '✏️', COLORS.blue));
    if (grandsUpdated.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                headerCell('Nom', 35),
                headerCell('Titre / Surnom', 35),
                headerCell('Modifié le', 30),
              ],
            }),
            ...grandsUpdated.map((g, i) =>
              new TableRow({
                children: [
                  dataCell(g.name, 35, { bold: true, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(g.title, 35, { shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(fmtShort(g.updatedAt), 30, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                ],
              })
            ),
          ],
        }),
      );
    } else {
      children.push(emptyMessage('Aucune modification de grand homme sur cette période.'));
    }

    children.push(separator());

    // ═══ SECTION 4 — EMPRUNTS ═══
    children.push(sectionTitle('Nouveaux Emprunts', '📋', COLORS.primary));
    if (loansCreated.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                headerCell('Membre', 22),
                headerCell('Livre', 28),
                headerCell('Emprunté le', 18),
                headerCell('Retour prévu', 18),
                headerCell('Statut', 14),
              ],
            }),
            ...loansCreated.map((l, i) =>
              new TableRow({
                children: [
                  dataCell(`${l.member?.prenom || ''} ${l.member?.nom || ''}`, 22, {
                    bold: true, shading: i % 2 === 1 ? COLORS.grayBg : undefined,
                  }),
                  dataCell(l.book?.title, 28, { shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(fmtShort(l.borrowDate), 18, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(fmtShort(l.dueDate), 18, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  new TableCell({
                    width: { size: 14, type: WidthType.PERCENTAGE },
                    shading: i % 2 === 1 ? { type: ShadingType.SOLID, color: COLORS.grayBg } : undefined,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 40, after: 40 },
                        children: [statusBadge(l.status)],
                      }),
                    ],
                  }),
                ],
              })
            ),
          ],
        }),
      );
    } else {
      children.push(emptyMessage('Aucun emprunt enregistré sur cette période.'));
    }

    // Retours
    children.push(sectionTitle('Livres Retournés', '✅', COLORS.green));
    if (loansReturned.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                headerCell('Membre', 28),
                headerCell('Livre', 32),
                headerCell('Date retour', 20),
                headerCell('Retard', 20),
              ],
            }),
            ...loansReturned.map((l, i) => {
              const wasLate = l.returnDate && l.dueDate && new Date(l.returnDate) > new Date(l.dueDate);
              const daysLate = wasLate
                ? Math.ceil((new Date(l.returnDate) - new Date(l.dueDate)) / (1000 * 60 * 60 * 24))
                : 0;
              return new TableRow({
                children: [
                  dataCell(`${l.member?.prenom || ''} ${l.member?.nom || ''}`, 28, {
                    bold: true, shading: i % 2 === 1 ? COLORS.grayBg : undefined,
                  }),
                  dataCell(l.book?.title, 32, { shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(fmtShort(l.returnDate), 20, { align: AlignmentType.CENTER, shading: i % 2 === 1 ? COLORS.grayBg : undefined }),
                  dataCell(
                    wasLate ? `${daysLate}j de retard` : 'À temps',
                    20,
                    {
                      align: AlignmentType.CENTER,
                      color: wasLate ? COLORS.red : COLORS.green,
                      bold: true,
                      shading: i % 2 === 1 ? COLORS.grayBg : undefined,
                    }
                  ),
                ],
              });
            }),
          ],
        }),
      );
    } else {
      children.push(emptyMessage('Aucun retour de livre sur cette période.'));
    }

    // Retards en cours
    children.push(sectionTitle('Emprunts en Retard (en cours)', '🔴', COLORS.red));
    if (loansOverdue.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                headerCell('Membre', 25),
                headerCell('Livre', 30),
                headerCell('Retour prévu', 20),
                headerCell('Jours de retard', 25),
              ],
            }),
            ...loansOverdue.map((l, i) => {
              const daysLate = Math.ceil((new Date() - new Date(l.dueDate)) / (1000 * 60 * 60 * 24));
              return new TableRow({
                children: [
                  dataCell(`${l.member?.prenom || ''} ${l.member?.nom || ''}`, 25, {
                    bold: true,
                    shading: i % 2 === 1 ? COLORS.redBg : undefined,
                  }),
                  dataCell(l.book?.title, 30, { shading: i % 2 === 1 ? COLORS.redBg : undefined }),
                  dataCell(fmtShort(l.dueDate), 20, {
                    align: AlignmentType.CENTER,
                    shading: i % 2 === 1 ? COLORS.redBg : undefined,
                  }),
                  dataCell(`${daysLate} jours`, 25, {
                    align: AlignmentType.CENTER,
                    bold: true,
                    color: COLORS.red,
                    shading: i % 2 === 1 ? COLORS.redBg : undefined,
                  }),
                ],
              });
            }),
          ],
        }),
      );
    } else {
      children.push(emptyMessage('Aucun emprunt en retard. Excellent !'));
    }

    // ═══ FOOTER ═══
    children.push(separator());
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 40 },
        children: [
          new TextRun({
            text: `Rapport généré le ${fmtDate(now)} — Bibliothèque CCI`,
            italics: true,
            color: COLORS.gray,
            font: 'Calibri',
            size: 18,
          }),
        ],
      }),
    );

    // ── Generate document ───────────────────────────────
    const doc = new Document({
      creator: 'Bibliothèque CCI',
      title: `Rapport Hebdomadaire — ${fmtShort(startDate)} au ${fmtShort(endDate)}`,
      description: 'Rapport hebdomadaire des activités de la bibliothèque CCI',
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Bibliothèque CCI — Rapport du ${fmtShort(endDate)}`,
                    color: COLORS.gray,
                    font: 'Calibri',
                    size: 16,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Page ',
                    color: COLORS.gray,
                    font: 'Calibri',
                    size: 16,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    color: COLORS.gray,
                    font: 'Calibri',
                    size: 16,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    const filename = `Rapport_CCI_${fmtShort(startDate).replace(/\//g, '-')}_au_${fmtShort(endDate).replace(/\//g, '-')}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
