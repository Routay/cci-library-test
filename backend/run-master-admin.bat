@echo off
echo ============================================================
echo   CREATION DU COMPTE MAITRE SUPERADMIN - CCI Bibliotheque
echo ============================================================
echo.
echo Entrez votre URI MongoDB Atlas (commence par mongodb+srv://)
echo Exemple: mongodb+srv://user:pass@cluster.mongodb.net/cci_library
echo.
set /p MONGO_URI="URI MongoDB Atlas: "
echo.
echo Connexion en cours...
set MONGO_URI=%MONGO_URI%
node create-master-admin.js
echo.
pause
