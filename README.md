# classroomfe / Game Companion

## Projektstatus
Diese App wurde von einer Classroom-Quiz-App zu einer **Brettspiel-Begleitapp** umgestellt.

### Kernmodi
1. **Live-Modus (bestehend)**
   - bestehende Room/Join-Infrastruktur mit Rollen (Spielleiter/Spieler)
2. **iPad-Spielmodus (neu)** unter `/game`
   - Startbildschirm
   - Anleitung (Text + optionaler Video-Link)
   - Spielstart oder „Spiel mit Ziel starten“
   - Spieler erfassen
   - Lebensmittelübersicht inkl. Varianten
   - Einkaufskorb mit Menge, Preis, Summe
   - „Einkauf fertig“ + Gesamtfeedback

### Produktentscheidung (Rollenfluss)
- **Entscheidung aktuell:** Integration statt harter Ablösung.
- Der bestehende `/rooms`-Flow bleibt als Legacy-/Live-Modus bestehen.
- Der neue `/game`-Flow ist der primäre Brettspiel-Modus für iPad am Tisch.

## Was bereits umgesetzt ist
- Lebensmittelübersicht mit Varianten, Nährwerten, Zusatzstoffen, Vorteilen und Risiken
- Einkaufskorb pro Spieler mit Mengen und Summen
- Zielmodus mit Zielauswahl pro Spieler
- Zielfeedback („Ziel erreicht?“) nach Spielende
- Lokale Persistenz des Spielstands im Browser (iPad-Refresh sicherer)
- API-Endpunkt zum Speichern/Laden von Spielsitzungen (`/api/game/sessions`)

## Datenmodell im Spielmodus
- `FoodItem` / `FoodVariant` für Produktdaten
- `SavedGameSession` für gespeicherte Spielstände
- 61er Vollkatalog als aktueller App-Katalog (iterierbar/erweiterbar)

## Entwicklung
```bash
npm install
npm run dev
```

## Testen
```bash
npm test
npm run build
```

## Offene Aufgaben (Remaining)
- **Validierte Daten einpflegen:** `data/foods-validated.json` auf vollständige 61 Lebensmittel + echte Varianten + geprüfte Nährwerte erweitern (derzeit Fallback auf generierten 61er Katalog).
- **Export ausbauen:** CSV ist vorhanden, PDF-Export fehlt noch.
- **Medienbibliothek serverseitig:** Upload ist aktuell lokal/browserbasiert; zentrale persistente Medienablage fehlt.
- **Scoring-Regeln finalisieren:** Pädagogische Zielmetriken mit Fachteam abstimmen und Grenzwerte pro Ziel verifizieren.
- **Legacy-Cleanup:** Nach Stabilisierung entscheiden, ob `/rooms` langfristig entfernt oder als Parallelmodus behalten wird.
