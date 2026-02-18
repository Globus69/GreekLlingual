# MIGRATION FILE INDEX

**Complete file paths for easy reference**  
**Date:** February 18, 2026  
**Branch:** agent-2-admin-daily-phrases

---

## PRODUCTION MIGRATIONS (13 files)

```
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/060_add_spanish_translations.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/067_add_practice_modes.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/068_enable_practice_test_data.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/071_practice_modes_implementation.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/072_vocabulary_fsrs_rpc.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/073_vocabulary_stats_rpc.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/074_fix_student_progress_rls.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/075_fix_student_progress_rls_custom_auth.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/076_fix_rls_anon_role.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/077_add_daily_phrases_scheduling.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/078_cleanup_vocabulary.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/079_create_vocabulary.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/20260218_add_audio_storage.sql
```

---

## SCRIPTS

```
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/scripts/run-migrations.sh
```

---

## DOCUMENTATION

```
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/MIGRATION-CLEANUP-REPORT.md
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/MIGRATION-QUICK-REFERENCE.md
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/AGENT15-COMPLETION-SUMMARY.md
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/MIGRATION-FILE-INDEX.md
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/README.md
```

---

## ARCHIVED DIAGNOSTIC FILES (12 files)

```
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/069_diagnose_dashboard_bugs.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/069_diagnose_dashboard_bugs_results.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/069_diagnose_dashboard_issues.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/069_diagnose_simple.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/069_get_practice_enabled_items.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/070_diagnostic_dashboard_complete.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/070_diagnostic_simple.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/070_test_rls_policy.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/check_users_table.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/create_content_table.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/diagnose_practice_config.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/verify_practice_modes.sql
```

---

## ARCHIVED OLD MIGRATIONS (2 files)

```
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/old-migrations/078_add_multilingual_vocab_support.sql
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/old-migrations/078_create_multilingual_vocabulary.sql
```

---

## DIRECTORY STRUCTURE

```
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/
├── supabase/
│   └── migrations/          (13 production files)
├── scripts/
│   └── run-migrations.sh    (executable)
├── archive/
│   ├── README.md
│   ├── diagnostics/         (12 diagnostic files)
│   └── old-migrations/      (2 superseded files)
├── MIGRATION-CLEANUP-REPORT.md
├── MIGRATION-QUICK-REFERENCE.md
├── AGENT15-COMPLETION-SUMMARY.md
└── MIGRATION-FILE-INDEX.md (this file)
```

---

## QUICK ACCESS COMMANDS

### View Production Migrations
```bash
ls /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/*.sql
```

### View Archived Diagnostics
```bash
ls /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/diagnostics/
```

### View Archived Old Migrations
```bash
ls /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/archive/old-migrations/
```

### Run Migration Script
```bash
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard
./scripts/run-migrations.sh
```

---

**End of Index**
