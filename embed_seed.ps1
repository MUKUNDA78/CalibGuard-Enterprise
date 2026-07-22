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

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$appContent = [System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)

# Replace DATA_VERSION
$appContent = $appContent -replace 'const DATA_VERSION = "[^"]+";', 'const DATA_VERSION = "2026.07.22.v11_clean_utf8_ascii_entities";'

# Replace INITIAL_INSTRUMENTS array content
$regex = '(?s)const INITIAL_INSTRUMENTS = \[.*?\];'
$newInitialInstruments = "const INITIAL_INSTRUMENTS = " + $jsInstruments + ";"

$appContent = $appContent -replace $regex, $newInitialInstruments

[System.IO.File]::WriteAllText($appPath, $appContent, $utf8NoBom)
[System.IO.File]::WriteAllText($indexPath, $appContent, $utf8NoBom)

Write-Host "Successfully updated CalibGuard_App.html and index.html with clean UTF-8 encoding!"
