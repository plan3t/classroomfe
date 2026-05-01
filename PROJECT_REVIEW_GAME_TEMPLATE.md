# Projekt-Review: classroomfe anhand der Brettspiel-App-Definition

## Kurzfazit
`classroomfe` ist funktional bereits weit fortgeschritten, aber **kein klassischer Brettspiel-Begleiter**. Es ist derzeit eine Live-Lernraum-App (Lehrer/Schüler) mit Echtzeit-Quiz, Fortschritt und Ergebnisexport. Für die gewünschte Brettspiel-Struktur ist vor allem ein **anderes Domänenmodell** nötig (Spiel, Runde, Züge, Punkte statt Raum, Session, Antworten).

---

## 1) 🎯 Ziel der App (Soll vs. Ist)

### Gewünschte Definition (Brettspiel)
Die App soll ein Brettspiel am Tisch unterstützen (z. B. Punkte zählen, Runden verwalten, Events/Karten anzeigen, Regeln erklären).

### Aktueller Stand in `classroomfe`
- Fokus liegt auf Sprachlern-Sessions zum Thema „Supermarkt“.
- Lehrkraft steuert Session, Schüler beantworten Vokabelaufgaben.
- Ergebnis- und Fortschrittslogik ist vorhanden, aber auf Lernfragen optimiert.

### Bewertung
- **Teilweise passend** (Punkte/Ergebnis-Mechanik vorhanden).
- **Kernziel verfehlt** für Brettspiel, weil Spielregeln/Runden/Züge/Kartenlogik fehlen.

---

## 2) 👥 Wer nutzt die App?

### Gewünschte Definition
Klarer Modus nötig: ein Gerät am Tisch, Spielleiter-Modus oder jeder auf eigenem Gerät.

### Aktueller Stand in `classroomfe`
- Striktes 2-Rollen-Modell: **Lehrer** (Host) und **Schüler** (Teilnehmer).
- Multi-Device ist vorhanden (Join-ID/QR/NFC).

### Bewertung
- Rollenmodell ist technisch stark, aber semantisch nicht auf „Spieler/Spielleiter“ zugeschnitten.
- Umbenennung + Anpassung der Berechtigungen würde viel wiederverwendbar machen.

---

## 3) 📱 Ablauf beim Öffnen (User Flow)

### Gewünschte Definition
Klarer Game-Flow: Start → neues Spiel → Spieler erfassen → spielen → Punkte → Gewinner.

### Aktueller Stand in `classroomfe`
1. Login/Registrierung für Lehrkraft
2. Raum erstellen (Sprache, Optionen)
3. Schüler joinen via ID/QR/NFC
4. Lehrkraft startet Session
5. Schüler beantworten Aufgaben
6. Session-Ende + Ergebnisse/CSV

### Bewertung
- Ablauf ist sauber und robust, aber **pädagogisch statt spielerisch**.
- Der Flow kann mit moderatem Aufwand in einen Spiel-Flow umgebaut werden.

---

## 4) 🖼️ Screens / Bildschirme

### Gewünschte Definition
Explizite Spiel-Screens: Start, Spielanlage, Rundenscreen, Punkteübersicht, Gewinneransicht.

### Aktueller Stand in `classroomfe`
Vorhandene Screens decken bereits viele Strukturbausteine ab:
- Start/Landing
- Login/Register
- Dashboard
- Join-Screen
- Teacher-Room (Steuerung)
- Student-Room (Interaktion)
- Resultate

### Bewertung
- UI-Struktur ist gut wiederverwendbar.
- Inhaltlich müssen Begriffe/Elemente konsequent auf „Spiel“ umgestellt werden.

---

## 5) ⚙️ Funktionen

### Gewünschte Definition
Mindestens: Punkte, Runden, ggf. Timer, Zufallsereignisse, Regeln, Gewinnerlogik.

### Aktueller Stand in `classroomfe`
Bereits vorhanden:
- Live-Session Steuerung
- Fortschritt/Accuracy
- Echtzeit-Events
- Ergebnisdarstellung + CSV

Fehlend für Brettspiel:
- Runden-/Zug-Engine
- Flexible Punkte-Eingabe pro Spieler
- Ereignis-/Karten-Deck
- In-App-Regelhilfe
- Optional: Timer pro Zug/Runde

### Bewertung
- Technisches Fundament ist da; domänenspezifische Spiellogik fehlt.

---

## 6) 🎨 Design-Ideen

### Aktueller Stand
- Funktionales Lern-App-Design.

### Empfehlung
- Designsystem um Theme-Varianten erweitern (z. B. „Fantasy“, „Minimal“, „Retro“).
- Klarere Spielzustände visuell markieren (Runde aktiv, Spieler am Zug, Endphase).

---

## 7) ❗ Besondere Wünsche

### Gewünschte Punkte
Offlinefähigkeit, Mehrsprachigkeit, einfache Bedienung.

### Aktueller Stand
- Mehrsprachigkeitsidee bereits angelegt (Sprachauswahl im Lernkontext).
- Browser-/Realtime-Architektur benötigt i. d. R. Serververbindung.

### Empfehlung
- Für „offline am Tisch“: Local-first Modus (z. B. IndexedDB + späteres Syncen).
- Für schnelle Nutzung: „Spiel in 30 Sekunden starten“-Flow ohne Pflicht-Login als Option.

---

## Konkrete Umsetzungs-Roadmap (empfohlen)

1. **Domänenumstellung**
   - Raum/Session/Schüler → Spiel/Runde/Spieler.
2. **Core-Game-Model hinzufügen**
   - `Game`, `Round`, `Turn`, `ScoreEvent`, optional `CardEvent`.
3. **UI-Texte + Navigation anpassen**
   - Lehrer/Schüler durch Spielleiter/Spieler ersetzen.
4. **Punkte- und Rundenscreen priorisieren**
   - Schnell erfassbare Score-Aktionen (+1, +5, -2, Freitext).
5. **Regelhilfe + Sonderfunktionen**
   - Kurzregeln, Timer, Zufallsereignisse.
6. **Optionaler Gastmodus**
   - Kein Konto nötig für lokale Spielrunden.

---

## Gesamtbewertung
`classroomfe` ist als technische Basis (Realtime, Rollen, Join-Flow, Ergebnislogik) **sehr gut geeignet**, um daraus eine Brettspiel-Begleit-App zu entwickeln. Der größte Aufwand liegt nicht in der Infrastruktur, sondern in der **fachlichen Neuausrichtung** von Lern-Quiz auf Spiel-Mechanik.
