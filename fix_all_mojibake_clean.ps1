$appPath = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$indexPath = "C:\Users\mukun\.gemini\antigravity\scratch\index.html"

# Read as raw bytes and decode as UTF8
$raw = [System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)

# Replacement pairs (Mojibake sequence => Clean ASCII HTML Entity)
$pairs = @(
    @("Ã°Å¸â€ Â ", "&#128269;"),
    @("Ã°Å¸â€ Â", "&#128269;"),
    @("Ã°Å¸â€œâ€ž", "&#128196;"),
    @("Ã°Å¸â€œÂ¤", "&#128228;"),
    @("Ã¢Å“Â Ã¯Â¸Â ", "&#9999;&#65039;"),
    @("Ã¢Å“Â ", "&#9999;&#65039;"),
    @("Ã°Å¸â€”â€˜Ã¯Â¸Â ", "&#128465;&#65039;"),
    @("Ã°Å¸â€”â€˜", "&#128465;&#65039;"),
    @("Ã°Å¸â€ â€™", "&#128274;"),
    @("Ã¢Å“â€¢", "&#10005;"),
    @("Ã°Å¸â€ Â¥", "&#128293;"),
    @("Ã°Å¸Å½Â¯", "&#127919;"),
    @("Ã¢Å¡â„¢Ã¯Â¸Â ", "&#9881;&#65039;"),
    @("Ã¢Å¡â„¢", "&#9881;&#65039;"),
    @("Ã°Å¸â€™Â¾", "&#128190;"),
    @("Ã°Å¸â€œÅ¾", "&#128222;"),
    @("Ã°Å¸â€œÅ“", "&#128220;"),
    @("Ã¢Å“â€¦", "&#9989;"),
    @("Ã¢Å¡â€“Ã¯Â¸Â ", "&#9878;&#65039;"),
    @("Ã¢Å¡â€“", "&#9878;&#65039;"),
    @("Ã°Å¸â€“Â¨Ã¯Â¸Â ", "&#128438;&#65039;"),
    @("Ã°Å¸â€“Â¨", "&#128438;&#65039;"),
    @("Ã°Å¸â€ºÂÃ¯Â¸Â ", "&#128737;&#65039;"),
    @("Ã°Å¸â€ºÂ", "&#128737;&#65039;"),
    @("Ã°Å¸â€˜â€˜", "&#128081;"),
    @("Ã°Å¸â€˜Â Ã¯Â¸Â ", "&#128065;&#65039;"),
    @("Ã°Å¸â€˜Â ", "&#128065;&#65039;"),
    @("Ã¢Å“â€ ", "&#10003;"),
    @("Ã¢Å“â€", "&#10003;"),
    @("Ã¢â‚¬â€", "&mdash;"),
    @("Ã¢â€°Â¤", "&le;"),
    @("AC", "&deg;C"),
    @("A", "&deg;")
)

foreach ($pair in $pairs) {
    $search = $pair[0]
    $replace = $pair[1]
    $raw = $raw.Replace($search, $replace)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($appPath, $raw, $utf8NoBom)
[System.IO.File]::WriteAllText($indexPath, $raw, $utf8NoBom)

Write-Host "Replaced all 69 corrupted Mojibake lines successfully!"
