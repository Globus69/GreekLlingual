# Fehlerprotokoll: Pop-up Speicher-Logik (UserManualDialog / SwipeTutorialDialog)
Datum: 23.02.2026

## Aktueller Status
Der Fehler besteht nach wie vor. Trotz Implementierung einer RPC-Lösung und Optimierung des Auth-Handshakes zeigt die App folgendes fehlerhaftes Verhalten:

## Fehler-Symptome (Schritt für Schritt)
1. **Initiales Erscheinen:** Das Pop-up (User Manual) erscheint vorschriftsmäßig beim Start/Login.
2. **Interaktion:** Der User klickt auf die Checkbox "Nicht mehr anzeigen".
3. **Erstes Fehlverhalten (Flickering):** Das Pop-up wird kurz ausgeblendet, blendet sich jedoch **direkt danach sofort wieder ein**.
4. **Zustandsverlust:** Beim Wiedereinblenden ist die Checkbox **nicht mehr gesetzt** (Zustand ging verloren).
5. **Zweite Interaktion:** Erst nach einem erneuten Klicken auf die Checkbox verschwindet das Pop-up endgültig für die aktuelle Sitzung.
6. **Persistenz-Fehler:** Nach einem Browser-Refresh (F5) erscheint das Pop-up erneut, als wäre nie eine Bestätigung erfolgt.

## Technische Analyse (Aktualisiert am 23.02.2026)
1. **Hauptursache (Gefunden):**
   - **RLS-Blockade:** Da Schüler als `anon` User eingeloggt sind, durften sie ihre eigenen Daten nicht per `SELECT` abrufen (`refreshUser` schlug fehl). Dadurch wurden die in der DB gespeicherten Änderungen (Checkbox-Häkchen) nie in das Frontend zurückgeladen.
   - **Dashboard-Unmount (Flickering):** Der Hook `useStatsData` setzte bei jedem Refresh `loading = true`. Das Dashboard blendete daraufhin den "Loading..."-Screen ein, was den `UserManualDialog` komplett zerstörte (unmounted). Nach dem Laden wurde er neu erstellt – mit zurückgesetztem Status (Häkchen weg, `hasBeenClosedForSession` weg).
   
## Durchgeführte Fixes
- **Migration 109:** Neue `SECURITY DEFINER` Funktion `get_user_data` erstellt, damit `anon` User ihr Profil sicher laden können.
- **AuthContext Update:** `refreshUserFromId` nutzt nun diese RPC-Funktion statt eines direkten Tabellen-Zugriffs.
- **Hook-Optimierung:** `useStatsData` triggert `loading = true` nur noch beim ALLERERSTEN Laden, nicht mehr bei Hintergrund-Updates. Das Dashboard bleibt stabil stehen, Dialoge werden nicht mehr unmounted.
- **Logging:** Umfassende Konsolen-Logs (`[AuthContext]`, `[UserManualDialog]`) hinzugefügt, um jeden Schritt (RPC -> State -> UI) verfolgen zu können.

## Nächste Schritte (Dringend)
1. **Migrations ausführen:** Die SQL-Dateien **108** (Update RPC) und **109** (Fetch RPC) müssen zwingend in Supabase ausgeführt werden.
2. **Browser-Log prüfen:** In der Konsole sollten nun Logs wie `💾 [AuthContext] Updating state with...` und `🔍 [UserManualDialog] Checking visibility...` erscheinen.
3. **End-to-End Test:**
   - Häkchen setzen -> Dialog verschwindet sanft und bleibt verschwunden.
   - Browser-Refresh (F5) -> Dialog darf NICHT mehr erscheinen.
