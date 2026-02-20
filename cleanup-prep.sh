#!/bin/bash

REPORT_DIR="./cleanup-reports"
mkdir -p "$REPORT_DIR"

echo "Erstelle Dateiliste..."
# Ignoriert node_modules, .git, .next und Python-venv
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/\.git/*" \
  -not -path "*/\.next/*" \
  -not -path "*/venv/*" \
  -not -path "*/__pycache__/*" > "$REPORT_DIR/all_files_list.txt"

echo "Suche nach TODOs und FIXMEs..."
# Sucht in allen relevanten Source-Dateien nach TODO oder FIXME
grep -rnw -E "TODO|FIXME" \
  --exclude-dir={node_modules,.git,.next,venv,__pycache__} \
  --exclude="cleanup-prep.sh" \
  . > "$REPORT_DIR/todo_fixme_report.txt"

echo "Vorbereitung abgeschlossen. Reports liegen in $REPORT_DIR/"
