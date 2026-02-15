 ✅ Wie nutzt du 055?

database/migrations/055_fsrs_verification_guide.sql

  Nach Ausführung von 052-054:

  1. Öffne 055_fsrs_verification_guide.sql lokal
  2. Kopiere Query 1 (Verify FSRS fields)
  3. Füge ein in Supabase SQL Editor
  4. Run → Prüfe ob 8 Spalten zurückkommen
  5. Wiederhole für Queries 2-5

  Query 6 (Test get_due_cards_fsrs):
  - Ist auskommentiert (wegen Platzhalter)
  - Wenn du testen willst: Kopiere, ersetze 'YOUR_USER_ID' mit echter UUID

  ---
  🎯 Zusammenfassung:

  ✅ Ausgeführt: 052, 053, 054
  ❌ NICHT ausgeführt: 055 (nur Anleitung)
  📊 Nächster Schritt: Verifikations-Queries aus 055 einzeln kopieren & testen

  Alles klar? 🚀

✻ Baked for 1m 1s

❯ wo bekomme ich die UUID ?                                                                                                                                                    
                            
⏺ Gute Frage! Die UUID ist die User-ID aus deiner users Tabelle. Hier sind 3 Methoden:                                                                                         
                                                            
  ---                                                                                                                                                                          
  🔍 Methode 1: SQL-Query (Einfachste)                                         
                                                                                                                                                                               
  Im Supabase SQL Editor:                                                      

  -- Alle User anzeigen
  SELECT id, name, pin_4digit, role, level
  FROM public.users
  ORDER BY created_at DESC;

  Ausgabe: Liste aller User mit IDs, z.B.:
  id                                   | name    | pin_4digit | role    | level
  -------------------------------------|---------|------------|---------|------
  a1b2c3d4-1234-5678-90ab-cdef12345678 | Susi    | 3741       | student | A1
  e5f6g7h8-9012-3456-78ij-klmn90123456 | Markus  | 8192       | student | A1
  ...

  → Kopiere die UUID aus der id Spalte

  ---
  🔍 Methode 2: Spezifischen Test-User finden

  Wenn du mit einem bestimmten Test-User testen willst:

  -- Susi (PIN 3741)
  SELECT id FROM public.users WHERE pin_4digit = '3741';

  -- Oder nach Name
  SELECT id FROM public.users WHERE name = 'Susi';

  → UUID direkt kopieren

  ---
  🔍 Methode 3: Im eingeloggten Zustand (Browser)

  1. Login auf http://localhost:3000/login-pin mit PIN 3741
  2. Browser Console öffnen (F12 → Console)
  3. Query ausführen:
  JSON.parse(localStorage.getItem('greeklingua_user')).id

  → UUID wird in Console ausgegeben

  ---
  ✅ Beispiel-Test mit echter UUID:

  Nachdem du UUID hast (z.B. a1b2c3d4-...):

  -- Test get_due_cards_fsrs
  SELECT * FROM get_due_cards_fsrs(
      'a1b2c3d4-1234-5678-90ab-cdef12345678'::UUID,  -- DEINE UUID hier!
      'A1',    -- Level
      10       -- Limit
  );

  Erwartetes Ergebnis:
  - Liste von Vokabelkarten die fällig sind
  - Oder leer, falls noch keine Reviews gemacht wurden

  ---
  🎯 Empfehlung:

  Verwende Methode 1 (alle User anzeigen) → einfachste Methode!

  SELECT id, name, pin_4digit FROM public.users WHERE role = 'student';

  Kopiere die UUID von Susi (oder einem anderen Test-User) und nutze sie für die Verifikations-Queries.

  Brauchst du noch Hilfe? 🚀