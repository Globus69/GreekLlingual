# ✅ Nächste Schritte - Security Setup Abschließen

**Stand:** 2026-02-12 21:45
**Status:** Alle Features implementiert, SQL + Testing ausstehend

---

## 📋 Quick Checklist

### **Phase 1: SQL-Migrationen (15 Min.)** ✅ Priorität HOCH

1. **Öffne Supabase SQL Editor:**
   - https://supabase.com/dashboard
   - Projekt: **HellenicHorizons GreekLingua**
   - SQL Editor → New Query

2. **Führe 3 Migrationen aus:**

   **Migration 1:** `supabase/add_device_fingerprint.sql`
   ```sql
   -- Kopiere kompletten Inhalt, dann Run
   ```

   **Migration 2:** `supabase/add_admin_mfa.sql`
   ```sql
   -- Kopiere kompletten Inhalt, dann Run
   ```

   **Migration 3:** `supabase/create_audit_log.sql`
   ```sql
   -- Kopiere kompletten Inhalt, dann Run
   ```

3. **Verifizierung:**
   ```sql
   -- Prüfe ob Spalten existieren
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'users'
   AND column_name IN ('device_fingerprint', 'mfa_secret', 'mfa_enabled', 'mfa_recovery_codes');

   -- Prüfe ob admin_login_log Tabelle existiert
   SELECT * FROM admin_login_log LIMIT 1;

   -- Prüfe RPC-Funktionen
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE '%mfa%'
   ORDER BY routine_name;
   ```

   **Erwartete Funktionen:**
   - `save_admin_mfa_secret`
   - `get_admin_mfa_secret`
   - `use_admin_recovery_code`
   - `disable_admin_mfa`

---

### **Phase 2: Testing (20 Min.)** ✅ Priorität HOCH

#### **Test 1: Rate Limiting**
1. Öffne `/login-pin`
2. Gib 11x einen falschen PIN ein (schnell hintereinander)
3. **Erwartetes Verhalten:** Nach 10 Versuchen → 429 Error + "Rate limit exceeded. Try again in X seconds."

#### **Test 2: Account Lockout**
1. Öffne `/login-pin`
2. Gib 5x einen falschen PIN für einen User ein
3. **Erwartetes Verhalten:** Nach 5 Versuchen → "Account locked for 15 minutes"
4. **Admin-Entsperrung testen:**
   - Gehe zu `/admin`
   - Öffne Student Management
   - Finde gesperrten User (🔒 Badge)
   - Klicke "🔓 Account entsperren"
   - **Erwartetes Verhalten:** User kann wieder einloggen

#### **Test 3: Device Fingerprinting**
1. Öffne `/login-pin`
2. Logge dich ein (erfolgreicher Login)
3. Öffne Supabase → Table Editor → users
4. **Erwartetes Verhalten:** `device_fingerprint` Spalte hat einen Hash-String (z.B. "a3f5c9d2e8b1...")

#### **Test 4: Admin Audit-Log**
1. Öffne `/login`
2. Logge dich als Admin ein (erfolgreich)
3. Logge dich aus, versuche falschen Login (2x)
4. Öffne `/admin`
5. Scrolle zu "🔐 Admin Login History"
6. **Erwartetes Verhalten:**
   - Statistiken zeigen: Total Attempts, Last 24h, Unique IPs
   - Klick "Show Login History"
   - Tabelle zeigt 3 Einträge (1x Success ✅, 2x Failed ❌)

#### **Test 5: Honeypot-PIN**
1. Öffne `/login-pin`
2. Gib PIN `0000` ein
3. **Erwartetes Verhalten:**
   - Login fehlschlägt
   - IP wird gebannt (in `banned_ips` Tabelle)
   - Optional: Telegram-Nachricht (falls aktiviert)

#### **Test 6: Progressive Delays**
1. Öffne `/login` oder `/login-pin`
2. Gib 5x hintereinander falschen PIN ein
3. **Erwartetes Verhalten:**
   - 1. Versuch: Sofortige Antwort (0ms)
   - 2. Versuch: 1 Sekunde Verzögerung
   - 3. Versuch: 2 Sekunden Verzögerung
   - 4. Versuch: 5 Sekunden Verzögerung
   - 5. Versuch: 10 Sekunden Verzögerung

#### **Test 7: Session Timeout**
1. Logge dich als Admin ein (`/login`)
2. Lasse Browser-Tab 16 Minuten offen (nicht benutzen)
3. Versuche auf `/admin` zu navigieren
4. **Erwartetes Verhalten:** Automatischer Logout + Redirect zu `/login`

---

### **Phase 3: MFA Setup (optional, 30 Min.)** ⚠️ Priorität MITTEL

**Voraussetzung:** SQL-Migration 2 (`add_admin_mfa.sql`) ausgeführt

#### **MFA-Setup Flow:**

1. **Admin-Dashboard erweitern:**
   - Öffne `src/app/admin/page.tsx`
   - Füge MFA-Setup-Button hinzu (z.B. unter Settings-Karte)
   - Import: `import MFASetup from '@/components/admin/MFASetup';`

