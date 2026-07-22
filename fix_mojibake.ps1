$appPath = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$indexPath = "C:\Users\mukun\.gemini\antigravity\scratch\index.html"

# Read bytes from file
$bytes = [System.IO.File]::ReadAllBytes($appPath)

# Decode using ISO-8859-1 (Latin1) to get literal Mojibake characters
$text = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($bytes)

# Map Mojibake sequences (when UTF-8 bytes were read as Latin1/Windows-1252) to ASCII-safe HTML Entities
# UTF-8 📊 = 0xF0 0x9F 0x93 0x8A => ðŸ“Š => &#128202;
# UTF-8 💾 = 0xF0 0x9F 0x92 0xBE => ðŸ’¾ => &#128190;
# UTF-8 📥 = 0xF0 0x9F 0x93 0xA5 => ðŸ“¥ => &#128229;
# UTF-8 🔄 = 0xF0 0x9F 0x94 0x84 => ðŸ”„ => &#128260;
# UTF-8 🔒 = 0xF0 0x9F 0x94 0x92 => ðŸ”’ => &#128274;
# UTF-8 👑 = 0xF0 0x9F 0x91 0x91 => ðŸ‘👑 / ðŸ‘‘ => &#128081;
# UTF-8 👁️ = 0xF0 0x9F 0x91 0x81 => ðŸ‘👁️ => &#128065;
# UTF-8 ✏️ = 0xE2 0x9C 0x8F => ✏️ => &#9999;&#65039;
# UTF-8 🗑️ = 0xF0 0x9F 0x97 0x91 => ðŸ—🗑️ => &#128465;&#65039;
# UTF-8 🖨️ = 0xF0 0x9F 0x96 0xA4 => ðŸ–🖨️ => &#128438;&#65039;
# UTF-8 📜 = 0xF0 0x9F 0x93 0x9C => ðŸ“📜 / ðŸ“œ => &#128220;
# UTF-8 📄 = 0xF0 0x9F 0x93 0x84 => ðŸ“📄 / ðŸ“„ => &#128196;
# UTF-8 🔍 = 0xF0 0x9F 0x94 0x8D => ðŸ”🔍 / ðŸ” => &#128269;
# UTF-8 🔥 = 0xF0 0x9F 0x94 0xA5 => ðŸ”🔥 / ðŸ”¥ => &#128293;
# UTF-8 🎯 = 0xF0 0x9F 0x8E 0xAF => ðŸŽ🎯 / ðŸŽ¯ => &#127919;
# UTF-8 ⚙️ = 0xE2 0x9A 0x99 => ⚙️ => &#9881;&#65039;

# First, let's fix known Mojibake strings directly
$replacements = @{
    "ðŸ“Š" = "&#128202;";
    "ðŸ’¾" = "&#128190;";
    "ðŸ“¥" = "&#128229;";
    "ðŸ”„" = "&#128260;";
    "ðŸ”’" = "&#128274;";
    "ðŸ‘‘" = "&#128081;";
    "ðŸ‘"  = "";
    "ðŸ“œ" = "&#128220;";
    "ðŸ“„" = "&#128196;";
    "ðŸ”" = "&#128269;";
    "ðŸ”¥" = "&#128293;";
    "ðŸŽ¯" = "&#127919;";
    "ðŸ—"  = "&#128465;";
    "ðŸ–"  = "&#128438;";
    "ðŸ“"  = "&#128196;"
}

foreach ($key in $replacements.Keys) {
    $text = $text.Replace($key, $replacements[$key])
}

# Write clean UTF-8 file back
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($appPath, $text, $utf8NoBom)
[System.IO.File]::WriteAllText($indexPath, $text, $utf8NoBom)

Write-Host "Fixed Mojibake corruption and saved clean files!"
