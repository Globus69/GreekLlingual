# Upstash Redis Setup für Rate Limiting

## 🎯 Zweck

Rate Limiting schützt die Login-Seiten vor Brute-Force-Angriffen:
- **Max. 10 Login-Versuche pro Minute** pro IP-Adresse
- Automatische Sperrung bei Überschreitung
- Sliding Window Algorithmus (präzise, keine Burst-Spitzen)

## 📝 Setup-Anleitung (5 Minuten)

### 1. Upstash Account erstellen

1. Gehe zu: https://upstash.com
2. Klicke auf **"Sign Up"**
3. Registriere dich mit GitHub oder Email (kostenlos)

### 2. Redis-Datenbank erstellen

1. Nach Login: Dashboard → **"Create Database"**
2. Konfiguration:
   - **Name:** `greeklingua-ratelimit`
   - **Type:** Regional (schneller) oder Global (weltweite Redundanz)
   - **Region:** Wähle nächste Region (z.B. EU-Central für Europa)
   - **Eviction:** keine (nicht nötig für Rate Limiting)
3. Klicke **"Create"**

### 3. API-Credentials kopieren

1. Nach Erstellung: Klicke auf die neu erstellte Datenbank
2. Gehe zum Tab **"Details"** oder **"REST API"**
3. Kopiere diese beiden Werte:
   - **UPSTASH_REDIS_REST_URL** (z.B. `https://eu1-vocal-swan-12345.upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (langer String, beginnt oft mit `A...`)

### 4. Environment Variables setzen

Öffne `.env.local` in deinem Projekt und füge die Werte ein:

```bash
# Upstash Redis für Rate Limiting
UPSTASH_REDIS_URL=https://eu1-vocal-swan-12345.upstash.io
UPSTASH_REDIS_TOKEN=AYKnA...dein_token_hier
```

**⚠️ WICHTIG:**
- Die `.env.local` ist in `.gitignore` (wird nicht committed)
- Für Produktion: Setze die Variablen in Vercel/Hosting-Dashboard

### 5. Testen

```bash
# Dev-Server neu starten
npm run dev

# Browser öffnen: http://localhost:3001/login-pin
# Versuche 11x einen falschen PIN einzugeben
# → Nach 10 Versuchen sollte "Too many attempts" erscheinen
```

## 🔍 Monitoring

### Upstash Dashboard

1. Gehe zu: https://console.upstash.com
2. Wähle deine Datenbank: `greeklingua-ratelimit`
3. Tab **"Data Browser"**:
   - Siehst du Keys wie `greeklingua:ratelimit:192.168.1.1`
   - Jeder Key = eine IP-Adresse mit ihrem Zähler

4. Tab **"Metrics"**:
   - Commands per second
   - Request count
   - Latency

### Redis CLI (Optional)

Du kannst auch direkt Redis-Commands ausführen:

```bash
# In Upstash Dashboard → CLI
GET greeklingua:ratelimit:192.168.1.1
# Zeigt aktuelle Anzahl Requests

KEYS greeklingua:ratelimit:*
# Zeigt alle gesperrten IPs
```

## 💰 Kostenlos-Limits

**Upstash Free Tier:**
- 10.000 Commands/Tag
- 256 MB Speicher
- Perfekt für kleine bis mittlere Apps

**Rate Limiting Verbrauch:**
- Pro Login-Versuch: ~2-3 Commands (SET + GET)
- 10.000 Commands = ~3.000-5.000 Login-Versuche/Tag
- Für typische Nutzung: **völlig ausreichend**

## 🚨 Troubleshooting

### Error: "Rate limit check failed"

**Ursache:** Upstash nicht erreichbar oder falsche Credentials

**Lösung:**
1. Prüfe `.env.local`: Sind URL + Token korrekt?
2. Prüfe Upstash Dashboard: Ist Datenbank online?
3. Console-Log prüfen: `Rate limit check failed: [error]`

**Fallback:** Bei Fehler erlaubt die App den Login trotzdem (fail-open)

### Rate Limit wird nicht angewendet

**Ursache:** Environment Variables nicht geladen

**Lösung:**
1. Server neu starten: `npm run dev`
2. Prüfe: `console.log(process.env.UPSTASH_REDIS_URL)` in `rateLimit.ts`
3. Sicherstellen dass `.env.local` im Projekt-Root liegt

### "Too many requests" obwohl nur 1x versucht

**Ursache:** Alter Rate Limit Key noch aktiv

**Lösung:**
1. Upstash Dashboard → Data Browser
2. Finde Key: `greeklingua:ratelimit:deine-ip`
3. Klicke **Delete** oder warte 60 Sekunden (automatischer Reset)

## 🔧 Anpassungen

### Rate Limit ändern

**Datei:** `src/lib/rateLimit.ts`

```typescript
// Von 10 auf 20 Versuche/Minute erhöhen:
export const rateLimitLogin = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'), // <-- hier ändern
  analytics: true,
  prefix: 'greeklingua:ratelimit',
});
```

### Zeitfenster ändern

```typescript
// 5 Versuche pro 5 Minuten:
limiter: Ratelimit.slidingWindow(5, '5 m')

// 100 Versuche pro Stunde:
limiter: Ratelimit.slidingWindow(100, '1 h')
```

### Weitere Routen schützen

**Datei:** `src/middleware.ts`

```typescript
export const config = {
  matcher: [
    '/login',
    '/login-pin',
    '/api/auth',        // <-- weitere Routen hinzufügen
    '/reset-password',  // <-- weitere Routen hinzufügen
  ],
};
```

## 📚 Weitere Infos

- Upstash Docs: https://upstash.com/docs/redis
- Rate Limit Library: https://github.com/upstash/ratelimit
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
