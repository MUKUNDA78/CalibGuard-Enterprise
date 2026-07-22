$path = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::GetEncoding("iso-8859-1"))
$lines = $text.Split("`n")
$results = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i].Contains("ð")) {
        $results += "$($i+1): $($lines[$i].Trim())"
    }
}
[System.IO.File]::WriteAllLines("C:\Users\mukun\.gemini\antigravity\scratch\mojibake_lines.txt", $results, [System.Text.Encoding]::UTF8)
Write-Host "Total Mojibake lines found (ISO-8859-1 mode):" $results.Count
