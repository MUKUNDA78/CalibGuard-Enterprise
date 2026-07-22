$html = [System.IO.File]::ReadAllText('C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html', [System.Text.Encoding]::UTF8)

# Extract INITIAL_INSTRUMENTS array from HTML
$pattern = 'const INITIAL_INSTRUMENTS = (\[[\s\S]*?\]);'
if ($html -match $pattern) {
    $json = $matches[1]
    $instruments = ConvertFrom-Json $json
    $today = [DateTime]::Parse('2026-07-22')
    $targetPhone = "7975635973"

    $overdue = @()
    $urgent14 = @()

    foreach ($item in $instruments) {
        $lastCal = [DateTime]::Parse($item.lastCalibratedDate)
        $freq = [int]$item.frequencyMonths
        $dueDate = $lastCal.AddMonths($freq).AddDays(-1)
        $daysLeft = ($dueDate - $today).Days

        if ($daysLeft -lt 0) {
            $overdue += [PSCustomObject]@{
                Tag = $item.tagId
                Name = $item.name
                LastCal = $lastCal.ToString("dd/MM/yyyy")
                DueDate = $dueDate.ToString("dd/MM/yyyy")
                DaysOverdue = [Math]::Abs($daysLeft)
            }
        } elseif ($daysLeft -le 14) {
            $urgent14 += [PSCustomObject]@{
                Tag = $item.tagId
                Name = $item.name
                LastCal = $lastCal.ToString("dd/MM/yyyy")
                DueDate = $dueDate.ToString("dd/MM/yyyy")
                DaysUntilDue = $daysLeft
            }
        }
    }

    # Format Message Payload
    $msg = "🚨 CALIBGUARD ENTERPRISE AUTOMATED ALERT 🚨`n"
    $msg += "Target Recipient: +91 $targetPhone`n"
    $msg += "System Reference Date: 22/07/2026`n`n"

    $msg += "⚠️ PENDING / OVERDUE FOR CALIBRATION ($($overdue.Count) Equipment):`n"
    if ($overdue.Count -eq 0) {
        $msg += "(None - All master instruments up to date)`n"
    } else {
        $idx = 1
        foreach ($o in $overdue) {
            $msg += "$idx. [$($o.Tag)] $($o.Name) | Last Calib: $($o.LastCal) | Due Date: $($o.DueDate) ($($o.DaysOverdue) Days OVERDUE)`n"
            $idx++
        }
    }

    $msg += "`n📅 DUE IN NEXT 14 DAYS ($($urgent14.Count) Equipment):`n"
    if ($urgent14.Count -eq 0) {
        $msg += "(None - No instruments due in next 14 days)`n"
    } else {
        $idx = 1
        foreach ($u in $urgent14) {
            $msg += "$idx. [$($u.Tag)] $($u.Name) | Due Date: $($u.DueDate) (in $($u.DaysUntilDue) Days)`n"
            $idx++
        }
    }

    $msg += "`n❗ ACTION REQUIRED: Please perform calibration and update CalibGuard system records to clear these active alerts.`n"
    $msg += "Status: ACTIVE DISPATCH (Alerts active until calibration completed & updated)"

    # Write to log file
    $logPath = "C:\Users\mukun\.gemini\antigravity\scratch\sms_alert_logs.txt"
    $logContent = "=== SMS ALERT DISPATCH LOG [$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] ===`nTarget Phone: $targetPhone`n`n$msg`n`n"
    [System.IO.File]::AppendAllText($logPath, $logContent, [System.Text.Encoding]::UTF8)

    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   CALIBGUARD SMS & WHATSAPP ALERT DISPATCHER (7975635973)   " -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $msg -ForegroundColor White
    Write-Host "`n[OK] Alert Log written to: $logPath" -ForegroundColor Green

    # Launch WhatsApp Web Link
    $encodedMsg = [Uri]::EscapeDataString($msg)
    $waUrl = "https://wa.me/91$targetPhone?text=$encodedMsg"
    Write-Host "[LINK] WhatsApp Direct Link: $waUrl" -ForegroundColor SkyBlue

    # Return summary object
    [PSCustomObject]@{
        TargetPhone = $targetPhone
        OverdueCount = $overdue.Count
        Due14Count = $urgent14.Count
        WhatsAppUrl = $waUrl
    }
} else {
    Write-Host "[ERROR] Could not parse INITIAL_INSTRUMENTS array" -ForegroundColor Red
}
