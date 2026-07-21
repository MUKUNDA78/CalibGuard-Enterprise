$file = Join-Path $env:USERPROFILE "Downloads\CalibGuard_Database_Backup_2026-07-21.json"
if (Test-Path $file) {
    $raw = Get-Content $file -Raw | ConvertFrom-Json
    Write-Host "Instruments Count:" $raw.instruments.Length
    Write-Host "Agencies Count:" $raw.agencies.Length
    Write-Host "Users Count:" $raw.users.Length

    # Save formatted JSON into scratch directory
    $raw | ConvertTo-Json -Depth 10 | Set-Content "C:\Users\mukun\.gemini\antigravity\scratch\master_seed.json" -Encoding UTF8
    Write-Host "Saved master_seed.json successfully!"
} else {
    Write-Host "Backup file not found at $file"
}
