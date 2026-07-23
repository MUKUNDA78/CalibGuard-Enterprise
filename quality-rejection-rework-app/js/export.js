// Exporter & Excel (.xlsx / .csv) Bulk Processor for Quality Inspection App

class QualityExporter {
    // Export dataset to Excel (.xlsx) with exact 8 columns: Date, Part Number, Production Qty, Accepted Qty, Rework Qty, Reason for Rework, Rejection Qty, Reason for Rejection
    static exportToExcel(records, stageName = 'All_Stages', filename = null) {
        if (!records || !records.length) {
            alert(`No records available to export for ${stageName}.`);
            return;
        }

        const formattedFilename = filename || `Quality_Inspection_${stageName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Exact 8 columns
        const dataRows = records.map(r => ({
            'Entry ID': r.id || '',
            'Date': r.date || '',
            'Part Number': r.partNo || '',
            'Production Qty': Number(r.productionQty) || 0,
            'Accepted Qty': Number(r.acceptedQty) || 0,
            'Rework Qty': Number(r.reworkQty) || 0,
            'Reason for Rework': r.reworkReason || '',
            'Rejection Qty': Number(r.rejectionQty) || 0,
            'Reason for Rejection': r.rejectionReason || ''
        }));

        if (window.XLSX) {
            const worksheet = XLSX.utils.json_to_sheet(dataRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, stageName.substring(0, 30));
            XLSX.writeFile(workbook, formattedFilename);
        } else {
            this.exportToCSV(records, formattedFilename.replace('.xlsx', '.csv'));
        }
    }

    // Download blank Excel template containing exact 8 columns
    static downloadStageTemplateExcel(stageKey = 'inprocess') {
        const stageName = STAGES[stageKey] ? STAGES[stageKey].name : 'Inspection';
        const filename = `${stageName.replace(/\s+/g, '_')}_Excel_Template.xlsx`;

        const sampleRows = [
            {
                'Date': new Date().toISOString().split('T')[0],
                'Part Number': 'CR-1042',
                'Production Qty': 500,
                'Accepted Qty': 470,
                'Rework Qty': 20,
                'Reason for Rework': 'Face Runout / Burr',
                'Rejection Qty': 10,
                'Reason for Rejection': 'Bore Undersize'
            },
            {
                'Date': new Date().toISOString().split('T')[0],
                'Part Number': 'CS-5509',
                'Production Qty': 300,
                'Accepted Qty': 285,
                'Rework Qty': 10,
                'Reason for Rework': 'Laser Marking Faded',
                'Rejection Qty': 5,
                'Reason for Rejection': 'Thread Gauge No-Go Pass'
            }
        ];

        if (window.XLSX) {
            const worksheet = XLSX.utils.json_to_sheet(sampleRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Template');
            XLSX.writeFile(workbook, filename);
        } else {
            this.exportToCSV(sampleRows, filename.replace('.xlsx', '.csv'));
        }
    }

    static parseExcelFile(file, targetStageKey = 'all', callback) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);

            if (window.XLSX) {
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                const results = [];

                rawJson.forEach(row => {
                    const getVal = (possibleKeys) => {
                        for (let k of possibleKeys) {
                            if (row[k] !== undefined && row[k] !== '') return row[k];
                        }
                        return '';
                    };

                    const partNo = getVal(['Part Number', 'Part No', 'PartNumber', 'partNo']);
                    if (partNo) {
                        let stageVal = targetStageKey === 'all' ? 'inprocess' : targetStageKey;

                        const prodQty = Number(getVal(['Production Qty', 'ProductionQty', 'Prod Qty'])) || 0;
                        const rewQty = Number(getVal(['Rework Qty', 'ReworkQty'])) || 0;
                        const rejQty = Number(getVal(['Rejection Qty', 'RejectionQty'])) || 0;

                        let accQty = Number(getVal(['Accepted Qty', 'AcceptedQty']));
                        if (isNaN(accQty) || accQty === 0) {
                            accQty = Math.max(0, prodQty - rewQty - rejQty);
                        }

                        results.push({
                            date: getVal(['Date', 'date']) || new Date().toISOString().split('T')[0],
                            stage: stageVal,
                            stageLabel: STAGES[stageVal] ? STAGES[stageVal].name : stageVal,
                            partNo: String(partNo),
                            productionQty: prodQty,
                            acceptedQty: accQty,
                            reworkQty: rewQty,
                            reworkReason: getVal(['Reason for Rework', 'Rework Reason', 'reworkReason']) || 'None',
                            rejectionQty: rejQty,
                            rejectionReason: getVal(['Reason for Rejection', 'Rejection Reason', 'rejectionReason']) || 'None'
                        });
                    }
                });

                callback(results);
            } else {
                alert('SheetJS Excel library not loaded.');
            }
        };

        reader.readAsArrayBuffer(file);
    }

    static exportToCSV(records, filename = 'Quality_Inspection_Data.csv') {
        if (!records || !records.length) {
            alert('No records available to export.');
            return;
        }

        const headers = [
            'ID',
            'Date',
            'Part Number',
            'Production Qty',
            'Accepted Qty',
            'Rework Qty',
            'Reason for Rework',
            'Rejection Qty',
            'Reason for Rejection'
        ];

        const csvRows = [headers.join(',')];

        records.forEach(r => {
            const row = [
                `"${r.id || ''}"`,
                `"${r.date || ''}"`,
                `"${r.partNo || ''}"`,
                r.productionQty || 0,
                r.acceptedQty || 0,
                r.reworkQty || 0,
                `"${(r.reworkReason || '').replace(/"/g, '""')}"`,
                r.rejectionQty || 0,
                `"${(r.rejectionReason || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static printQualityReport(records, summaryMetrics, stageName = 'All Stages') {
        const printWindow = window.open('', '_blank');
        const now = new Date().toLocaleString();

        const tableRows = records.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.date}</td>
                <td><b>${r.partNo}</b></td>
                <td>${r.productionQty}</td>
                <td><span style="color: #059669; font-weight: bold;">${r.acceptedQty}</span></td>
                <td>${r.reworkQty} (${r.reworkReason})</td>
                <td><span style="color: #dc2626; font-weight: bold;">${r.rejectionQty}</span> (${r.rejectionReason})</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${stageName} Inspection Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #0f172a; }
                    h1 { color: #0f172a; margin-bottom: 5px; }
                    .subtitle { color: #64748b; margin-bottom: 20px; font-size: 14px; }
                    .kpi-container { display: flex; gap: 15px; margin-bottom: 25px; }
                    .kpi-box { flex: 1; border: 1px solid #e2e8f0; padding: 12px; borderRadius: 8px; background: #f8fafc; }
                    .kpi-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
                    .kpi-value { font-size: 20px; font-weight: bold; margin-top: 5px; color: #2563eb; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>${stageName} Inspection Report</h1>
                <div class="subtitle">Generated on: ${now} | Inspection Summary</div>
                
                <div class="kpi-container">
                    <div class="kpi-box">
                        <div class="kpi-title">Production Qty</div>
                        <div class="kpi-value">${summaryMetrics.totalProductionQty.toLocaleString()} Pcs</div>
                    </div>
                    <div class="kpi-box">
                        <div class="kpi-title">Accepted Qty</div>
                        <div class="kpi-value">${summaryMetrics.totalAcceptedQty.toLocaleString()} Pcs (${summaryMetrics.firstPassYield}%)</div>
                    </div>
                    <div class="kpi-box">
                        <div class="kpi-title">Rejection Qty</div>
                        <div class="kpi-value">${summaryMetrics.totalRejectionQty.toLocaleString()} Pcs (${summaryMetrics.overallRejectionRate}%)</div>
                    </div>
                    <div class="kpi-box">
                        <div class="kpi-title">Rework Qty</div>
                        <div class="kpi-value">${summaryMetrics.totalReworkQty.toLocaleString()} Pcs (${summaryMetrics.overallReworkRate}%)</div>
                    </div>
                </div>

                <h2>Log Breakdown (${records.length} Records)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Part Number</th>
                            <th>Production Qty</th>
                            <th>Accepted Qty</th>
                            <th>Rework Qty & Reason</th>
                            <th>Rejection Qty & Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
}
