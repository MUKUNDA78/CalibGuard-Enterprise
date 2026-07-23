/**
 * Quality Team & Production Rejection/Rework Monitor Application Logic
 * Permanent Data Protection - Never Overwrite User-Uploaded Data
 */

// Application State
const state = {
  logs: [],
  currentUser: null,
  searchQueries: {
    inprocess: '',
    final: '',
    mpi: '',
    heattreat: '',
    vendor: '',
    customer: '',
    logs: ''
  },
  rejectionReasons: [
    'Dimensional Out of Spec',
    'Vendor Machining Deviation',
    'Material Porosity / Cast Void',
    'MPI Surface Crack',
    'Heat Treat Hardness Out of Range',
    'NPD / Pilot Sample Trial Defect',
    'Non-Moving Obsolete Scrap',
    'Heat Treat Distortion',
    'Tooling Marks / Scratches',
    'Thread Damage / Burrs',
    'Customer Spec Mismatch'
  ],
  reworkReasons: [
    'Vendor Re-machining Correction',
    'Oversize Machining (Re-turn/Grind)',
    'Surface Rust / Degreasing Clean',
    'Thread Chasing & Deburring',
    'Hardness Tempering Adjustment',
    'NPD Trial Re-work Polishing'
  ],
  capaItems: [
    { id: 'CAPA-101', reason: 'Vendor Machining Deviation', stage: 'Vendor Returns', rootCause: 'Outsourced CNC supplier precision drift on bore tolerance', action: 'Issue Supplier Corrective Action Notice (SCAN) & 100% incoming audit', owner: 'Sarah Lin / Vendor QA', status: 'In-Progress' },
    { id: 'CAPA-102', reason: 'Material Porosity / Cast Void', stage: 'Material Defect', rootCause: 'Raw material foundry casting mold degassing temperature drop', action: 'Enforce foundry mill test cert check & ultrasonic thickness check', owner: 'Marcus Vance', status: 'Closed' },
    { id: 'CAPA-103', reason: 'NPD / Pilot Sample Trial Defect', stage: 'NPD / Dev', rootCause: 'First article tooling fixture alignment discrepancy during pilot run', action: 'Modify NPD CAD fixture design and validate 50-piece prototype run', owner: 'Alex Johnson / R&D', status: 'In-Progress' },
    { id: 'CAPA-104', reason: 'MPI Surface Crack', stage: 'MPI', rootCause: 'Thermal shock during quenching step in heat treatment line #2', action: 'Standardize oil bath quench temperature controls to 60-70°C', owner: 'Priya Sharma', status: 'In-Progress' },
    { id: 'CAPA-105', reason: 'Customer Spec Mismatch', stage: 'Customer Returns', rootCause: 'Outdated revision drawing (Rev B instead of Rev C) in packaging area', action: 'Digital SOP display deployment at final packaging stations', owner: 'Customer QA Lead', status: 'In-Progress' }
  ],
  filters: {
    startDate: '',
    endDate: '',
    shift: 'all'
  },
  charts: {}
};

const MASTER_KEY = 'quality_monitor_master_logs';
const USER_DATA_KEY = 'quality_monitor_user_uploaded_data';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  loadData();
  setupEventListeners();
  initDateFilters();
  renderAll();
});

// Authentication System
function checkAuthStatus() {
  let authUser = localStorage.getItem('quality_app_auth_user');
  if (!authUser) {
    authUser = 'Mukund';
    localStorage.setItem('quality_app_auth_user', 'Mukund');
  }
  state.currentUser = authUser;
  const modalEl = document.getElementById('login-modal-overlay');
  if (modalEl) modalEl.classList.remove('active');
  const userDisp = document.getElementById('user-display-name');
  if (userDisp) userDisp.innerHTML = `<i class="fas fa-user-circle"></i> ${authUser}`;
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const userVal = document.getElementById('login-username').value.trim();
  const passVal = document.getElementById('login-password').value.trim();
  const errorMsg = document.getElementById('login-error-msg');

  if (userVal.toLowerCase() === 'mukund' && passVal === 'Tejas') {
    localStorage.setItem('quality_app_auth_user', 'Mukund');
    state.currentUser = 'Mukund';
    if (errorMsg) errorMsg.style.display = 'none';
    const modalEl = document.getElementById('login-modal-overlay');
    if (modalEl) modalEl.classList.remove('active');
    const userDisp = document.getElementById('user-display-name');
    if (userDisp) userDisp.innerHTML = `<i class="fas fa-user-circle"></i> Mukund`;
    alert('Welcome Mukund! Authentication successful.');
  } else {
    if (errorMsg) {
      errorMsg.style.display = 'block';
      errorMsg.innerText = 'Invalid Username or Password! (Hint: Username: Mukund / Password: Tejas)';
    }
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('quality_app_auth_user');
    state.currentUser = null;
    document.getElementById('login-modal-overlay').classList.add('active');
  }
}

// Robust Multi-Tier Data Recovery Engine - Unifies all keys
function loadData() {
  const allKeys = [
    USER_DATA_KEY,
    MASTER_KEY,
    'quality_monitor_logs_v13',
    'quality_monitor_logs_v12',
    'quality_monitor_logs_v11',
    'quality_monitor_logs_v10',
    'quality_monitor_logs_v9',
    'quality_monitor_logs_v8',
    'quality_monitor_logs_v7',
    'quality_monitor_logs_v6'
  ];

  const loadedLogsMap = new Map();

  allKeys.forEach(k => {
    const val = localStorage.getItem(k);
    if (val) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (item && item.id) {
              if (!loadedLogsMap.has(item.id)) {
                loadedLogsMap.set(item.id, item);
              }
            }
          });
        }
      } catch (e) {
        console.error(`Error reading ${k}:`, e);
      }
    }
  });

  let loadedLogs = Array.from(loadedLogsMap.values());

  // If no logs found in any storage key, generate default seed demo data
  if (loadedLogs.length === 0) {
    generateSeedData();
    return;
  }

  // Auto-normalize legacy records to ensure category tags match
  loadedLogs.forEach(l => {
    if (l.primaryReworkReason === 'General Rework') {
      l.primaryReworkReason = '';
    }
    if (l.notes) {
      const n = l.notes.toLowerCase();
      if ((n.includes('in process') || n.includes('in-process') || n.includes('process')) && !n.includes('inprocess')) {
        l.notes += ' inprocess';
      }
      if ((n.includes('final qa') || n.includes('final inspection')) && !n.includes('final')) {
        l.notes += ' final';
      }
    }
  });

  state.logs = loadedLogs;
  saveData(false);
}

function saveData(notify = true) {
  try {
    const serialized = JSON.stringify(state.logs);
    localStorage.setItem(MASTER_KEY, serialized);
    localStorage.setItem(USER_DATA_KEY, serialized);
    // Also update legacy keys so all keys stay synchronized
    localStorage.setItem('quality_monitor_logs_v13', serialized);
    if (notify) {
      const nowTime = new Date().toLocaleTimeString();
      alert(`💾 Data Saved Permanently at ${nowTime}!\n\nTotal quality records stored in database: ${state.logs.length}`);
    }
  } catch (err) {
    console.error('Failed to save data to disk:', err);
    if (notify) alert('Failed to save data. Storage quota exceeded.');
  }
}

// Function to explicitly Clear All Data
function clearAllData() {
  if (confirm('Are you sure you want to CLEAR ALL present data? This will give you a blank clean slate to upload your Excel sheets.')) {
    state.logs = [];
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(MASTER_KEY);
    state.filters.startDate = '';
    state.filters.endDate = '';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    renderAll();
    alert('All present data cleared! Ready for your Excel uploads.');
  }
}

