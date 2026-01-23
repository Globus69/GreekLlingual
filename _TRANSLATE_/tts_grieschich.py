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
    print(f"Datei '{input_datei}' nicht gefunden. Erstelle sie und füge Phrasen ein.")
    phrasen = []

if not phrasen:
    print("Keine Phrasen gefunden. Beende Programm.")
else:
    print(f"{len(phrasen)} Phrasen gefunden – starte Umwandlung...")
    for phrase in phrasen:
        text_to_mp3(phrase, lang='el')
    print("Fertig! Alle MP3-Dateien liegen im Ordner 'audio'.")
