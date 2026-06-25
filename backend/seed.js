import mongoose    from 'mongoose';
import dotenv      from 'dotenv';
import Book        from './models/Book.js';
import User        from './models/User.js';
import Loan        from './models/Loan.js';
import GrandHomme  from './models/GrandHomme.js';

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
      GrandHomme.deleteMany(),
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

    // ── Grands Hommes ─────────────────────────────────────
    const grandsHommes = [
      {
        name: 'Al-Ghazâlî',
        title: 'Hujjat al-Islam (La preuve de l\'Islam)',
        dates: '1058 – 1111',
        description: 'Théologien, philosophe et mystique persan, il a profondément influencé le développement de la théologie islamique et du soufisme. Son œuvre majeure "Revivification des sciences de la religion" (Ihyâ\' \'ulûm ad-dîn) est un classique intemporel qui demeure une référence fondamentale dans le monde musulman.',
        image: 'https://images.unsplash.com/photo-1584281720498-8fa194ddb656?auto=format&fit=crop&q=80&w=400',
        tags: ['Théologie', 'Soufisme', 'Philosophie'],
        ordre: 1,
        actif: true,
      },
      {
        name: 'Ibn Khaldoun',
        title: 'Père de la sociologie',
        dates: '1332 – 1406',
        description: 'Historien, philosophe, diplomate et sociologue avant l\'heure. Sa célèbre "Muqaddima" (Introduction à l\'histoire universelle) pose les bases de l\'analyse sociologique, de l\'économie et de l\'historiographie moderne. Il est reconnu comme un pionnier dans plusieurs domaines des sciences humaines.',
        image: 'https://images.unsplash.com/photo-1548624177-3e1ee454eb84?auto=format&fit=crop&q=80&w=400',
        tags: ['Histoire', 'Sociologie', 'Économie'],
        ordre: 2,
        actif: true,
      },
      {
        name: 'Ibn Taymiyya',
        title: 'Cheikh al-Islam',
        dates: '1263 – 1328',
        description: 'Éminent savant hanbalite, juriste et théologien. Ses écrits vastes et profonds sur la croyance (Aqida) et la jurisprudence (Fiqh) ont laissé une empreinte indélébile sur la pensée réformatrice dans le monde musulman. Il est considéré comme l\'un des plus grands savants de l\'histoire islamique.',
        image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400',
        tags: ['Aqida', 'Fiqh', 'Réforme'],
        ordre: 3,
        actif: true,
      },
      {
        name: 'Saladin (Salah al-Din)',
        title: 'Sultan d\'Égypte et de Syrie',
        dates: '1138 – 1193',
        description: 'Leader militaire et politique légendaire, connu pour sa justice, sa clémence et sa bravoure. Il a unifié le monde musulman et repris Jérusalem, tout en gagnant le respect de ses alliés comme de ses ennemis. Son héritage est celui d\'un dirigeant juste et courageux.',
        image: 'https://images.unsplash.com/photo-1590490359854-dfba196ceaca?auto=format&fit=crop&q=80&w=400',
        tags: ['Leadership', 'Histoire', 'Bravoure'],
        ordre: 4,
        actif: true,
      },
      {
        name: 'Ibn Sina (Avicenne)',
        title: 'Prince des médecins',
        dates: '980 – 1037',
        description: 'Médecin, philosophe et savant persan dont le "Canon de la Médecine" a été le manuel médical de référence en Europe et dans le monde islamique pendant des siècles. Polymathe accompli, il a aussi contribué à la physique, à la philosophie et à l\'astronomie.',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        tags: ['Médecine', 'Philosophie', 'Science'],
        ordre: 5,
        actif: true,
      },
      {
        name: 'Imam Al-Bukhari',
        title: 'Amir al-Mu\'minin fi al-Hadith',
        dates: '810 – 870',
        description: 'Compilateur du Sahih al-Bukhari, le recueil de hadiths le plus authentique de l\'Islam. Sa méthodologie rigoureuse de vérification des chaînes de transmission a établi les standards de la science du hadith pour les générations suivantes.',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=400',
        tags: ['Hadith', 'Science', 'Érudition'],
        ordre: 6,
        actif: true,
      },
    ];

    await GrandHomme.insertMany(grandsHommes);
    console.log(`🏛️  ${grandsHommes.length} Grands Hommes insérés`);

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