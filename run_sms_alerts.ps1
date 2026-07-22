$code = @"
using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;

public class SMSAlertDispatcher
{
    public class Instrument
    {
        public string id { get; set; }
        public string tagId { get; set; }
        public string name { get; set; }
        public string category { get; set; }
        public string lastCalibratedDate { get; set; }
        public int frequencyMonths { get; set; }
    }

    public static void Run()
    {
        string appPath = @"C:\Users\mukun\.gemini\antigravity\scratch\CalibGuard_App.html";
        string html = File.ReadAllText(appPath, Encoding.UTF8);

        Match match = Regex.Match(html, @"const INITIAL_INSTRUMENTS = (\[[\s\S]*?\]);");
        if (!match.Success)
        {
            Console.WriteLine("Could not match INITIAL_INSTRUMENTS.");
            return;
        }

        string json = match.Groups[1].Value;
        DateTime today = DateTime.Parse("2026-07-22");
        string targetPhone = "7975635973";

        // Simple JSON parse for tagId, name, lastCalibratedDate, frequencyMonths
        var tagMatches = Regex.Matches(json, @"""tagId"":\s*""([^""]+)""");
        var nameMatches = Regex.Matches(json, @"""name"":\s*""([^""]+)""");
        var dateMatches = Regex.Matches(json, @"""lastCalibratedDate"":\s*""([^""]+)""");
        var freqMatches = Regex.Matches(json, @"""frequencyMonths"":\s*(\d+)");

        List<string> overdueList = new List<string>();
        List<string> due14List = new List<string>();

        int count = tagMatches.Count;
        for (int i = 0; i < count; i++)
        {
            string tagId = tagMatches[i].Groups[1].Value;
            string name = nameMatches[i].Groups[1].Value;
            DateTime lastCal = DateTime.Parse(dateMatches[i].Groups[1].Value);
            int freq = int.Parse(freqMatches[i].Groups[1].Value);

            DateTime dueDate = lastCal.AddMonths(freq).AddDays(-1);
            int daysLeft = (dueDate - today).Days;

            if (daysLeft < 0)
            {
                int overdueDays = Math.Abs(daysLeft);
                overdueList.Add("[" + tagId + "] " + name + " | Last Calib: " + lastCal.ToString("dd/MM/yyyy") + " | Due Date: " + dueDate.ToString("dd/MM/yyyy") + " (" + overdueDays + " Days OVERDUE)");
            }
            else if (daysLeft <= 14)
            {
                due14List.Add("[" + tagId + "] " + name + " | Due Date: " + dueDate.ToString("dd/MM/yyyy") + " (in " + daysLeft + " Days)");
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.AppendLine("CALIBGUARD ENTERPRISE AUTOMATED ALERT");
        sb.AppendLine("Target Recipient: +91 " + targetPhone);
        sb.AppendLine("System Reference Date: 22/07/2026");
        sb.AppendLine();
        sb.AppendLine("PENDING / OVERDUE FOR CALIBRATION (" + overdueList.Count + " Equipment):");

        if (overdueList.Count == 0)
        {
            sb.AppendLine("(None - All master instruments up to date)");
        }
        else
        {
            for (int i = 0; i < overdueList.Count; i++)
            {
                sb.AppendLine((i + 1) + ". " + overdueList[i]);
            }
        }

        sb.AppendLine();
        sb.AppendLine("DUE IN NEXT 14 DAYS (" + due14List.Count + " Equipment):");
        if (due14List.Count == 0)
        {
            sb.AppendLine("(None - No instruments due in next 14 days)");
        }
        else
        {
            for (int i = 0; i < due14List.Count; i++)
            {
                sb.AppendLine((i + 1) + ". " + due14List[i]);
            }
        }

        sb.AppendLine();
        sb.AppendLine("ACTION REQUIRED: Please perform calibration and update CalibGuard system records to clear these active alerts.");
        sb.AppendLine("Status: ACTIVE DISPATCH (Alerts active until calibration completed & updated)");

        string alertPayload = sb.ToString();

        string logPath = @"C:\Users\mukun\.gemini\antigravity\scratch\sms_alert_logs.txt";
        string logEntry = "=== SMS ALERT DISPATCH LOG [" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "] ===\nTarget Phone: " + targetPhone + "\n\n" + alertPayload + "\n\n";
        File.AppendAllText(logPath, logEntry, Encoding.UTF8);

        Console.WriteLine("============================================================");
        Console.WriteLine("   CALIBGUARD SMS & WHATSAPP ALERT DISPATCHER (" + targetPhone + ")   ");
        Console.WriteLine("============================================================");
        Console.WriteLine(alertPayload);
        Console.WriteLine("\n[OK] Alert Log successfully saved to: " + logPath);
    }
}
"@

Add-Type -TypeDefinition $code
[SMSAlertDispatcher]::Run()
