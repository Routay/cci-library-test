/**
 * ============================================================
 *  SCRIPT DE CRÉATION DU COMPTE MAÎTRE (MASTER SUPERADMIN)
 *  Bibliothèque CCI — ESP
 * ============================================================
 *  Ce script crée un compte superadmin maître protégé.
 *  Il ne sera JAMAIS visible ni modifiable via l'interface.
 *
 *  Usage : node create-master-admin.js
 * ============================================================
 */

import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import dotenv   from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI non défini dans .env');
  process.exit(1);
}

// ── Identifiants du compte maître ────────────────────────────
// Ces valeurs sont définies ici UNE SEULE FOIS et ne peuvent
// pas être modifiées via l'interface d'administration.
const MASTER_EMAIL    = 'manetahirou215@gmail.com';
const MASTER_PASSWORD = 'routaycci@01-15-2002';
const MASTER_FLAG     = true; // isMasterAdmin — protège le compte
// ─────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    nom:           String,
    prenom:        String,
    email:         { type: String, lowercase: true },
    password:      String,
    role:          String,
    actif:         Boolean,
    isMasterAdmin: { type: Boolean, default: false }, // champ de protection
  },
  { strict: false }
);

async function createMasterAdmin() {
  try {
    console.log('\n🔗 Connexion à MongoDB...');
    console.log('   URI :', MONGO_URI.replace(/:\/\/[^@]+@/, '://***:***@'));

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Vérifie si le compte existe déjà
    const existing = await User.findOne({ email: MASTER_EMAIL });

    // Hash du mot de passe (12 rounds = très sécurisé)
    const hashedPassword = await bcrypt.hash(MASTER_PASSWORD, 12);

    if (existing) {
      console.log('🔄 Compte maître déjà existant — mise à jour et renforcement...');
      await User.updateOne(
        { email: MASTER_EMAIL },
        {
          $set: {
            nom:           'Tahirou',
            prenom:        'Mane',
            password:      hashedPassword,
            role:          'super_admin',
            actif:         true,
            isMasterAdmin: MASTER_FLAG,
          }
        }
      );
      console.log('✅ Compte maître mis à jour et protégé !');
    } else {
      console.log('➕ Création du nouveau compte maître...');
      await User.create({
        nom:           'Tahirou',
        prenom:        'Mane',
        email:         MASTER_EMAIL,
        password:      hashedPassword,
        role:          'super_admin',
        actif:         true,
        isMasterAdmin: MASTER_FLAG,
      });
      console.log('✅ Compte maître créé avec succès !');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🔐 COMPTE MAÎTRE SUPERADMIN CONFIGURÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📧 Email    : manetahirou215@gmail.com');
    console.log('  🔑 Password : [CONFIDENTIEL — ne jamais partager]');
    console.log('  🛡️  Statut  : Protégé (isMasterAdmin = true)');
    console.log('  🌐 URL      : https://bibliothequecci.com/admin/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    console.log('🔌 Déconnecté. Terminé !');
    process.exit(0);

  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
}

createMasterAdmin();
