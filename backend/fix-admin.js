import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = "mongodb://localhost:27017/cci_library";

async function fix() {
  try {
  const response = await axios.post('http://localhost:5000/api/auth/login', {
    email: form.email,
    password: form.password
  });

  // --- AJOUTE CES DEUX LIGNES DE DEBUG ---
  console.log("Réponse du serveur :", response.data);
  console.log("Tentative de redirection...");
  // ---------------------------------------

  login(response.data); 
  
  navigate('/admin/dashboard');
  console.log("Redirection appelée !");

}catch (error) {
    console.error("❌ Erreur :", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

fix();