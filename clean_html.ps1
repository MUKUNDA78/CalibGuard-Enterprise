$appPath = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$indexPath = "C:\Users\mukun\.gemini\antigravity\scratch\index.html"

# Read text as raw UTF-8
$text = [System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)

# Replace all Mojibake substrings
$text = $text.Replace("ðŸ“Š", "&#128202;")
$text = $text.Replace("ðŸ’¾", "&#128190;")
$text = $text.Replace("ðŸ“¥", "&#128229;")
$text = $text.Replace("ðŸ”„", "&#128260;")
$text = $text.Replace("ðŸ”’", "&#128274;")
$text = $text.Replace("ðŸ‘‘", "&#128081;")
$text = $text.Replace("ðŸ“œ", "&#128220;")
$text = $text.Replace("ðŸ“„", "&#128196;")
$text = $text.Replace("ðŸ”¥", "&#128293;")
$text = $text.Replace("ðŸŽ¯", "&#127919;")

# Replace any remaining Mojibake character sequences starting with ð
$text = [regex]::Replace($text, "ðŸ[^\s<>"'\)]*", "")

# Save UTF-8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($appPath, $text, $utf8NoBom)
[System.IO.File]::WriteAllText($indexPath, $text, $utf8NoBom)

Write-Host "Successfully cleaned HTML files!"
