================================================================================
          HOW-TO: Automatische Erzeugung von MP3-Aussprache-Dateien
                    (Englisch → Griechisch mit gTTS)
================================================================================

1. Voraussetzungen (einmalig installieren)

   Öffne das Terminal und führe diese Befehle aus:

   # Python 3.12 installieren (falls nicht vorhanden)
   brew install python@3.12

   # Virtuelle Umgebung erstellen (sehr empfohlen!)
   python3 -m venv venv
   source venv/bin/activate

   # Bibliothek installieren
   pip install gtts


2. Dateien anlegen

   Erstelle im selben Ordner zwei Dateien:

   a) tts_grieschich.py (das Skript – kopiere den Code unten rein)
   b) phrasen.txt (deine Texte – eine Phrase pro Zeile)


3. Inhalt von tts_grieschich.py

   from gtts import gTTS
   import os

   def text_to_mp3(text, lang='el', output_dir="audio"):
       if not text.strip():
           return

       filename = text.strip().replace(' ', '_').replace('.', '').replace(',', '') + '.mp3'
       os.makedirs(output_dir, exist_ok=True)
       filepath = os.path.join(output_dir, filename)

       try:
           tts = gTTS(text=text, lang=lang, slow=False)
           tts.save(filepath)
           print(f"Gespeichert: {filepath}")
       except Exception as e:
           print(f"Fehler bei '{text}': {e}")

   # ===============================================
   # Hauptprogramm – liest aus phrasen.txt
   # ===============================================

   input_datei = "phrasen.txt"

   try:
       with open(input_datei, 'r', encoding='utf-8') as f:
           phrasen = [zeile.strip() for zeile in f if zeile.strip()]
   except FileNotFoundError:
       print(f"Datei '{input_datei}' nicht gefunden.")
       phrasen = []

   if not phrasen:
       print("Keine Phrasen gefunden. Beende Programm.")
   else:
       print(f"{len(phrasen)} Phrasen gefunden – starte Umwandlung...")
       for phrase in phrasen:
           text_to_mp3(phrase, lang='el')
       print("Fertig! Alle MP3-Dateien liegen im Ordner 'audio'.")


4. Phrasen in phrasen.txt eingeben

   Beispiel-Inhalt von phrasen.txt:

   Das ist ein schöner Tag.
   Die Sonne geht unter.
   Der Mond zieht auf.
   Guten Morgen.
   Ich liebe dich.


5. Skript starten

   Im Terminal (im selben Ordner):

   source venv/bin/activate    # falls venv nicht aktiv
   python3 tts_grieschich.py

   → Ergebnis: Ordner audio/ mit MP3-Dateien (z. B. Das_ist_ein_schöner_Tag.mp3)


6. Tipps & Erweiterungen

   - Englische Aussprache? Ändere lang='en' in text_to_mp3(..., lang='en')
   - Langsamere Stimme? Ändere slow=True
   - Mehr Phrasen? Einfach in phrasen.txt hinzufügen
   - Automatisch alle MP3 löschen vor Neu-Start? Füge vor der Schleife ein:
     import shutil
     shutil.rmtree('audio', ignore_errors=True)

   Viel Erfolg und schöne griechische Aussprache!  
   Erstellt am 23.01.2026 – Stefan & Grok
================================================================================
