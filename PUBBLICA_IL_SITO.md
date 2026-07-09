# Pubblicare il sito radar (gratis su Internet)

Il sito è pronto. Segui questi passi **una sola volta**.

## 1. Crea un account GitHub (se non ce l’hai)

Vai su https://github.com/join

## 2. Crea un nuovo repository

1. https://github.com/new  
2. Nome esempio: `santa-teresa-radar`  
3. **Public**  
4. **Non** aggiungere README (cartella già pronta)  
5. Clic **Create repository**

## 3. Carica i file da PowerShell

Sostituisci `TUO_UTENTE` e `NOME_REPO` con i tuoi:

```powershell
cd "C:\Users\studiFRA\Desktop\METEO"
git init
git branch -M main
git add index.html santa_teresa_radar.html mappa_santateresa.png .gitignore .github
git commit -m "Sito radar Santa Teresa di Riva"
git remote add origin https://github.com/TUO_UTENTE/NOME_REPO.git
git push -u origin main
```

Ti chiederà login GitHub (browser o token).

## 4. Attiva GitHub Pages

1. Sul repo → **Settings** → **Pages**  
2. **Build and deployment** → Source: **GitHub Actions**  
3. Dopo 1–2 minuti il sito è online su:

   `https://TUO_UTENTE.github.io/NOME_REPO/`

(Esempio: `https://mario.github.io/santa-teresa-radar/`)

## 5. Aggiornare il sito in futuro

Dopo ogni modifica ai file HTML:

```powershell
cd "C:\Users\studiFRA\Desktop\METEO"
git add index.html santa_teresa_radar.html mappa_santateresa.png
git commit -m "Aggiornamento radar"
git push
```

---

## Alternativa senza Git: Netlify Drop

1. Vai su https://app.netlify.com/drop  
2. Trascina questi 3 file: `index.html`, `santa_teresa_radar.html`, `mappa_santateresa.png`  
3. Netlify ti dà un link pubblico subito (es. `https://qualcosa.netlify.app`)

---

**Nota:** il radar live richiede internet (API RainViewer + Open-Meteo). Funziona anche sul sito pubblico.
