# Hellenic Horizons – GreekLingua Dashboard  
**Zentrale Einstiegsseite**  
(letztes Update: 14. Februar 2026)

Dies ist der schnellste Weg, um das Projekt zu verstehen – egal ob du nach einem Jahr wiederkommst oder Claude/Grok einen neuen Prompt gibst.

## Überblick – Wichtige Module & Bereiche

- **[Daily Phrases](./modules/daily-phrases/README.md)**  
  Tägliche Phrasen, DueCardsToday-Logik, Content-Generierung und Anzeige im Dashboard

- **[Vocabulary / Vokabel-Training](./modules/vocabulary/)**  
  (falls schon vorhanden oder geplant – später ausfüllen)

- **[Fortschritt & Tracking](./modules/progress-tracking/)**  
  (User-Statistiken, Streaks, Review-Intervalle …)

- **[Authentifizierung & User-Management](./modules/auth/)**  
  (Login, Sessions, ggf. Supabase / Firebase-Integration)

## Wichtige zentrale Dateien

- **[TODO.md](./TODO.md)**  
  Alle offenen Aufgaben – gesammelt aus dem ganzen Projekt (regelmäßig aktualisieren)

- **[AI Guidelines & Key Parameters](./docs/ai-guidelines.md)**  
  Was Claude/Grok bei jedem Prompt zwingend beachten muss (Parameter, Verbote, Stil)

- **[Projekt-Architektur & Entscheidungen](./docs/architecture.md)**  
  Warum ist etwas so gebaut? (später befüllen)

- **[Wesentliche Konfigurationen & Umgebung](./docs/key-parameters.md)**  
  API-Keys, Endpoints, wichtige Konstanten (ohne echte Secrets!)

## Weitere nützliche Orte

- **public/** → Frontend-Assets, statische Inhalte, Bilder  
- **src/** oder **lib/** → Haupt-Quellcode (je nach Tech-Stack)  
- **_archive/** → Alter Kram, den wir nicht mehr brauchen, aber behalten wollen

Viel Erfolg – und denk dran:  
**Bei jedem Claude/Grok-Prompt immer ai-guidelines.md mit einbeziehen!**