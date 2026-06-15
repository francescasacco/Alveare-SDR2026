# Alveare SDR 2026 — App React + TypeScript

App web che mostra l'immagine "Alveare" con tutti i loghi delle associazioni **cliccabili**.  
Deploy pronto per **Vercel** (o qualsiasi host statico).

---

## Setup locale (VSCode)

### Prerequisiti
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

### 1 · Installa le dipendenze

```bash
npm install
```

### 2 · Avvia il server di sviluppo

```bash
npm run dev
```

Apri il browser su **http://localhost:5173** — l'app si aggiorna in tempo reale quando salvi i file.

---

## Configurare i link delle associazioni

Apri **`src/logos.ts`** — è l'unico file da modificare.  
Sostituisci `'#'` con gli URL reali per ogni associazione:

```ts
{ id: 1, cx: 273.5, cy: 58.6, label: 'Nome Associazione', url: 'https://linktr.ee/...' },
```

I loghi sono numerati **dall'alto verso il basso, da sinistra a destra**.  
Salva il file: la preview si aggiorna istantaneamente.

---

## Come funziona

- **`src/logos.ts`** — dati di configurazione (label + URL per ogni esagono)
- **`src/HexOverlay.tsx`** — SVG sovrapposto all'immagine con aree ellittiche trasparenti e cliccabili
- **`src/Tooltip.tsx`** — tooltip che appare sull'hover
- **`src/App.tsx`** — layout principale
- **`src/assets/alveare.svg`** — l'immagine originale (non modificare)

---

## Deploy su Vercel

### Metodo A — GitHub (consigliato)

1. Crea un repository su [github.com](https://github.com) e fai push del progetto:
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/TUO-UTENTE/alveare-sdr2026.git
   git push -u origin main
   ```
2. Vai su [vercel.com](https://vercel.com) → **Add New Project** → seleziona il repository.
3. Vercel rileva automaticamente Vite. Clicca **Deploy**.
4. Per aggiornare i link: modifica `src/logos.ts`, fai commit e push → Vercel rideploya in automatico.

### Metodo B — Deploy diretto da terminale

```bash
npm install -g vercel
npm run build
vercel --prod
```

---

## Build di produzione locale

```bash
npm run build      # genera la cartella dist/
npm run preview    # serve dist/ su http://localhost:4173
```

---

## Struttura file

```
alveare-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── alveare.svg          ← immagine originale
│   ├── App.tsx                  ← layout principale
│   ├── HexOverlay.tsx           ← hotspot cliccabili
│   ├── Tooltip.tsx              ← tooltip hover
│   ├── logos.ts                 ← ⭐ MODIFICA QUI i link
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```
