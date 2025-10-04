# Security Warnings Fixes

These are configuration-level security warnings that need to be addressed in the Supabase Dashboard, not via SQL.

## 1. Leaked Password Protection Disabled

**Issue**: Supabase Auth is not checking passwords against HaveIBeenPwned.org database of compromised passwords.

**Fix**: Enable in Supabase Dashboard
1. Go to **Authentication** → **Settings** 
2. Find **Password Security** section
3. Enable **"Check against HaveIBeenPwned"** or **"Leaked Password Protection"**
4. Save changes

**Impact**: 
- ✅ Prevents users from using commonly compromised passwords
- ✅ Enhances overall account security
- ✅ No breaking changes to existing users

## 2. Vulnerable Postgres Version

**Issue**: Current Postgres version `supabase-postgres-17.4.1.075` has available security patches.

**Fix**: Upgrade database in Supabase Dashboard
1. Go to **Settings** → **Infrastructure** 
2. Look for **Database** or **Postgres Version** section
3. Click **"Upgrade"** or **"Update to latest version"**
4. Follow the upgrade process (may require brief downtime)

**Impact**:
- ✅ Applies latest security patches
- ✅ Fixes known vulnerabilities
- ⚠️ May require brief maintenance window
- ⚠️ Test thoroughly after upgrade

## Priority

1. **High Priority**: Enable leaked password protection (no downtime)
2. **Medium Priority**: Upgrade Postgres (requires planning for downtime)

## Notes

- These are platform-level settings, not code changes
- Both fixes are applied through the Supabase Dashboard UI
- No SQL queries needed for these warnings
- Consider upgrading Postgres during low-traffic periods
