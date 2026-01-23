#!/bin/bash

# In den Ordner wechseln, in dem diese Datei liegt
cd "$(dirname "$0")"

# Virtuelle Umgebung aktivieren (falls vorhanden)
if [ -d "venv" ]; then
  source venv/bin/activate
fi

# Skript starten
python3 tts_grieschich.py

# Fenster offen halten, damit du die Ausgabe siehst
echo ""
echo "Fertig! Alle MP3s sind im Ordner 'audio'."
echo "Drücke Enter zum Beenden..."
read -r
