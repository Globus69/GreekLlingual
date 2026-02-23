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
   
## Durchgeführte Fixes (Erweitert)
- **Migration 110 (Reparatur-Script):** Da einige Spalten (wie `acknowledged_swipe_tutorial_version`) in deiner Datenbank fehlten, schlug der RPC fehl. Migration 110 stellt sicher, dass alle Spalten existieren, bevor die Funktionen erstellt werden.
- **Migration 109:** Neue `SECURITY DEFINER` Funktion `get_user_data` erstellt.
- **AuthContext Update:** `refreshUserFromId` nutzt nun diese RPC-Funktion.
- **Hook-Optimierung:** `useStatsData` triggert `loading = true` nur noch beim ALLERERSTEN Laden.

## Nächste Schritte (Dringend)
1. **Migrations ausführen:** Bitte führe ZUERST die neue Datei **`110_repair_popup_columns_and_rpc.sql`** im Supabase SQL Editor aus. Diese repariert die fehlenden Spalten und Funktionen in einem Rutsch.
2. **Browser-Log prüfen:** Nach dem Ausführen von Script 110 sollte der "400 Bad Request" in der Konsole verschwinden.
3. **End-to-End Test:**
   - Häkchen setzen -> Dialog verschwindet sanft und bleibt verschwunden.
   - Browser-Refresh (F5) -> Dialog darf NICHT mehr erscheinen.
