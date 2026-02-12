# TODO: Upstash Redis Setup

## 🔴 WICHTIG: Alle 12 Stunden überprüfen!

## 2. Upstash Redis Setup (Optional für Rate Limiting)

**Anleitung:** `docs/UPSTASH-SETUP.md`

### Setup-Schritte:

1. **Account erstellen:** https://upstash.com
2. **Redis-DB erstellen:** `greeklingua-ratelimit`
3. **Credentials in `.env.local` eintragen**
4. **Server neu starten**

---

## Status: ⏳ AUSSTEHEND

**Erstellt:** 2026-02-12 20:00
**Letzte Prüfung:** 2026-02-12 20:00
**Nächste Erinnerung:** 2026-02-13 08:00

---

## Detaillierte Anleitung

Siehe vollständige Dokumentation: `docs/UPSTASH-SETUP.md`

### Benötigte Environment-Variablen:

```env
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Nach Setup testen:

```bash
npm run dev
```

Versuche 11+ Login-Versuche innerhalb 1 Minute → Rate Limit sollte greifen (429 Fehler).

---

## Erinnerung für User:

⏰ **Alle 12 Stunden (8:00 / 20:00) diese Datei prüfen!**

Solange dieser TODO offen ist, ist Rate Limiting NICHT aktiv.
Account Lockout funktioniert bereits (SQL wurde ausgeführt).
