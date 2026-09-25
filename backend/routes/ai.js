import express from 'express';
import { upload, cloudinary } from '../utils/cloudinary.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect, adminOnly } from '../middleware/auth.js';
import fetch from 'node-fetch'; // Pour télécharger l'image depuis Cloudinary si besoin
import multer from 'multer';

const router = express.Router();
const memoryUpload = multer({ storage: multer.memoryStorage() });

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

router.post('/extract-covers', protect, adminOnly, memoryUpload.fields([
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

    // Préparer les médias pour Gemini directement depuis la mémoire
    const mediaParts = [];
    if (pdfUrl) mediaParts.push(await fetchMediaAsBase64(pdfUrl));
    if (frontCoverFile) {
      mediaParts.push({
        inlineData: {
          data: frontCoverFile.buffer.toString('base64'),
          mimeType: frontCoverFile.mimetype
        }
      });
    }
    if (backCoverFile) {
      mediaParts.push({
        inlineData: {
          data: backCoverFile.buffer.toString('base64'),
          mimeType: backCoverFile.mimetype
        }
      });
    }

    // Upload des images vers Cloudinary en parallèle (pour stocker les URLs)
    const uploadToCloudinary = (file) => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'cci-library', resource_type: 'image' },
        (error, result) => error ? reject(error) : resolve(result.secure_url)
      );
      stream.end(file.buffer);
    });

    const frontCoverUpload = frontCoverFile ? uploadToCloudinary(frontCoverFile) : Promise.resolve(null);
    const backCoverUpload = backCoverFile ? uploadToCloudinary(backCoverFile) : Promise.resolve(null);

    // Initialiser Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

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

    // Attendre les uploads Cloudinary
    const [frontCoverUrl, backCoverUrl] = await Promise.all([frontCoverUpload, backCoverUpload]);

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

router.post('/scan-pages', protect, adminOnly, memoryUpload.array('pages', 30), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "La clé API Gemini n'est pas configurée." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Aucune image fournie." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    
    const prompt = `Tu es un assistant chargé d'extraire le texte depuis une photo de page de livre pour recréer le document au propre.
S'il te plaît, extrais tout le texte lisible de cette image, en corrigeant les erreurs évidentes d'OCR (lettres mal reconnues) mais sans inventer de phrases. 
Structure ta réponse UNIQUEMENT avec des balises HTML propres (par exemple <h2>, <h3>, <p>, <ul>, <li>, <strong>, <br>) pour refléter fidèlement la mise en page d'origine (titres, paragraphes, listes). 
Ne retourne QUE le code HTML (pas de blocs markdown \`\`\`html autour, juste le texte formaté en HTML).`;

    const pagesHtml = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(`Processing file ${i+1}/${req.files.length} (Size: ${file.size} bytes)`);
      
      try {
        const mediaPart = {
          inlineData: {
            data: file.buffer.toString("base64"),
            mimeType: file.mimetype
          }
        };
        
        console.log("Calling Gemini API...");
        const result = await model.generateContent([prompt, mediaPart]);
        const response = await result.response;
        let text = response.text();
        
        // Nettoyage des backticks si l'IA en renvoie quand même
        text = text.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim();
        pagesHtml.push(text);
        console.log(`Successfully processed file ${i+1}`);
      } catch (err) {
        console.error(`Error processing file ${i+1}:`, err);
        throw err; // Re-throw to be caught by outer catch
      }
    }

    res.json({ pages: pagesHtml });
  } catch (error) {
    console.error("Erreur de scan des pages par IA:", error);
    res.status(500).json({ message: "Erreur lors du scan : " + error.message });
  }
});

export default router;
