# Telegram Bot Setup für Security Alerts

**Status:** ⚠️ Vorbereitet, aber NICHT aktiviert
**Zweck:** Admin-Benachrichtigungen bei Sicherheitsvorfällen (Honeypot-Login, Account-Lockout, etc.)

---

## 🤖 1. Telegram Bot erstellen

### **Schritt 1: BotFather starten**
1. Öffne Telegram
2. Suche nach **@BotFather**
3. Starte Chat mit `/start`

### **Schritt 2: Neuen Bot erstellen**
```
/newbot
```

**BotFather fragt:**
- **Name:** `GreekLingua Security Bot` (kann beliebig sein)
- **Username:** `greeklingua_security_bot` (muss auf `_bot` enden und eindeutig sein)

**Antwort von BotFather:**
```
Done! Congratulations on your new bot. You will find it at t.me/greeklingua_security_bot.

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789

For a description of the Bot API, see this page:
https://core.telegram.org/bots/api
```

**✅ Kopiere den Token:** `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789`

---

## 💬 2. Chat-ID herausfinden

### **Option A: Über GetUpdates API (einfach)**

1. **Starte Chat mit deinem Bot:**
   - Öffne `t.me/greeklingua_security_bot` (dein Bot-Username)
   - Klicke **"Start"**
   - Sende eine beliebige Nachricht (z.B. "Test")

2. **Hole Chat-ID via API:**
   ```bash
   curl https://api.telegram.org/bot<DEIN_BOT_TOKEN>/getUpdates
   ```

   **Beispiel:**
   ```bash
   curl https://api.telegram.org/bot1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789/getUpdates
   ```

3. **Antwort (JSON):**
   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456789,
         "message": {
           "message_id": 1,
           "from": {
             "id": 987654321,
             "is_bot": false,
             "first_name": "Dein Name"
           },
           "chat": {
             "id": 987654321,  // ← DAS IST DEINE CHAT-ID!
             "first_name": "Dein Name",
             "type": "private"
           },
           "text": "Test"
         }
       }
     ]
   }
   ```

4. **✅ Kopiere die Chat-ID:** `987654321`

### **Option B: Über @userinfobot (alternativ)**

1. Starte Chat mit **@userinfobot**
2. Bot sendet automatisch deine Chat-ID

---

## 🔐 3. Secrets in Supabase setzen

### **Wo:**
1. Öffne https://supabase.com/dashboard
2. Wähle dein Projekt: **HellenicHorizons GreekLingua**
3. Gehe zu: **Settings** → **Edge Functions**

### **Secrets hinzufügen:**

**Secret 1: TELEGRAM_BOT_TOKEN**
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

**Secret 2: TELEGRAM_ADMIN_CHAT_ID**
```bash
supabase secrets set TELEGRAM_ADMIN_CHAT_ID=987654321
```

**Alternative (über UI):**
1. Klicke **"Add new secret"**
2. Name: `TELEGRAM_BOT_TOKEN`, Value: `<dein-token>`
3. Klicke **"Add new secret"**
4. Name: `TELEGRAM_ADMIN_CHAT_ID`, Value: `<deine-chat-id>`

---

## ☁️ 4. Edge Function deployen

### **Voraussetzung:** Supabase CLI installiert
```bash
npm install -g supabase
```

### **Login:**
```bash
supabase login
```

### **Link zu deinem Projekt:**
```bash
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard
supabase link --project-ref <deine-projekt-ref>
```

**Projekt-Ref findest du hier:**
- Supabase Dashboard → Settings → General → Reference ID

### **Deploy Edge Function:**
```bash
supabase functions deploy send-telegram
```

**Erwartete Ausgabe:**
```
Deploying send-telegram (typescript)...
Function URL: https://<projekt-ref>.supabase.co/functions/v1/send-telegram
```

---

## ✅ 5. Test der Edge Function

### **Manueller Test via cURL:**
```bash
curl -X POST \
  https://<projekt-ref>.supabase.co/functions/v1/send-telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "🧪 Test-Nachricht von GreekLingua Security Bot"
  }'
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "message": "Message sent",
  "telegramResponse": { ... }
}
```

**✅ Prüfe Telegram:** Du solltest die Nachricht erhalten haben!

---

## 🔗 6. Integration in verify_user_4digit_pin() aktivieren

Die Edge Function ist bereits vorbereitet in `supabase/prepare_notification_system.sql`.

### **Was passiert:**
Wenn ein Honeypot-PIN versucht wird:
1. `verify_user_4digit_pin()` erkennt Honeypot
2. Bannt IP (`banned_ips` Tabelle)
3. Ruft `send_security_alert()` RPC auf
4. RPC ruft Edge Function auf
5. Edge Function sendet Telegram-Nachricht
6. Log-Eintrag in `notification_log`

### **Aktivierung:**
Die Integration ist bereits im SQL-Code vorbereitet. Nach Deploy der Edge Function + Secrets ist das System **automatisch aktiv**.

---

## 📱 7. Nachrichten-Format

### **Honeypot-Alert:**
```
🚨 SECURITY ALERT