// Generate Sample Data for Demo
function generateSeedData() {
  const logs = [];
  const today = new Date();
  const shifts = ['Shift A', 'Shift B', 'Shift C'];
  const parts = [
    'PART-1001 (Gear Shaft)',
    'PART-1002 (Flange Hub)',
    'PART-1003 (Pinion Housing)',
    'PART-1004 (Axle Spindle)',
    'NPD-5001 (Prototype EV Shaft)'
  ];

  for (let i = 29; i >= 0; i--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - i);
    const dateStr = dateObj.toISOString().split('T')[0];

    shifts.forEach((shift, shiftIdx) => {
      const prodQty = Math.floor(850 + Math.random() * 400);
      const inProcessRej = Math.floor(10 + Math.random() * 15);
      const finalRej = Math.floor(4 + Math.random() * 8);
      const mpiRej = Math.floor(3 + Math.random() * 7);
      const htRej = Math.floor(3 + Math.random() * 6);
      const custRet = Math.random() > 0.7 ? Math.floor(1 + Math.random() * 3) : 0;
      const vendorMachiningRej = Math.floor(4 + Math.random() * 9);
      const materialDefectRej = Math.floor(3 + Math.random() * 8);
      const nonMovingScrapRej = Math.random() > 0.6 ? Math.floor(2 + Math.random() * 5) : 0;
      const npdDevRej = Math.random() > 0.5 ? Math.floor(2 + Math.random() * 6) : 0;

      const totalRej = inProcessRej + finalRej + mpiRej + htRej + custRet + vendorMachiningRej + materialDefectRej + nonMovingScrapRej + npdDevRej;
      const reworkQty = Math.floor(14 + Math.random() * 18);
      const reworkRecovered = Math.floor(reworkQty * (0.84 + Math.random() * 0.1));

      const inspectorNames = ['Mukund', 'Priya Sharma', 'Marcus Vance', 'Sarah Lin'];
      const inspector = inspectorNames[shiftIdx % inspectorNames.length];
      const part = parts[(i + shiftIdx) % parts.length];

      const topRejReason = state.rejectionReasons[Math.floor(Math.random() * 6)];
      const topReworkReason = state.reworkReasons[Math.floor(Math.random() * 4)];

      logs.push({
        id: `LOG-${dateStr}-${shift.replace(' ', '')}`,
        date: dateStr,
        shift: shift,
        inspectorName: inspector,
        partNumber: part,
        productionQty: prodQty,
        inProcessRejection: inProcessRej,
        finalRejection: finalRej,
        mpiRejection: mpiRej,
        heatTreatRejection: htRej,
        customerReturns: custRet,
        vendorMachiningRejection: vendorMachiningRej,
        materialDefect: materialDefectRej,
        nonMovingScrap: nonMovingScrapRej,
        npdDevelopmentRejection: npdDevRej,
        totalRejection: totalRej,
        reworkQty: reworkQty,
        reworkRecovered: reworkRecovered,
        primaryRejectionReason: topRejReason,
        primaryReworkReason: topReworkReason,
        notes: `Quality audit log for ${shift}.`
      });
    });
  }

  state.logs = logs;
  saveData(false);
}

function setupEventListeners() {
  document.getElementById('login-form').addEventListener('submit', handleLoginSubmit);
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-save-data').addEventListener('click', () => saveData(true));

  document.getElementById('btn-show-all-dates').addEventListener('click', () => {
    state.filters.startDate = '';
    state.filters.endDate = '';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    renderAll();
  });

  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetView = e.currentTarget.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
      
      e.currentTarget.classList.add('active');
      document.getElementById(`${targetView}-view`).classList.add('active');
      
      setTimeout(() => {
        Object.values(state.charts).forEach(chart => chart && chart.resize());
      }, 50);
    });
  });

  document.getElementById('shift-filter').addEventListener('change', (e) => {
    state.filters.shift = e.target.value;
    renderAll();
  });

  document.getElementById('start-date').addEventListener('change', (e) => {
    state.filters.startDate = e.target.value;
    renderAll();
  });

  document.getElementById('end-date').addEventListener('change', (e) => {
    state.filters.endDate = e.target.value;
    renderAll();
  });

  // Attach Real-Time Search Listeners for Each Window
  const searchInputs = ['inprocess', 'final', 'mpi', 'heattreat', 'vendor', 'customer', 'logs'];
  searchInputs.forEach(key => {
    const inputEl = document.getElementById(`search-${key}`);
    if (inputEl) {
      inputEl.addEventListener('input', (e) => {
        state.searchQueries[key] = e.target.value.toLowerCase().trim();
        renderAll();
      });
    }
  });

  document.getElementById('btn-add-log').addEventListener('click', () => openAddModal('auto'));
  document.getElementById('btn-upload-excel').addEventListener('click', () => openExcelModal('auto'));
  document.getElementById('btn-clear-all').addEventListener('click', clearAllData);

  document.getElementById('btn-seed-data').addEventListener('click', () => {
    if (confirm('Load sample demo dataset?')) {
      generateSeedData();
      initDateFilters();
      renderAll();
    }
  });
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('excel-modal-close').addEventListener('click', closeExcelModal);
  document.getElementById('excel-modal-cancel').addEventListener('click', closeExcelModal);

  document.getElementById('quality-form').addEventListener('submit', handleFormSubmit);

  const fileInput = document.getElementById('excel-file-input');
  const dropzone = document.getElementById('dropzone');

  dropzone.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleExcelFile(e.dataTransfer.files[0]);
      fileInput.value = '';
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length) {
      handleExcelFile(e.target.files[0]);
      fileInput.value = '';
    }
  });
}

function initDateFilters() {
  const dates = state.logs.map(l => l.date).filter(Boolean).sort();
  if (dates.length) {
    state.filters.startDate = dates[0];
    state.filters.endDate = dates[dates.length - 1];
    document.getElementById('start-date').value = state.filters.startDate;
    document.getElementById('end-date').value = state.filters.endDate;
  } else {
    state.filters.startDate = '';
    state.filters.endDate = '';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
  }
}

function updateDateFiltersForImportedData(importedDates) {
  if (!importedDates || !importedDates.length) return;
  const sortedImported = importedDates.filter(Boolean).sort();
  const minImport = sortedImported[0];
  const maxImport = sortedImported[sortedImported.length - 1];

  if (!state.filters.startDate || minImport < state.filters.startDate) {
    state.filters.startDate = minImport;
    document.getElementById('start-date').value = minImport;
  }
  if (!state.filters.endDate || maxImport > state.filters.endDate) {
    state.filters.endDate = maxImport;
    document.getElementById('end-date').value = maxImport;
  }
}

function getFilteredLogs() {
  return state.logs.filter(log => {
    if (state.filters.startDate && log.date < state.filters.startDate) return false;
    if (state.filters.endDate && log.date > state.filters.endDate) return false;
    if (state.filters.shift !== 'all' && log.shift !== state.filters.shift) return false;
    return true;
  });
}

function getAggregatedData() {
  const filtered = getFilteredLogs();
  const groups = {};

  filtered.forEach(log => {
    const key = log.date;

    if (!groups[key]) {
      groups[key] = {
        period: key,
        productionQty: 0,
        inProcessRejection: 0,
        finalRejection: 0,
        mpiRejection: 0,
        heatTreatRejection: 0,
        customerReturns: 0,
        vendorMachiningRejection: 0,
        materialDefect: 0,
        nonMovingScrap: 0,
        npdDevelopmentRejection: 0,
        totalRejection: 0,
        reworkQty: 0,
        reworkRecovered: 0
      };
    }

    const g = groups[key];
    g.productionQty += log.productionQty;
    g.inProcessRejection += log.inProcessRejection;
    g.finalRejection += log.finalRejection;
    g.mpiRejection += log.mpiRejection;
    g.heatTreatRejection += log.heatTreatRejection;
    g.customerReturns += log.customerReturns;
    g.vendorMachiningRejection += (log.vendorMachiningRejection || 0);
    g.materialDefect += (log.materialDefect || 0);
    g.nonMovingScrap += (log.nonMovingScrap || 0);
    g.npdDevelopmentRejection += (log.npdDevelopmentRejection || 0);
    g.totalRejection += log.totalRejection;
    g.reworkQty += log.reworkQty;
    g.reworkRecovered += log.reworkRecovered;
  });

  return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
}

