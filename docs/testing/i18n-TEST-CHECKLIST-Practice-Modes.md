# i18n Test Checklist – Practice Modes

**Sprachen:** RU (Russisch), EL (Griechisch)
**Keys:** 30 pro Sprache
**Date:** 2026-02-17
**Agent:** Agent 2 (i18n Specialist)

---

## 🧪 MANUELLE UI-TESTS

### Pre-Test Setup
- [ ] Dev-Server starten: `npm run dev`
- [ ] Browser öffnen: `http://localhost:3000`
- [ ] Als Student einloggen

---

### **Test 1: Sprachenwechsel Allgemein**
**Ziel:** Prüfen ob RU und EL korrekt laden

1. Dashboard öffnen
2. Language Selector öffnen
3. **RU wählen:**
   - [ ] Header-Texte auf RU
   - [ ] Button-Labels auf RU
   - [ ] Navigation auf RU
4. **EL wählen:**
   - [ ] Header-Texte auf EL (Dimotiki!)
   - [ ] Button-Labels auf EL
   - [ ] Navigation auf EL

**Acceptance:**
- ✅ Keine Hardcoded English Strings
- ✅ Alle Texte wechseln sofort
- ✅ Keine Fehler in Console

---

### **Test 2: Practice Modes Page (RU)**
**Ziel:** Alle Practice-Texte auf Russisch prüfen

1. Sprache auf **RU** setzen
2. `/practice-modes` öffnen (Button 13 im Dashboard)
3. **Prüfe Page-Header:**
   - [ ] Title: "Режимы Практики"
   - [ ] Subtitle vorhanden und auf RU
4. **Prüfe Info-Cards:**
   - [ ] "Игра на Совпадение" (Matching Game)
   - [ ] "Множественный Выбор" (Multiple Choice)
   - [ ] "Напиши" (Write Input)
   - [ ] Descriptions auf RU
5. **Prüfe Buttons:**
   - [ ] "Начать Практику" (Start Practice)
   - [ ] "Заблокировано" (Locked) - falls applicable
   - [ ] "Разблокировано!" (Unlocked) - falls applicable

**Acceptance:**
- ✅ Alle Texte auf Russisch
- ✅ Informal "ты" Form verwendet
- ✅ Freundlicher Ton

---

### **Test 3: Practice Modes Page (EL)**
**Ziel:** Alle Practice-Texte auf Griechisch prüfen (Dimotiki!)

1. Sprache auf **EL** setzen
2. `/practice-modes` öffnen
3. **Prüfe Page-Header:**
   - [ ] Title: "Λειτουργίες Πρακτικής"
   - [ ] Subtitle auf EL
4. **Prüfe Info-Cards:**
   - [ ] "Παιχνίδι Αντιστοίχισης" (Matching Game)
   - [ ] "Πολλαπλή Επιλογή" (Multiple Choice)
   - [ ] "Γράψε το" (Write Input)
   - [ ] Descriptions auf EL
5. **Prüfe Buttons:**
   - [ ] "Ξεκίνα την Πρακτική" (Start Practice)
   - [ ] "Κλειδωμένο" (Locked)
   - [ ] "Ξεκλειδώθηκε!" (Unlocked)

**KRITISCH - Dimotiki-Check:**
- [ ] ✅ "Καλώς ήρθες" (nicht "Καλώς ήλθες")
- [ ] ✅ "Ξεκίνα" (nicht "Ξεκίνησον")
- [ ] ✅ "Γράψε" (nicht "Γράψον")
- [ ] ✅ Imperativ 2. Person Singular
- [ ] ❌ KEINE Katharevousa-Formen

**Acceptance:**
- ✅ Alle Texte auf Griechisch
- ✅ Dimotiki-Stil verwendet
- ✅ Modern und freundlich
- ❌ KEINE altertümlichen Formen

---

### **Test 4: Matching Game (RU)**
**Ziel:** Game-spezifische Translations prüfen

1. Sprache: **RU**
2. Matching Game öffnen
3. **Prüfe Instructions:**
   - [ ] "Сопоставь английские слова с их греческими переводами"
4. **Prüfe UI-Elemente:**
   - [ ] Timer: "Время: {X}с"
   - [ ] Score: "Очки: {X}%"
   - [ ] Mistakes: "Ошибки: {X}"
5. **Spiele das Game:**
   - [ ] Feedback "Правильно! Молодец!" (Correct)
   - [ ] Feedback "Неправильно. Попробуй ещё раз!" (Incorrect)
