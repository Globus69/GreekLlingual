#!/usr/bin/env node

/**
 * CSV Validation Script
 *
 * Validates vocabulary CSV files before import
 * Reports errors and warnings
 *
 * Usage:
 *   node validate-csv.js <path-to-csv-file>
 *
 * Example:
 *   node validate-csv.js ./public/templates/vocab-a1-complete.csv
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Validation rules
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const MIN_FREQUENCY = 1;
const MAX_FREQUENCY = 5;

const REQUIRED_COLUMNS = [
  'greek_transcription',
  'level',
  'difficulty',
];

const OPTIONAL_COLUMNS = [
  'nr',
  'greek_phonetic',
  'frequency',
  'en_translation',
  'en_importance_reason',
  'en_audio_url',
  'de_translation',
  'de_importance_reason',
  'de_audio_url',
  'es_translation',
  'es_importance_reason',
  'es_audio_url',
  'ru_translation',
  'ru_importance_reason',
  'ru_audio_url',
];

const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

// Parse CSV manually (simple parser)
function parseCSV(content) {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : '';
    });
    rows.push({ lineNum: i + 1, data: row });
  }

  return { headers, rows };
}

// Validation functions
function validateHeaders(headers) {
  const errors = [];
  const warnings = [];

  // Check required columns
  REQUIRED_COLUMNS.forEach(col => {
    if (!headers.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  });

  // Check for unknown columns
  headers.forEach(header => {
    if (!ALL_COLUMNS.includes(header)) {
      warnings.push(`Unknown column: ${header} (will be ignored)`);
    }
  });

  return { errors, warnings };
}

function validateRow(row, rowNum) {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!row.greek_transcription || row.greek_transcription === '') {
    errors.push(`Row ${rowNum}: greek_transcription is required`);
  }

  if (!row.level || row.level === '') {
    errors.push(`Row ${rowNum}: level is required`);
  } else if (!VALID_LEVELS.includes(row.level)) {
    errors.push(`Row ${rowNum}: level must be one of: ${VALID_LEVELS.join(', ')} (got: ${row.level})`);
  }

  if (!row.difficulty || row.difficulty === '') {
    errors.push(`Row ${rowNum}: difficulty is required`);
  } else if (!VALID_DIFFICULTIES.includes(row.difficulty)) {
    if (row.difficulty === 'middle') {
      errors.push(`Row ${rowNum}: difficulty "middle" is invalid. Use "medium" instead.`);
    } else {
      errors.push(`Row ${rowNum}: difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')} (got: ${row.difficulty})`);
    }
  }

  // Check frequency (optional, but must be valid if present)
  if (row.frequency && row.frequency !== '') {
    const freq = parseInt(row.frequency, 10);
    if (isNaN(freq)) {
      errors.push(`Row ${rowNum}: frequency must be a number (got: ${row.frequency})`);
    } else if (freq < MIN_FREQUENCY || freq > MAX_FREQUENCY) {
      errors.push(`Row ${rowNum}: frequency must be between ${MIN_FREQUENCY} and ${MAX_FREQUENCY} (got: ${freq})`);
    }
  }

  // Check nr (optional, but must be number if present)
  if (row.nr && row.nr !== '') {
    const nr = parseInt(row.nr, 10);
    if (isNaN(nr)) {
      errors.push(`Row ${rowNum}: nr must be a number (got: ${row.nr})`);
    }
  }

  // Check audio URLs (optional, but should be valid URL if present)
  const audioFields = ['en_audio_url', 'de_audio_url', 'es_audio_url', 'ru_audio_url'];
  audioFields.forEach(field => {
    if (row[field] && row[field] !== '') {
      if (!row[field].startsWith('http://') && !row[field].startsWith('https://')) {
        warnings.push(`Row ${rowNum}: ${field} should be a full URL (got: ${row[field]})`);
      }
    }
  });

  // Check if at least one translation exists
  const translations = [row.en_translation, row.de_translation, row.es_translation, row.ru_translation];
  const hasTranslation = translations.some(t => t && t !== '');
  if (!hasTranslation) {
    warnings.push(`Row ${rowNum}: No translations provided. At least one translation recommended.`);
  }

  return { errors, warnings };
}

// Main validation function
function validateCSV(filePath) {
  console.log(`${colors.cyan}${colors.bright}CSV Validation Tool${colors.reset}`);
  console.log(`${colors.blue}File: ${filePath}${colors.reset}\n`);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.log(`${colors.red}❌ Error: File not found: ${filePath}${colors.reset}`);
    process.exit(1);
  }

  // Read file
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.log(`${colors.red}❌ Error reading file: ${error.message}${colors.reset}`);
    process.exit(1);
  }

  // Parse CSV
  const { headers, rows } = parseCSV(content);

  if (headers.length === 0) {
    console.log(`${colors.red}❌ Error: Empty file or no headers${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.bright}Headers found (${headers.length}):${colors.reset}`);
  headers.forEach(h => console.log(`  - ${h}`));
  console.log();

  console.log(`${colors.bright}Data rows: ${rows.length}${colors.reset}\n`);

  // Validate headers
  const headerValidation = validateHeaders(headers);
  let totalErrors = headerValidation.errors.length;
  let totalWarnings = headerValidation.warnings.length;

  if (headerValidation.errors.length > 0) {
    console.log(`${colors.red}${colors.bright}Header Errors:${colors.reset}`);
    headerValidation.errors.forEach(err => console.log(`  ${colors.red}❌ ${err}${colors.reset}`));
    console.log();
  }

  if (headerValidation.warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bright}Header Warnings:${colors.reset}`);
    headerValidation.warnings.forEach(warn => console.log(`  ${colors.yellow}⚠️  ${warn}${colors.reset}`));
    console.log();
  }

  // Validate rows
  const rowErrors = [];
  const rowWarnings = [];

  rows.forEach(({ lineNum, data }) => {
    const validation = validateRow(data, lineNum);
    if (validation.errors.length > 0) {
      rowErrors.push(...validation.errors);
    }
    if (validation.warnings.length > 0) {
      rowWarnings.push(...validation.warnings);
    }
  });

  totalErrors += rowErrors.length;
  totalWarnings += rowWarnings.length;

  if (rowErrors.length > 0) {
    console.log(`${colors.red}${colors.bright}Row Errors (${rowErrors.length}):${colors.reset}`);
    rowErrors.forEach(err => console.log(`  ${colors.red}❌ ${err}${colors.reset}`));
    console.log();
  }

  if (rowWarnings.length > 0) {
    console.log(`${colors.yellow}${colors.bright}Row Warnings (${rowWarnings.length}):${colors.reset}`);
    rowWarnings.forEach(warn => console.log(`  ${colors.yellow}⚠️  ${warn}${colors.reset}`));
    console.log();
  }

  // Summary
  console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}VALIDATION SUMMARY${colors.reset}`);
  console.log(`${colors.bright}═══════════════════════════════════════${colors.reset}`);
  console.log(`Total rows: ${rows.length}`);
  console.log(`Total errors: ${colors.red}${totalErrors}${colors.reset}`);
  console.log(`Total warnings: ${colors.yellow}${totalWarnings}${colors.reset}`);
  console.log();

  if (totalErrors === 0) {
    console.log(`${colors.green}${colors.bright}✅ VALIDATION PASSED${colors.reset}`);
    console.log(`${colors.green}CSV is ready for import!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}❌ VALIDATION FAILED${colors.reset}`);
    console.log(`${colors.red}Please fix errors before importing.${colors.reset}\n`);
    process.exit(1);
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`${colors.yellow}Usage: node validate-csv.js <path-to-csv-file>${colors.reset}`);
    console.log(`${colors.yellow}Example: node validate-csv.js ./public/templates/vocab-a1-complete.csv${colors.reset}\n`);
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  validateCSV(filePath);
}

module.exports = { validateCSV, parseCSV, validateHeaders, validateRow };