// Master Render Pipeline
function renderAll() {
  const aggregated = getAggregatedData();
  const filteredLogs = getFilteredLogs();

  renderKpis(filteredLogs);
  renderCharts(aggregated, filteredLogs);
  renderTop5ParetoTables(filteredLogs);
  
  renderInProcessWindow(filteredLogs);
  renderFinalWindow(filteredLogs);
  renderMpiWindow(filteredLogs);
  renderHeatTreatWindow(filteredLogs);
  renderVendorWindow(filteredLogs);
  renderCustomerWindow(filteredLogs);

  renderLogsTable(filteredLogs);
  renderCapaTable();
}

function renderKpis(filteredLogs) {
  let totalProd = 0, totalInProcess = 0, totalFinal = 0, totalMPI = 0, totalHT = 0, totalCustRet = 0;
  let totalVendor = 0, totalMatDef = 0, totalNonMove = 0, totalNPD = 0;
  let totalRej = 0, totalRework = 0, totalReworkRecovered = 0;

  filteredLogs.forEach(l => {
    totalProd += l.productionQty;
    totalInProcess += l.inProcessRejection;
    totalFinal += l.finalRejection;
    totalMPI += l.mpiRejection;
    totalHT += l.heatTreatRejection;
    totalCustRet += l.customerReturns;
    totalVendor += (l.vendorMachiningRejection || 0);
    totalMatDef += (l.materialDefect || 0);
    totalNonMove += (l.nonMovingScrap || 0);
    totalNPD += (l.npdDevelopmentRejection || 0);
    totalRej += l.totalRejection;
    totalRework += l.reworkQty;
    totalReworkRecovered += l.reworkRecovered;
  });

  const scrapRate = totalProd > 0 ? ((totalRej / totalProd) * 100).toFixed(2) : '0.00';
  const ppm = totalProd > 0 ? Math.round((totalRej / totalProd) * 1000000) : 0;
  const reworkYield = totalRework > 0 ? ((totalReworkRecovered / totalRework) * 100).toFixed(1) : '0.0';
  const fpy = totalProd > 0 ? (((totalProd - totalRej) / totalProd) * 100).toFixed(1) : '100.0';

  document.getElementById('kpi-production').innerText = totalProd.toLocaleString();
  document.getElementById('kpi-scrap-rate').innerText = `${scrapRate}%`;
  document.getElementById('kpi-ppm').innerText = `${ppm.toLocaleString()} PPM`;
  document.getElementById('kpi-rework').innerText = totalRework.toLocaleString();
  document.getElementById('kpi-rework-yield').innerText = `${reworkYield}% Rec.`;
  document.getElementById('kpi-vendor-mat').innerText = `${totalVendor}`;
  document.getElementById('kpi-vendor-mat-sub').innerText = `Vendor Machining Defect`;
  document.getElementById('kpi-cust-ret').innerText = `${totalCustRet}`;
  document.getElementById('kpi-fpy').innerText = `${fpy}%`;
}

function renderCharts(aggregated, filteredLogs) {
  const periods = aggregated.map(a => a.period);

  renderProductionRejectionChart(periods, aggregated);
  renderStageShareChart(filteredLogs);
  renderParetoRejectionChart(filteredLogs);
  renderTopReworkChart(filteredLogs);
}

