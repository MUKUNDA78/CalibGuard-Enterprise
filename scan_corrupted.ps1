$path = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$lines = Get-Content $path -Encoding UTF8
$corrupted = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match 'ð') {
        $corrupted += "$($i+1): $($lines[$i].Trim())"
    }
}
$corrupted | Out-File "C:\Users\mukun\.gemini\antigravity\scratch\corrupted_lines.txt" -Encoding UTF8
Write-Host "Found $($corrupted.Count) corrupted lines. Saved to corrupted_lines.txt"
