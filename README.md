# OKZ-Schilder Generator

Single-File-Webapp zum Erstellen von 16x16 cm Schildern: farbige Kopffläche mit Überschrift/Untertitel, darunter frei kombinierbare Textblöcke. Export als PDF, Vorlagen speicherbar/ladbar als JSON.

## Lokal nutzen (ohne Installation)

`OKZ-Schilder-Generator.html` doppelklicken und im Browser öffnen. Der Ordner `fonts/` muss im selben Verzeichnis liegen. Kein Server, keine Installation nötig.

## Online per GitHub Pages (mit Passwort-Hürde)

Die Datei enthält ein optionales Login-Gate. Es ist nur aktiv, wenn beim Deploy ein SHA-256-Passwort-Hash eingesetzt wurde (lokal per Doppelklick bleibt die Hürde deaktiviert).

### Einmalige Einrichtung

1. PowerShell im Projektordner öffnen.
2. `deploy-setup.ps1` ausführen. Voraussetzung: [GitHub CLI](https://cli.github.com) installiert und mit `gh auth login` angemeldet, sowie Schreibrechte in der Organisation `werbeagentur-maikbartz`.
3. Das Skript legt das Repo `werbeagentur-maikbartz/OKZ-Schild-Tool` an, aktiviert GitHub Pages (Quelle: GitHub Actions) und pusht den Code. Danach kann optional direkt das Passwort gesetzt werden.
4. Nach dem ersten erfolgreichen Workflow-Lauf ist die Seite erreichbar unter:
   `https://werbeagentur-maikbartz.github.io/OKZ-Schild-Tool/`

### Passwort setzen oder ändern

```
gh secret set SITE_PASSWORD --repo werbeagentur-maikbartz/OKZ-Schild-Tool
```

Danach den Workflow erneut auslösen (Push auf `main`, oder manuell):

```
gh workflow run deploy.yml --repo werbeagentur-maikbartz/OKZ-Schild-Tool
```

Bereits eingeloggte Besucher werden nach einer Passwortänderung automatisch neu zum Login aufgefordert.

### Deploy-Status prüfen

```
gh run watch --repo werbeagentur-maikbartz/OKZ-Schild-Tool
```

## Projektstruktur

```
OKZ-Schilder-Generator.html   Die App selbst
fonts/                        Univers LT Std (Bold/Light), lokal eingebunden
.github/workflows/deploy.yml  Build & Deploy nach GitHub Pages
deploy-setup.ps1              Einmaliges Setup-Skript (Repo anlegen, Pages aktivieren, pushen)
```
