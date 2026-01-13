# Data Recovery Guide

## 🔍 Current Situation

Tests accidentally deleted production data. Here's what we know:

### ✅ Data That Still Exists:
- **Medicines**: 96 Electro Homeopathy medicines
- **Rules**: 65 Electro Homeopathy rules
- **Users**: 2 (newly seeded: admin, doctor)
- **Symptoms**: 110 Electro + 200 Classical = 310 total (re-seeded)
- **Remedies**: 100 Classical Homeopathy (re-seeded)
- **Rubrics**: 840 Classical Homeopathy (re-seeded)

### ⚠️ Data Status:
- **Patients**: ❌ All patient records deleted (0 patients)
- **Prescriptions**: ✅ 6 prescriptions still exist (but orphaned - patients deleted)
- **Case Records**: ✅ 123 case records still exist (but orphaned - patients deleted)
- **Appointments**: ❌ All appointment records deleted (0 appointments)
- **Original Users**: ❌ Previous admin/doctor accounts deleted

## 🔄 Recovery Options

### Option 1: MongoDB Atlas Backups (BEST OPTION)

If you're using **MongoDB Atlas**, you have automatic backups:

1. **Go to MongoDB Atlas Dashboard**
   - Login: https://cloud.mongodb.com
   - Select your cluster: `electromed`
   - Go to **"Backups"** tab

2. **Check Available Backups**
   - Atlas keeps snapshots automatically
   - Look for backups from **before tests were run**
   - Usually backups are available for last 2-7 days

3. **Restore from Backup**
   - Click on a backup from before data loss
   - Select **"Restore"** option
   - Choose to restore to:
     - **Same cluster** (will overwrite current data)
     - **New cluster** (safer - restore to new cluster first, then migrate)

4. **Point-in-Time Recovery**
   - If enabled, you can restore to exact time before deletion
   - More precise than snapshot restore

### Option 2: Manual Database Export (If Available)

If you have any manual exports:

1. **Check for .json or .bson files**
   - Look for database dumps
   - Check backup folders
   - Check cloud storage (Google Drive, Dropbox, etc.)

2. **Restore from Export**
   ```bash
   # If you have .bson files
   mongorestore --uri="mongodb+srv://..." --db=electromed /path/to/backup
   ```

### Option 3: Check Other Databases/Clusters

1. **Check if data exists elsewhere**
   - Development database
   - Staging database
   - Another MongoDB cluster
   - Local MongoDB instance

2. **Export from other database**
   ```bash
   mongodump --uri="mongodb+srv://..." --db=electromed
   ```

3. **Import to production**
   ```bash
   mongorestore --uri="mongodb+srv://..." --db=electromed dump/electromed
   ```

### Option 4: Application Logs (Limited Recovery)

1. **Check Application Logs**
   - Server logs might have patient/prescription data
   - API request logs
   - Error logs

2. **Check Frontend Cache**
   - Browser localStorage
   - Session storage
   - Service worker cache

## 🛠️ Immediate Actions

### Step 1: Check MongoDB Atlas Backups
```bash
# Go to: https://cloud.mongodb.com
# Navigate to: Your Cluster → Backups
# Look for: Snapshots from before data loss
```

### Step 2: Prevent Future Data Loss
✅ **Already Fixed**: Tests now use separate test database

### Step 3: Verify Current Data
```bash
cd backend
npm run check:all-data
```

## 📋 Recovery Checklist

- [ ] Check MongoDB Atlas Backups
- [ ] Check for manual database exports
- [ ] Check other databases/clusters
- [ ] Check application logs
- [ ] Check frontend cache
- [ ] Verify test database separation (✅ Done)
- [ ] Re-seed essential data (✅ Done)

## ⚠️ Important Notes

1. **Time is Critical**: MongoDB Atlas backups may expire (usually 2-7 days)
2. **Act Fast**: Check backups immediately
3. **Test First**: If restoring, test on a separate cluster first
4. **Backup Current State**: Before restoring, backup current state

## 🔐 MongoDB Atlas Backup Access

**To access backups:**
1. Login to MongoDB Atlas
2. Select your project
3. Click on your cluster
4. Go to **"Backups"** tab
5. Look for **"Snapshots"** or **"Continuous Backup"**

**Backup Retention:**
- **M0 (Free)**: No automatic backups
- **M2+ (Paid)**: 2 days of snapshots
- **M10+ (Paid)**: 2 days snapshots + point-in-time recovery
- **M30+ (Paid)**: 7 days snapshots + point-in-time recovery

## 💡 Prevention for Future

1. ✅ **Separate Test Database** (Fixed)
2. **Regular Backups**: Set up automated backups
3. **Backup Verification**: Regularly test backup restoration
4. **Data Protection**: Add confirmation before deleting production data
5. **Monitoring**: Alert on large data deletions

---

**Next Steps:**
1. **IMMEDIATELY** check MongoDB Atlas Backups
2. If backup found, restore to a new cluster first (test)
3. Then restore to production
4. Verify all data is recovered

## 🎯 GOOD NEWS: Some Data Still Exists!

**Orphaned Data (Recoverable):**
- ✅ **6 Prescriptions** - Still in database, but patient links broken
- ✅ **123 Case Records** - Still in database, but patient links broken

**What This Means:**
- Prescription data (medicines, symptoms, dates) is still there
- Case record data (remedies, symptoms, outcomes) is still there
- Only patient records were deleted
- If we restore patients from backup, links will reconnect automatically

## 🔄 Recovery Strategy

### Option A: Full Database Restore (BEST)
1. Restore entire database from MongoDB Atlas backup
2. All data will be recovered (patients + prescriptions + cases)
3. **Recommended if backup is available**

### Option B: Partial Recovery (If No Backup)
1. Export orphaned prescriptions and case records
2. Restore patients from backup (if available)
3. Re-link prescriptions and cases to restored patients
4. **Use if only patient data can be restored**

### Option C: Manual Patient Recreation
1. Extract patient IDs from orphaned prescriptions/cases
2. Manually recreate patient records with same IDs
3. Prescriptions and cases will automatically link
4. **Use if backup not available but prescription data is valuable**

---

**Status**: ⚠️ Patient data lost, but 6 prescriptions and 123 case records still exist (orphaned)