6. **Prüfe Result Summary:**
   - [ ] Title: "Практика Завершена!"
   - [ ] "Твой Результат" (Your Score)
   - [ ] "Затраченное Время" (Time Taken)
   - [ ] "Рейтинг FSRS" (FSRS Rating)
   - [ ] Button: "Попробовать Снова" (Try Again)
   - [ ] Button: "Закрыть" (Close)

**Acceptance:**
- ✅ Alle Feedback-Texte auf RU
- ✅ Informal "ты" Form ("Попробуй", nicht "Попробуйте")
- ✅ Freundlicher Ton ("Молодец!")

---

### **Test 5: Matching Game (EL)**
**Ziel:** Game-spezifische Translations prüfen (Dimotiki!)

1. Sprache: **EL**
2. Matching Game öffnen
3. **Prüfe Instructions:**
   - [ ] "Αντιστοίχισε τις αγγλικές λέξεις με τις ελληνικές μεταφράσεις"
4. **Prüfe UI-Elemente:**
   - [ ] Timer: "Χρόνος: {X}s"
   - [ ] Score: "Σκορ: {X}%"
   - [ ] Mistakes: "Λάθη: {X}"
5. **Spiele das Game:**
   - [ ] Feedback "Σωστό! Μπράβο!" (Correct)
   - [ ] Feedback "Λάθος. Δοκίμασε ξανά!" (Incorrect)
   - [ ] Feedback "Πολύ κοντά! Έλεγξε την ορθογραφία." (Very close)
6. **Prüfe Result Summary:**
   - [ ] Title: "Πρακτική Ολοκληρώθηκε!"
   - [ ] "Το Σκορ σου" (Your Score)
   - [ ] "Χρόνος που πήρε" (Time Taken)
   - [ ] "Αξιολόγηση FSRS" (FSRS Rating)
   - [ ] Button: "Δοκίμασε Ξανά" (Try Again)
   - [ ] Button: "Κλείσε" (Close)

**KRITISCH - Dimotiki-Check:**
- [ ] ✅ "Αντιστοίχισε" (nicht "Αντιστοιχίσατε")
- [ ] ✅ "Δοκίμασε" (nicht "Δοκιμάσατε")
- [ ] ✅ "Έλεγξε" (nicht "Ελέγξατε")
- [ ] ✅ Imperativ 2. Person Singular
- [ ] ✅ "Μπράβο!" (modern, freundlich)

**Acceptance:**
- ✅ Alle Feedback-Texte auf EL
- ✅ Dimotiki-Stil durchgehend
- ✅ Modern und freundlich

---

### **Test 6: Multiple Choice (RU)**
**Ziel:** Quiz-spezifische Translations

1. Sprache: **RU**
2. Multiple Choice öffnen
3. **Prüfe Instructions:**
   - [ ] "Выбери правильный греческий перевод"
4. **Prüfe Feedback:**
   - [ ] Correct: "Правильно! Молодец!"
   - [ ] Incorrect: "Неправильно. Попробуй ещё раз!"
5. **Prüfe Result Summary:**
   - [ ] Alle Texte auf RU
   - [ ] Konsistent mit Matching Game

**Acceptance:**
- ✅ Konsistenter Stil mit Matching Game
- ✅ Informal "ты" Form

---

### **Test 7: Multiple Choice (EL)**
**Ziel:** Quiz-spezifische Translations (Dimotiki!)

1. Sprache: **EL**
2. Multiple Choice öffnen
3. **Prüfe Instructions:**
   - [ ] "Διάλεξε τη σωστή ελληνική μετάφραση"
4. **Prüfe Feedback:**
   - [ ] Correct: "Σωστό! Μπράβο!"
   - [ ] Incorrect: "Λάθος. Δοκίμασε ξανά!"
5. **Prüfe Result Summary:**
   - [ ] Alle Texte auf EL
   - [ ] Dimotiki-Stil konsistent

**KRITISCH:**
- [ ] ✅ "Διάλεξε" (nicht "Διαλέξατε" oder "Διάλεξον")

**Acceptance:**
- ✅ Dimotiki-Stil durchgehend
- ✅ Konsistent mit Matching Game

---

### **Test 8: Write Input (RU)**
**Ziel:** Input-spezifische Translations

1. Sprache: **RU**
2. Write Input öffnen
3. **Prüfe Instructions:**
   - [ ] "Напиши греческий перевод"
4. **Prüfe UI:**
   - [ ] Attempts: "Попытки: {current} / {max}"
5. **Prüfe Feedback:**
   - [ ] Correct: "Правильно! Молодец!"
   - [ ] Close: "Очень близко! Проверь правописание."
   - [ ] Incorrect: "Неправильно. Попробуй ещё раз!"

