# Testing Checklist

## Manual Tests

### Vocabulary Management
- [ ] Navigate to /admin/vocab
- [ ] Page loads without errors
- [ ] Create new vocabulary entry
- [ ] Edit existing entry
- [ ] Delete entry
- [ ] Bulk select multiple entries
- [ ] Bulk edit (change level/difficulty)
- [ ] Bulk delete

### CSV Import/Export
- [ ] Download template (German name)
- [ ] Import A1 sample
- [ ] Verify entries appear in table
- [ ] Export to CSV
- [ ] Re-import exported file
- [ ] Validate data integrity

### Filters & Search
- [ ] Filter by level (A1, A2, B1)
- [ ] Filter by difficulty
- [ ] Search Greek text
- [ ] Search English text
- [ ] Clear filters
- [ ] Combined filters work

### Mobile Tests
- [ ] Open on mobile device (or Chrome DevTools)
- [ ] Navigate to /m
- [ ] Practice modes load
- [ ] Stats page displays correctly
- [ ] Touch interactions work
- [ ] Viewport adapts correctly

### Vocabulary Practice
- [ ] Start vocabulary practice session
- [ ] Answer cards (correct/incorrect)
- [ ] Review SRS scheduling
- [ ] Check progress tracking
- [ ] Verify due cards update

## Automated Tests

### Build & Compile
- [ ] TypeScript: Run `npx tsc --noEmit`
  - Target: < 10 critical errors
  - Current: ~5 validator errors (acceptable)
- [ ] ESLint: Run `npm run lint`
  - Target: < 50 errors
  - Current: ~40 errors (mostly @typescript-eslint/no-explicit-any)
- [ ] Build: Run `npm run build`
  - Target: Build succeeds
  - Warnings acceptable

### Development Server
- [ ] Dev server starts: `npm run dev`
- [ ] No console errors on homepage
- [ ] Hot reload works
- [ ] API routes respond

### Database
- [ ] Migrations up to date (076_fix_rls_anon_role.sql)
- [ ] Vocabulary RPC functions exist
  - `get_vocabulary_fsrs_stats`
  - `get_vocabulary_overview_stats`
- [ ] RLS policies active
- [ ] Test data loaded

## Performance Tests

### Load Times
- [ ] Homepage loads < 3s
- [ ] /admin/vocab loads < 5s
- [ ] /m loads < 2s
- [ ] API responses < 1s

### Memory Usage
- [ ] Dev server stable memory usage
- [ ] No memory leaks during practice
- [ ] IndexedDB cache working

## Accessibility Tests

### Keyboard Navigation
- [ ] Tab through form fields
- [ ] Enter to submit forms
- [ ] Escape to close dialogs

### Screen Reader
- [ ] ARIA labels present
- [ ] Form labels associated
- [ ] Error messages announced

## Security Tests

### Authentication
- [ ] Non-admin cannot access /admin/*
- [ ] RLS policies enforce user isolation
- [ ] API endpoints validate permissions

### Data Validation
- [ ] CSV import validates format
- [ ] Form inputs sanitized
- [ ] SQL injection prevented

## Known Issues

1. TypeScript validator errors in .next/types/validator.ts (non-blocking)
2. ESLint @typescript-eslint/no-explicit-any warnings (technical debt)
3. Some desktop pages not yet mobile-optimized
4. Migration 078/079 not yet created (vocabulary system uses existing tables)

## Test Results

### Last Run: [DATE]
- Manual Tests: [X/Y] passed
- Automated Tests: [X/Y] passed
- Performance: [PASS/FAIL]
- Accessibility: [PASS/FAIL]
- Security: [PASS/FAIL]

### Overall Status: [READY/NOT READY] for production