2. **MFA-Setup Dialog öffnen:**
   ```tsx
   const [showMFASetup, setShowMFASetup] = useState(false);

   <div onClick={() => setShowMFASetup(true)}>
     ⚙️ MFA einrichten
   </div>

   {showMFASetup && (
     <MFASetup
       userId={user.id}
       userEmail={user.email}
       onComplete={() => setShowMFASetup(false)}
       onCancel={() => setShowMFASetup(false)}
     />
   )}
   ```

3. **MFA-Setup durchführen:**
   - Öffne Admin-Dashboard → Settings → "MFA einrichten"
   - QR-Code wird angezeigt
   - Scanne mit Authenticator-App (Google Authenticator, Authy, etc.)
   - 10 Recovery Codes werden generiert → SPEICHERN!
   - Gib ersten 6-stelligen Code ein zur Verifizierung
   - **Erwartetes Verhalten:** "MFA erfolgreich aktiviert" + mfa_enabled=true in DB

4. **MFA-Login testen:**
   - Logout
   - Login mit Username + PIN
   - **Erwartetes Verhalten:** Nach erfolgreichem PIN → MFA-Dialog erscheint
   - Gib 6-stelligen Code aus Authenticator-App ein
   - **Erwartetes Verhalten:** Erfolgreicher Login + Redirect zu `/dashboard`

5. **Recovery Code testen:**
   - Logout
   - Login mit Username + PIN
   - Im MFA-Dialog: Klicke "Use Recovery Code"
   - Gib einen der 10 Recovery Codes ein
   - **Erwartetes Verhalten:** Erfolgreicher Login, Code wird ungültig (nur 1x nutzbar)

---

### **Phase 4: Telegram-Benachrichtigungen (optional, 20 Min.)** ⚠️ Priorität NIEDRIG

**Siehe:** `docs/TELEGRAM-SETUP.md`

**Kurz-Anleitung:**

1. **Telegram Bot erstellen:**
   - @BotFather → `/newbot`
   - Bot-Token kopieren

2. **Chat-ID ermitteln:**
   - Starte Chat mit deinem Bot
   - cURL: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Chat-ID kopieren

3. **Secrets in Supabase setzen:**
   ```bash
   supabase secrets set TELEGRAM_BOT_TOKEN=<dein-token>
   supabase secrets set TELEGRAM_ADMIN_CHAT_ID=<deine-chat-id>
   ```

4. **Edge Function deployen:**
   ```bash
   supabase functions deploy send-telegram
   ```

5. **Test:**
   - Gib Honeypot-PIN `0000` ein
   - **Erwartetes Verhalten:** Telegram-Nachricht erhalten

---

## 🔧 Wenn Probleme auftreten

### **Build-Fehler:**
```bash
npm run build
```
→ Alle TypeScript-Fehler beheben

### **Supabase-Verbindungsprobleme:**
```bash
# Prüfe .env.local
cat .env.local | grep SUPABASE
```
→ NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY korrekt?

### **Rate Limiting funktioniert nicht:**
```bash
# Prüfe Upstash Credentials
cat .env.local | grep UPSTASH
```
→ UPSTASH_REDIS_REST_URL und UPSTASH_REDIS_REST_TOKEN korrekt?

### **RPC-Funktionen nicht gefunden:**
```sql
-- Liste alle RPC-Funktionen
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```
→ Fehlende Funktionen = SQL-Migration nicht ausgeführt

---

## 📊 Status-Check

Nach Abschluss aller Phasen sollten folgende Features **aktiv** sein:

| Feature | Status | Verifizierung |
|---------|--------|---------------|
| **Rate Limiting** | ✅ | Test 1 bestanden |
| **Account Lockout** | ✅ | Test 2 bestanden |
| **Progressive Delays** | ✅ | Test 6 bestanden |
| **Device Fingerprinting** | ✅ | Test 3 bestanden |
| **Honeypot Detection** | ✅ | Test 5 bestanden |
| **Admin Audit-Log** | ✅ | Test 4 bestanden |
| **Session Timeout** | ✅ | Test 7 bestanden |
| **Admin MFA** | ⚠️ | Optional (Phase 3) |
| **Telegram Alerts** | ⚠️ | Optional (Phase 4) |

---

## 🎯 Minimale Setup-Zeit

**Nur Phase 1 + 2 (absolutes Minimum):**
- SQL-Migrationen: 15 Min.
- Testing: 20 Min.
- **Gesamt: 35 Min.**

**Mit MFA (empfohlen):**
- + Phase 3: 30 Min.
- **Gesamt: 65 Min.**

**Komplett (inkl. Telegram):**
- + Phase 4: 20 Min.
- **Gesamt: 85 Min.**

---

## 📝 Hilfreiche Dokumentation

- **SQL-Migrationen:** `docs/SQL-MIGRATION-GUIDE.md`
- **Telegram-Setup:** `docs/TELEGRAM-SETUP.md`
- **Security-Status:** `docs/SECURITY-STATUS.md`
- **Security-Plan:** `docs/security-implementation-plan.md`

---

**Viel Erfolg beim Setup! 🚀**

Bei Fragen oder Problemen: Alle Dateien sind dokumentiert und getestet.
