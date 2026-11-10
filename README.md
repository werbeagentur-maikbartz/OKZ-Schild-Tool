# OKZ Tools

Sammlung kleiner Single-Page-Werkzeuge mit gemeinsamem Dashboard. Reines HTML/CSS/JS, kein Build-Tool.

| App | Format | Status |
|---|---|---|
| **OKZ-Schilder** (`apps/okz-schilder/`) | 16 × 16 cm, farbige Kopffläche + Textblöcke, PDF-Export, Vorlagen (JSON) | aktiv |
| **SocialMedia** (`apps/socialmedia/`) | 21 × 21 cm, Bereiche TOP 48 mm / CONTENT Rest / BOTTOM 36 mm | Gerüst |

## Projektstruktur

```
index.html                    Dashboard (Startseite, Karte pro App)
apps/
  okz-schilder/index.html     Schilder-Generator
  socialmedia/index.html      SocialMedia (Gerüst)
shared/
  base.css                    Gemeinsame Styles (Schrift, Panel, Buttons, Login)
  editor.css                  Block-Editor (Karten, Textfelder) für Apps mit mehreren Blöcken
  auth.js                     Gemeinsame Login-Hürde (ein Login für alle Apps)
  export.js                   Export als PNG / JPG / PDF (300 dpi), ohne Abhängigkeiten
assets/                       Logos und Grafiken (SVG, inkl. verlinkter Bilder)
  fonts/                      Univers LT Std (Bold/Light)
.github/workflows/deploy.yml  Build & Deploy nach GitHub Pages
```

## Lokal nutzen (ohne Installation)

`index.html` doppelklicken. Alle Pfade sind relativ, es werden keine ES-Module verwendet – daher funktioniert alles auch direkt per `file://`. Die Login-Hürde ist lokal deaktiviert.

PNG/JPG/PDF-Export der SocialMedia-App benötigt `http(s)` (GitHub Pages oder ein lokaler Server, z. B. `python -m http.server` im Projektordner). Per Doppelklick (`file://`) darf der Browser keine Dateien einlesen: dort funktioniert nur das PDF über den Druckdialog.

## Online per GitHub Pages (mit Passwort-Hürde)

Pages-Quelle muss auf *GitHub Actions* stehen. Bei jedem Push auf `main` (oder manuell) baut der Workflow den Ordner `dist/` (`index.html`, `apps/`, `shared/`) und deployt ihn:

`https://werbeagentur-maikbartz.github.io/OKZ-Schild-Tool/` → Dashboard

Die Login-Hürde (`shared/auth.js`) ist nur aktiv, wenn das Secret `SITE_PASSWORD` gesetzt ist; der Workflow ersetzt dann den Platzhalter durch den SHA-256-Hash. Ein Login gilt für das Dashboard und alle Apps. Das ist eine einfache Zugangshürde im Browser, kein echter Zugriffsschutz.

### Passwort setzen oder ändern

```
gh secret set SITE_PASSWORD --repo werbeagentur-maikbartz/OKZ-Schild-Tool
gh workflow run deploy.yml --repo werbeagentur-maikbartz/OKZ-Schild-Tool
```

Bereits eingeloggte Besucher werden nach einer Passwortänderung automatisch neu zum Login aufgefordert.

### Deploy-Status prüfen

```
gh run watch --repo werbeagentur-maikbartz/OKZ-Schild-Tool
```

## Neue App hinzufügen

1. Ordner `apps/<name>/index.html` anlegen (am einfachsten `apps/socialmedia/` als Vorlage kopieren).
2. Im `<head>` `../../shared/base.css` einbinden, direkt nach `<body>` `../../shared/auth.js`.
3. Auf dem Dashboard (`index.html`) einen `<li>`-Eintrag kopieren und anpassen.

Der Workflow deployt `apps/` komplett – eine Workflow-Änderung ist nicht nötig.
