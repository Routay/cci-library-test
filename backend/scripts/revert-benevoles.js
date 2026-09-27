/**
 * Migration INVERSE : Remettre tous les membres à isBenevole=false
 * 
 * Logique métier :
 *   - Membre = emprunte des livres → page Membres
 *   - Bénévole = crée un compte bénévole pour donner → page Comptes Bénévoles
 *   - Les deux sont séparés (sécurité & clarté)
 * 
 * Usage: node scripts/revert-benevoles.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function revert() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Remettre TOUS les membres à isBenevole=false
    const result = await usersCollection.updateMany(
      { role: 'membre' },
      { $set: { isBenevole: false, benevoleRegisteredAt: null } }
    );

    console.log(`🔄 ${result.modifiedCount} compte(s) remis à isBenevole=false`);
    console.log('');
    console.log('📋 Logique métier en place :');
    console.log('   • Un membre qui emprunte → page Membres uniquement');
    console.log('   • Un bénévole qui donne  → page Comptes Bénévoles uniquement');
    console.log('   • Seule la création explicite d\'un compte bénévole marque isBenevole=true');
    console.log('');

    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

revert();