function renderProductionRejectionChart(labels, data) {
  const ctx = document.getElementById('chart-prod-rej').getContext('2d');
  if (state.charts.prodRej) state.charts.prodRej.destroy();

  state.charts.prodRej = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Production Qty',
          data: data.map(d => d.productionQty),
          backgroundColor: 'rgba(225, 29, 72, 0.18)',
          borderColor: '#e11d48',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Total Rejection Qty',
          data: data.map(d => d.totalRejection),
          type: 'line',
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          borderWidth: 2.5,
          pointRadius: 4,
          tension: 0.3,
          yAxisID: 'y1'
        },
        {
          label: 'Rework Qty',
          data: data.map(d => d.reworkQty),
          type: 'line',
          borderColor: '#d97706',
          backgroundColor: '#d97706',
          borderWidth: 2,
          pointRadius: 3,
          borderDash: [4, 4],
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#4c0519', font: { size: 12, weight: 'bold' } } }
      },
      scales: {
        x: { ticks: { color: '#9f1239', font: { weight: 'bold' } }, grid: { color: '#fecdd3' } },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Production Units', color: '#be123c' },
          ticks: { color: '#be123c' },
          grid: { color: '#fecdd3' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Rejection / Rework Units', color: '#dc2626' },
          ticks: { color: '#dc2626' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function renderStageShareChart(filteredLogs) {
  const ctx = document.getElementById('chart-stage-share').getContext('2d');
  if (state.charts.stageShare) state.charts.stageShare.destroy();

  let inProcess = 0, final = 0, mpi = 0, ht = 0, cust = 0;
  let vendor = 0, matDef = 0, nonMove = 0, npd = 0;

  filteredLogs.forEach(l => {
    inProcess += l.inProcessRejection;
    final += l.finalRejection;
    mpi += l.mpiRejection;
    ht += l.heatTreatRejection;
    cust += l.customerReturns;
    vendor += (l.vendorMachiningRejection || 0);
    matDef += (l.materialDefect || 0);
    nonMove += (l.nonMovingScrap || 0);
    npd += (l.npdDevelopmentRejection || 0);
  });

  state.charts.stageShare = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['In-Process', 'Final QA', 'MPI (NDT)', 'Heat Treat', 'Customer Returns', 'Machining Vendor', 'Material Defect', 'Non-Moving Parts', 'NPD / Dev'],
      datasets: [{
        data: [inProcess, final, mpi, ht, cust, vendor, matDef, nonMove, npd],
        backgroundColor: ['#2563eb', '#d97706', '#7c3aed', '#dc2626', '#db2777', '#0284c7', '#ea580c', '#475569', '#c026d3'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#4c0519', font: { size: 11, weight: 'bold' } } }
      },
      cutout: '62%'
    }
  });
}

function renderParetoRejectionChart(filteredLogs) {
  const ctx = document.getElementById('chart-pareto-rejection').getContext('2d');
  if (state.charts.paretoRej) state.charts.paretoRej.destroy();

  const reasonMap = {};
  filteredLogs.forEach(l => {
    if (l.totalRejection > 0 && l.primaryRejectionReason && l.primaryRejectionReason !== 'None') {
      const r = l.primaryRejectionReason;
      reasonMap[r] = (reasonMap[r] || 0) + l.totalRejection;
    }
  });

  const sorted = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]);
  const top5 = sorted.slice(0, 5);
  
  const labels = top5.map(item => item[0]);
  const counts = top5.map(item => item[1]);

  const totalTop5Sum = counts.reduce((acc, c) => acc + c, 0);
  let cumulative = 0;
  const cumulativePercentages = counts.map(c => {
    cumulative += c;
    return totalTop5Sum > 0 ? parseFloat(((cumulative / totalTop5Sum) * 100).toFixed(1)) : 0;
  });

  state.charts.paretoRej = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No Rejections'],
      datasets: [
        {
          label: 'Rejection Count',
          data: counts.length ? counts : [0],
          backgroundColor: '#e11d48',
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Cumulative % (80/20 Rule)',
          data: cumulativePercentages.length ? cumulativePercentages : [0],
          type: 'line',
          borderColor: '#d97706',
          backgroundColor: '#d97706',
          borderWidth: 2.5,
          pointRadius: 5,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#4c0519', font: { weight: 'bold' } } }
      },
      scales: {
        x: { ticks: { color: '#9f1239', font: { size: 10, weight: 'bold' } }, grid: { color: '#fecdd3' } },
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Defect Qty', color: '#e11d48' },
          ticks: { color: '#be123c' },
          grid: { color: '#fecdd3' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 100,
          title: { display: true, text: 'Cumulative %', color: '#d97706' },
          ticks: { color: '#d97706', callback: value => `${value}%` },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function renderTopReworkChart(filteredLogs) {
  const ctx = document.getElementById('chart-rework-reasons').getContext('2d');
  if (state.charts.reworkChart) state.charts.reworkChart.destroy();

  const reworkMap = {};
  filteredLogs.forEach(l => {
    if (l.primaryReworkReason && l.primaryReworkReason !== 'None' && l.primaryReworkReason !== 'General Rework') {
      const r = l.primaryReworkReason;
      reworkMap[r] = (reworkMap[r] || 0) + (l.reworkQty || 1);
    }
  });

  const sorted = Object.entries(reworkMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  state.charts.reworkChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.length ? sorted.map(s => s[0]) : ['No Rework'],
      datasets: [{
        label: 'Rework Qty',
        data: sorted.length ? sorted.map(s => s[1]) : [0],
        backgroundColor: '#7c3aed',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#4c0519', font: { weight: 'bold' } } }
      },
      scales: {
        x: { ticks: { color: '#be123c' }, grid: { color: '#fecdd3' } },
        y: { ticks: { color: '#4c0519', font: { weight: 'bold' } } }
      }
    }
  });
}

// Stage Table Renderer - Respective Window Only
function renderStageWindowTable(tbodyId, logs, rejKey, kpiTotalId, kpiScrapId, searchKey, kpiInspectedId, categoryName) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';

  let totalRej = 0;
  let totalInspected = 0;

  const query = state.searchQueries[searchKey] || '';
  
  // Filter logs for THIS RESPECTIVE WINDOW ONLY
  const windowLogs = logs.filter(log => {
    const hasRej = (log[rejKey] || 0) > 0;
    const cleanCategory = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNotes = (log.notes || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let isCategoryImport = cleanNotes.includes(cleanCategory);
    if (cleanCategory === 'inprocess') {
      isCategoryImport = isCategoryImport || cleanNotes.includes('process') || cleanNotes.includes('inproc');
    }
    if (cleanCategory === 'final') {
      isCategoryImport = isCategoryImport || cleanNotes.includes('final') || cleanNotes.includes('fqc') || cleanNotes.includes('inspection');
    }

    return hasRej || isCategoryImport;
  });

  const filtered = windowLogs.filter(log => {
    if (!query) return true;
    const partMatch = log.partNumber.toLowerCase().includes(query);
    const rejReasonMatch = (log.primaryRejectionReason || '').toLowerCase().includes(query);
    const reworkReasonMatch = (log.primaryReworkReason || '').toLowerCase().includes(query);
    const inspectorMatch = (log.inspectorName || '').toLowerCase().includes(query);
    return partMatch || rejReasonMatch || reworkReasonMatch || inspectorMatch;
  });

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:2rem;">No records found for ${categoryName} window ${query ? 'matching query "' + query + '"' : ''}</td></tr>`;
    if (kpiInspectedId) document.getElementById(kpiInspectedId).innerText = '0';
    if (kpiTotalId) document.getElementById(kpiTotalId).innerText = '0';
    if (kpiScrapId) document.getElementById(kpiScrapId).innerText = '0.00%';
    return;
  }

  sorted.forEach(log => {
    const rQty = log[rejKey] || 0;
    totalRej += rQty;
    totalInspected += log.productionQty;
    
    const acceptedQty = Math.max(0, log.productionQty - rQty);
    const rejPct = log.productionQty > 0 ? ((rQty / log.productionQty) * 100).toFixed(2) : '0.00';
    
    const reworkQty = log.reworkQty || 0;
    const reworkPct = log.productionQty > 0 ? ((reworkQty / log.productionQty) * 100).toFixed(2) : '0.00';

    const rejReasonText = (log.primaryRejectionReason && log.primaryRejectionReason !== 'None') 
      ? log.primaryRejectionReason 
      : (rQty > 0 ? 'Unclassified' : '-');

    const reworkReasonText = (log.primaryReworkReason && log.primaryReworkReason !== 'None' && log.primaryReworkReason !== 'General Rework')
      ? log.primaryReworkReason
      : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${log.date}</td>
      <td><strong>${log.partNumber}</strong></td>
      <td>${log.productionQty.toLocaleString()}</td>
      <td><span style="color:#059669; font-weight:700;">${acceptedQty.toLocaleString()}</span></td>
      <td><strong style="color:${rQty > 0 ? '#dc2626' : '#475569'}">${rQty.toLocaleString()}</strong></td>
      <td><span class="badge" style="background:${rQty > 0 ? '#ffe4e6' : '#f1f5f9'}; color:${rQty > 0 ? '#be123c' : '#475569'};">${rejPct}%</span></td>
      <td><span style="color:${rQty > 0 ? '#4c0519' : '#94a3b8'}; font-weight:600;">${rejReasonText}</span></td>
      <td><span style="color:${reworkQty > 0 ? '#7c3aed' : '#475569'}; font-weight:700;">${reworkQty}</span></td>
      <td>${reworkPct}%</td>
      <td><span style="font-size:0.8rem; color:${reworkReasonText !== '-' ? '#9f1239' : '#94a3b8'}; font-weight:600;">${reworkReasonText}</span></td>
    `;
    tbody.appendChild(tr);
  });

  if (kpiInspectedId) document.getElementById(kpiInspectedId).innerText = totalInspected.toLocaleString();
  if (kpiTotalId) document.getElementById(kpiTotalId).innerText = totalRej.toLocaleString();
  if (kpiScrapId) {
    const scrapPct = totalInspected > 0 ? ((totalRej / totalInspected) * 100).toFixed(2) : '0.00';
    document.getElementById(kpiScrapId).innerText = `${scrapPct}%`;
  }
}

function renderInProcessWindow(filteredLogs) {
  renderStageWindowTable('tbody-inprocess', filteredLogs, 'inProcessRejection', 'inproc-total', 'inproc-scrap-rate', 'inprocess', 'inproc-inspected', 'inprocess');
}

function renderFinalWindow(filteredLogs) {
  renderStageWindowTable('tbody-final', filteredLogs, 'finalRejection', 'final-total', 'final-scrap-rate', 'final', 'final-inspected', 'final');
}

function renderMpiWindow(filteredLogs) {
  renderStageWindowTable('tbody-mpi', filteredLogs, 'mpiRejection', 'mpi-total', 'mpi-scrap-rate', 'mpi', 'mpi-inspected', 'mpi');
}

function renderHeatTreatWindow(filteredLogs) {
  renderStageWindowTable('tbody-heattreat', filteredLogs, 'heatTreatRejection', 'ht-total', 'ht-scrap-rate', 'heattreat', 'ht-inspected', 'heattreat');
}

function renderVendorWindow(filteredLogs) {
  let totalVendorRej = 0;
  let totalProd = 0;
  const vendorPartMap = {};

  const query = state.searchQueries.vendor || '';

  const windowLogs = filteredLogs.filter(l => (l.vendorMachiningRejection || 0) > 0 || (l.notes && l.notes.toLowerCase().includes('vendor')));

  const searchedLogs = windowLogs.filter(log => {
    if (!query) return true;
    const partMatch = log.partNumber.toLowerCase().includes(query);
    const rejReasonMatch = (log.primaryRejectionReason || '').toLowerCase().includes(query);
    return partMatch || rejReasonMatch;
  });

  searchedLogs.forEach(l => {
    const vRej = l.vendorMachiningRejection || 0;
    totalVendorRej += vRej;
    totalProd += l.productionQty;

    if (vRej > 0) {
      if (!vendorPartMap[l.partNumber]) {
        vendorPartMap[l.partNumber] = { part: l.partNumber, rejQty: 0, prodQty: 0, reason: l.primaryRejectionReason, date: l.date };
      }
      vendorPartMap[l.partNumber].rejQty += vRej;
      vendorPartMap[l.partNumber].prodQty += l.productionQty;
    }
  });

  const vendorPpm = totalProd > 0 ? Math.round((totalVendorRej / totalProd) * 1000000) : 0;
  const vendorScrapPct = totalProd > 0 ? ((totalVendorRej / totalProd) * 100).toFixed(2) : '0.00';

  document.getElementById('vendor-total-rej').innerText = totalVendorRej.toLocaleString();
  document.getElementById('vendor-ppm').innerText = `${vendorPpm.toLocaleString()} PPM`;
  document.getElementById('vendor-scrap-rate').innerText = `${vendorScrapPct}%`;

  const tbody = document.getElementById('tbody-vendor');
  tbody.innerHTML = '';

  const vendorItems = Object.values(vendorPartMap).sort((a, b) => b.rejQty - a.rejQty);

  if (!vendorItems.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">${query ? 'No matching vendor records for query "' + query + '"' : 'No Vendor Machining Rejections Recorded'}</td></tr>`;
    return;
  }

  vendorItems.forEach(item => {
    const rejPct = item.prodQty > 0 ? ((item.rejQty / item.prodQty) * 100).toFixed(2) : '0.00';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.date}</td>
      <td><strong>${item.part}</strong></td>
      <td><strong style="color:#0284c7">${item.rejQty.toLocaleString()}</strong></td>
      <td><span style="color:#be123c; font-weight:700;">${item.reason || 'Vendor Machining Deviation'}</span></td>
      <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${rejPct}%</span></td>
      <td><button class="btn btn-sm btn-primary" onclick="openCapaForReason('Vendor Machining Deviation')">View SCAN CAPA</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCustomerWindow(filteredLogs) {
  let totalCustRet = 0;
  let totalProd = 0;
  const custPartMap = {};

  const query = state.searchQueries.customer || '';

  const windowLogs = filteredLogs.filter(l => (l.customerReturns || 0) > 0 || (l.notes && l.notes.toLowerCase().includes('customer')));

  const searchedLogs = windowLogs.filter(log => {
    if (!query) return true;
    const partMatch = log.partNumber.toLowerCase().includes(query);
    const rejReasonMatch = (log.primaryRejectionReason || '').toLowerCase().includes(query);
    return partMatch || rejReasonMatch;
  });

  searchedLogs.forEach(l => {
    const cRet = l.customerReturns || 0;
    totalCustRet += cRet;
    totalProd += l.productionQty;

    if (cRet > 0) {
      if (!custPartMap[l.partNumber]) {
        custPartMap[l.partNumber] = { part: l.partNumber, retQty: 0, prodQty: 0, reason: l.primaryRejectionReason, date: l.date };
      }
      custPartMap[l.partNumber].retQty += cRet;
      custPartMap[l.partNumber].prodQty += l.productionQty;
    }
  });

  const custPpm = totalProd > 0 ? Math.round((totalCustRet / totalProd) * 1000000) : 0;

  document.getElementById('cust-total-ret').innerText = totalCustRet.toLocaleString();
  document.getElementById('cust-ppm').innerText = `${custPpm.toLocaleString()} PPM`;

  const tbody = document.getElementById('tbody-customer');
  tbody.innerHTML = '';

  const custItems = Object.values(custPartMap).sort((a, b) => b.retQty - a.retQty);

  if (!custItems.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">${query ? 'No matching customer return records for query "' + query + '"' : 'No Customer Returns Recorded'}</td></tr>`;
    return;
  }

  custItems.forEach(item => {
    const retPpm = item.prodQty > 0 ? Math.round((item.retQty / item.prodQty) * 1000000) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.date}</td>
      <td><strong>${item.part}</strong></td>
      <td><strong style="color:#db2777">${item.retQty.toLocaleString()}</strong></td>
      <td><span style="color:#be123c; font-weight:700;">${item.reason || 'Customer Spec Mismatch'}</span></td>
      <td><span class="badge" style="background:#fce7f3; color:#be185d;">${retPpm} PPM</span></td>
      <td><button class="btn btn-sm btn-primary" onclick="openCapaForReason('Customer Spec Mismatch')">View 8D Report</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTop5ParetoTables(filteredLogs) {
  const rejMap = {};
  filteredLogs.forEach(l => {
    if (l.totalRejection > 0 && l.primaryRejectionReason && l.primaryRejectionReason !== 'None') {
      const r = l.primaryRejectionReason;
      if (!rejMap[r]) rejMap[r] = { count: 0 };
      rejMap[r].count += l.totalRejection;
    }
  });

  const totalRejCount = Object.values(rejMap).reduce((a, b) => a + b.count, 0);
  const sortedRej = Object.entries(rejMap).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  const rejTbody = document.getElementById('tbody-top5-rejection');
  rejTbody.innerHTML = '';

  let cumulativeSum = 0;

  if (!sortedRej.length) {
    rejTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:1.5rem;">No Rejections Available for Pareto Ranking</td></tr>`;
  } else {
    sortedRej.forEach(([reason, obj], index) => {
      cumulativeSum += obj.count;
      const share = totalRejCount > 0 ? ((obj.count / totalRejCount) * 100).toFixed(1) : '0.0';
      const cumShare = totalRejCount > 0 ? ((cumulativeSum / totalRejCount) * 100).toFixed(1) : '0.0';

      let maxStage = 'In-Process';
      if (reason.includes('Vendor')) maxStage = 'Machining Vendor';
      else if (reason.includes('Material') || reason.includes('Porosity')) maxStage = 'Material Defect';
      else if (reason.includes('NPD') || reason.includes('Trial')) maxStage = 'NPD / Dev';
      else if (reason.includes('MPI')) maxStage = 'MPI (NDT)';
      else if (reason.includes('Heat Treat')) maxStage = 'Heat Treat';
      else if (reason.includes('Customer')) maxStage = 'Customer Returns';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge" style="background:#ffe4e6; color:#be123c;">#${index + 1}</span></td>
        <td><strong>${reason}</strong></td>
        <td><span class="badge badge-vendor">${maxStage}</span></td>
        <td><strong style="color:#e11d48">${obj.count.toLocaleString()}</strong></td>
        <td>${share}%</td>
        <td><strong>${cumShare}%</strong></td>
        <td><button class="btn btn-sm btn-primary" onclick="openCapaForReason('${reason.replace(/'/g, "\\'")}')">View CAPA</button></td>
      `;
      rejTbody.appendChild(tr);
    });
  }

  const reworkMap = {};
  filteredLogs.forEach(l => {
    if (l.primaryReworkReason && l.primaryReworkReason !== 'None' && l.primaryReworkReason !== 'General Rework') {
      const r = l.primaryReworkReason;
      if (!reworkMap[r]) reworkMap[r] = { qty: 0, recovered: 0 };
      reworkMap[r].qty += (l.reworkQty || 1);
      reworkMap[r].recovered += (l.reworkRecovered || Math.floor((l.reworkQty || 1) * 0.85));
    }
  });

  const totalReworkQty = Object.values(reworkMap).reduce((a, b) => a + b.qty, 0);
  const sortedRework = Object.entries(reworkMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);

  const reworkTbody = document.getElementById('tbody-top5-rework');
  reworkTbody.innerHTML = '';

  if (!sortedRework.length) {
    reworkTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:1.5rem;">No Rework Items Logged</td></tr>`;
  } else {
    sortedRework.forEach(([reason, obj], index) => {
      const yieldPct = obj.qty > 0 ? ((obj.recovered / obj.qty) * 100).toFixed(1) : '0.0';
      const share = totalReworkQty > 0 ? ((obj.qty / totalReworkQty) * 100).toFixed(1) : '0.0';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge" style="background:#f3e8ff; color:#6b21a8;">#${index + 1}</span></td>
        <td><strong>${reason}</strong></td>
        <td><strong>${obj.qty.toLocaleString()}</strong></td>
        <td><span style="color:#059669">${obj.recovered.toLocaleString()}</span></td>
        <td><strong style="color:${yieldPct > 85 ? '#059669' : '#d97706'}">${yieldPct}%</strong></td>
        <td>${share}%</td>
      `;
      reworkTbody.appendChild(tr);
    });
  }
}

function renderLogsTable(filteredLogs) {
  const tbody = document.getElementById('tbody-logs');
  tbody.innerHTML = '';

  const query = state.searchQueries.logs || '';

  const searched = filteredLogs.filter(log => {
    if (!query) return true;
    const partMatch = log.partNumber.toLowerCase().includes(query);
    const rejReasonMatch = (log.primaryRejectionReason || '').toLowerCase().includes(query);
    const reworkReasonMatch = (log.primaryReworkReason || '').toLowerCase().includes(query);
    const inspectorMatch = (log.inspectorName || '').toLowerCase().includes(query);
    return partMatch || rejReasonMatch || reworkReasonMatch || inspectorMatch;
  });

  const sorted = [...searched].sort((a, b) => b.date.localeCompare(a.date));

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="17" style="text-align:center; color:#94a3b8; padding:2rem;">${query ? 'No matching registry records for query "' + query + '"' : 'No Logs Found. Click "Upload Excel Sheet" or "Add Log Entry" to begin.'}</td></tr>`;
    return;
  }

  sorted.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${log.date}</td>
      <td><span class="badge" style="background:#ffe4e6; color:#be123c;">${log.shift}</span></td>
      <td>${log.inspectorName || 'Mukund'}</td>
      <td><span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">${log.partNumber}</span></td>
      <td><strong>${log.productionQty.toLocaleString()}</strong></td>
      <td><span style="color:#2563eb; font-weight:700;">${log.inProcessRejection}</span></td>
      <td><span style="color:#d97706; font-weight:700;">${log.finalRejection}</span></td>
      <td><span style="color:#7c3aed; font-weight:700;">${log.mpiRejection}</span></td>
      <td><span style="color:#dc2626; font-weight:700;">${log.heatTreatRejection}</span></td>
      <td><span style="color:#db2777; font-weight:700;">${log.customerReturns || 0}</span></td>
      <td><span style="color:#0284c7; font-weight:700;">${log.vendorMachiningRejection || 0}</span></td>
      <td><span style="color:#ea580c; font-weight:700;">${log.materialDefect || 0}</span></td>
      <td><span style="color:#475569; font-weight:700;">${log.nonMovingScrap || 0}</span></td>
      <td><span style="color:#c026d3; font-weight:700;">${log.npdDevelopmentRejection || 0}</span></td>
      <td><strong style="color:${log.totalRejection > 0 ? '#e11d48' : '#475569'}">${log.totalRejection}</strong></td>
      <td>${log.reworkQty} (${log.reworkRecovered} Rec.)</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteLog('${log.id}')"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCapaTable() {
  const tbody = document.getElementById('tbody-capa');
  tbody.innerHTML = '';

  state.capaItems.forEach(capa => {
    let statusBadge = 'badge-status-open';
    if (capa.status === 'In-Progress') statusBadge = 'badge-status-prog';
    if (capa.status === 'Closed') statusBadge = 'badge-status-closed';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${capa.id}</strong></td>
      <td><strong>${capa.reason}</strong></td>
      <td><span class="badge badge-vendor">${capa.stage}</span></td>
      <td style="max-width:220px; font-size:0.8rem;">${capa.rootCause}</td>
      <td style="max-width:260px; font-size:0.8rem; color:#be123c;">${capa.action}</td>
      <td>${capa.owner}</td>
      <td><span class="badge ${statusBadge}">${capa.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Modal Handlers
function openAddModal(category = 'auto') {
  state.currentAddCategory = category;
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('log-date').value = new Date().toISOString().split('T')[0];

  const titleEl = document.querySelector('#modal-overlay .modal-title');
  
  const inprocEl = document.getElementById('log-inproc');
  const finalEl = document.getElementById('log-final');
  const mpiEl = document.getElementById('log-mpi');
  const htEl = document.getElementById('log-ht');
  const vendorEl = document.getElementById('log-vendor');
  const custEl = document.getElementById('log-cust');

  // Reset default input values
  inprocEl.value = '0';
  finalEl.value = '0';
  mpiEl.value = '0';
  htEl.value = '0';
  vendorEl.value = '0';
  custEl.value = '0';

  if (category === 'inprocess') {
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-gears" style="color:#2563eb; margin-right:0.5rem;"></i> Add In-Process Quality Log Entry`;
    inprocEl.value = '12';
    setTimeout(() => inprocEl.focus(), 100);
  } else if (category === 'final') {
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-magnifying-glass" style="color:#d97706; margin-right:0.5rem;"></i> Add Final Inspection QA Log Entry`;
    finalEl.value = '5';
    setTimeout(() => finalEl.focus(), 100);
  } else if (category === 'mpi') {
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-magnet" style="color:#7c3aed; margin-right:0.5rem;"></i> Add MPI NDT Crack Check Log Entry`;
    mpiEl.value = '4';
    setTimeout(() => mpiEl.focus(), 100);
  } else if (category === 'heattreat') {
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-fire-burner" style="color:#dc2626; margin-right:0.5rem;"></i> Add Heat Treatment Quality Log Entry`;
    htEl.value = '3';
    setTimeout(() => htEl.focus(), 100);
  } else if (category === 'vendor') {
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-truck-field" style="color:#0284c7; margin-right:0.5rem;"></i> Add Machining Vendor Rejection Entry`;
    vendorEl.value = '6';
    setTimeout(() => vendorEl.focus(), 100);
  } else if (category === 'customer') {
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-truck-ramp-box" style="color:#db2777; margin-right:0.5rem;"></i> Add Customer Return Claim Entry`;
    custEl.value = '3';
    setTimeout(() => custEl.focus(), 100);
  } else {
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-clipboard-list" style="color:#e11d48; margin-right:0.5rem;"></i> Add Quality, Vendor & Rejection Log`;
    inprocEl.value = '12';
    finalEl.value = '5';
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

function openExcelModal(category = 'auto') {
  document.getElementById('excel-category-select').value = category;
  const fileInput = document.getElementById('excel-file-input');
  if (fileInput) fileInput.value = '';
  document.getElementById('excel-modal-overlay').classList.add('active');
}

function closeExcelModal() {
  document.getElementById('excel-modal-overlay').classList.remove('active');
}

function parseExcelDate(rawVal) {
  if (!rawVal) return new Date().toISOString().split('T')[0];
  if (rawVal instanceof Date) {
    return rawVal.toISOString().split('T')[0];
  }
  if (typeof rawVal === 'number') {
    const dateObj = new Date((rawVal - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  }
  const str = String(rawVal).trim();
  if (str.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
    const parts = str.split(/[\/\-]/);
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  if (str.match(/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/)) {
    const parts = str.split(/[\/\-]/);
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str.substring(0, 10);
}

function getExcelValue(row, normRow, possibleKeys) {
  for (const k of possibleKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
    const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normRow[cleanK] !== undefined && normRow[cleanK] !== null && String(normRow[cleanK]).trim() !== '') {
      return normRow[cleanK];
    }
  }
  return null;
}

// Ultra-Strict Excel Importer with Automatic Persistence
function handleExcelFile(file) {
  const selectedCategory = document.getElementById('excel-category-select').value;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const importedLogs = [];
      const importedDates = [];

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        rawRows.forEach((row, idx) => {
          const normRow = {};
          Object.keys(row).forEach(k => {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            normRow[cleanKey] = row[k];
          });

          // Extract Date
          const dateRaw = getExcelValue(row, normRow, ['Date', 'DATE', 'date', 'Log Date', 'Return Date', 'Inspection Date']);
          const dateStr = parseExcelDate(dateRaw);
          importedDates.push(dateStr);

          // Extract Shift, Inspector, Part Number
          const shift = getExcelValue(row, normRow, ['Shift', 'SHIFT', 'shift']) || 'Shift A';
          const inspector = getExcelValue(row, normRow, ['Inspector', 'INSPECTOR', 'inspector']) || (state.currentUser || 'Mukund');
          const part = getExcelValue(row, normRow, ['Part Number', 'Part No', 'Part', 'PartNumber', 'PART NUMBER', 'Item']) || 'PART-1001';

          // Extract Quantities
          const rawInspected = getExcelValue(row, normRow, ['Inspected Qty', 'InspectedQty', 'Production Qty', 'Prod Qty', 'Inspected', 'Total Qty']);
          const rawAccepted = getExcelValue(row, normRow, ['Accepted Qty', 'AcceptedQty', 'Accepted']);
          const rawRejection = getExcelValue(row, normRow, ['Rejection Qty', 'RejectionQty', 'Returned Qty', 'ReturnedQty', 'Reject Qty', 'Rej Qty', 'Qty']);
          const rawRework = getExcelValue(row, normRow, ['Rework Qty', 'ReworkQty', 'Rework']);

          const rejectionQty = rawRejection !== null ? Math.max(0, parseInt(rawRejection) || 0) : 0;
          const acceptedQty = rawAccepted !== null ? Math.max(0, parseInt(rawAccepted) || 0) : 0;
          let inspectedQty = rawInspected !== null ? Math.max(0, parseInt(rawInspected) || 0) : 0;
          const reworkQty = rawRework !== null ? Math.max(0, parseInt(rawRework) || 0) : 0;

          if (!inspectedQty) {
            if (acceptedQty > 0 || rejectionQty > 0) inspectedQty = acceptedQty + rejectionQty;
            else inspectedQty = 100;
          }

          const reworkRecovered = Math.floor(reworkQty * 0.85);

          // Comprehensive Rejection Reason Matcher
          const rejReasonRaw = getExcelValue(row, normRow, [
            'Reason for Rejection',
            'Reason For Rejection',
            'REASON FOR REJECTION',
            'Rejection Reason',
            'RejectionReason',
            'REJECTION REASON',
            'Reason for rejection',
            'Defect Reason',
            'Defect Cause',
            'Rejection Cause',
            'Primary Rejection Reason',
            'PrimaryRejectionReason',
            'Reason'
          ]);
          const rejReason = rejReasonRaw ? String(rejReasonRaw).trim() : (rejectionQty > 0 ? 'Unclassified' : 'None');

          // Comprehensive Rework Reason Matcher - NO FALLBACK
          const reworkReasonRaw = getExcelValue(row, normRow, [
            'Reason for Rework',
            'Reason For Rework',
            'REASON FOR REWORK',
            'Rework Reason',
            'ReworkReason',
            'REWORK REASON',
            'Reason for rework',
            'Rework Action',
            'Action for Rework',
            'Rework Details',
            'Rework Process',
            'Rework Cause',
            'Primary Rework Reason',
            'PrimaryReworkReason',
            'Rework Note',
            'Rework Notes'
          ]);
          const reworkReason = reworkReasonRaw ? String(reworkReasonRaw).trim() : '';

          // STRICT STREAM ISOLATION & TAGGING
          let inproc = 0, final = 0, mpi = 0, ht = 0, cust = 0, vendor = 0, mat = 0, nonmove = 0, npd = 0;
          const lowerSheet = sheetName.toLowerCase();
          const cleanSheet = lowerSheet.replace(/[^a-z0-9]/g, '');
          let streamTag = selectedCategory;
          
          if (selectedCategory === 'inprocess' || (selectedCategory === 'auto' && (cleanSheet.includes('inprocess') || cleanSheet.includes('process') || cleanSheet.includes('inproc')))) {
            inproc = rejectionQty;
            streamTag = 'inprocess';
          } 
          else if (selectedCategory === 'final' || (selectedCategory === 'auto' && (cleanSheet.includes('final') || cleanSheet.includes('fqc') || cleanSheet.includes('oqc') || cleanSheet.includes('inspection')))) {
            final = rejectionQty;
            streamTag = 'final';
          } 
          else if (selectedCategory === 'mpi' || (selectedCategory === 'auto' && (cleanSheet.includes('mpi') || cleanSheet.includes('ndt') || cleanSheet.includes('crack')))) {
            mpi = rejectionQty;
            streamTag = 'mpi';
          } 
          else if (selectedCategory === 'heattreat' || (selectedCategory === 'auto' && (cleanSheet.includes('heat') || cleanSheet.includes('ht') || cleanSheet.includes('temper')))) {
            ht = rejectionQty;
            streamTag = 'heattreat';
          } 
          else if (selectedCategory === 'customer' || (selectedCategory === 'auto' && (cleanSheet.includes('customer') || cleanSheet.includes('cust') || cleanSheet.includes('dispatch') || cleanSheet.includes('field')))) {
            cust = rejectionQty;
            streamTag = 'customer';
          } 
          else if (selectedCategory === 'vendor' || (selectedCategory === 'auto' && (cleanSheet.includes('vendor') || cleanSheet.includes('supplier') || cleanSheet.includes('subcon')))) {
            vendor = rejectionQty;
            streamTag = 'vendor';
          } 
            if (!inproc && !final && !mpi && !ht && !cust && !vendor) {
              if (selectedCategory && selectedCategory !== 'auto') {
                if (selectedCategory === 'inprocess') inproc = rejectionQty;
                else if (selectedCategory === 'final') final = rejectionQty;
                else if (selectedCategory === 'mpi') mpi = rejectionQty;
                else if (selectedCategory === 'heattreat') ht = rejectionQty;
                else if (selectedCategory === 'vendor') vendor = rejectionQty;
                else if (selectedCategory === 'customer') cust = rejectionQty;
                streamTag = selectedCategory;
              } else {
                inproc = rejectionQty;
                streamTag = 'inprocess';
              }
            }
          }

          const totalRej = inproc + final + mpi + ht + cust + vendor + mat + nonmove + npd;

          importedLogs.push({
            id: `IMP-${Date.now()}-${idx}`,
            date: dateStr,
            shift: String(shift),
            inspectorName: String(inspector),
            partNumber: String(part),
            productionQty: inspectedQty,
            inProcessRejection: inproc,
            finalRejection: final,
            mpiRejection: mpi,
            heatTreatRejection: ht,
            customerReturns: cust,
            vendorMachiningRejection: vendor,
            materialDefect: mat,
            nonMovingScrap: nonmove,
            npdDevelopmentRejection: npd,
            totalRejection: totalRej,
            reworkQty: reworkQty,
            reworkRecovered: reworkRecovered,
            primaryRejectionReason: String(rejReason),
            primaryReworkReason: String(reworkReason),
            notes: `Uploaded via ${streamTag} sheet.`
          });
        });
      });

      if (!importedLogs.length) {
        alert('No data rows found in the uploaded Excel file.');
        return;
      }

      // Append new logs to state
      state.logs = [...importedLogs, ...state.logs];

      // Auto expand date filters to include imported dates
      updateDateFiltersForImportedData(importedDates);

      // Permanently save to storage
      saveData(false);
      closeExcelModal();

      if (selectedCategory !== 'auto') {
        const targetTabBtn = document.querySelector(`[data-tab="${selectedCategory}"]`);
        if (targetTabBtn) {
          document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
          targetTabBtn.classList.add('active');
          document.getElementById(`${selectedCategory}-view`).classList.add('active');
        }
      }

      renderAll();
      alert(`Successfully imported and saved ${importedLogs.length} quality records! Data is permanently protected.`);

    } catch (err) {
      console.error('Error parsing Excel file:', err);
      alert('Failed to parse Excel file. Please ensure valid .xlsx / .csv format.');
    }
  };
  reader.readAsArrayBuffer(file);
}

function downloadCategoryTemplate(category) {
  let filename = 'Quality_Template.xlsx';
  let headers = [];
  let sampleRow = [];

  if (category === 'inprocess') {
    filename = 'InProcess_Rejection_Template.xlsx';
    headers = ['Date', 'Part Number', 'Inspected Qty', 'Accepted Qty', 'Rejection Qty', 'Rejection %', 'Reason for Rejection', 'Rework Qty', 'Rework %', 'Reason for Rework'];
    sampleRow = ['2026-07-22', 'PART-1001 (Gear Shaft)', 1000, 988, 12, '1.20%', 'Dimensional Out of Spec', 10, '1.00%', 'Oversize Machining (Re-turn/Grind)'];
  } 
  else if (category === 'final') {
    filename = 'Final_Inspection_Rejection_Template.xlsx';
    headers = ['Date', 'Part Number', 'Inspected Qty', 'Accepted Qty', 'Rejection Qty', 'Rejection %', 'Reason for Rejection', 'Rework Qty', 'Rework %', 'Reason for Rework'];
    sampleRow = ['2026-07-22', 'PART-1002 (Flange Hub)', 1200, 1194, 6, '0.50%', 'Thread Damage / Burrs', 5, '0.42%', 'Thread Chasing & Deburring'];
  } 
  else if (category === 'mpi') {
    filename = 'MPI_NDT_Rejection_Template.xlsx';
    headers = ['Date', 'Part Number', 'Inspected Qty', 'Accepted Qty', 'Rejection Qty', 'Rejection %', 'Reason for Rejection', 'Rework Qty', 'Rework %', 'Reason for Rework'];
    sampleRow = ['2026-07-22', 'PART-1003 (Pinion Housing)', 950, 946, 4, '0.42%', 'MPI Surface Crack', 3, '0.31%', 'Surface Rust / Degreasing Clean'];
  } 
  else if (category === 'heattreat') {
    filename = 'Heat_Treatment_Rejection_Template.xlsx';
    headers = ['Date', 'Part Number', 'Inspected Qty', 'Accepted Qty', 'Rejection Qty', 'Rejection %', 'Reason for Rejection', 'Rework Qty', 'Rework %', 'Reason for Rework'];
    sampleRow = ['2026-07-22', 'PART-1004 (Axle Spindle)', 1100, 1095, 5, '0.45%', 'Heat Treat Hardness Out of Range', 4, '0.36%', 'Hardness Tempering Adjustment'];
  } 
  else if (category === 'customer') {
    filename = 'Customer_Returns_Template.xlsx';
    headers = ['Date', 'Part Number', 'Returned Qty', 'Reason for Rejection'];
    sampleRow = ['2026-07-22', 'PART-1001 (Gear Shaft)', 3, 'Customer Spec Mismatch'];
  } 
  else if (category === 'vendor') {
    filename = 'Machining_Vendor_Returns_Template.xlsx';
    headers = ['Date', 'Part Number', 'Rejection Qty', 'Reason for Rejection'];
    sampleRow = ['2026-07-22', 'PART-1002 (Flange Hub)', 8, 'Vendor Machining Deviation'];
  } 
  else {
    filename = 'Master_Quality_All_In_One_Template.xlsx';
    headers = ['Date', 'Shift', 'Inspector', 'Part Number', 'Production Qty', 'In-Process Rej', 'Final Rej', 'MPI Rej', 'Heat Treat Rej', 'Customer Returns', 'Vendor Machining Rej', 'Material Defect', 'Non-Moving Scrap', 'NPD Dev Rej', 'Rework Qty', 'Rework Recovered', 'Primary Rej Reason', 'Primary Rework Reason'];
    sampleRow = ['2026-07-22', 'Shift A', 'Mukund', 'PART-1001 (Gear Shaft)', 1000, 10, 4, 3, 2, 0, 5, 3, 1, 2, 15, 13, 'Vendor Machining Deviation', 'Oversize Machining (Re-turn/Grind)'];
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, filename);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const date = document.getElementById('log-date').value;
  const shift = document.getElementById('log-shift').value;
  const inspector = document.getElementById('log-inspector').value;
  const partNumber = document.getElementById('log-part').value;
  
  const prodQty = parseInt(document.getElementById('log-prod').value) || 0;
  const inProc = parseInt(document.getElementById('log-inproc').value) || 0;
  const final = parseInt(document.getElementById('log-final').value) || 0;
  const mpi = parseInt(document.getElementById('log-mpi').value) || 0;
  const ht = parseInt(document.getElementById('log-ht').value) || 0;
  const cust = parseInt(document.getElementById('log-cust').value) || 0;
  const vendorMach = parseInt(document.getElementById('log-vendor').value) || 0;
  const matDef = parseInt(document.getElementById('log-material').value) || 0;
  const nonMove = parseInt(document.getElementById('log-nonmoving').value) || 0;
  const npdDev = parseInt(document.getElementById('log-npd').value) || 0;

  const rework = parseInt(document.getElementById('log-rework').value) || 0;
  const recovered = parseInt(document.getElementById('log-recovered').value) || 0;
  
  const rejReason = document.getElementById('log-rej-reason').value;
  const reworkReason = document.getElementById('log-rework-reason').value;

  const totalRej = inProc + final + mpi + ht + cust + vendorMach + matDef + nonMove + npdDev;

  let categoryTag = state.currentAddCategory || 'auto';
  if (categoryTag === 'auto') {
    if (inProc > 0) categoryTag = 'inprocess';
    else if (final > 0) categoryTag = 'final';
    else if (mpi > 0) categoryTag = 'mpi';
    else if (ht > 0) categoryTag = 'heattreat';
    else if (vendorMach > 0) categoryTag = 'vendor';
    else if (cust > 0) categoryTag = 'customer';
  }

  const newLog = {
    id: `LOG-${date}-${shift.replace(' ', '')}-${Date.now().toString().slice(-4)}`,
    date,
    shift,
    inspectorName: inspector,
    partNumber,
    productionQty: prodQty,
    inProcessRejection: inProc,
    finalRejection: final,
    mpiRejection: mpi,
    heatTreatRejection: ht,
    customerReturns: cust,
    vendorMachiningRejection: vendorMach,
    materialDefect: matDef,
    nonMovingScrap: nonMove,
    npdDevelopmentRejection: npdDev,
    totalRejection: totalRej,
    reworkQty: rework,
    reworkRecovered: recovered,
    primaryRejectionReason: rejReason,
    primaryReworkReason: reworkReason,
    notes: `Uploaded via ${categoryTag} sheet.`
  };

  state.logs.unshift(newLog);
  saveData(false);
  closeModal();
  renderAll();
  alert('Quality log entry added and permanently saved!');
}

function deleteLog(id) {
  if (confirm('Delete this quality log record?')) {
    state.logs = state.logs.filter(l => l.id !== id);
    saveData(false);
    renderAll();
  }
}

function openCapaForReason(reason) {
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
  
  const paretoTab = document.querySelector('[data-tab="pareto"]');
  if (paretoTab) paretoTab.classList.add('active');
  document.getElementById('pareto-view').classList.active = true;

  document.getElementById('capa-section').scrollIntoView({ behavior: 'smooth' });
}

function exportCSV() {
  const filtered = getFilteredLogs();
  if (!filtered.length) {
    alert('No logs available to export.');
    return;
  }

  const headers = [
    'ID', 'Date', 'Shift', 'Inspector', 'Part Number', 'Production Qty',
    'In-Process Rej', 'Final Rej', 'MPI Rej', 'Heat Treat Rej', 'Customer Returns',
    'Vendor Machining Rej', 'Material Defect', 'Non-Moving Scrap', 'NPD Dev Rej',
    'Total Rej', 'Rework Qty', 'Rework Recovered', 'Primary Rej Reason', 'Primary Rework Reason'
  ];
  
  const rows = filtered.map(l => [
    l.id, l.date, l.shift, `"${l.inspectorName}"`, `"${l.partNumber}"`,
    l.productionQty, l.inProcessRejection, l.finalRejection, l.mpiRejection,
    l.heatTreatRejection, l.customerReturns, l.vendorMachiningRejection || 0,
    l.materialDefect || 0, l.nonMovingScrap || 0, l.npdDevelopmentRejection || 0,
    l.totalRejection, l.reworkQty, l.reworkRecovered, `"${l.primaryRejectionReason}"`, `"${l.primaryReworkReason}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Quality_Monitor_Export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
