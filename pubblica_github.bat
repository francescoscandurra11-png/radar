@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  === Pubblica sito su GitHub ===
echo.
set /p USER=Utente GitHub (es. mario-rossi): 
set /p REPO=Nome repository (es. santa-teresa-radar): 
echo.

if not exist ".git" (
  git init
  git branch -M main
)

git add index.html santa_teresa_radar.html mappa_santateresa.png .gitignore .github PUBBLICA_IL_SITO.md
git commit -m "Sito radar Santa Teresa di Riva" 2>nul
if errorlevel 1 (
  echo Nessuna modifica nuova oppure commit gia fatto.
)

git remote remove origin 2>nul
git remote add origin https://github.com/%USER%/%REPO%.git

echo.
echo  Ora eseguo: git push -u origin main
echo  (serve login GitHub)
echo.
git push -u origin main

if errorlevel 1 (
  echo.
  echo  PUSH fallito. Crea prima il repo vuoto su:
  echo  https://github.com/new
  echo  Nome: %REPO%  -  Public
  echo  Poi rilancia questo file.
) else (
  echo.
  echo  OK! Attiva Pages: repo - Settings - Pages - Source: GitHub Actions
  echo  Sito: https://%USER%.github.io/%REPO%/
)
echo.
pause
