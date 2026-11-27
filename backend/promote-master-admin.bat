@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM  promote-master-admin.bat
REM  Lance le script de promotion du Master Admin sur MongoDB Atlas.
REM
REM  Usage : double-clic ou depuis le terminal dans le dossier backend/
REM ─────────────────────────────────────────────────────────────────────────────

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   Promotion du Master Admin - CCI Biblio     ║
echo  ╚══════════════════════════════════════════════╝
echo.

REM Vérifier que MONGO_URI est bien défini dans .env
if not exist ".env" (
  echo [ERREUR] Fichier .env introuvable dans le dossier backend/
  echo Veuillez créer un fichier .env avec MONGO_URI=...
  pause
  exit /b 1
)

echo [INFO] Lancement du script de promotion...
echo.

node scripts/promoteMasterAdmin.js

echo.
echo [INFO] Terminé. Appuyez sur une touche pour fermer.
pause
