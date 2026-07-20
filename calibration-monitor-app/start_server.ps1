$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server running at http://localhost:8080/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response
    $html = Get-Content -Path "$PSScriptRoot\app.html" -Raw
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
    $response.ContentType = "text/html; charset=utf-8"
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.OutputStream.Close()
}
