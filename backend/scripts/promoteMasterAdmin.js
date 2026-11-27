/**
 * scripts/promoteMasterAdmin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Promouvoir un compte existant en "Master Admin" protégé.
 *
 * Usage :
 *   MONGO_URI="mongodb+srv://..." MASTER_ADMIN_EMAIL="email@example.com" node scripts/promoteMasterAdmin.js
 *
 * Variables d'environnement requises (ou depuis .env) :
 *   MONGO_URI           – URI MongoDB Atlas
 *   MASTER_ADMIN_EMAIL  – Email du compte à protéger
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User    from '../models/User.js';

const MONGO_URI  = process.env.MONGO_URI || process.env.MONGODB_URI;
const MASTER_EMAIL = process.env.MASTER_ADMIN_EMAIL || 'manetahirou215@gmail.com';

if (!MONGO_URI) {
  console.error('❌  Variable MONGO_URI manquante. Exemple :');
  console.error('   MONGO_URI="mongodb+srv://..." node scripts/promoteMasterAdmin.js');
  process.exit(1);
}

(async () => {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅  Connecté');

    const result = await User.updateOne(
      { email: MASTER_EMAIL },
      {
        $set: {
          isMasterAdmin: true,
          role: 'super_admin',
          actif: true,
        },
      }
    );

    if (result.matchedCount === 0) {
      console.error(`❌  Utilisateur introuvable : ${MASTER_EMAIL}`);
    } else if (result.modifiedCount === 0) {
      console.log(`ℹ️   Déjà configuré comme Master Admin : ${MASTER_EMAIL}`);
    } else {
      console.log(`✅  ${MASTER_EMAIL} promu Master Admin avec succès`);
    }

    // Vérification
    const user = await User.findOne({ email: MASTER_EMAIL }).select('-password');
    if (user) {
      console.log('\n📋 État actuel du compte :');
      console.log(`   Email        : ${user.email}`);
      console.log(`   Rôle         : ${user.role}`);
      console.log(`   isMasterAdmin: ${user.isMasterAdmin}`);
      console.log(`   Actif        : ${user.actif}`);
    }

  } catch (err) {
    console.error('❌  Erreur :', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
})();
