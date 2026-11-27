/**
 * ============================================================
 *  SCRIPT DE RÉINITIALISATION DU SUPERADMIN
 *  Bibliothèque CCI — ESP
 * ============================================================
 *  Usage :
 *    node reset-superadmin.js
 *  Ou avec une URI MongoDB Atlas directement :
 *    MONGO_URI="mongodb+srv://..." node reset-superadmin.js
 * ============================================================
 */

import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import dotenv   from 'dotenv';

dotenv.config();

// ── Paramètres du compte superadmin ──────────────────────────
const SUPERADMIN_EMAIL    = 'superadmin@cci.sn';
const NEW_PASSWORD        = 'Superadmin2026';   // Mot de passe réinitialisé
// ─────────────────────────────────────────────────────────────

// Prend la MONGO_URI de l'environnement (variable d'env ou .env)
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI non défini. Ajoutez-le dans .env ou passez-le en variable.');
  process.exit(1);
}

async function resetPassword() {
  try {
    console.log('\n🔗 Connexion à MongoDB...');
    console.log('   URI :', MONGO_URI.replace(/:\/\/[^@]+@/, '://***:***@')); // Masque les identifiants

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Schéma minimal User (sans importer le modèle complet)
    const UserSchema = new mongoose.Schema(
      {
        nom:      String,
        prenom:   String,
        email:    { type: String, lowercase: true },
        password: String,
        role:     String,
        actif:    Boolean,
      },
      { strict: false }
    );

    // Évite le re-enregistrement si le modèle existe déjà
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Cherche le compte superadmin
    const user = await User.findOne({ email: SUPERADMIN_EMAIL });

    if (!user) {
      console.log(`⚠️  Aucun compte trouvé avec l'email : ${SUPERADMIN_EMAIL}`);
      console.log('   Création d\'un nouveau compte superadmin...\n');

      const hashed = await bcrypt.hash(NEW_PASSWORD, 12);
      await User.create({
        nom:      'Admin',
        prenom:   'Super',
        email:    SUPERADMIN_EMAIL,
        password: hashed,
        role:     'super_admin',
        actif:    true,
      });
      console.log('✅ Compte superadmin créé avec succès !');
    } else {
      console.log(`👤 Compte trouvé : ${user.prenom} ${user.nom} (${user.role})`);

      // Hash du nouveau mot de passe
      const hashed = await bcrypt.hash(NEW_PASSWORD, 12);

      // Mise à jour directe (bypasse le middleware pre-save pour éviter double-hash)
      await User.updateOne(
        { email: SUPERADMIN_EMAIL },
        {
          $set: {
            password: hashed,
            actif:    true,          // Réactive le compte si désactivé
            role:     'super_admin', // Assure le bon rôle
          }
        }
      );

      console.log('✅ Mot de passe réinitialisé avec succès !');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📧 Email    :', SUPERADMIN_EMAIL);
    console.log('  🔑 Password :', NEW_PASSWORD);
    console.log('  🌐 URL      : https://bibliothequecci.com/admin/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB. Terminé !');
    process.exit(0);

  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
}

resetPassword();
