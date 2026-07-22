$appPath = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$lines = [System.IO.File]::ReadAllLines($appPath, [System.Text.Encoding]::UTF8)
$results = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '&#65533;') {
        $results += "$($i+1): $($lines[$i].Trim())"
    }
}
$results | Out-File "C:\Users\mukun\.gemini\antigravity\scratch\replacement_char_lines.txt" -Encoding UTF8
Write-Host "Total replacement character lines found:" $results.Count
