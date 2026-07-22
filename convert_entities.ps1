$code = @"
using System;
using System.IO;
using System.Text;

public class HtmlEntityConverter
{
    public static void ConvertFile(string filePath)
    {
        string text = File.ReadAllText(filePath, Encoding.UTF8);
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < text.Length; i++)
        {
            int codePoint = char.ConvertToUtf32(text, i);
            if (char.IsSurrogatePair(text, i))
            {
                i++; // Skip second char of surrogate pair
            }

            if (codePoint > 127)
            {
                // Convert non-ASCII character to HTML entity
                sb.Append("&#" + codePoint + ";");
            }
            else
            {
                sb.Append((char)codePoint);
            }
        }

        string result = sb.ToString();
        UTF8Encoding utf8NoBom = new UTF8Encoding(false);
        File.WriteAllText(filePath, result, utf8NoBom);
    }
}
"@

Add-Type -TypeDefinition $code

$appPath = "C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html"
$indexPath = "C:\Users\mukun\.gemini\antigravity\scratch\index.html"

[HtmlEntityConverter]::ConvertFile($appPath)
[HtmlEntityConverter]::ConvertFile($indexPath)

Write-Host "Converted 100% of non-ASCII characters to robust ASCII HTML entities!"