Honeypot-PIN detected!

PIN: 0000
IP: 192.168.1.100
Time: 2026-02-12 21:45:23 UTC

User banned immediately.
```

### **Account-Lockout:**
```
🔒 Account Lockout

User: student_name
Attempts: 5
Locked until: 2026-02-12 22:00:00 UTC
IP: 192.168.1.101
```

---

## 🧪 8. Verifizierung

### **1. Prüfe Secrets:**
```bash
supabase secrets list
```

**Erwartete Ausgabe:**
```
TELEGRAM_BOT_TOKEN (set)
TELEGRAM_ADMIN_CHAT_ID (set)
```

### **2. Prüfe Edge Function:**
```bash
supabase functions list
```

**Erwartete Ausgabe:**
```
send-telegram (deployed)
```

### **3. Prüfe notification_log Tabelle:**
```sql
SELECT * FROM notification_log ORDER BY created_at DESC LIMIT 10;
```

---

## ❗ Troubleshooting

### **Problem:** "Bot token is invalid"
**Lösung:** Prüfe Token-Format (muss sein: `123456789:ABC...`)

### **Problem:** "Chat not found"
**Lösung:**
1. Starte Chat mit Bot in Telegram
2. Sende mindestens eine Nachricht
3. Hole Chat-ID neu via `getUpdates`

### **Problem:** "Edge function not found"
**Lösung:**
```bash
supabase functions deploy send-telegram --no-verify-jwt
```

### **Problem:** "Unauthorized"
**Lösung:** Prüfe ob Secrets gesetzt sind:
```bash
supabase secrets list
```

---

## 🔄 Alternative: WhatsApp statt Telegram

**Nicht empfohlen**, da WhatsApp Business API komplex ist:
- Benötigt Facebook Business Account
- Benötigt verifizierte Telefonnummer
- Monatliche Kosten (nach 1000 Nachrichten)
- Setup-Zeit: 2-3 Tage

**Telegram ist einfacher:**
- Kostenlos
- Setup in 5 Minuten
- Keine Verifizierung nötig
- Unbegrenzte Nachrichten

---

## ✅ Checkliste

- [ ] Telegram Bot erstellt (@BotFather)
- [ ] Bot-Token kopiert
- [ ] Chat mit Bot gestartet
- [ ] Chat-ID ermittelt (via getUpdates)
- [ ] Secrets in Supabase gesetzt (TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID)
- [ ] Supabase CLI installiert
- [ ] Edge Function deployed (`send-telegram`)
- [ ] Manueller Test erfolgreich (cURL)
- [ ] SQL-Migration ausgeführt (`prepare_notification_system.sql`)
- [ ] Honeypot-Test durchgeführt (PIN 0000 eingeben)
- [ ] Telegram-Nachricht erhalten ✅

---

**Geschätzte Setup-Zeit:** 15-20 Minuten
**Status nach Setup:** System automatisch aktiv, Admin erhält sofort Benachrichtigungen
