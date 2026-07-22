$code = @"
using System;
using System.IO;
using System.Text;

public class MojibakeFixer
{
    public static void Process(string filePath)
    {
        // Read file as UTF-8
        string content = File.ReadAllText(filePath, Encoding.UTF8);

        // Decode UTF-8 string back to ISO-8859-1 bytes
        Encoding iso = Encoding.GetEncoding("iso-8859-1");
        byte[] bytes = iso.GetBytes(content);

        // Decode those bytes as UTF-8
        string recovered = Encoding.UTF8.GetString(bytes);

        // Save back with UTF-8 (No BOM)
        UTF8Encoding utf8NoBom = new UTF8Encoding(false);
        File.WriteAllText(filePath, recovered, utf8NoBom);
    }
}
"@

Add-Type -TypeDefinition $code

$appPath = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$indexPath = "C:\Users\mukun\.gemini\antigravity\scratch\index.html"

[MojibakeFixer]::Process($appPath)
[MojibakeFixer]::Process($indexPath)

Write-Host "Automatic UTF-8 Mojibake Recovery Executed Successfully!"
