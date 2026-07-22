$appPath = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$bytes = [System.IO.File]::ReadAllBytes($appPath)
$text = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($bytes)
$lines = $text.Split("`n")

$out = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($line -match 'ð|â|Ã') {
        $out += "$($i+1): $($line.Trim())"
    }
}

$out | Out-File "C:\Users\mukun\.gemini\antigravity\scratch\all_corrupted_lines.txt" -Encoding UTF8
Write-Host "Total remaining corrupted lines:" $out.Count
