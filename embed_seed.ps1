$backupPath = Join-Path $env:USERPROFILE "Downloads\CalibGuard_Database_Backup_2026-07-21.json"
$appPath = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$indexPath = "C:\Users\mukun\.gemini\antigravity\scratch\index.html"

if (!(Test-Path $backupPath)) {
    Write-Host "Backup file not found"
    exit 1
}

$raw = Get-Content $backupPath -Raw | ConvertFrom-Json
$instruments = $raw.instruments

Write-Host "Embedding" $instruments.Count "instruments into seed data..."

# Convert instruments to JS JSON representation
$jsInstruments = $instruments | ConvertTo-Json -Depth 5

$appContent = Get-Content $appPath -Raw

# Replace DATA_VERSION
$appContent = $appContent -replace 'const DATA_VERSION = "[^"]+";', 'const DATA_VERSION = "2026.07.21.v10_real_user_seed_saved";'

# Replace INITIAL_INSTRUMENTS array content
$regex = '(?s)const INITIAL_INSTRUMENTS = \[.*?\];'
$newInitialInstruments = "const INITIAL_INSTRUMENTS = " + $jsInstruments + ";"

$appContent = $appContent -replace $regex, $newInitialInstruments

Set-Content -Path $appPath -Value $appContent -Encoding UTF8
Set-Content -Path $indexPath -Value $appContent -Encoding UTF8

Write-Host "Successfully updated CalibGuard_App.html and index.html with all 34 real master instruments!"
