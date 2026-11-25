/**
 * reset-password.js
 * Réinitialise le mot de passe du superadmin directement en base.
 * Usage : node reset-password.js
 */
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import dotenv   from 'dotenv';

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/cci_library';

const NEW_PASSWORD  = 'Superadmin2026';
const ADMIN_EMAIL   = 'superadmin@cci.sn';

async function resetPassword() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté :', MONGO_URI.replace(/:\/\/.+@/, '://***@'));

    const db   = mongoose.connection.db;
    const col  = db.collection('users');

    const user = await col.findOne({ email: ADMIN_EMAIL });
    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email : ${ADMIN_EMAIL}`);
      process.exit(1);
    }

    console.log(`👤 Utilisateur trouvé : ${user.nom} ${user.prenom} (${user.role})`);

    const hashed = await bcrypt.hash(NEW_PASSWORD, 12);

    await col.updateOne(
      { email: ADMIN_EMAIL },
      { $set: { password: hashed } }
    );

    console.log('✅ Mot de passe réinitialisé avec succès !');
    console.log(`📧 Email    : ${ADMIN_EMAIL}`);
    console.log(`🔑 Password : ${NEW_PASSWORD}`);

  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

resetPassword();
