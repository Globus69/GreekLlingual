# Authorization & Security Architecture

## Overview

GreekLingua uses a custom PIN-based authentication system with **server-side authorization** for all critical operations.

**Key Principle:** All authorization checks happen server-side in Supabase RPC functions with `SECURITY DEFINER`.

---

## Authentication Flow

### 1. PIN Login (Mobile & Desktop)

```
User enters 4-digit PIN
    ↓
Client calls verify_user_4digit_pin(pin, ip, user_agent)
    ↓
Server checks:
  - Is IP banned? → Reject
  - Is PIN a honeypot? → Log + Ban IP + Reject
  - Is PIN valid? → Return user data
    ↓
Client stores user in localStorage
```

**Security Features:**
- ✅ Honeypot PINs trigger automatic 24h IP ban
- ✅ Server-side validation (client-side checks removed)
- ✅ Rate limiting via Upstash Redis
- ✅ Progressive delays on failed attempts

---

## Authorization System

### RLS (Row Level Security)

All tables use RLS policies that integrate with custom PIN auth:

**Content Table:**
- `SELECT`: Everyone can read (public content)
- `INSERT/UPDATE/DELETE`: Only via RPC functions with admin check

**Honeypot Tables:**
- Read-only for anon (for RPC functions)
- Full access for admins

### Admin Check Function

```sql
CREATE FUNCTION is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
```

Used by all admin RPC functions to verify user role.

---

## Secure RPC Functions

All critical operations use `SECURITY DEFINER` RPC functions:

### Content Operations

| Function | Auth Required | Description |
|----------|---------------|-------------|
| `admin_create_content` | Admin | Create new content |
| `admin_update_content` | Admin | Update content |
| `admin_delete_content` | Admin | Delete single item |
| `admin_bulk_delete_content` | Admin | Delete up to 100 items |
| `admin_bulk_import_content` | Admin | Import from CSV |

**Pattern:**
```typescript
// ❌ NEVER do this (bypasses security)
await supabase.from('content').delete().in('id', ids);

// ✅ ALWAYS use RPC functions
await supabase.rpc('admin_bulk_delete_content', {
    p_user_id: user.id,
    p_content_ids: ids
});
```

### Honeypot System

| Function | Purpose |
|----------|---------|
| `verify_user_4digit_pin` | Login with honeypot + ban checks |
| `ban_ip` | Ban IP address for duration |
| `is_ip_banned` | Check if IP is banned |
| `cleanup_expired_bans` | Remove expired bans |

**Honeypot PINs (auto-ban on attempt):**
- `0000`, `1111`-`9999` (sequential)
- `1234`, `4321` (predictable)
- `1122`, `2211`, `5678` (common patterns)

---

## Security Guidelines

### For Developers

**DO:**
- ✅ Always use RPC functions for mutations
- ✅ Pass `user_id` from localStorage to RPC functions
- ✅ Validate inputs with Zod before calling RPC
- ✅ Handle errors gracefully (don't expose internals)

**DON'T:**
- ❌ Never call `.insert()`, `.update()`, `.delete()` directly on tables
- ❌ Never implement authorization logic client-side
- ❌ Never trust `user_id` without server validation
- ❌ Never bypass RLS policies

### Adding New Protected Operations

1. **Create RPC function in migration:**
   ```sql
   CREATE FUNCTION admin_do_something(p_user_id UUID, ...)
   RETURNS ... AS $$
   BEGIN
       IF NOT is_admin_user(p_user_id) THEN
           RAISE EXCEPTION 'Admin only';
       END IF;
       -- ... operation ...
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. **Grant permissions:**
   ```sql
   GRANT EXECUTE ON FUNCTION admin_do_something TO anon, authenticated;
   ```

3. **Call from client:**
   ```typescript
   const user = JSON.parse(localStorage.getItem('greeklingua_user'));
   const { data, error } = await supabase.rpc('admin_do_something', {
       p_user_id: user.id,
       ...params
   });
   ```

---

## Migrations

Key migrations for authorization:

- `020_create_honeypot_pins_fixed.sql` - Honeypot system
- `062_fix_content_rls_for_custom_auth.sql` - Content RLS + RPC functions
- `063_fix_users_rls_recursion.sql` - Users RLS fixes
- `066_add_bulk_delete_rpc_with_auth.sql` - Bulk delete with auth

---

## Testing Authorization

### Test Admin Access

```typescript
// Should succeed for admin
const { data } = await supabase.rpc('admin_create_content', {
    p_user_id: adminUserId,
    p_type: 'vocabulary',
    // ... content data
});

// Should fail for student
const { error } = await supabase.rpc('admin_create_content', {
    p_user_id: studentUserId,
    // ...
});
// error.message: "Only admins can create content"
```

### Test Honeypot

```typescript
// Should ban IP and return "Invalid PIN"
const { data } = await supabase.rpc('verify_user_4digit_pin', {
    p_pin: '0000',
    p_ip_address: '192.168.1.100',
    p_user_agent: 'Test'
});
// data[0].error: "Invalid PIN"
```

---

## Threat Model

**Mitigated Threats:**
- ✅ **Unauthorized mutations:** All writes require admin check
- ✅ **Brute-force attacks:** Rate limiting + honeypots + IP bans
- ✅ **Client-side bypass:** Authorization is server-side only
- ✅ **SQL injection:** Zod validation + parameterized queries
- ✅ **Bulk abuse:** Max 100 items per bulk operation

**Future Improvements:**
- 🔄 Audit log for all admin operations
- 🔄 Session management with httpOnly cookies (instead of localStorage)
- 🔄 CSRF protection for state-changing operations

---

## Related Documentation

- [Input Validation](../src/lib/validation/README.md)
- [Security Audit TODO](../TODO-Audit-Und-Optimierungen-2026-02-16.md)
- [Database Migrations](../database/migrations/)
