# Project Cleanup Summary

## Files to Remove

### 1. Duplicate/Outdated Documentation
- `backend/DATA_RECOVERY_COMPLETE_GUIDE.md` (duplicate of DATA_RECOVERY_GUIDE.md)
- `backend/PHASE5_TESTING_SUMMARY.md` (duplicate of PHASE5_TESTING_COMPLETE.md)
- `backend/SEED_DATA_ENHANCEMENT_SUMMARY.md` (temporary summary)
- `backend/MODALITY_FILTERING_SUMMARY.md` (temporary summary)
- `backend/API_TESTING_SUMMARY.md` (temporary summary)
- `SERVER_STATUS.md` (temporary status file)
- `PHASE4_COMPLETE_SUMMARY.md` (phase summary - completed)
- `PHASE4_FRONTEND_INTEGRATION_SUMMARY.md` (phase summary - completed)
- `QUICK_DEPLOY.md` (duplicate of DEPLOYMENT_GUIDE.md)

### 2. One-Time Fix/Migration Scripts (Already Executed)
- `backend/src/scripts/fixRuleMappings.ts`
- `backend/src/scripts/fixRuleSymptomIds.ts`
- `backend/src/scripts/updateRulesWithCurrentSymptoms.ts` (replaced by recreateRulesWithCurrentSymptoms.ts)
- `backend/src/scripts/deleteElectroSymptoms.ts`
- `backend/src/scripts/removeOldStaff.ts`
- `backend/src/scripts/fixStaffEmail.ts`
- `backend/src/scripts/makeClassicalSymptomsGlobal.ts`
- `backend/src/scripts/migrateModalityFields.ts`
- `backend/src/scripts/verifyModalityMigration.ts`
- `backend/src/scripts/dropRemedyIndexes.ts`

### 3. Test/Diagnostic Scripts (Not Needed in Production)
- `backend/src/scripts/testStaffLogin.ts`
- `backend/src/scripts/testStaffPassword.ts`
- `backend/src/scripts/testClassicalHomeopathyAPI.ts`
- `backend/src/scripts/diagnoseMedicineSuggestions.ts`
- `backend/src/scripts/checkEmailExists.ts`
- `backend/src/scripts/listAllStaff.ts`
- `backend/src/scripts/listMedicines.ts`
- `backend/src/scripts/listSymptoms.ts`
- `backend/src/scripts/checkUsers.ts`
- `backend/src/scripts/checkRemedies.ts`
- `backend/src/scripts/checkElectroHomeopathyData.ts`
- `backend/src/scripts/checkClassicalSymptoms.ts`
- `backend/src/scripts/checkMedicineRules.ts`
- `backend/src/scripts/checkOrphanedData.ts`
- `backend/src/scripts/checkRuleMapping.ts`
- `backend/src/scripts/checkAllData.ts`
- `backend/src/scripts/exportOrphanedData.ts`
- `backend/src/scripts/seedClassicalHomeopathyTestData.ts` (test data)

### 4. Old Backup Data
- `backend/data-backup/` (old backup data - can be removed if not needed)

### 5. Unused Integrations
- `src/integrations/supabase/` (if Supabase is not being used)

### 6. Build Output (Should be in .gitignore)
- `backend/dist/` (build output - should be regenerated)

## Files to Keep

### Important Documentation
- `README.md` - Main project readme
- `PROJECT_OVERVIEW.md` - Project overview
- `PROJECT_STRUCTURE.md` - Project structure
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `IMPLEMENTATION_ROADMAP.md` - Implementation roadmap
- `ENHANCEMENT_ROADMAP.md` - Enhancement roadmap
- `PROJECT_ENHANCEMENTS_SUMMARY.md` - Enhancement summary
- `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` - Important documentation
- `MULTI_MODALITY_IMPLEMENTATION_PLAN.md` - Important documentation
- `backend/README.md` - Backend readme
- `backend/docs/` - API documentation
- `backend/ELECTRO_HOMEOPATHY_RULE_ENGINE_FIX.md` - Important fix documentation
- `backend/CLASSICAL_HOMEOPATHY_ACCURACY_IMPROVEMENTS.md` - Important documentation
- `backend/ELECTRO_HOMEOPATHY_ACCURACY_IMPROVEMENTS.md` - Important documentation
- `backend/DATA_RECOVERY_GUIDE.md` - Important recovery guide
- `backend/DATA_LOSS_PREVENTION.md` - Important prevention guide
- `backend/PHASE5_TESTING_COMPLETE.md` - Testing documentation

### Important Scripts
- `backend/src/scripts/seedUsers.ts` - User seeding
- `backend/src/scripts/seedSymptoms.ts` - Symptom seeding
- `backend/src/scripts/seedMedicines.ts` - Medicine seeding
- `backend/src/scripts/seedMedicineRules.ts` - Rule seeding
- `backend/src/scripts/seedSubscriptionPlans.ts` - Plan seeding
- `backend/src/scripts/seedClassicalHomeopathyComprehensive.ts` - Comprehensive seeding
- `backend/src/scripts/recreateRulesWithCurrentSymptoms.ts` - Rule recreation
- `backend/src/scripts/data/` - Data generation scripts
