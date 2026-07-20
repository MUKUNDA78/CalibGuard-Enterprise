// Utility functions for Calibration Monitoring System

const TODAY_DATE = new Date('2026-07-18T11:47:24');

function getDaysUntilDue(dateStr) {
  if (!dateStr) return 0;
  const dueDate = new Date(dateStr);
  const diffTime = dueDate.getTime() - TODAY_DATE.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getCalibrationAlertInfo(nextDueDate, thresholdDays = 7) {
  const days = getDaysUntilDue(nextDueDate);

  if (days < 0) {
    return {
      key: 'overdue',
      label: `OVERDUE (${Math.abs(days)} days ago)`,
      shortLabel: 'Overdue',
      days: days,
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 shadow-red-900/30',
      textClass: 'text-red-400',
      bgPulse: 'animate-pulse bg-red-500/10',
      alertLevel: 'CRITICAL',
      icon: 'alert-triangle'
    };
  } else if (days <= thresholdDays) {
    return {
      key: 'due-urgent',
      label: `DUE IN ${days} DAY${days === 1 ? '' : 'S'} (${thresholdDays}-Day Alert Window)`,
      shortLabel: `Due in ${days}d`,
      days: days,
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-900/30',
      textClass: 'text-amber-400',
      bgPulse: 'bg-amber-500/5',
      alertLevel: 'WARNING',
      icon: 'bell'
    };
  } else if (days <= 30) {
    return {
      key: 'due-upcoming',
      label: `Due in ${days} days`,
      shortLabel: `Due in ${days}d`,
      days: days,
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      textClass: 'text-blue-400',
      bgPulse: '',
      alertLevel: 'INFO',
      icon: 'clock'
    };
  } else {
    return {
      key: 'valid',
      label: `Compliant (${days} days left)`,
      shortLabel: 'Compliant',
      days: days,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      textClass: 'text-emerald-400',
      bgPulse: '',
      alertLevel: 'OK',
      icon: 'check-circle'
    };
  }
}

function calculateNextDueDate(lastDateStr, months) {
  if (!lastDateStr) return '';
  const date = new Date(lastDateStr);
  date.setMonth(date.getMonth() + parseInt(months, 10));
  return date.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}

function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Simple CSV Text Parser into Array of Objects
 */
function parseCSV(text) {
  const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
    if (row.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx];
      });
      results.push(obj);
    }
  }
  return results;
}

/**
 * Downloads Excel/CSV Import Template
 */
function downloadCSVTemplate() {
  const sampleData = [
    {
      TagID: "EQ-IMP-101",
      Name: "Digital Height Gauge 0-300mm",
      Category: "Dimensional",
      Manufacturer: "Mitutoyo",
      Model: "192-630-10",
      SerialNumber: "MT-992019",
      Location: "QA Inspection Room",
      FrequencyMonths: "6",
      LastCalibratedDate: "2026-02-15",
      AgencyCode: "PMS-LAB",
      Tolerance: "±0.01 mm"
    },
    {
      TagID: "EQ-IMP-102",
      Name: "Precision Dial Indicator 0-10mm",
      Category: "Dimensional",
      Manufacturer: "Starrett",
      Model: "25-441J",
      SerialNumber: "ST-881029",
      Location: "CNC Lathe Line 1",
      FrequencyMonths: "6",
      LastCalibratedDate: "2026-03-01",
      AgencyCode: "APEX-CAL",
      Tolerance: "±0.005 mm"
    }
  ];

  exportToCSV('CalibGuard_Instrument_Import_Template.csv', sampleData);
}

const StorageManager = {
  get: (key, defaultValue) => {
    try {
      const item = localStorage.getItem(`calibguard_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('LocalStorage error:', e);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(`calibguard_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }
};

window.CalibUtils = {
  TODAY_DATE,
  getDaysUntilDue,
  getCalibrationAlertInfo,
  calculateNextDueDate,
  formatDate,
  exportToCSV,
  parseCSV,
  downloadCSVTemplate,
  StorageManager
};
