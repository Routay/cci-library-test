import User from '../models/User.js'; // Vérifie bien le chemin vers ton modèle User
import ActivityLog from '../models/ActivityLog.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: "Identifiants incorrects (Email non trouvé)" });
        }

        if (!user.actif) {
            return res.status(403).json({ message: "Compte désactivé. Contactez l'administrateur." });
        }

        // Restrict to admins and super_admins
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({ message: "Accès refusé. Réservé aux administrateurs." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Identifiants incorrects (Mot de passe erroné)" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        await ActivityLog.create({
            adminId: user._id,
            action: 'LOGIN',
            entity: 'Session',
            details: `Connexion de ${user.prenom} ${user.nom} (${user.role})`
        });

        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        res.status(200).json({
            token,
            user: {
                id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin,
                isBenevole: user.isBenevole,
                partnerStatus: user.partnerStatus,
            }
        });

    } catch (error) {
        console.error("Erreur Admin Login:", error);
        res.status(500).json({ message: "Erreur serveur lors de la connexion" });
    }
};

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

        // Restrict regular login to members only (admins should use admin-login)
        if (user.role === 'admin' || user.role === 'super_admin') {
            return res.status(403).json({ message: "Veuillez utiliser le portail administrateur pour vous connecter." });
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

        // Sauvegarder la date de dernière connexion
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

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
                isBenevole: user.isBenevole,
                partnerStatus: user.partnerStatus,
            }
        });

    } catch (error) {
        console.error("Erreur Login:", error);
        res.status(500).json({ message: "Erreur serveur lors de la connexion" });
    }
};

export const register = async (req, res) => {
    const { nom, prenom, email, password, tel, etablissement, sexe, isBenevole } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Un compte avec cet email existe déjà" });
        }

        // Validate strong password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." });
        }

        const user = await User.create({
            nom,
            prenom,
            email,
            password,
            tel,
            etablissement,
            sexe,
            isBenevole: isBenevole === true,
            benevoleRegisteredAt: isBenevole === true ? new Date() : null,
            role: 'membre'
        });

        res.status(201).json({
            message: "Inscription réussie. Veuillez vous connecter.",
            user: {
                id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                partnerStatus: user.partnerStatus,
                isBenevole: user.isBenevole,
                benevoleRegisteredAt: user.benevoleRegisteredAt
            }
        });

    } catch (error) {
        console.error("Erreur Inscription:", error);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
    }
};

export const becomeBenevole = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        user.isBenevole = true;
        user.benevoleRegisteredAt = new Date();
        await user.save();

        res.status(200).json({
            message: "Vous êtes maintenant un bénévole",
            user: {
                id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                isBenevole: user.isBenevole
            }
        });
    } catch (error) {
        console.error("Erreur Devenir Bénévole:", error);
        res.status(500).json({ message: "Erreur serveur lors de l'opération" });
    }
};
// Trigger redeploy