**Acceptance:**
- ✅ Informal "ты" Form ("Напиши", "Проверь")
- ✅ Freundlicher Ton

---

### **Test 9: Write Input (EL)**
**Ziel:** Input-spezifische Translations (Dimotiki!)

1. Sprache: **EL**
2. Write Input öffnen
3. **Prüfe Instructions:**
   - [ ] "Γράψε την ελληνική μετάφραση"
4. **Prüfe UI:**
   - [ ] Attempts: "Προσπάθειες: {current} / {max}"
5. **Prüfe Feedback:**
   - [ ] Correct: "Σωστό! Μπράβο!"
   - [ ] Close: "Πολύ κοντά! Έλεγξε την ορθογραφία."
   - [ ] Incorrect: "Λάθος. Δοκίμασε ξανά!"

**KRITISCH:**
- [ ] ✅ "Γράψε" (nicht "Γράψον" oder "Γράψτε")
- [ ] ✅ "Έλεγξε" (nicht "Ελέγξατε")

**Acceptance:**
- ✅ Dimotiki-Stil konsistent
- ✅ Imperativ 2. Person Singular

---

### **Test 10: Admin Config (RU)**
**Ziel:** Admin-Panel Practice Config auf RU

1. Als Admin einloggen
2. Admin-Panel öffnen
3. Content Management → Learning Item bearbeiten
4. Practice Modes Configuration öffnen
5. **Prüfe Labels:**
   - [ ] Title: "Настройка Режимов Практики"
   - [ ] "Включить режимы практики" (Enable)
   - [ ] "Порог Активации (Повторений)" (Threshold)
   - [ ] "Доступные Режимы" (Available Modes)
6. **Config speichern:**
   - [ ] Toast: "Конфигурация практики сохранена!"

**Acceptance:**
- ✅ Alle Admin-Texte auf RU
- ✅ Professional aber freundlich

---

### **Test 11: Admin Config (EL)**
**Ziel:** Admin-Panel Practice Config auf EL (Dimotiki!)

1. Als Admin einloggen
2. Sprache auf **EL** setzen
3. Admin-Panel → Content Management
4. Learning Item bearbeiten → Practice Config
5. **Prüfe Labels:**
   - [ ] Title: "Ρυθμίσεις Λειτουργιών Πρακτικής"
   - [ ] "Ενεργοποίηση λειτουργιών πρακτικής" (Enable)
   - [ ] "Όριο Ενεργοποίησης (Επαναλήψεις)" (Threshold)
   - [ ] "Διαθέσιμες Λειτουργίες" (Available Modes)
6. **Config speichern:**
   - [ ] Toast: "Η διαμόρφωση πρακτικής αποθηκεύτηκε!"

**Acceptance:**
- ✅ Alle Admin-Texte auf EL
- ✅ Dimotiki-Stil (professional aber modern)

---

## ✅ ACCEPTANCE CRITERIA

### Funktional:
- [ ] Alle 30 Practice Keys für RU vorhanden
- [ ] Alle 30 Practice Keys für EL vorhanden
- [ ] Keine Hardcoded English Strings in Practice Modes
- [ ] Language Switch funktioniert instant
- [ ] Keine Console-Errors

### Style-Konformität:
- [ ] **RU:** Informal "ты" Form durchgehend
- [ ] **RU:** Freundlicher, direkter Ton
- [ ] **EL:** Dimotiki-Stil (KEIN Katharevousa!)
- [ ] **EL:** Imperativ 2. Person Singular
- [ ] **EL:** Modern und freundlich

### Konsistenz:
- [ ] Terminology konsistent innerhalb RU
- [ ] Terminology konsistent innerhalb EL
- [ ] Feedback-Messages konsistent über alle Games
- [ ] Admin-Texte konsistent mit User-Texte

---

## 🐛 Bug-Tracking

**Falls Fehler gefunden:**
1. Screenshot erstellen
2. Browser Console kopieren
3. Fehlenden/falschen Key notieren
4. Issue erstellen oder direkt fixen

---

## 📊 Test-Ergebnis

**Date Tested:** _______________________
**Tester:** _______________________
**Browser:** _______________________

**Overall Result:**
- [ ] ✅ PASS - Alle Tests bestanden
- [ ] ⚠️ MINOR ISSUES - Kleine Korrekturen nötig
- [ ] ❌ FAIL - Größere Probleme gefunden

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Ready for Production:** [ ] YES / [ ] NO

---

**Agent 2 (i18n Specialist)** - 2026-02-17
