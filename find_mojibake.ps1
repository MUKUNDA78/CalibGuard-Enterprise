$path = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)
$results = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match 'ð') {
        $results += "$($i+1): $($lines[$i].Trim())"
    }
}
$results | Out-File "C:\Users\mukun\.gemini\antigravity\scratch\mojibake_lines.txt" -Encoding UTF8
Write-Host "Total Mojibake lines found:" $results.Count
