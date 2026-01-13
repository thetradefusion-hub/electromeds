# Data Loss Prevention Guide

## ⚠️ CRITICAL ISSUE IDENTIFIED

**Problem:** Tests were running against the PRODUCTION database and deleting all data!

## 🔍 What Happened

1. **Test Setup Issue**: Tests were connecting to the same MongoDB database as production
2. **Cleanup Function**: `cleanupTestData()` in test helpers deletes ALL data from collections
3. **Result**: When tests ran, they deleted all production data including:
   - All users (admin, doctors, staff)
   - All symptoms
   - All remedies
   - All medicines
   - All rules
   - All patients
   - All prescriptions

## ✅ FIX APPLIED

**Test Setup Updated** (`backend/src/__tests__/setup.ts`):
- Tests now use a **separate test database**: `electromed_test`
- Production database (`electromed`) is now protected
- Test cleanup only affects test database

## 🛡️ Protection Measures

### 1. Separate Test Database
Tests now automatically use `electromed_test` instead of `electromed`

### 2. Test Helpers Updated
- `cleanupTestData()` only runs in test database
- Test data creation uses test database

### 3. Environment Variable Check
Always verify `MONGODB_URI` points to the correct database:
- **Production**: `mongodb+srv://.../electromed`
- **Test**: `mongodb+srv://.../electromed_test` (auto-generated)

## 📋 Current Database Status

Based on checks:
- ✅ **Users**: 2 (newly seeded: admin@electromed.com, doctor@electromed.com)
- ✅ **Medicines**: 96 (Electro Homeopathy)
- ✅ **Rules**: 65 (Electro Homeopathy)
- ❌ **Symptoms**: 0 (need to re-seed)
- ❌ **Remedies**: 0 (need to re-seed for Classical Homeopathy)
- ❌ **Rubrics**: 0 (need to re-seed for Classical Homeopathy)

## 🔄 Data Recovery Steps

### Step 1: Re-seed Symptoms
```bash
cd backend
npm run seed:symptoms
```

### Step 2: Re-seed Classical Homeopathy Data
```bash
npm run seed:classical-comprehensive
```

### Step 3: Verify Data
```bash
npm run check:users
npm run check:electro
npm run check:remedies
```

## 🚨 IMPORTANT: Future Testing

**NEVER run tests against production database!**

### Safe Testing:
1. ✅ Tests automatically use `electromed_test` database
2. ✅ Production data is protected
3. ✅ Test cleanup only affects test database

### Before Running Tests:
1. Check `.env` file - verify `MONGODB_URI` points to production
2. Tests will automatically use test database
3. Production database remains safe

## 📝 Recommendations

1. **Use Separate Test Database** (✅ Already Fixed)
2. **Add Database Name Validation** - Warn if test connects to production
3. **Add Backup Script** - Regular backups before major operations
4. **Add Data Protection** - Confirm before deleting production data

## 🔐 MongoDB Atlas Backup

If you have MongoDB Atlas:
1. Check **Backups** section in Atlas dashboard
2. Restore from latest backup if needed
3. Point-in-time recovery available (if enabled)

---

**Status**: ✅ Fixed - Tests now use separate database
**Action Required**: Re-seed missing data (symptoms, remedies, rubrics)
