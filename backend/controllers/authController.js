import User from '../models/User.js'; // Vérifie bien le chemin vers ton modèle User
import ActivityLog from '../models/ActivityLog.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Vérifier si l'utilisateur existe
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: "Identifiants incorrects (Email non trouvé)" });
        }

        // 2. Vérifier si l'utilisateur est actif
        if (!user.actif) {
            return res.status(403).json({ message: "Compte désactivé. Contactez l'administrateur." });
        }

        // 3. Comparer le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Identifiants incorrects (Mot de passe erroné)" });
        }

        // 4. Créer le Token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 5. Logger la connexion si c'est un admin ou super_admin
        if (user.role === 'admin' || user.role === 'super_admin') {
            await ActivityLog.create({
                adminId: user._id,
                action: 'LOGIN',
                entity: 'Session',
                details: `Connexion de ${user.prenom} ${user.nom} (${user.role})`
            });
            // Sauvegarder la date de dernière connexion
            await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
        }

        // 6. Réponse de succès
        res.status(200).json({
            token,
            user: {
                id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin,
            }
        });

    } catch (error) {
        console.error("Erreur Login:", error);
        res.status(500).json({ message: "Erreur serveur lors de la connexion" });
    }
};