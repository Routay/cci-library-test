/**
 * Migration : Marquer tous les membres existants comme bénévoles
 * 
 * Usage: node scripts/migrate-benevoles.js
 * 
 * Cette migration met à jour tous les comptes membres qui n'ont pas
 * encore le champ isBenevole=true, et leur attribue la date de création
 * du compte comme date d'inscription bénévole.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Trouver tous les membres qui n'ont pas isBenevole=true
    const membersToUpdate = await usersCollection.find({
      role: 'membre',
      $or: [
        { isBenevole: { $exists: false } },
        { isBenevole: false },
        { isBenevole: null }
      ]
    }).toArray();

    console.log(`📊 ${membersToUpdate.length} compte(s) membre(s) à migrer`);

    if (membersToUpdate.length === 0) {
      console.log('✅ Aucune migration nécessaire — tous les comptes sont déjà marqués bénévoles');
      await mongoose.disconnect();
      return;
    }

    // Mettre à jour chaque membre
    let updated = 0;
    for (const member of membersToUpdate) {
      await usersCollection.updateOne(
        { _id: member._id },
        {
          $set: {
            isBenevole: true,
            benevoleRegisteredAt: member.createdAt || new Date()
          }
        }
      );
      updated++;
      console.log(`  ✔ ${member.prenom} ${member.nom} (${member.email}) → bénévole`);
    }

    console.log(`\n🎉 Migration terminée : ${updated} compte(s) mis à jour`);
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  } catch (err) {
    console.error('❌ Erreur de migration:', err);
    process.exit(1);
  }
}

migrate();
