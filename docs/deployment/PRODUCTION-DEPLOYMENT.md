# 🚀 Production Deployment Guide

**Stand:** 2026-02-12
**Status:** ✅ Production-Ready

---

## ✅ Pre-Deployment Checklist

### **1. Environment Variables**
- [ ] `.env.local` erstellt (von `.env.example` kopiert)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt
- [ ] `UPSTASH_REDIS_REST_URL` gesetzt
- [ ] `UPSTASH_REDIS_REST_TOKEN` gesetzt
- [ ] `NEXT_PUBLIC_ADMIN_ALLOWED_IPS` konfiguriert (für Production!)

### **2. Supabase Secrets**
- [ ] `TELEGRAM_BOT_TOKEN` via CLI gesetzt
- [ ] `TELEGRAM_ADMIN_CHAT_ID` via CLI gesetzt

### **3. SQL-Migrationen**
- [ ] Alle 16 SQL-Dateien in Supabase SQL Editor ausgeführt
- [ ] RPC-Funktionen verifiziert (siehe SECURITY-STATUS.md)

### **4. Security Features**
- [ ] Rate Limiting getestet (Upstash Redis aktiv)
- [ ] Account Lockout getestet (5 Fehlversuche)
- [ ] Honeypot-PINs getestet (Telegram-Alert)
- [ ] Device Fingerprinting aktiv
- [ ] Admin MFA konfiguriert (optional)

---

## 🔐 Security Configuration

### **IP-Whitelisting für Admin-Login**

**⚠️ WICHTIG:** Für Production **MUSS** IP-Whitelisting aktiviert werden!

**In `.env.local`:**
```env
# Production: Nur bestimmte IPs erlauben
NEXT_PUBLIC_ADMIN_ALLOWED_IPS=203.0.113.42,198.51.100.10

# Development: Leer lassen
NEXT_PUBLIC_ADMIN_ALLOWED_IPS=
```

**Deine eigene IP herausfinden:**
```bash
curl https://api.ipify.org
```

---

## 📦 Deployment auf Vercel

### **1. GitHub Repository vorbereiten**

```bash
git add -A
git commit -m "Production ready"
git push origin main
```

### **2. Vercel Dashboard**

1. Gehe zu: https://vercel.com/dashboard
2. Klicke **"New Project"**
3. Importiere GitHub Repository: `GreekLlingual`
4. Framework: **Next.js** (auto-detected)
5. Root Directory: `./`

### **3. Environment Variables setzen**

Im Vercel Dashboard → **Settings** → **Environment Variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bzdzqmnxycnudflcnmzj.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` | Production |
| `UPSTASH_REDIS_REST_URL` | `https://sharing-stallion-54978.upstash.io` | Production |
| `UPSTASH_REDIS_REST_TOKEN` | `AdbCAA...` | Production |
| `NEXT_PUBLIC_ADMIN_ALLOWED_IPS` | `203.0.113.42` | Production |

**⚠️ Secrets (TELEGRAM_*) werden NICHT hier gesetzt** - die sind in Supabase!

### **4. Deploy**

Klicke **"Deploy"** - Vercel baut automatisch.

**Build-Zeit:** ~2-3 Minuten

**URL:** `https://greek-llingual-xyz.vercel.app`

---

## 🧪 Post-Deployment Tests

Nach erfolgreichem Deployment:

### **Test 1: Login-PIN**
1. Öffne: `https://your-domain.vercel.app/login-pin`
2. Gib gültigen PIN ein
3. ✅ Login funktioniert

### **Test 2: Honeypot + Telegram**
1. Gib PIN `0000` ein
2. ✅ Login wird blockiert
3. ✅ Telegram-Nachricht kommt an

### **Test 3: Rate Limiting**
1. 11x schnell falschen PIN eingeben
2. ✅ Nach 10 Versuchen: "Rate limit exceeded"

### **Test 4: Account Lockout**
1. 5x falschen PIN für einen User eingeben
2. ✅ "Account locked for 15 minutes"

### **Test 5: Admin-Login**
1. Öffne: `https://your-domain.vercel.app/login`
2. ✅ IP-Whitelist prüft deine IP
3. ✅ CAPTCHA funktioniert
4. ✅ Audit-Log wird erstellt

### **Test 6: Admin-Dashboard**
1. Login als Admin
2. ✅ Login History zeigt Einträge
3. ✅ Student Management funktioniert

---

## 🔒 Security Best Practices

### **1. Regelmäßige Checks**
- [ ] Wöchentlich Admin Audit-Log prüfen
- [ ] Monatlich Supabase RLS-Policies prüfen
- [ ] Bei Verdacht: IP-Ban-Liste prüfen (`banned_ips` Tabelle)

### **2. Notfall-Prozeduren**

**Account entsperren:**
```sql
-- In Supabase SQL Editor
SELECT unlock_user('<user_id>');
```

**IP entbannen:**
```sql
-- In Supabase SQL Editor
SELECT unban_user_ips('<user_id>');
-- Oder alle IPs:
SELECT unban_all_ips();
```

**MFA deaktivieren (Notfall):**
```sql
SELECT disable_admin_mfa('<user_id>');
```

### **3. Monitoring**

**Telegram-Alerts überwachen:**
- 🚨 Honeypot-Versuche
- 🔒 Account-Lockouts
- ⚠️ Ungewöhnliche Login-Muster

**Supabase Dashboard:**
- Database → Tables → `admin_login_log`
- Database → Tables → `banned_ips`
- Database → Tables → `notification_log`

---

## 🐛 Troubleshooting

### **Problem: Rate Limiting funktioniert nicht**

**Lösung:**
1. Prüfe Upstash Redis Dashboard: https://console.upstash.com
2. Prüfe ENV-Variablen in Vercel
3. Logs prüfen: Vercel Dashboard → Functions → Logs

### **Problem: Telegram-Nachricht kommt nicht**

**Lösung:**
1. Prüfe Supabase Secrets:
   ```bash
   supabase secrets list
   ```
2. Teste Edge Function direkt:
   ```bash
   curl -X POST https://bzdzqmnxycnudflcnmzj.supabase.co/functions/v1/send-telegram \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{"message": "Test"}'
   ```

### **Problem: IP-Whitelisting blockiert mich**

**Lösung:**
1. Hole deine aktuelle IP:
   ```bash
   curl https://api.ipify.org
   ```
2. Füge IP zu `NEXT_PUBLIC_ADMIN_ALLOWED_IPS` hinzu
3. Redeploy auf Vercel

---

## 📊 Performance-Optimierung

### **1. Next.js Caching**

Bereits konfiguriert:
- Middleware cached
- Static Pages cached
- API Routes on-demand

### **2. Supabase Connection Pooling**

Bereits aktiv (Supabase verwaltet automatisch)

### **3. Upstash Redis**

- Sliding Window Algorithm = optimal
- Analytics aktiviert = Monitoring

---

## 🔄 Updates & Wartung

### **Update-Prozess:**

1. Teste lokal:
   ```bash
   npm run dev
   npm run build
   ```

2. Committe Changes:
   ```bash
   git add -A
   git commit -m "Update: ..."
   git push
   ```

3. Vercel deployed automatisch (Continuous Deployment)

4. Teste Production-URL nach Deploy

---

## ✅ Production-Status

**Deployment:** ✅ Ready
**Security:** ✅ Hardened
**Monitoring:** ✅ Active
**Backups:** ✅ Supabase Auto-Backup
**SSL:** ✅ Vercel Auto-SSL

---

**Bei Fragen:** Siehe `docs/NEXT-STEPS.md` oder `docs/SECURITY-STATUS.md`
