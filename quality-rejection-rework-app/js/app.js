// Main Application Controller (Strict Timestamp Date Range Filtering)

document.addEventListener('DOMContentLoaded', () => {
    let currentStage = 'all';
    let currentSearch = '';
    let currentFromDate = '';
    let currentToDate = '';

    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const filterFromDate = document.getElementById('filterFromDate');
    const filterToDate = document.getElementById('filterToDate');
    const btnApplyDateFilter = document.getElementById('btnApplyDateFilter');

    const btnResetFilters = document.getElementById('btnResetFilters');
    const btnResetData = document.getElementById('btnResetData');
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const btnPrintReport = document.getElementById('btnPrintReport');

    // Stage Window Action Bar Elements
    const activeStageTitle = document.getElementById('activeStageTitle');
    const activeStageSubtitle = document.getElementById('activeStageSubtitle');
    const btnStageUploadExcel = document.getElementById('btnStageUploadExcel');
    const btnStageDownloadExcel = document.getElementById('btnStageDownloadExcel');
    const btnStageManualEntry = document.getElementById('btnStageManualEntry');

    // Chart Card Elements
    const paretoCard = document.getElementById('paretoCard');
    const stageBreakdownCard = document.getElementById('stageBreakdownCard');
    const typeCompareCard = document.getElementById('typeCompareCard');

    const tableBody = document.getElementById('tableBody');
    const recordCountLabel = document.getElementById('recordCountLabel');

    // Record Modal Elements
    const recordModal = document.getElementById('recordModal');
    const modalTitle = document.getElementById('modalTitle');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const recordForm = document.getElementById('recordForm');

    // Form inputs
    const formRecordId = document.getElementById('formRecordId');
    const formDate = document.getElementById('formDate');
    const formPartNo = document.getElementById('formPartNo');
    const formProductionQty = document.getElementById('formProductionQty');
    const formAcceptedQty = document.getElementById('formAcceptedQty');
    const formReworkQty = document.getElementById('formReworkQty');
    const formReworkReason = document.getElementById('formReworkReason');
    const formRejectionQty = document.getElementById('formRejectionQty');
    const formRejectionReason = document.getElementById('formRejectionReason');

    // Upload Modal Elements
    const uploadModal = document.getElementById('uploadModal');
    const uploadModalTitle = document.getElementById('uploadModalTitle');
    const uploadModalDesc = document.getElementById('uploadModalDesc');
    const btnCloseUploadModal = document.getElementById('btnCloseUploadModal');
    const btnCancelUploadModal = document.getElementById('btnCancelUploadModal');
    const csvFileInput = document.getElementById('csvFileInput');
    const btnSelectCSVFile = document.getElementById('btnSelectCSVFile');
    const selectedFileName = document.getElementById('selectedFileName');
    const btnDownloadTemplate = document.getElementById('btnDownloadTemplate');
    const btnProcessUpload = document.getElementById('btnProcessUpload');

    let selectedFileForImport = null;

    function init() {
        formDate.value = new Date().toISOString().split('T')[0];
        setupEventListeners();
        updateStageBadgeCounts();
        updateStageWindowHeader();
        renderDashboard();
    }

    function updateStageBadgeCounts() {
        const allRecords = dataStore.getAllRecords();
        document.getElementById('countAll').textContent = allRecords.length;

        Object.keys(STAGES).forEach(sKey => {
            const count = allRecords.filter(r => r.stage === sKey).length;
            const badgeId = 'count' + sKey.charAt(0).toUpperCase() + sKey.slice(1).replace('_', '');
            const badgeElem = document.getElementById(badgeId);
            if (badgeElem) {
                badgeElem.textContent = count;
            }
        });
    }

    function updateStageWindowHeader() {
        if (currentStage === 'all') {
            activeStageTitle.innerHTML = `<i class="fa-solid fa-layer-group text-blue"></i> All Stages Quality Window`;
            activeStageSubtitle.textContent = `Viewing complete quality inspection dataset across all manufacturing & supplier stages.`;
            btnStageUploadExcel.innerHTML = `<i class="fa-solid fa-file-excel"></i> Upload All Stages Excel Sheet`;
            btnStageDownloadExcel.innerHTML = `<i class="fa-solid fa-file-export"></i> Download All Stages Excel Sheet`;
            btnStageManualEntry.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> + Manual Entry`;

            if (stageBreakdownCard) stageBreakdownCard.style.display = 'flex';
            if (typeCompareCard) typeCompareCard.style.display = 'flex';
            if (paretoCard) {
                paretoCard.classList.remove('col-12');
                paretoCard.classList.add('col-8');
            }
        } else {
            const stageInfo = STAGES[currentStage];
            const sName = stageInfo ? stageInfo.name : currentStage;
            const sColor = stageInfo ? stageInfo.color : '#2563eb';
            const sIcon = stageInfo ? stageInfo.icon : 'fa-cogs';

            activeStageTitle.innerHTML = `<i class="fa-solid ${sIcon}" style="color: ${sColor};"></i> ${sName} Window`;
            activeStageSubtitle.textContent = `Dedicated inspection analytics, Excel sheet upload/export, and manual entry for ${sName}.`;

            btnStageUploadExcel.innerHTML = `<i class="fa-solid fa-file-excel"></i> Upload ${sName} Excel Sheet`;
            btnStageDownloadExcel.innerHTML = `<i class="fa-solid fa-file-export"></i> Download ${sName} Excel Sheet`;
            btnStageManualEntry.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> + Manual Entry for ${sName}`;

            if (stageBreakdownCard) stageBreakdownCard.style.display = 'none';
            if (typeCompareCard) typeCompareCard.style.display = 'none';
            if (paretoCard) {
                paretoCard.classList.remove('col-8');
                paretoCard.classList.add('col-12');
            }
        }
    }

    // Helper to safely parse dates to midnight timestamp
    function parseToTime(dateStr, isEndOfDay = false) {
        if (!dateStr) return null;
        try {
            const cleanStr = String(dateStr).trim().split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const d = isEndOfDay 
                    ? new Date(year, month, day, 23, 59, 59, 999) 
                    : new Date(year, month, day, 0, 0, 0, 0);
                return d.getTime();
            }
            const fallback = new Date(cleanStr).getTime();
            return isNaN(fallback) ? null : fallback;
        } catch (e) {
            return null;
        }
    }

    function getFilteredRecords() {
        let records = dataStore.getAllRecords();

        // 1. Stage Window Filter
        if (currentStage !== 'all') {
            records = records.filter(r => r.stage === currentStage);
        }

        // 2. From Date Filter
        const fromTime = parseToTime(currentFromDate, false);
        if (fromTime) {
            records = records.filter(r => {
                const recTime = parseToTime(r.date, false);
                return recTime !== null && recTime >= fromTime;
            });
        }

        // 3. To Date Filter
        const toTime = parseToTime(currentToDate, true);
        if (toTime) {
            records = records.filter(r => {
                const recTime = parseToTime(r.date, false);
                return recTime !== null && recTime <= toTime;
            });
        }

        // 4. Text Search Filter
        if (currentSearch.trim() !== '') {
            const query = currentSearch.toLowerCase();
            records = records.filter(r =>
                (r.id && r.id.toLowerCase().includes(query)) ||
                (r.partNo && r.partNo.toLowerCase().includes(query)) ||
                (r.reworkReason && r.reworkReason.toLowerCase().includes(query)) ||
                (r.rejectionReason && r.rejectionReason.toLowerCase().includes(query))
            );
        }

        return records;
    }

    function renderDashboard() {
        const filteredRecords = getFilteredRecords();
        const metrics = dataStore.getSummaryMetrics(filteredRecords);

        // Update KPIs
        document.getElementById('kpiProductionQty').textContent = metrics.totalProductionQty.toLocaleString();
        document.getElementById('kpiAcceptedQty').textContent = metrics.totalAcceptedQty.toLocaleString();
        document.getElementById('kpiYieldRate').textContent = `${metrics.firstPassYield}% First Pass Yield`;
        document.getElementById('kpiRejectionQty').textContent = metrics.totalRejectionQty.toLocaleString();
        document.getElementById('kpiRejectionRate').textContent = `${metrics.overallRejectionRate}% Rejection Rate`;
        document.getElementById('kpiReworkQty').textContent = metrics.totalReworkQty.toLocaleString();
        document.getElementById('kpiReworkRate').textContent = `${metrics.overallReworkRate}% Rework Rate`;

        // Render Charts & Table
        chartManager.renderAllCharts(filteredRecords);
        renderTable(filteredRecords);
    }

    function renderTable(records) {
        tableBody.innerHTML = '';
        recordCountLabel.textContent = `Showing ${records.length} record${records.length !== 1 ? 's' : ''}`;

        if (records.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                        No inspection records found matching your date range / filter.
                    </td>
                </tr>
            `;
            return;
        }

        records.forEach(r => {
            const tr = document.createElement('tr');

            const reworkInfo = Number(r.reworkQty) > 0 
                ? `<strong style="color: var(--accent-amber);">${r.reworkQty} Pcs</strong><br><small style="color: var(--text-secondary);">${r.reworkReason || 'None'}</small>`
                : `<span style="color: var(--text-muted);">0</span>`;

            const rejectionInfo = Number(r.rejectionQty) > 0 
                ? `<strong style="color: var(--accent-red);">${r.rejectionQty} Pcs</strong><br><small style="color: var(--text-secondary);">${r.rejectionReason || 'None'}</small>`
                : `<span style="color: var(--text-muted);">0</span>`;

            tr.innerHTML = `
                <td>
                    <strong style="color: #0f172a;">${r.id}</strong><br>
                    <small style="color: var(--text-muted);">${r.date}</small>
                </td>
                <td>
                    <strong style="color: var(--accent-blue); font-size: 0.95rem;">${r.partNo}</strong>
                </td>
                <td><strong>${r.productionQty || 0}</strong> Pcs</td>
                <td><strong style="color: var(--accent-green);">${r.acceptedQty || 0}</strong> Pcs</td>
                <td>${reworkInfo}</td>
                <td>${rejectionInfo}</td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-outline edit-btn" data-id="${r.id}" style="padding: 4px 8px; font-size: 0.75rem;" title="Edit Record">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-outline delete-btn" data-id="${r.id}" style="padding: 4px 8px; font-size: 0.75rem; color: var(--accent-red);" title="Delete Record">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openEditModal(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm(`Are you sure you want to delete record ${id}?`)) {
                    dataStore.deleteRecord(id);
                    updateStageBadgeCounts();
                    renderDashboard();
                }
            });
        });
    }

    function setupEventListeners() {
        // Stage Tab Clicks
        document.querySelectorAll('.stage-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.stage-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentStage = tab.getAttribute('data-stage');
                updateStageWindowHeader();
                renderDashboard();
            });
        });

        // Stage Action Bar Buttons
        btnStageUploadExcel.addEventListener('click', () => {
            openUploadModalForStage(currentStage);
        });

        btnStageDownloadExcel.addEventListener('click', () => {
            const records = getFilteredRecords();
            const sName = currentStage === 'all' ? 'All_Stages' : (STAGES[currentStage] ? STAGES[currentStage].name : currentStage);
            QualityExporter.exportToExcel(records, sName);
        });

        btnStageManualEntry.addEventListener('click', () => {
            openAddModal(currentStage);
        });

        // Search Input
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderDashboard();
        });

        // Date Inputs change & input events
        filterFromDate.addEventListener('change', (e) => {
            currentFromDate = e.target.value;
            renderDashboard();
        });
        filterFromDate.addEventListener('input', (e) => {
            currentFromDate = e.target.value;
            renderDashboard();
        });

        filterToDate.addEventListener('change', (e) => {
            currentToDate = e.target.value;
            renderDashboard();
        });
        filterToDate.addEventListener('input', (e) => {
            currentToDate = e.target.value;
            renderDashboard();
        });

        if (btnApplyDateFilter) {
            btnApplyDateFilter.addEventListener('click', () => {
                currentFromDate = filterFromDate.value;
                currentToDate = filterToDate.value;
                renderDashboard();
            });
        }

        // Reset Filters
        btnResetFilters.addEventListener('click', () => {
            searchInput.value = '';
            filterFromDate.value = '';
            filterToDate.value = '';
            currentSearch = '';
            currentFromDate = '';
            currentToDate = '';

            document.querySelectorAll('.stage-tab').forEach(t => t.classList.remove('active'));
            const allTab = document.querySelector('.stage-tab[data-stage="all"]');
            if (allTab) allTab.classList.add('active');
            currentStage = 'all';

            updateStageWindowHeader();
            renderDashboard();
        });

        // Reset Data
        btnResetData.addEventListener('click', () => {
            if (confirm('Clear workspace data?')) {
                dataStore.resetToDefault();
                updateStageBadgeCounts();
                renderDashboard();
            }
        });

        // Print Report
        btnPrintReport.addEventListener('click', () => {
            const records = getFilteredRecords();
            const metrics = dataStore.getSummaryMetrics(records);
            const sName = currentStage === 'all' ? 'All Stages' : (STAGES[currentStage] ? STAGES[currentStage].name : currentStage);
            QualityExporter.printQualityReport(records, metrics, sName);
        });

        // Header Add Manual Entry Button
        btnOpenAddModal.addEventListener('click', () => {
            openAddModal(currentStage);
        });

        btnCloseModal.addEventListener('click', closeModal);
        btnCancelModal.addEventListener('click', closeModal);

        // Upload Modal Listeners
        btnCloseUploadModal.addEventListener('click', closeUploadModal);
        btnCancelUploadModal.addEventListener('click', closeUploadModal);

        btnSelectCSVFile.addEventListener('click', () => {
            csvFileInput.click();
        });

        csvFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                selectedFileForImport = e.target.files[0];
                selectedFileName.textContent = `Selected: ${selectedFileForImport.name}`;
            }
        });

        btnDownloadTemplate.addEventListener('click', () => {
            const sKey = currentStage === 'all' ? 'inprocess' : currentStage;
            QualityExporter.downloadStageTemplateExcel(sKey);
        });

        btnProcessUpload.addEventListener('click', () => {
            if (!selectedFileForImport) {
                alert('Please select an Excel (.xlsx, .xls) or CSV file first.');
                return;
            }

            QualityExporter.parseExcelFile(selectedFileForImport, currentStage, (parsedRecords) => {
                if (parsedRecords && parsedRecords.length > 0) {
                    const count = dataStore.importRecords(parsedRecords);
                    alert(`Successfully imported ${count} inspection records!`);
                    closeUploadModal();
                    updateStageBadgeCounts();
                    renderDashboard();
                } else {
                    alert('No valid inspection records found in the uploaded file.');
                }
            });
        });

        // Auto calculate accepted Qty on form inputs
        const calculateAccepted = () => {
            const prod = Number(formProductionQty.value) || 0;
            const rew = Number(formReworkQty.value) || 0;
            const rej = Number(formRejectionQty.value) || 0;
            if (prod > 0) {
                formAcceptedQty.value = Math.max(0, prod - rew - rej);
            }
        };

        formProductionQty.addEventListener('input', calculateAccepted);
        formReworkQty.addEventListener('input', calculateAccepted);
        formRejectionQty.addEventListener('input', calculateAccepted);

        // Form Submit
        recordForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isEdit = formRecordId.value !== '';
            const targetStageKey = currentStage === 'all' ? 'inprocess' : currentStage;

            const recordData = {
                date: formDate.value || new Date().toISOString().split('T')[0],
                stage: targetStageKey,
                stageLabel: STAGES[targetStageKey] ? STAGES[targetStageKey].name : targetStageKey,
                partNo: formPartNo.value,
                productionQty: Number(formProductionQty.value) || 0,
                acceptedQty: Number(formAcceptedQty.value) || 0,
                reworkQty: Number(formReworkQty.value) || 0,
                reworkReason: formReworkReason.value || 'None',
                rejectionQty: Number(formRejectionQty.value) || 0,
                rejectionReason: formRejectionReason.value || 'None'
            };

            if (isEdit) {
                dataStore.updateRecord(formRecordId.value, recordData);
            } else {
                dataStore.addRecord(recordData);
            }

            closeModal();
            updateStageBadgeCounts();
            renderDashboard();
        });
    }

    function openAddModal(stageKey = 'inprocess') {
        const sKey = stageKey === 'all' ? 'inprocess' : stageKey;
        const stageName = STAGES[sKey] ? STAGES[sKey].name : sKey;
        modalTitle.textContent = `Manual Data Entry - ${stageName}`;
        recordForm.reset();
        formRecordId.value = '';
        formDate.value = new Date().toISOString().split('T')[0];
        recordModal.classList.add('active');
    }

    function openEditModal(id) {
        const record = dataStore.getAllRecords().find(r => r.id === id);
        if (!record) return;

        modalTitle.textContent = `Edit Entry ${record.id}`;
        formRecordId.value = record.id;
        formDate.value = record.date || new Date().toISOString().split('T')[0];
        formPartNo.value = record.partNo || '';
        formProductionQty.value = record.productionQty || 0;
        formAcceptedQty.value = record.acceptedQty || 0;
        formReworkQty.value = record.reworkQty || 0;
        formReworkReason.value = record.reworkReason || '';
        formRejectionQty.value = record.rejectionQty || 0;
        formRejectionReason.value = record.rejectionReason || '';

        recordModal.classList.add('active');
    }

    function openUploadModalForStage(stageKey) {
        const stageName = STAGES[stageKey] ? STAGES[stageKey].name : 'Quality Window';
        uploadModalTitle.textContent = `Upload Excel / CSV Sheet for ${stageName}`;
        uploadModalDesc.innerHTML = `
            Upload an Excel spreadsheet (.xlsx, .xls) or CSV file for <strong>${stageName}</strong>.<br>
            Header columns: <code>Date, Part Number, Production Qty, Accepted Qty, Rework Qty, Reason for Rework, Rejection Qty, Reason for Rejection</code>
        `;
        uploadModal.classList.add('active');
    }

    function closeModal() {
        recordModal.classList.remove('active');
    }

    function closeUploadModal() {
        uploadModal.classList.remove('active');
        selectedFileForImport = null;
        selectedFileName.textContent = '';
        csvFileInput.value = '';
    }

    init();
});
