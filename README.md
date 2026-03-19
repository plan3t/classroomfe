# classroomfe

## Deutsch

### Projektbeschreibung

**classroomfe** ist eine responsive Sprachlernplattform für Lehrkräfte und Schüler. Lehrkräfte erstellen Live-Lernräume zum Thema **Supermarkt**, wählen eine Zielsprache und begleiten eine gemeinsame Session in Echtzeit. Schüler treten über eine **8-stellige Join-ID**, einen **QR-Code** oder optional per **NFC** bei und beantworten bildgestützte Vokabelaufgaben direkt im Browser.

Die Anwendung ist auf interaktive Unterrichtssituationen ausgelegt: Lehrkräfte verwalten Räume, starten und beenden Sessions, verfolgen den Lernfortschritt live und exportieren Ergebnisse als CSV. Schüler erhalten sofortiges Feedback zu ihren Antworten und können – sofern aktiviert – eine browserbasierte Sprachhilfe verwenden.

### Funktionen

#### Für Lehrkräfte

- Registrierung und Login für den geschützten Zugriff auf das Dashboard
- Erstellen von Live-Räumen zum Thema **Supermarkt**
- Auswahl der Zielsprache: **Deutsch**, **Englisch**, **Französisch** oder **Spanisch**
- Aktivierbare Sprachhilfe für Schüler
- Automatisch generierte Join-ID, Join-URL und QR-Code pro Raum
- Live-Warteraum mit Echtzeit-Übersicht über beigetretene Schüler
- Starten und Beenden von Sessions direkt aus dem Lehrerraum
- Fortschrittsanzeige mit Abschlussquote, Gesamtzahl richtiger Antworten und durchschnittlicher Genauigkeit
- CSV-Export der Raumergebnisse

#### Für Schüler

- Beitritt zu einem Raum per Join-ID
- Alternativ Join per QR-Code-Link
- Optionaler NFC-gestützter Join, falls per Feature-Flag aktiviert und im Browser unterstützt
- Bildgestützte Vokabelaufgaben innerhalb einer laufenden Session
- Sofortiges Feedback auf Antworten
- Browserbasiertes Vorlesen per Text-to-Speech bei aktivierter Sprachhilfe
- Abschlussansicht mit persönlichem Ergebnis

#### Technische Merkmale

- Echtzeit-Kommunikation über Socket.IO
- Next.js-App mit App Router
- Authentifizierung mit NextAuth
- Prisma als Datenzugriffsschicht für PostgreSQL
- Docker- und Docker-Compose-Setup für lokale Nutzung und Deployment
- Automatisierte Tests für Join-Flow, Antwortauswertung und Fortschrittslogik

### Technologie-Stack

- **Frontend / Full Stack:** Next.js 15, React 19, TypeScript
- **Authentifizierung:** NextAuth
- **Datenbank:** PostgreSQL 16
- **ORM:** Prisma
- **Echtzeit:** Socket.IO
- **Tests:** Vitest
- **Container:** Docker, Docker Compose

### Docker-Release-Workflow

Dieses Repository enthält einen manuellen GitHub-Actions-Workflow unter `.github/workflows/docker-release.yml`.
Starte in GitHub im Tab **Actions** den Workflow **Docker Release** und gib ein Release-Tag wie `v1.0.0` an. Der Workflow erledigt anschließend Folgendes:

1. Er baut das Docker-Image aus dem `Dockerfile`.
2. Er pusht das Image in die GitHub Container Registry als `ghcr.io/<owner>/<repo>`.
3. Er erstellt oder aktualisiert den passenden Git-Tag.
4. Er veröffentlicht ein GitHub-Release mit automatisch generierten Release Notes und dem Image-Digest.

### Schneller Start mit Docker Compose

Du kannst das veröffentlichte Image zusammen mit PostgreSQL über die enthaltene Compose-Datei starten:

```bash
docker compose up -d
```

Dadurch werden folgende Dienste gestartet:

- `ghcr.io/plan3t/classroomfe:latest` auf <http://localhost:3000>
- PostgreSQL 16 mit dem benötigten Schema und automatisch vorgeladenen Beispieldaten

Die Standard-Zugangsdaten für die Datenbank sind bereits in der `docker-compose.yml` hinterlegt. Für einen ersten Start sind daher weder eine zusätzliche `.env`-Datei noch ein manueller Migrationsschritt erforderlich.

---

## English

### Project description

**classroomfe** is a responsive language-learning platform for teachers and students. Teachers create live learning rooms for the **supermarket** topic, choose a target language, and guide a shared session in real time. Students join through an **8-digit join ID**, a **QR code**, or optionally via **NFC**, then solve image-based vocabulary tasks directly in the browser.

The application is built for interactive classroom use: teachers manage rooms, start and finish sessions, track learning progress live, and export results as CSV. Students receive immediate answer feedback and can use browser-based speech support when enabled.

### Features

#### For teachers

- Registration and login for protected dashboard access
- Creation of live rooms for the **supermarket** topic
- Target language selection: **German**, **English**, **French**, or **Spanish**
- Optional speech assistance for students
- Automatically generated join ID, join URL, and QR code for each room
- Live waiting room with real-time participant overview
- Start and finish controls directly inside the teacher room
- Progress tracking with completion rate, total correct answers, and average accuracy
- CSV export for room results

#### For students

- Join a room with a join ID
- Alternative join flow through a QR-code link
- Optional NFC-based join when enabled by feature flag and supported by the browser
- Image-based vocabulary tasks during an active session
- Immediate answer feedback
- Browser-based text-to-speech support when language help is enabled
- Final results view with the student's personal score

#### Technical highlights

- Real-time communication via Socket.IO
- Next.js application using the App Router
- Authentication with NextAuth
- Prisma as the PostgreSQL data access layer
- Docker and Docker Compose setup for local use and deployment
- Automated tests for join flow, answer validation, and progress logic

### Technology stack

- **Frontend / Full stack:** Next.js 15, React 19, TypeScript
- **Authentication:** NextAuth
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Realtime:** Socket.IO
- **Testing:** Vitest
- **Containers:** Docker, Docker Compose

### Docker release workflow

This repository includes a manual GitHub Actions workflow at `.github/workflows/docker-release.yml`.
Run **Docker Release** from the Actions tab in GitHub, provide a release tag such as `v1.0.0`, and the workflow will:

1. Build the Docker image from `Dockerfile`.
2. Push the image to GitHub Container Registry as `ghcr.io/<owner>/<repo>`.
3. Create or update the matching Git tag.
4. Publish a GitHub release with generated release notes and the image digest.

### Quick start with Docker Compose

Run the published image together with PostgreSQL using the included compose file:

```bash
docker compose up -d
```

This starts:

- `ghcr.io/plan3t/classroomfe:latest` at <http://localhost:3000>
- PostgreSQL 16 with the required schema and starter data preloaded automatically

The default database credentials are already configured in `docker-compose.yml`, so no extra `.env` file or manual migration step is required for a first run.
