import mongoose from 'mongoose';
import dotenv   from 'dotenv';
import Book     from './models/Book.js';
import User     from './models/User.js';
import Loan     from './models/Loan.js';

dotenv.config();

// ── Données livres ────────────────────────────────────────
const books = [
  {
    title:       'Les Trois Principes du Tawhid',
    author:      'Cheikh Ibn Abdil-Wahhab',
    category:    'Tawhid',
    stock:       3,
    description: 'Un ouvrage fondamental sur les bases de la croyance islamique.',
  },
  {
    title:       "La Doctrine de l'Islam",
    author:      'Khalid Maci',
    category:    'Aqida',
    stock:       2,
    description: 'Présentation claire de la doctrine islamique authentique.',
  },
  {
    title:       'La Voie du Groupe Sauve',
    author:      'Collectif',
    category:    'Aqida',
    stock:       1,
    description: "La voie de la communauté et du groupe sauvé selon les textes.",
  },
  {
    title:       "L'Unicite de Dieu",
    author:      'Cheikh Mohammed Ibn Abdil-Wahhab',
    category:    'Tawhid',
    stock:       4,
    isWeekly:    true,
    description: "Ouvrage de référence sur le Tawhid et l'unicité divine.",
  },
  {
    title:       'Etudes Islamiques Vol.I',
    author:      'Khalid Maci',
    category:    'Fiqh',
    stock:       0,
    description: 'Volume I des études islamiques couvrant le fiqh de base.',
  },
  {
    title:       'La Confiance en Allah',
    author:      'Ibn Rajab Al-Hanbali',
    category:    'Tazkiyya',
    stock:       2,
    description: 'La confiance en Allah et son influence sur la vie du croyant.',
  },
  {
    title:       'Histoires des Prophetes Vol.II',
    author:      'Abusama Drame',
    category:    'Sira',
    stock:       1,
    description: 'Histoires des prophètes racontées selon les textes authentiques.',
  },
  {
    title:       'Famille et Societe en Islam',
    author:      'Collectif',
    category:    'Fiqh',
    stock:       3,
    description: 'La famille et la société vues à travers le prisme islamique.',
  },
  {
    title:       'La Sorcellerie et la Divination',
    author:      'Collectif',
    category:    'Aqida',
    stock:       2,
    description: "Le jugement islamique sur la sorcellerie et la divination.",
  },
  {
    title:       "Pour Allah puis pour l'Histoire",
    author:      'Collectif',
    category:    'Sira',
    stock:       1,
    description: 'Récits historiques de musulmans qui ont vécu pour Allah.',
  },
];

// ── Compte administrateur ─────────────────────────────────
const adminData = {
  nom:      'Super Admin',
  prenom:   'CCI',
  email:    'superadmin@cci.sn',
  password: 'superadmin123',
  role:     'super_admin',
  actif:    true,
};

// ── Membres de test ───────────────────────────────────────
const membersData = [
  { nom: 'Diallo',  prenom: 'Moussa',   email: 'moussa@esp.sn',   tel: '+221 77 111 11 11', role: 'membre', actif: true },
  { nom: 'Sow',     prenom: 'Fatou',    email: 'fatou@esp.sn',    tel: '+221 76 222 22 22', role: 'membre', actif: true },
  { nom: 'Kone',    prenom: 'Ibrahima', email: 'ibrahima@esp.sn', tel: '+221 78 333 33 33', role: 'membre', actif: true },
  { nom: 'Ba',      prenom: 'Aicha',    email: 'aicha@esp.sn',    tel: '+221 77 444 44 44', role: 'membre', actif: false },
  { nom: 'Ndiaye',  prenom: 'Oumar',    email: 'oumar@esp.sn',    tel: '+221 76 555 55 55', role: 'membre', actif: true },
];

// ── Fonction principale ───────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cci_library'
    );
    console.log('✅ Connecté à MongoDB');

    // Vide les collections existantes
    await Promise.all([
      Book.deleteMany(),
      User.deleteMany(),
      Loan.deleteMany(),
    ]);
    console.log('🗑️  Collections vidées');

    // Insère les livres
    const createdBooks = await Book.insertMany(books);
    console.log(`📚 ${createdBooks.length} livres insérés`);

    // Crée le super admin
    await User.create(adminData);
    console.log('👤 Super Admin créé : superadmin@cci.sn / superadmin123');

    // Crée les membres
    const createdMembers = await User.insertMany(membersData);
    console.log(`👥 ${createdMembers.length} membres créés`);

    // Crée quelques emprunts de test
    const today   = new Date();
    const inTwoWeeks = new Date(today);
    inTwoWeeks.setDate(today.getDate() + 14);
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 5);

    const loans = [
      {
        member:     createdMembers[0]._id,
        book:       createdBooks[0]._id,
        borrowDate: today,
        dueDate:    inTwoWeeks,
        status:     'actif',
      },
      {
        member:     createdMembers[1]._id,
        book:       createdBooks[4]._id,
        borrowDate: pastDate,
        dueDate:    pastDate,
        status:     'retard',
      },
      {
        member:     createdMembers[2]._id,
        book:       createdBooks[5]._id,
        borrowDate: pastDate,
        dueDate:    today,
        returnDate: today,
        status:     'rendu',
      },
    ];

    await Loan.insertMany(loans);
    console.log(`📋 ${loans.length} emprunts de test créés`);

    console.log('\n🎉 Seed terminé avec succès !');
    console.log('────────────────────────────────');
    console.log('Super Admin: superadmin@cci.sn / superadmin123');
    console.log('URL    : http://localhost:5000/api/health');
    console.log('────────────────────────────────');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Erreur seed :', err.message);
    process.exit(1);
  }
}

seed();