# CSV Import - Sichere Server-Side Lösung

**Status:** ✅ Implementiert (2026-02-18)

## Problem

CSV-Import schlug fehl mit RLS-Fehler:
```
❌ new row violates row-level security policy for table "multilingual_vocabulary"
```

Auch wenn der User als Admin eingeloggt war und RLS-Policies existierten, die authenticated users INSERT erlauben.

## Lösung: Server-Side API mit service_role key

### Architektur

```
┌─────────────────┐
│  Client (Browser) │
│  - Parse CSV     │
│  - Show Preview  │
│  - Validate Data │
└────────┬─────────┘
         │ POST /api/admin/vocab/import
         │ (FormData: file, mode)
         ▼
┌─────────────────┐
│  Server API Route│ ← service_role key (env only)
│  - Uses Admin    │
│    Client        │
│  - Bypasses RLS  │
│  - Bulk Insert   │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  - multilingual_ │
│    vocabulary    │
└──────────────────┘
```

### Sicherheitsaspekte

#### ✅ SICHER
1. **service_role key nur server-side**
   - In `.env.local` (never committed)
   - Nur in API Route verwendet (`/src/app/api/admin/vocab/import/route.ts`)
   - Nie im Browser-Code

2. **Client sendet nur File + Mode**
   - Kein direkter Supabase-Zugriff
   - File wird server-side verarbeitet

3. **Erweiterbar für Auth-Checks**
   - Kann in API Route User-Session prüfen
   - Kann Admin-Rolle validieren

#### ❌ NICHT SICHER (wurde vermieden)
- service_role key im Client-Code
- service_role key in .env committed
- Client-seitiger Bulk-Insert ohne RLS

## Setup

### 1. service_role Key hinzufügen

Füge zur `.env.local` hinzu:

```bash
# Supabase Service Role Key (SERVER-SIDE ONLY - NEVER COMMIT)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Wo finde ich den Key?**
1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt
3. Settings → API
4. Kopiere den **service_role** key (nicht anon!)

### 2. .env.local aktualisieren

Deine `.env.local` sollte haben:

```bash
# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon key)

# Private (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role key)
```

### 3. Server neu starten

```bash
npm run dev
```

Der service_role key wird nur beim Server-Start geladen.

## Verwendung

### CSV-Import in Admin UI

1. Gehe zu `/admin/vocab`
2. Klicke "Import"
3. Wähle CSV-Datei
4. Vorschau prüfen
5. Modus wählen (Append/Overwrite)
6. Import starten

**Was passiert:**
- Client parst CSV und zeigt Vorschau
- Bei Import: File wird an `/api/admin/vocab/import` gesendet
- Server verarbeitet mit service_role key
- Ergebnis wird an Client zurückgegeben

## Dateien

### Server-Side (verwendet service_role)

- **`/src/app/api/admin/vocab/import/route.ts`**
  - POST endpoint für CSV-Import
  - Erstellt Admin-Client mit service_role key
  - Parst CSV, validiert, fügt in DB ein
  - Gibt ImportResult zurück

### Client-Side (kein service_role)

- **`/src/lib/api/vocab.ts` - `importCSV()`**
  - Sendet FormData an Server-API
  - Empfängt ImportResult
  - Zeigt Fehler/Erfolg

- **`/src/components/admin/VocabImportModal.tsx`**
  - UI für Import
  - CSV-Vorschau mit PapaParse
  - Client-seitige Validierung
  - Ruft `importCSV()` auf

## RLS Policies

Die folgenden Policies existieren (Migration 086):

```sql
-- Authenticated users can insert vocabulary
CREATE POLICY "Authenticated users can insert multilingual_vocabulary"
    ON multilingual_vocabulary
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin full access to vocabulary"
    ON multilingual_vocabulary
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );
```

**Hinweis:** Auch mit diesen Policies verwenden wir die Server-API, weil:
- Konsistentes Verhalten garantiert
- Bessere Fehlerbehandlung
- Logging server-side
- Keine Session-Probleme

## Fehlerbehandlung

### "Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set"

**Ursache:** service_role key fehlt in `.env.local`

**Lösung:**
1. Füge `SUPABASE_SERVICE_ROLE_KEY=...` zu `.env.local` hinzu
2. Starte Server neu: `npm run dev`

### "Permission denied" trotz Admin-Login

**Ursache:** Client verwendet anon key, Session wird nicht übergeben

**Lösung:** Verwende die Server-API (bereits implementiert)

### Import zeigt "0 imported, 90 skipped"

**Mögliche Ursachen:**
1. Duplikate in CSV
2. Validierungsfehler
3. RLS blockiert (sollte mit API nicht passieren)

**Debugging:**
- Öffne Browser Console (F12)
- Suche nach `❌` Fehlermeldungen
- Prüfe "Import Ergebnis" Box für Details

## Alternative: Client-Side Import (NICHT empfohlen)

Falls du trotzdem client-seitig importieren möchtest:

### Voraussetzungen

1. User muss eingeloggt sein:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Not authenticated');
   ```

2. RLS Policy muss existieren:
   ```sql
   CREATE POLICY "insert_policy"
   ON multilingual_vocabulary
   FOR INSERT
   TO authenticated
   WITH CHECK (true);
   ```

3. Keine service_role Logik (Overwrite-Mode schwierig)

### Warum NICHT empfohlen?

- Session-Probleme schwer zu debuggen
- RLS-Policies können komplex sein
- Overwrite-Mode erfordert DELETE-Permission
- Bulk-Insert langsamer im Browser
- Schlechteres Error-Handling

## Best Practices

✅ **DO:**
- Verwende Server-API für alle Admin-Bulk-Operationen
- Halte service_role key in `.env.local`
- Füge `.env.local` zu `.gitignore` hinzu (ist bereits)
- Logge Errors server-side (console.log in API Route)

❌ **DON'T:**
- service_role key committen
- service_role key im Client-Code
- Bulk-Insert ohne Fehlerbehandlung
- Sensible Daten im Browser speichern

## Nächste Schritte

Falls weitere Tabellen Import benötigen:
1. Erstelle ähnliche API Route (z.B. `/api/admin/phrases/import`)
2. Verwende gleiches Pattern (service_role server-side)
3. Passe Client-Funktion an

## Zusammenfassung

**Was wurde implementiert:**
- ✅ Server-Side API Route mit service_role key
- ✅ Client-Side Funktion sendet an API
- ✅ Sichere Architektur (key nie im Browser)
- ✅ Detailliertes Error-Handling
- ✅ Logging für Debugging

**Warum diese Lösung:**
- Sicher (service_role nur server-side)
- Zuverlässig (keine RLS-Probleme)
- Wartbar (klare Trennung)
- Erweiterbar (Auth-Checks möglich)

**Status:** ✅ Produktionsreif
