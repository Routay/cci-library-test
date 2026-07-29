import express from 'express';
import { upload } from '../utils/cloudinary.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect, adminOnly } from '../middleware/auth.js';
import fetch from 'node-fetch'; // Pour télécharger l'image depuis Cloudinary si besoin

const router = express.Router();

async function fetchMediaAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Erreur lors du téléchargement de ${url}: ${response.status} ${response.statusText}`);
    throw new Error(`Impossible de télécharger le fichier distant (${response.status}). Le lien est peut-être invalide.`);
  }
  const buffer = await response.buffer();
  let mimeType = response.headers.get('content-type') || 'image/jpeg';
  if (url.toLowerCase().endsWith('.pdf')) {
    mimeType = 'application/pdf';
  }
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType
    }
  };
}

router.post('/extract-covers', protect, adminOnly, upload.fields([
  { name: 'frontCover', maxCount: 1 },
  { name: 'backCover', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "La clé API Gemini (GEMINI_API_KEY) n'est pas configurée sur le serveur." });
    }

    const frontCoverFile = req.files?.['frontCover']?.[0];
    const backCoverFile = req.files?.['backCover']?.[0];

    const pdfUrl = req.body.pdfUrl;

    if (!frontCoverFile && !backCoverFile && !pdfUrl) {
      return res.status(400).json({ message: "Aucun média (image ou PDF) fourni." });
    }

    const frontCoverUrl = frontCoverFile ? frontCoverFile.path : null;
    const backCoverUrl = backCoverFile ? backCoverFile.path : null;

    // Préparer les médias pour Gemini
    const mediaParts = [];
    if (pdfUrl) mediaParts.push(await fetchMediaAsBase64(pdfUrl));
    if (frontCoverUrl) mediaParts.push(await fetchMediaAsBase64(frontCoverUrl));
    if (backCoverUrl) mediaParts.push(await fetchMediaAsBase64(backCoverUrl));

    // Initialiser Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    let prompt = "";
    if (pdfUrl) {
      prompt = `Tu es un bibliothécaire expert. Je te fournis le document (PDF) et/ou la couverture d'un livre islamique. Ton objectif est d'extraire le titre, l'auteur, et de rédiger un résumé extrêmement professionnel et détaillé du livre. Fais-en une véritable note de synthèse analytique (Présentation générale, Thèmes principaux, Portée de l'œuvre).
S'il te plaît, fournis une réponse structurée en JSON contenant :
{
  "title": "Titre du livre (s'il est trouvé)",
  "author": "Auteur du livre (s'il est trouvé)",
  "extractedText": "Le texte complet formaté en HTML propre (utilise <h3>, <p>, <ul>, <strong> etc.)."
}`;
    } else {
      prompt = `
Tu es un bibliothécaire expert. Je te fournis l'image de la page de garde (avant) et/ou de la page arrière (quatrième de couverture) d'un livre islamique.
Ton objectif est d'extraire et de formater le contenu pour qu'il soit directement lisible sur notre site.

S'il te plaît, fournis une réponse structurée en JSON contenant :
{
  "title": "Titre du livre (s'il est lisible)",
  "author": "Auteur du livre (s'il est lisible)",
  "extractedText": "Le texte complet formaté en HTML propre (utilise <h3>, <p>, <ul>, <strong> etc. pour que ce soit beau et lisible). Ce texte doit contenir le résumé, la biographie de l'auteur, et toute autre information pertinente trouvée sur les couvertures. Fais en sorte que le texte soit rédigé de manière fluide et professionnelle, en corrigeant les éventuelles erreurs d'OCR (reconnaissance optique de caractères), mais sans inventer d'informations qui ne sont pas sur l'image."
}
`;
    }

    const result = await model.generateContent([prompt, ...mediaParts]);
    const response = await result.response;
    const text = response.text();

    // Extraire le JSON de la réponse de Gemini
    let jsonResult = {};
    try {
      // Trouver le contenu entre les accolades s'il y a du texte autour
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResult = JSON.parse(jsonMatch[0]);
      } else {
        jsonResult = JSON.parse(text);
      }
    } catch (parseError) {
      console.error("Erreur parsing JSON Gemini:", text);
      jsonResult = { title: "", author: "", extractedText: text };
    }

    res.json({
      frontCoverUrl,
      backCoverUrl,
      title: jsonResult.title,
      author: jsonResult.author,
      extractedText: jsonResult.extractedText
    });

  } catch (error) {
    console.error("Erreur d'extraction IA:", error);
    res.status(500).json({ message: "Erreur lors de l'extraction par l'IA : " + error.message });
  }
});

export default router;
