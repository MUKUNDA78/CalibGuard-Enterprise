// Chart initialization and update logic using Chart.js (Quantity & Reason Focused)

class QualityChartManager {
    constructor() {
        this.paretoChart = null;
        this.stageBreakdownChart = null;
        this.typeCompareChart = null;
        this.vendorChart = null;
    }

    renderAllCharts(records) {
        this.renderParetoChart(records);
        this.renderStageBreakdownChart(records);
        this.renderTypeCompareChart(records);
        this.renderVendorChart(records);
    }

    // 1. Pareto Chart (Top Rejection & Rework Reasons by Quantity & Cumulative %)
    renderParetoChart(records) {
        const ctx = document.getElementById('paretoChart');
        if (!ctx) return;

        const reasonMap = {};
        records.forEach(r => {
            if (r.rejectionReason && r.rejectionQty > 0) {
                const reason = r.rejectionReason;
                reasonMap[reason] = (reasonMap[reason] || 0) + Number(r.rejectionQty || 0);
            }
            if (r.reworkReason && r.reworkReason !== 'None' && r.reworkQty > 0) {
                const reason = '[Rework] ' + r.reworkReason;
                reasonMap[reason] = (reasonMap[reason] || 0) + Number(r.reworkQty || 0);
            }
        });

        const sortedReasons = Object.entries(reasonMap)
            .map(([reason, qty]) => ({ reason, qty }))
            .sort((a, b) => b.qty - a.qty);

        const labels = sortedReasons.map(d => d.reason.length > 25 ? d.reason.substring(0, 22) + '...' : d.reason);
        const quantities = sortedReasons.map(d => d.qty);

        const grandTotal = quantities.reduce((sum, q) => sum + q, 0);

        let cumulativeSum = 0;
        const cumulativePct = quantities.map(qty => {
            cumulativeSum += qty;
            return grandTotal > 0 ? Number(((cumulativeSum / grandTotal) * 100).toFixed(1)) : 0;
        });

        if (this.paretoChart) {
            this.paretoChart.destroy();
        }

        this.paretoChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['No Defect Reasons Logged'],
                datasets: [
                    {
                        label: 'Defect / Rework Qty (Pcs)',
                        data: quantities.length > 0 ? quantities : [0],
                        backgroundColor: 'rgba(37, 99, 235, 0.85)',
                        borderColor: '#2563eb',
                        borderWidth: 1,
                        yAxisID: 'yQty',
                        order: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Cumulative %',
                        data: cumulativePct.length > 0 ? cumulativePct : [0],
                        type: 'line',
                        borderColor: '#d97706',
                        backgroundColor: 'rgba(217, 119, 6, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#d97706',
                        pointRadius: 4,
                        yAxisID: 'yPct',
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#334155', font: { family: 'Inter', weight: '600' } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.yAxisID === 'yQty') {
                                    return ` Defect Qty: ${context.raw} Pcs`;
                                } else {
                                    return ` Cumulative: ${context.raw}%`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#475569', font: { family: 'Inter', size: 11, weight: '500' } },
                        grid: { color: '#e2e8f0' }
                    },
                    yQty: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Quantity (Pcs)', color: '#475569', font: { weight: '600' } },
                        ticks: { color: '#475569' },
                        grid: { color: '#e2e8f0' }
                    },
                    yPct: {
                        type: 'linear',
                        position: 'right',
                        min: 0,
                        max: 100,
                        title: { display: true, text: 'Cumulative %', color: '#d97706', font: { weight: '600' } },
                        ticks: { color: '#d97706', callback: value => value + '%' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    // 2. Stage Breakdown Donut Chart (Rejection Qty by Stage)
    renderStageBreakdownChart(records) {
        const ctx = document.getElementById('stageBreakdownChart');
        if (!ctx) return;

        const stageQty = {};
        Object.keys(STAGES).forEach(sKey => {
            stageQty[sKey] = 0;
        });

        records.forEach(r => {
            if (stageQty[r.stage] !== undefined) {
                stageQty[r.stage] += Number(r.rejectionQty || 0);
            }
        });

        const labels = Object.keys(STAGES).map(sKey => STAGES[sKey].name);
        const data = Object.keys(STAGES).map(sKey => stageQty[sKey]);
        const backgroundColors = Object.keys(STAGES).map(sKey => STAGES[sKey].color);

        if (this.stageBreakdownChart) {
            this.stageBreakdownChart.destroy();
        }

        this.stageBreakdownChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#334155', font: { family: 'Inter', size: 12, weight: '500' }, padding: 15 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.raw || 0;
                                return ` Rejection Qty: ${val} Pcs`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }

    // 3. Rejection vs Rework Quantity per Stage
    renderTypeCompareChart(records) {
        const ctx = document.getElementById('typeCompareChart');
        if (!ctx) return;

        const rejectionByStage = {};
        const reworkByStage = {};
        Object.keys(STAGES).forEach(sKey => {
            rejectionByStage[sKey] = 0;
            reworkByStage[sKey] = 0;
        });

        records.forEach(r => {
            rejectionByStage[r.stage] = (rejectionByStage[r.stage] || 0) + Number(r.rejectionQty || 0);
            reworkByStage[r.stage] = (reworkByStage[r.stage] || 0) + Number(r.reworkQty || 0);
        });

        const labels = Object.keys(STAGES).map(sKey => STAGES[sKey].name.replace(' Inspection', ''));
        const rejectionData = Object.keys(STAGES).map(sKey => rejectionByStage[sKey]);
        const reworkData = Object.keys(STAGES).map(sKey => reworkByStage[sKey]);

        if (this.typeCompareChart) {
            this.typeCompareChart.destroy();
        }

        this.typeCompareChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Rejection Qty (Pcs)',
                        data: rejectionData,
                        backgroundColor: '#dc2626',
                        borderRadius: 4
                    },
                    {
                        label: 'Rework Qty (Pcs)',
                        data: reworkData,
                        backgroundColor: '#2563eb',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#334155', font: { family: 'Inter', weight: '600' } } }
                },
                scales: {
                    x: {
                        ticks: { color: '#475569', font: { family: 'Inter', size: 10, weight: '500' } },
                        grid: { color: '#e2e8f0' }
                    },
                    y: {
                        ticks: { color: '#475569' },
                        grid: { color: '#e2e8f0' },
                        title: { display: true, text: 'Quantity (Pcs)', color: '#475569', font: { weight: '600' } }
                    }
                }
            }
        });
    }

    // 4. Machining Vendor Rejection Qty Comparison
    renderVendorChart(records) {
        const ctx = document.getElementById('vendorChart');
        if (!ctx) return;

        const vendorDataMap = {};
        records.filter(r => r.stage === 'vendor_machining').forEach(r => {
            const vName = r.vendor || 'Unknown Vendor';
            if (!vendorDataMap[vName]) {
                vendorDataMap[vName] = 0;
            }
            vendorDataMap[vName] += Number(r.rejectionQty || 0);
        });

        const labels = Object.keys(vendorDataMap);
        const quantities = labels.map(v => vendorDataMap[v]);

        if (this.vendorChart) {
            this.vendorChart.destroy();
        }

        this.vendorChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['No Vendor Rejections'],
                datasets: [{
                    label: 'Vendor Rejection Qty (Pcs)',
                    data: quantities.length > 0 ? quantities : [0],
                    backgroundColor: '#7c3aed',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#334155', font: { family: 'Inter', weight: '600' } } }
                },
                scales: {
                    x: {
                        ticks: { color: '#475569' },
                        grid: { color: '#e2e8f0' }
                    },
                    y: {
                        ticks: { color: '#475569', font: { family: 'Inter', size: 11, weight: '500' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

const chartManager = new QualityChartManager();
