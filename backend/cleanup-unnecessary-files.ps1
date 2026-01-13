# PowerShell script to remove unnecessary files from the project

Write-Host "🧹 Starting project cleanup..." -ForegroundColor Cyan

# List of files to remove
$filesToRemove = @(
    # Duplicate/Outdated Documentation
    "backend\DATA_RECOVERY_COMPLETE_GUIDE.md",
    "backend\PHASE5_TESTING_SUMMARY.md",
    "backend\SEED_DATA_ENHANCEMENT_SUMMARY.md",
    "backend\MODALITY_FILTERING_SUMMARY.md",
    "backend\API_TESTING_SUMMARY.md",
    "SERVER_STATUS.md",
    "PHASE4_COMPLETE_SUMMARY.md",
    "PHASE4_FRONTEND_INTEGRATION_SUMMARY.md",
    "QUICK_DEPLOY.md",
    
    # One-Time Fix/Migration Scripts
    "backend\src\scripts\fixRuleMappings.ts",
    "backend\src\scripts\fixRuleSymptomIds.ts",
    "backend\src\scripts\updateRulesWithCurrentSymptoms.ts",
    "backend\src\scripts\deleteElectroSymptoms.ts",
    "backend\src\scripts\removeOldStaff.ts",
    "backend\src\scripts\fixStaffEmail.ts",
    "backend\src\scripts\makeClassicalSymptomsGlobal.ts",
    "backend\src\scripts\migrateModalityFields.ts",
    "backend\src\scripts\verifyModalityMigration.ts",
    "backend\src\scripts\dropRemedyIndexes.ts",
    
    # Test/Diagnostic Scripts
    "backend\src\scripts\testStaffLogin.ts",
    "backend\src\scripts\testStaffPassword.ts",
    "backend\src\scripts\testClassicalHomeopathyAPI.ts",
    "backend\src\scripts\diagnoseMedicineSuggestions.ts",
    "backend\src\scripts\checkEmailExists.ts",
    "backend\src\scripts\listAllStaff.ts",
    "backend\src\scripts\listMedicines.ts",
    "backend\src\scripts\listSymptoms.ts",
    "backend\src\scripts\checkUsers.ts",
    "backend\src\scripts\checkRemedies.ts",
    "backend\src\scripts\checkElectroHomeopathyData.ts",
    "backend\src\scripts\checkClassicalSymptoms.ts",
    "backend\src\scripts\checkMedicineRules.ts",
    "backend\src\scripts\checkOrphanedData.ts",
    "backend\src\scripts\checkRuleMapping.ts",
    "backend\src\scripts\checkAllData.ts",
    "backend\src\scripts\exportOrphanedData.ts",
    "backend\src\scripts\seedClassicalHomeopathyTestData.ts"
)

# Directories to remove
$directoriesToRemove = @(
    "backend\data-backup"
)

$removedCount = 0
$notFoundCount = 0

Write-Host "`n📁 Removing files..." -ForegroundColor Yellow

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Removed: $file" -ForegroundColor Green
        $removedCount++
    } else {
        Write-Host "  ⚠️  Not found: $file" -ForegroundColor Gray
        $notFoundCount++
    }
}

Write-Host "`n📂 Removing directories..." -ForegroundColor Yellow

foreach ($dir in $directoriesToRemove) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force
        Write-Host "  ✅ Removed: $dir" -ForegroundColor Green
        $removedCount++
    } else {
        Write-Host "  ⚠️  Not found: $dir" -ForegroundColor Gray
        $notFoundCount++
    }
}

Write-Host "`n📊 Cleanup Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Removed: $removedCount items" -ForegroundColor Green
Write-Host "  ⚠️  Not found: $notFoundCount items" -ForegroundColor Gray
Write-Host "`nCleanup completed!" -ForegroundColor Cyan
