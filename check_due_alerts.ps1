$html = [System.IO.File]::ReadAllText('C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html', [System.Text.Encoding]::UTF8)

# Extract INITIAL_INSTRUMENTS string
$pattern = 'const INITIAL_INSTRUMENTS = (\[[\s\S]*?\]);'
if ($html -match $pattern) {
    $json = $matches[1]
    $instruments = ConvertFrom-Json $json
    $today = [DateTime]::Parse('2026-07-22')

    Write-Host "Total Seed Instruments in App: $($instruments.Count)"

    $overdueList = @()
    $due14List = @()

    foreach ($item in $instruments) {
        $lastCal = [DateTime]::Parse($item.lastCalibratedDate)
        $freq = [int]$item.frequencyMonths
        $dueDate = $lastCal.AddMonths($freq).AddDays(-1)
        $daysLeft = ($dueDate - $today).Days

        if ($daysLeft -lt 0) {
            $overdueList += [PSCustomObject]@{
                Tag = $item.tagId
                Name = $item.name
                Category = $item.category
                LastCal = $item.lastCalibratedDate
                DueDate = $dueDate.ToString("dd/MM/yyyy")
                Status = "$([Math]::Abs($daysLeft)) Days Overdue"
            }
        } elseif ($daysLeft -le 14) {
            $due14List += [PSCustomObject]@{
                Tag = $item.tagId
                Name = $item.name
                Category = $item.category
                LastCal = $item.lastCalibratedDate
                DueDate = $dueDate.ToString("dd/MM/yyyy")
                Status = "Due in $daysLeft Days"
            }
        }
    }

    Write-Host "`n=== PENDING / OVERDUE FOR CALIBRATION ($($overdueList.Count)) ==="
    $overdueList | Format-Table -AutoSize

    Write-Host "`n=== DUE IN NEXT 14 DAYS ($($due14List.Count)) ==="
    $due14List | Format-Table -AutoSize
} else {
    Write-Host "Could not find INITIAL_INSTRUMENTS in HTML"
}
