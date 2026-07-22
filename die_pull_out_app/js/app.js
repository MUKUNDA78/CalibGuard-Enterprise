/**
 * DIE PULL OUT ANALYSIS & LIFE CYCLE MANAGEMENT - CORE ENGINE
 * 500+ Tooling Master Registry Engine, Plant Drop Hammer Units, User Editable Die Status & Excel Backup
 */

const AppState = {
  dieSets: [],
  pullOutMeetings: [],
  designTasks: [],
  dieShopTasks: [],
  trialTasks: [],
  currentTab: 'dashboard',
  currentRole: 'admin',
  dateFilter: 'ALL',

  // Exact Plant Drop Hammer Units
  forgingLines: [
    '1 Ton',
    '1.5 Ton',
    '2.5 Ton (Old)',
    '2.5 Ton (New)',
    '3.5 Ton',
    '0.5 Ton Open Hammer'
  ],

  // Die Status Options
  dieStatusOptions: [
    'In Production',
    'Pending Resink',
    'Pending Design Mod',
    'Trial Pending',
    'Standby / Ready',
    'Scrapped'
  ],

  // Roles Definition & Permissions Matrix
  roles: {
    admin: { name: 'System Admin', badge: 'badge-rose', icon: '👑', canEdit: true, canDelete: true },
    quality: { name: 'Quality Assurance Team', badge: 'badge-cyan', icon: '📋', canEdit: false, canDelete: false },
    design: { name: 'Tooling Design Team', badge: 'badge-amber', icon: '📐', canEdit: false, canDelete: false },
    dieshop: { name: 'Die Shop Master', badge: 'badge-indigo', icon: '⚙️', canEdit: false, canDelete: false },
    production: { name: 'Production Lead', badge: 'badge-emerald', icon: '🚜', canEdit: false, canDelete: false },
    executive: { name: 'Top Management', badge: 'badge-purple', icon: '💼', canEdit: false, canDelete: false, viewOnly: true }
  },

  // Key Initializer
  init() {
    this.loadFromStorage();
    if (!this.dieSets || this.dieSets.length === 0) {
      this.loadSeedData();
    }
    this.setupNavigation();
    this.renderRoleSelector();
    this.renderCurrentView();
  },

  // Save to LocalStorage
  save() {
    localStorage.setItem('die_pullout_diesets', JSON.stringify(this.dieSets));
    localStorage.setItem('die_pullout_meetings', JSON.stringify(this.pullOutMeetings));
    localStorage.setItem('die_pullout_designtasks', JSON.stringify(this.designTasks));
    localStorage.setItem('die_pullout_dieshoptasks', JSON.stringify(this.dieShopTasks));
    localStorage.setItem('die_pullout_trialtasks', JSON.stringify(this.trialTasks));
    localStorage.setItem('die_pullout_role', this.currentRole);
  },

  // Load from LocalStorage
  loadFromStorage() {
    try {
      this.dieSets = JSON.parse(localStorage.getItem('die_pullout_diesets')) || [];
      this.pullOutMeetings = JSON.parse(localStorage.getItem('die_pullout_meetings')) || [];
      this.designTasks = JSON.parse(localStorage.getItem('die_pullout_designtasks')) || [];
      this.dieShopTasks = JSON.parse(localStorage.getItem('die_pullout_dieshoptasks')) || [];
      this.trialTasks = JSON.parse(localStorage.getItem('die_pullout_trialtasks')) || [];
      this.currentRole = localStorage.getItem('die_pullout_role') || 'admin';
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
  },

  // Role Switcher Setup
  setRole(roleKey) {
    if (this.roles[roleKey]) {
      this.currentRole = roleKey;
      this.save();
      this.showToast(`Switched active user role to: ${this.roles[roleKey].name}`, 'info');
      this.renderRoleSelector();
      this.renderCurrentView();
    }
  },

  renderRoleSelector() {
    const roleSelect = document.getElementById('user-role-select');
    if (roleSelect) {
      roleSelect.value = this.currentRole;
    }
    const badgeEl = document.getElementById('role-badge-display');
    if (badgeEl) {
      const r = this.roles[this.currentRole];
      badgeEl.className = `badge ${r.badge}`;
      badgeEl.innerHTML = `${r.icon} ${r.name}`;
    }
  },

  // Date Filtering logic for Daily Logs
  getFilteredMeetings() {
    if (this.dateFilter === 'ALL') return this.pullOutMeetings;
    const today = new Date().toISOString().split('T')[0];
    
    if (this.dateFilter === 'TODAY') {
      return this.pullOutMeetings.filter(m => m.meetingDate === today);
    }
    
    if (this.dateFilter === 'YESTERDAY') {
      const yDate = new Date();
      yDate.setDate(yDate.getDate() - 1);
      const yStr = yDate.toISOString().split('T')[0];
      return this.pullOutMeetings.filter(m => m.meetingDate === yStr);
    }

    if (this.dateFilter === 'WEEK') {
      const pastWeek = new Date();
      pastWeek.setDate(pastWeek.getDate() - 7);
      return this.pullOutMeetings.filter(m => new Date(m.meetingDate) >= pastWeek);
    }

    return this.pullOutMeetings;
  },

  // Seed Data tailored with User Editable Die Status
  loadSeedData() {
    const todayStr = new Date().toISOString().split('T')[0];

    this.dieSets = [
      {
        id: 'DIE-CR-402',
        dieNo: 'DIE-CR-402',
        partName: 'Connecting Rod 1.5L',
        partNumber: 'CR-150-88A',
        forgingLine: '2.5 Ton (New)',
        dieLifeTarget: 50000,
        totalStrokesCumulative: 42800,
        maxResinkLimit: 5,
        currentResinkCount: 2,
        status: 'In Production',
        dieReleasedOn: todayStr
      },
      {
        id: 'DIE-FG-901',
        dieNo: 'DIE-FG-901',
        partName: 'Drive Flange Forging',
        partNumber: 'DF-900-33X',
        forgingLine: '3.5 Ton',
        dieLifeTarget: 40000,
        totalStrokesCumulative: 31200,
        maxResinkLimit: 4,
        currentResinkCount: 3,
        status: 'Pending Resink',
        dieReleasedOn: todayStr
      },
      {
        id: 'DIE-GB-550',
        dieNo: 'DIE-GB-550',
        partName: 'Gear Blank Preform',
        partNumber: 'GB-550-12B',
        forgingLine: '1.5 Ton',
        dieLifeTarget: 30000,
        totalStrokesCumulative: 18500,
        maxResinkLimit: 6,
        currentResinkCount: 1,
        status: 'Pending Design Mod',
        dieReleasedOn: todayStr
      },
      {
        id: 'DIE-CS-108',
        dieNo: 'DIE-CS-108',
        partName: 'Crankshaft Counterweight',
        partNumber: 'CS-108-99V',
        forgingLine: '2.5 Ton (Old)',
        dieLifeTarget: 25000,
        totalStrokesCumulative: 9400,
        maxResinkLimit: 4,
        currentResinkCount: 0,
        status: 'Trial Pending',
        dieReleasedOn: todayStr
      },
      {
        id: 'DIE-OP-200',
        dieNo: 'DIE-OP-200',
        partName: 'Open Forging Shaft',
        partNumber: 'OF-200-11',
        forgingLine: '0.5 Ton Open Hammer',
        dieLifeTarget: 20000,
        totalStrokesCumulative: 12100,
        maxResinkLimit: 5,
        currentResinkCount: 1,
        status: 'In Production',
        dieReleasedOn: todayStr
      },
      {
        id: 'DIE-ST-101',
        dieNo: 'DIE-ST-101',
        partName: 'Steering Knuckle Forging',
        partNumber: 'SK-100-22',
        forgingLine: '1 Ton',
        dieLifeTarget: 35000,
        totalStrokesCumulative: 14200,
        maxResinkLimit: 4,
        currentResinkCount: 0,
        status: 'In Production',
        dieReleasedOn: todayStr
      }
    ];

    this.pullOutMeetings = [
      {
        id: 'POM-2026-001',
        dieNo: 'DIE-FG-901',
        dieId: 'DIE-FG-901',
        dieRunType: 'Resink Die',
        qtyProducedIfRunning: 8500,
        dieReleasedOn: todayStr,
        hammerUnit: '3.5 Ton',
        dieLifeTarget: 40000,
        totalQtyProduced: 31200,
        meetingDate: todayStr,
        reasonForPullout: 'Batch Completion & Flash Land Wear',
        issuesFaced: 'Web boss dimension drifting +0.25mm above tolerance. Flash line thickness reduced causing high forging load.',
        rootCause: 'Impression erosion on lower step transition exceeded 0.25mm limit. Flash land worn out.',
        correctiveAction: 'Execute 1.5mm CNC EDM resinking of impression and recut flash land gutter.',
        decision: 'Die Shop Resink Required',
        designRequired: false,
        resinkDepthRequired: 1.5,
        signoffs: {
          quality: { signed: true, name: 'R. Sharma (QA Lead)', comment: 'First part ok; last part web out by +0.25mm.', date: todayStr },
          dieShop: { signed: true, name: 'V. Kumar (Tooling Lead)', comment: 'Die block thickness ok for 1.5mm resink.', date: todayStr },
          design: { signed: true, name: 'A. Roy (Design Lead)', comment: 'Existing 2D CAD geometry remains unchanged.', date: todayStr },
          production: { signed: true, name: 'M. Patel (Forging Sup)', comment: 'Batch of 8,500 parts completed.', date: todayStr }
        },
        notes: 'Impression wash out exceeded 0.25mm depth limit. Send directly to CNC EDM resinking room.'
      },
      {
        id: 'POM-2026-002',
        dieNo: 'DIE-GB-550',
        dieId: 'DIE-GB-550',
        dieRunType: 'Running Die',
        qtyProducedIfRunning: 6200,
        dieReleasedOn: todayStr,
        hammerUnit: '1.5 Ton',
        dieLifeTarget: 30000,
        totalQtyProduced: 18500,
        meetingDate: todayStr,
        reasonForPullout: 'Underfill on Upper Corner & Draft Sticky',
        issuesFaced: 'Forged parts getting stuck in upper die cavity. Metal underfill on corner fillet radius.',
        rootCause: 'Draft angle 7° is insufficient for metal flow during drop hammer stroke. Corner radius R5.0mm is too sharp.',
        correctiveAction: 'Tooling Design Team to update CAD ECN to increase draft angle to 8.5° and fillet radius to R7.0mm before resinking.',
        decision: 'Design Modification + Resink',
        designRequired: true,
        resinkDepthRequired: 2.0,
        signoffs: {
          quality: { signed: true, name: 'R. Sharma (QA Lead)', comment: 'Underfill causes high scrap rate (4%). ECN required.', date: todayStr },
          dieShop: { signed: true, name: 'V. Kumar (Tooling Lead)', comment: 'Awaiting updated 3D CAD step file from Design.', date: todayStr },
          design: { signed: true, name: 'A. Roy (Design Lead)', comment: 'ECN-FG-2026-44 released with 8.5° draft.', date: todayStr },
          production: { signed: true, name: 'M. Patel (Forging Sup)', comment: 'Production stopped on 1.5T Hammer for this die.', date: todayStr }
        },
        notes: 'Root cause analysis indicates draft angle is insufficient for metal flow. Design team must increase draft from 7° to 8.5° before resinking.'
      }
    ];

    this.designTasks = [
      {
        id: 'DES-2026-009',
        meetingId: 'POM-2026-002',
        dieId: 'DIE-GB-550',
        title: 'Draft Angle & Corner Radius Modification',
        description: 'Update 3D CAD model to increase upper impression draft angle from 7° to 8.5° and fillet radius to R7.0mm to eliminate forging stickiness.',
        assignedTo: 'Anish Roy (Tooling Design)',
        status: 'In Progress',
        ecnNumber: 'ECN-FG-2026-44',
        createdAt: todayStr
      }
    ];

    this.dieShopTasks = [
      {
        id: 'DS-2026-014',
        meetingId: 'POM-2026-001',
        dieId: 'DIE-FG-901',
        title: 'Resink Impression & Flash Gutter Recut',
        resinkDepth: 1.5,
        assignedTo: 'Vikram Kumar (Die Shop Master)',
        status: 'Machining',
        estimatedHours: 18,
        createdAt: todayStr
      }
    ];

    this.trialTasks = [
      {
        id: 'TRL-2026-004',
        dieId: 'DIE-CS-108',
        title: 'First-Piece Drop Hammer Forging Trial Post-Resink #1',
        assignedTo: 'Mukesh Patel (Production)',
        status: 'Ready for Trial',
        createdAt: todayStr
      }
    ];

    this.save();
  },

  // Setup navigation click handlers
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  },

  // Tab switching engine
  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update Top Bar Titles
    const titleEl = document.getElementById('page-title');
    const subEl = document.getElementById('page-sub');
    
    switch(tabName) {
      case 'dashboard':
        titleEl.textContent = 'Drop Hammer Forging Die Pull Out Dashboard';
        subEl.textContent = 'Daily multi-user status, drop hammer die wear analysis & cross-functional action tracking';
        break;
      case 'master-fleet':
        titleEl.textContent = 'Die Master Data Registry (500+ Tooling Fleet)';
        subEl.textContent = 'Update & register master dies and status before holding pull out meetings.';
        break;
      case 'meeting':
        titleEl.textContent = 'Die Pull Out Evaluation Meeting (Daily Log)';
        subEl.textContent = 'Multi-user evaluation of issues faced during production, root cause & corrective action';
        break;
      case 'design-hub':
        titleEl.textContent = 'Tooling Design Team Modification Station';
        subEl.textContent = 'Design team workspace: Track ECN 3D CAD revisions triggered by meeting root cause analysis';
        break;
      case 'dieshop-hub':
        titleEl.textContent = 'Die Shop Resinking & Refurbishment Station';
        subEl.textContent = 'Die Shop workspace: CNC EDM resinking queue, hardfacing welding & precision polishing';
        break;
      case 'trial-hub':
        titleEl.textContent = 'Drop Hammer Trial Run Inspection Station';
        subEl.textContent = 'Forging team workspace: First-piece trial drop hammer forging validation post-resink';
        break;
      case 'history':
        titleEl.textContent = 'Die Lifecycle Audit Registry & Daily Logs';
        subEl.textContent = 'Full historical audit trail. Admins can edit/delete records; Management views reports.';
        break;
      case 'analytics':
        titleEl.textContent = 'Executive Management Wear Analytics & Pareto';
        subEl.textContent = 'High-level executive metrics, failure mode Pareto, and drop hammer die life optimization';
        break;
    }

    this.renderCurrentView();
  },

  // Render logic router
  renderCurrentView() {
    const content = document.getElementById('content-area');
    if (!content) return;

    switch (this.currentTab) {
      case 'dashboard':
        renderDashboardView(content);
        break;
      case 'master-fleet':
        renderMasterDataView(content);
        break;
      case 'meeting':
        if (typeof renderMeetingView === 'function') {
          renderMeetingView(content);
        }
        break;
      case 'design-hub':
      case 'dieshop-hub':
      case 'trial-hub':
        if (typeof renderWorkflowView === 'function') {
          renderWorkflowView(content, this.currentTab);
        }
        break;
      case 'history':
        if (typeof renderHistoryView === 'function') {
          renderHistoryView(content);
        }
        break;
      case 'analytics':
        if (typeof renderAnalyticsView === 'function') {
          renderAnalyticsView(content);
        }
        break;
      default:
        renderDashboardView(content);
    }
  },

  // Helper Toast Notifications
  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'danger' ? '✕' : 'ℹ'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Render Dedicated Master Data Registry Station View
function renderMasterDataView(container) {
  const isAdmin = AppState.currentRole === 'admin';

  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title"><span>🛡️</span> Registered Die Master Data Fleet (${AppState.dieSets.length} Total Dies)</h3>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="exportFullDataBackup()">💾 Export Excel Backup</button>
            <button class="btn btn-secondary" onclick="openExcelImportModal()">📥 Bulk Upload Excel (500+ Dies)</button>
            <button class="btn btn-primary" onclick="openDieMasterModal()">+ Register New Master Die</button>
          </div>
        </div>

        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
          Register and update Master Dies (Die No, Part Name, Target Die Life, Hammer Unit, Total Qty & Die Status) <strong>BEFORE</strong> conducting Die Pull Out Meetings.
        </p>

        <!-- Search & Hammer Unit & Status Filter Bar -->
        <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
          <input type="text" id="master-search-input" class="form-control" style="max-width: 250px;" placeholder="🔍 Search Die No or Part Name..." oninput="filterMasterTable()" />
          <select id="master-hammer-filter" class="form-control" style="width: auto;" onchange="filterMasterTable()">
            <option value="ALL">All Hammer Units</option>
            ${AppState.forgingLines.map(l => `<option value="${l}">${l}</option>`).join('')}
          </select>

          <select id="master-status-filter" class="form-control" style="width: auto;" onchange="filterMasterTable()">
            <option value="ALL">All Die Statuses</option>
            ${AppState.dieStatusOptions.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>

        <div class="table-responsive">
          <table class="custom-table" id="master-fleet-table">
            <thead>
              <tr>
                <th>Die No</th>
                <th>Part Name</th>
                <th>Part Number</th>
                <th>Hammer Unit</th>
                <th>Target Die Life</th>
                <th>Total Qty Produced</th>
                <th>Max Resinks</th>
                <th>Die Status (User Editable)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="master-fleet-tbody">
              ${AppState.dieSets.map(d => `
                <tr>
                  <td style="font-weight: 700; color: var(--cyan-primary);">${d.dieNo || d.id}</td>
                  <td><strong>${d.partName}</strong></td>
                  <td style="color: var(--text-muted); font-size: 12px;">${d.partNumber}</td>
                  <td><strong style="color: var(--indigo-accent);">${d.forgingLine || '2.5 Ton (New)'}</strong></td>
                  <td><strong>${(d.dieLifeTarget || 30000).toLocaleString()}</strong> parts</td>
                  <td><strong>${(d.totalStrokesCumulative || 0).toLocaleString()} parts</strong></td>
                  <td>${d.currentResinkCount || 0} / ${d.maxResinkLimit || 4}</td>
                  <td>
                    <select class="form-control" style="padding: 2px 6px; font-size: 12px; font-weight: 600;" onchange="updateDieStatusDirectly('${d.id}', this.value)">
                      ${AppState.dieStatusOptions.map(opt => `<option value="${opt}" ${d.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" onclick="openDieMasterModal('${d.id}')">✏️ Edit Master</button>
                      ${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteDieSet('${d.id}')">🗑️ Delete</button>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

window.updateDieStatusDirectly = function(dieId, newStatus) {
  const die = AppState.dieSets.find(d => d.id === dieId);
  if (die) {
    die.status = newStatus;
    AppState.save();
    AppState.showToast(`✓ Die No ${dieId} status updated to: "${newStatus}"`, 'success');
  }
};

window.filterMasterTable = function() {
  const query = (document.getElementById('master-search-input').value || '').toLowerCase();
  const hammerFilter = document.getElementById('master-hammer-filter').value;
  const statusFilter = document.getElementById('master-status-filter').value;

  const tbody = document.getElementById('master-fleet-tbody');
  if (!tbody) return;

  const filtered = AppState.dieSets.filter(d => {
    const dieNo = (d.dieNo || d.id).toLowerCase();
    const partName = (d.partName || '').toLowerCase();
    const hammer = d.forgingLine || '';
    const status = d.status || '';

    const matchesQuery = dieNo.includes(query) || partName.includes(query);
    const matchesHammer = hammerFilter === 'ALL' || hammer === hammerFilter;
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

    return matchesQuery && matchesHammer && matchesStatus;
  });

  const isAdmin = AppState.currentRole === 'admin';

  tbody.innerHTML = filtered.length === 0 ? `
    <tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 20px;">No matching dies found in Master Registry.</td></tr>
  ` : filtered.map(d => `
    <tr>
      <td style="font-weight: 700; color: var(--cyan-primary);">${d.dieNo || d.id}</td>
      <td><strong>${d.partName}</strong></td>
      <td style="color: var(--text-muted); font-size: 12px;">${d.partNumber}</td>
      <td><strong style="color: var(--indigo-accent);">${d.forgingLine || '2.5 Ton (New)'}</strong></td>
      <td><strong>${(d.dieLifeTarget || 30000).toLocaleString()}</strong> parts</td>
      <td><strong>${(d.totalStrokesCumulative || 0).toLocaleString()} parts</strong></td>
      <td>${d.currentResinkCount || 0} / ${d.maxResinkLimit || 4}</td>
      <td>
        <select class="form-control" style="padding: 2px 6px; font-size: 12px; font-weight: 600;" onchange="updateDieStatusDirectly('${d.id}', this.value)">
          ${AppState.dieStatusOptions.map(opt => `<option value="${opt}" ${d.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" onclick="openDieMasterModal('${d.id}')">✏️ Edit Master</button>
          ${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteDieSet('${d.id}')">🗑️ Delete</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
};

// Export Full Database Backup to Excel or JSON
window.exportFullDataBackup = function() {
  if (typeof XLSX === 'undefined') {
    AppState.showToast('Preparing backup generator...', 'info');
  }

  const wb = XLSX.utils.book_new();

  // 1. Die Sets Sheet
  const wsDies = XLSX.utils.json_to_sheet(AppState.dieSets.map(d => ({
    "Die No": d.dieNo || d.id,
    "Part Name": d.partName,
    "Part Number": d.partNumber,
    "Hammer Unit": d.forgingLine || d.pressLine || '',
    "Die Life Target": d.dieLifeTarget || 30000,
    "Total Qty Produced": d.totalStrokesCumulative,
    "Current Resinks": d.currentResinkCount,
    "Max Resink Limit": d.maxResinkLimit,
    "Die Status": d.status,
    "Die Released On": d.dieReleasedOn || d.lastPullOutDate
  })));
  XLSX.utils.book_append_sheet(wb, wsDies, "Tooling Master Fleet");

  // 2. Meetings Sheet
  const wsMeetings = XLSX.utils.json_to_sheet(AppState.pullOutMeetings.map(m => ({
    "Meeting ID": m.id,
    "Die No": m.dieNo || m.dieId,
    "Run Type": m.dieRunType || 'Running Die',
    "Qty Produced if Running": m.qtyProducedIfRunning || m.strokesInRun,
    "Die Released On": m.dieReleasedOn || m.meetingDate,
    "Hammer Unit": m.hammerUnit || '2.5 Ton (New)',
    "Die Life Target": m.dieLifeTarget || 30000,
    "Total Qty Produced": m.totalQtyProduced || m.totalCumulativeStrokes,
    "Issues Faced": m.issuesFaced || '',
    "Root Cause": m.rootCause || '',
    "Corrective Action": m.correctiveAction || '',
    "Decision": m.decision,
    "Resink Depth (mm)": m.resinkDepthRequired || 0
  })));
  XLSX.utils.book_append_sheet(wb, wsMeetings, "Pull Out Meetings Log");

  // Save File
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Forging_Die_Master_Backup_${dateStr}.xlsx`);
  AppState.showToast(`💾 Backup exported successfully to Excel (${dateStr})!`, 'success');
};

// Excel Sheet Upload Engine (SheetJS integration for bulk Tooling Master Fleet import: 500+ Dies)
window.openExcelImportModal = function() {
  const modal = document.getElementById('global-modal');
  const modalBody = document.getElementById('modal-body');
  const modalTitle = document.getElementById('modal-title');

  modalTitle.textContent = `📥 Bulk Upload Excel Master Fleet (500+ Dies)`;
  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <p style="font-size: 13px; color: var(--text-muted);">
        Select your plant Excel sheet (<code>.xlsx</code> or <code>.xls</code>) or CSV file to bulk import/update 500+ Tooling Master Dies <strong>BEFORE</strong> holding pull out meetings.
      </p>

      <div style="background: var(--bg-input); border: 2px dashed var(--cyan-primary); padding: 30px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <div style="font-size: 36px; color: var(--cyan-primary);">📊</div>
        <div>
          <strong style="font-size: 14px; color: var(--text-main);">Click below to select Excel file</strong>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Supported columns: <code>Die No</code>, <code>Part Name</code>, <code>Part Number</code>, <code>Hammer Unit</code>, <code>Die Life Target</code>, <code>Total Qty Produced</code>, <code>Status</code></p>
        </div>
        <input type="file" id="excel-file-input" accept=".xlsx, .xls, .csv" style="display: none;" onchange="handleExcelFileUpload(event)" />
        <button type="button" class="btn btn-primary" onclick="document.getElementById('excel-file-input').click()">
          <span>📁 Browse & Select Excel File (500+ Dies)</span>
        </button>
      </div>

      <div style="background: #f1f5f9; padding: 14px; border-radius: 8px; border-left: 4px solid var(--indigo-accent); font-size: 12px; color: var(--text-muted);">
        <strong style="color: var(--indigo-accent);">💡 Excel Template Format Guide:</strong>
        <p style="margin-top: 4px;">Your Excel sheet should contain a header row with columns like:</p>
        <code style="display: block; margin-top: 4px; background: #e2e8f0; padding: 6px; border-radius: 4px; color: #0f172a;">
          Die No | Part Name | Part Number | Hammer Unit | Die Life Target | Total Qty Produced | Status
        </code>
        <div style="margin-top: 10px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="downloadExcelTemplate()">
            <span>⬇️ Download Sample Excel Template (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

// Generate and Download Sample Excel Template
window.downloadExcelTemplate = function() {
  if (typeof XLSX === 'undefined') {
    AppState.showToast('Excel library loading, please try again in a second.', 'warning');
    return;
  }

  const sampleData = [
    {
      "Die No": "DIE-CR-600",
      "Part Name": "Connecting Rod 2.2L",
      "Part Number": "CR-220-88X",
      "Hammer Unit": "2.5 Ton (New)",
      "Die Life Target": 45000,
      "Total Qty Produced": 12000,
      "Status": "In Production"
    },
    {
      "Die No": "DIE-FG-950",
      "Part Name": "Front Hub Flange",
      "Part Number": "FH-950-11A",
      "Hammer Unit": "3.5 Ton",
      "Die Life Target": 35000,
      "Total Qty Produced": 8500,
      "Status": "Pending Resink"
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Master Die Fleet");
  XLSX.writeFile(wb, "Drop_Hammer_500_Die_Master_Template.xlsx");
  AppState.showToast('Downloaded sample Excel template!', 'success');
};

// Process Uploaded Excel File
window.handleExcelFileUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonRows || jsonRows.length === 0) {
        AppState.showToast('The uploaded Excel sheet is empty!', 'warning');
        return;
      }

      let importedCount = 0;
      let updatedCount = 0;

      jsonRows.forEach(row => {
        const id = (row['Die No'] || row['Die ID'] || row['die_id'] || row['DieNo'] || '').toString().trim();
        const partName = (row['Part Name'] || row['part_name'] || '').toString().trim();
        const partNumber = (row['Part Number'] || row['part_number'] || '').toString().trim();
        const forgingLine = (row['Hammer Unit'] || row['Forging Line'] || '2.5 Ton (New)').toString().trim();
        const dieLifeTarget = parseInt(row['Die Life Target'] || row['target'] || 30000) || 30000;
        const totalQtyProduced = parseInt(row['Total Qty Produced'] || row['total_qty'] || 0) || 0;
        const status = (row['Status'] || row['Die Status'] || 'In Production').toString().trim();

        if (!id) return;

        const existingIndex = AppState.dieSets.findIndex(d => (d.dieNo || d.id).toUpperCase() === id.toUpperCase());
        if (existingIndex >= 0) {
          AppState.dieSets[existingIndex].partName = partName || AppState.dieSets[existingIndex].partName;
          AppState.dieSets[existingIndex].partNumber = partNumber || AppState.dieSets[existingIndex].partNumber;
          AppState.dieSets[existingIndex].forgingLine = forgingLine;
          AppState.dieSets[existingIndex].dieLifeTarget = dieLifeTarget;
          AppState.dieSets[existingIndex].status = status;
          if (totalQtyProduced > 0) {
            AppState.dieSets[existingIndex].totalStrokesCumulative = totalQtyProduced;
          }
          updatedCount++;
        } else {
          AppState.dieSets.unshift({
            id,
            dieNo: id,
            partName: partName || 'Forged Part',
            partNumber: partNumber || 'SPEC-001',
            forgingLine,
            dieLifeTarget,
            cavities: 1,
            maxResinkLimit: 4,
            currentResinkCount: 0,
            totalStrokesCumulative: totalQtyProduced,
            status,
            dieReleasedOn: new Date().toISOString().split('T')[0]
          });
          importedCount++;
        }
      });

      AppState.save();
      document.getElementById('global-modal').classList.remove('active');
      AppState.showToast(`Excel Import Successful! ${importedCount} new dies added, ${updatedCount} master records updated.`, 'success');
      AppState.renderCurrentView();
    } catch (err) {
      console.error('Excel Import Error:', err);
      AppState.showToast('Error reading Excel file. Please ensure it is a valid .xlsx or .csv file.', 'danger');
    }
  };

  reader.readAsArrayBuffer(file);
};

// Tooling Master Data Modal Engine (Add / Edit Die Sets BEFORE Meeting - including Die Status)
window.openDieMasterModal = function(dieIdToEdit = null) {
  const isEdit = !!dieIdToEdit;
  const existingDie = isEdit ? AppState.dieSets.find(d => d.id === dieIdToEdit) : null;

  const currentLine = existingDie ? (existingDie.forgingLine || existingDie.pressLine || '') : '';
  const currentStatus = existingDie ? (existingDie.status || 'In Production') : 'In Production';

  const modal = document.getElementById('global-modal');
  const modalBody = document.getElementById('modal-body');
  const modalTitle = document.getElementById('modal-title');

  modalTitle.textContent = isEdit ? `✏️ Update Master Data BEFORE Meeting - ${dieIdToEdit}` : `➕ Register New Master Die (Fleet Registry)`;

  modalBody.innerHTML = `
    <form onsubmit="saveDieMasterForm(event, ${isEdit ? `'${dieIdToEdit}'` : 'null'})" style="display: flex; flex-direction: column; gap: 14px;">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Die No *</label>
          <input type="text" class="form-control" id="m-die-id" value="${existingDie ? (existingDie.dieNo || existingDie.id) : ''}" ${isEdit ? 'readonly' : 'required'} placeholder="e.g. DIE-CR-500" />
        </div>

        <div class="form-group">
          <label class="form-label">Forged Part Name *</label>
          <input type="text" class="form-control" id="m-part-name" value="${existingDie ? existingDie.partName : ''}" required placeholder="e.g. Connecting Rod 2.0L" />
        </div>

        <div class="form-group">
          <label class="form-label">Part Blueprint Number *</label>
          <input type="text" class="form-control" id="m-part-number" value="${existingDie ? existingDie.partNumber : ''}" required placeholder="e.g. CR-200-99X" />
        </div>

        <div class="form-group">
          <label class="form-label">Hammer Unit *</label>
          <select class="form-control" id="m-forging-line-custom" required>
            <option value="">-- Select Hammer Unit --</option>
            ${AppState.forgingLines.map(l => `<option value="${l}" ${currentLine === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Die Life Target (Parts Target) *</label>
          <input type="number" class="form-control" id="m-die-target" value="${existingDie ? (existingDie.dieLifeTarget || 30000) : 30000}" required />
        </div>

        <div class="form-group">
          <label class="form-label">Total Qty Produced (Cumulative Parts) *</label>
          <input type="number" class="form-control" id="m-total-qty" value="${existingDie ? (existingDie.totalStrokesCumulative || 0) : 0}" required placeholder="Enter total cumulative parts produced" />
        </div>

        <div class="form-group">
          <label class="form-label">Die Status (Set by You) *</label>
          <select class="form-control" id="m-die-status" required>
            ${AppState.dieStatusOptions.map(opt => `<option value="${opt}" ${currentStatus === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Die Released On</label>
          <input type="date" class="form-control" id="m-released-on" value="${existingDie ? (existingDie.dieReleasedOn || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]}" required />
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 14px;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('global-modal').classList.remove('active')">Cancel</button>
        <button type="submit" class="btn btn-primary">
          <span>💾 ${isEdit ? 'Save Master Data Updates' : 'Save & Register New Die Set'}</span>
        </button>
      </div>
    </form>
  `;

  modal.classList.add('active');
};

window.saveDieMasterForm = function(e, editDieId) {
  e.preventDefault();
  const id = editDieId || document.getElementById('m-die-id').value.trim();
  const partName = document.getElementById('m-part-name').value.trim();
  const partNumber = document.getElementById('m-part-number').value.trim();
  const forgingLine = document.getElementById('m-forging-line-custom').value;
  const dieLifeTarget = parseInt(document.getElementById('m-die-target').value) || 30000;
  const totalQtyProduced = parseInt(document.getElementById('m-total-qty').value) || 0;
  const status = document.getElementById('m-die-status').value;
  const dieReleasedOn = document.getElementById('m-released-on').value;

  if (!id || !partName || !partNumber || !forgingLine || !status) {
    AppState.showToast('Please fill all required master data fields.', 'warning');
    return;
  }

  if (editDieId) {
    const die = AppState.dieSets.find(d => d.id === editDieId);
    if (die) {
      die.dieNo = id;
      die.partName = partName;
      die.partNumber = partNumber;
      die.forgingLine = forgingLine;
      die.dieLifeTarget = dieLifeTarget;
      die.totalStrokesCumulative = totalQtyProduced;
      die.status = status;
      die.dieReleasedOn = dieReleasedOn;
      AppState.showToast(`✓ Master Data & Status Saved for Die No: ${id}!`, 'success');
    }
  } else {
    if (AppState.dieSets.some(d => d.id === id)) {
      AppState.showToast(`Die No "${id}" already exists in master registry!`, 'warning');
      return;
    }

    const newDie = {
      id,
      dieNo: id,
      partName,
      partNumber,
      forgingLine,
      dieLifeTarget,
      cavities: 1,
      maxResinkLimit: 4,
      currentResinkCount: 0,
      totalStrokesCumulative: totalQtyProduced,
      status,
      dieReleasedOn
    };
    AppState.dieSets.unshift(newDie);
    AppState.showToast(`✓ Registered & Saved New Die No: ${id} (${partName})!`, 'success');
  }

  AppState.save();
  document.getElementById('global-modal').classList.remove('active');
  AppState.renderCurrentView();
};

// Global Admin Edit/Delete Actions Engine
window.deleteMeeting = function(meetingId) {
  if (AppState.currentRole !== 'admin') {
    AppState.showToast('Permission Denied: Only System Admin can delete meeting records.', 'danger');
    return;
  }

  if (confirm(`ADMIN ACTION: Are you sure you want to PERMANENTLY DELETE meeting record ${meetingId}?`)) {
    AppState.pullOutMeetings = AppState.pullOutMeetings.filter(m => m.id !== meetingId);
    AppState.save();
    AppState.showToast(`Meeting ${meetingId} deleted successfully by Admin.`, 'success');
    AppState.renderCurrentView();
  }
};

window.editMeetingModal = function(meetingId) {
  if (AppState.currentRole !== 'admin') {
    AppState.showToast('Permission Denied: Only System Admin can edit historical records.', 'danger');
    return;
  }

  const meeting = AppState.pullOutMeetings.find(m => m.id === meetingId);
  if (!meeting) return;

  const modal = document.getElementById('global-modal');
  const modalBody = document.getElementById('modal-body');
  const modalTitle = document.getElementById('modal-title');

  modalTitle.textContent = `👑 Admin Edit Record - ${meeting.id}`;
  modalBody.innerHTML = `
    <form onsubmit="saveEditedMeeting(event, '${meeting.id}')" style="display: flex; flex-direction: column; gap: 14px;">
      <div class="form-group">
        <label class="form-label">Die No</label>
        <input type="text" class="form-control" id="edit-die-no" value="${meeting.dieNo || meeting.dieId}" required />
      </div>

      <div class="form-group">
        <label class="form-label">Die Status / Run Type</label>
        <select class="form-control" id="edit-run-type">
          <option value="New Sink" ${meeting.dieRunType === 'New Sink' ? 'selected' : ''}>New Sink</option>
          <option value="Resink Die" ${meeting.dieRunType === 'Resink Die' ? 'selected' : ''}>Resink Die</option>
          <option value="Running Die" ${meeting.dieRunType === 'Running Die' ? 'selected' : ''}>Running Die</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Qty Produced if Running</label>
        <input type="number" class="form-control" id="edit-strokes" value="${meeting.qtyProducedIfRunning || meeting.strokesInRun}" required />
      </div>

      <div class="form-group">
        <label class="form-label">Total Qty Produced (Cumulative)</label>
        <input type="number" class="form-control" id="edit-total-qty" value="${meeting.totalQtyProduced || meeting.totalCumulativeStrokes}" required />
      </div>

      <div class="form-group">
        <label class="form-label">Hammer Unit</label>
        <select class="form-control" id="edit-hammer-unit">
          ${AppState.forgingLines.map(l => `<option value="${l}" ${(meeting.hammerUnit || '2.5 Ton (New)') === l ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Die Life Target</label>
        <input type="number" class="form-control" id="edit-die-target" value="${meeting.dieLifeTarget || 30000}" required />
      </div>

      <div class="form-group">
        <label class="form-label">Issues Faced During Production</label>
        <textarea class="form-control" id="edit-issues" required>${meeting.issuesFaced || ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Root Cause Analysis</label>
        <textarea class="form-control" id="edit-rootcause" required>${meeting.rootCause || ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Corrective Action Planned</label>
        <textarea class="form-control" id="edit-action" required>${meeting.correctiveAction || ''}</textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('global-modal').classList.remove('active')">Cancel</button>
        <button type="submit" class="btn btn-primary"><span>💾 Save Admin Changes</span></button>
      </div>
    </form>
  `;

  modal.classList.add('active');
};

window.saveEditedMeeting = function(e, meetingId) {
  e.preventDefault();
  const meeting = AppState.pullOutMeetings.find(m => m.id === meetingId);
  if (!meeting) return;

  meeting.dieNo = document.getElementById('edit-die-no').value;
  meeting.dieRunType = document.getElementById('edit-run-type').value;
  meeting.qtyProducedIfRunning = parseInt(document.getElementById('edit-strokes').value) || 0;
  meeting.totalQtyProduced = parseInt(document.getElementById('edit-total-qty').value) || 0;
  meeting.strokesInRun = meeting.qtyProducedIfRunning;
  meeting.totalCumulativeStrokes = meeting.totalQtyProduced;
  meeting.hammerUnit = document.getElementById('edit-hammer-unit').value;
  meeting.dieLifeTarget = parseInt(document.getElementById('edit-die-target').value) || 30000;
  meeting.issuesFaced = document.getElementById('edit-issues').value;
  meeting.rootCause = document.getElementById('edit-rootcause').value;
  meeting.correctiveAction = document.getElementById('edit-action').value;

  // Also update Master Die total cumulative parts
  const die = AppState.dieSets.find(d => (d.dieNo || d.id) === meeting.dieNo);
  if (die) {
    die.totalStrokesCumulative = meeting.totalQtyProduced;
  }

  AppState.save();
  document.getElementById('global-modal').classList.remove('active');
  AppState.showToast(`✓ Meeting ${meetingId} changes saved successfully!`, 'success');
  AppState.renderCurrentView();
};

window.deleteDieSet = function(dieId) {
  if (AppState.currentRole !== 'admin') {
    AppState.showToast('Permission Denied: Only System Admin can delete die tooling sets.', 'danger');
    return;
  }

  if (confirm(`ADMIN ACTION: Are you sure you want to PERMANENTLY DELETE Die No ${dieId}?`)) {
    AppState.dieSets = AppState.dieSets.filter(d => d.id !== dieId);
    AppState.save();
    AppState.showToast(`Die No ${dieId} deleted successfully.`, 'success');
    AppState.renderCurrentView();
  }
};

window.deleteTask = function(taskId, taskType) {
  if (AppState.currentRole !== 'admin') {
    AppState.showToast('Permission Denied: Only System Admin can delete work tasks.', 'danger');
    return;
  }

  if (confirm(`ADMIN ACTION: Delete Task ${taskId}?`)) {
    if (taskType === 'design') AppState.designTasks = AppState.designTasks.filter(t => t.id !== taskId);
    if (taskType === 'dieshop') AppState.dieShopTasks = AppState.dieShopTasks.filter(t => t.id !== taskId);
    if (taskType === 'trial') AppState.trialTasks = AppState.trialTasks.filter(t => t.id !== taskId);
    AppState.save();
    AppState.showToast(`Task ${taskId} deleted by Admin.`, 'success');
    AppState.renderCurrentView();
  }
};

// Render Dashboard View
function renderDashboardView(container) {
  const filteredMeetings = AppState.getFilteredMeetings();
  const totalMeetings = filteredMeetings.length;
  const pendingDesign = AppState.designTasks.filter(t => t.status !== 'Completed').length;
  const pendingResink = AppState.dieShopTasks.filter(t => t.status !== 'Completed').length;
  const pendingTrial = AppState.trialTasks.filter(t => t.status !== 'Approved').length;

  const resinkDecisionCount = filteredMeetings.filter(m => m.decision.includes('Resink')).length;
  const resinkRate = totalMeetings > 0 ? Math.round((resinkDecisionCount / totalMeetings) * 100) : 0;

  const roleInfo = AppState.roles[AppState.currentRole];
  const isAdmin = AppState.currentRole === 'admin';

  container.innerHTML = `
    <!-- Top Active Role & Daily Filter Banner -->
    <div class="card-panel animate-fade-in" style="background: linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(255, 255, 255, 1)); border-left: 4px solid var(--cyan-primary);">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 24px;">${roleInfo.icon}</div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); font-weight: 700;">Logged In User Role</div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main);">${roleInfo.name}</h3>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">📅 Filter Daily Records:</span>
          <select class="form-control" style="width: auto;" onchange="AppState.dateFilter = this.value; AppState.renderCurrentView();">
            <option value="ALL" ${AppState.dateFilter === 'ALL' ? 'selected' : ''}>All Historical Records</option>
            <option value="TODAY" ${AppState.dateFilter === 'TODAY' ? 'selected' : ''}>Today's Shift Entries</option>
            <option value="YESTERDAY" ${AppState.dateFilter === 'YESTERDAY' ? 'selected' : ''}>Yesterday's Shift</option>
            <option value="WEEK" ${AppState.dateFilter === 'WEEK' ? 'selected' : ''}>Last 7 Days</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Top KPI Cards -->
    <div class="kpi-grid animate-fade-in">
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-title">Registered Master Dies</span>
          <div class="kpi-icon-box icon-cyan">🛡️</div>
        </div>
        <div class="kpi-value">${AppState.dieSets.length}</div>
        <div class="kpi-sub">500+ Tooling Master Fleet</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-title">Pull Out Meetings</span>
          <div class="kpi-icon-box icon-cyan">📋</div>
        </div>
        <div class="kpi-value">${totalMeetings}</div>
        <div class="kpi-sub">Logged Runs Reviewed</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-title">Design Modifications</span>
          <div class="kpi-icon-box icon-amber">📐</div>
        </div>
        <div class="kpi-value">${pendingDesign}</div>
        <div class="kpi-sub">Design Team ECN Queue</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-title">Die Shop Queue</span>
          <div class="kpi-icon-box icon-rose">⚙️</div>
        </div>
        <div class="kpi-value">${pendingResink}</div>
        <div class="kpi-sub">Die Shop CNC Resink Jobs</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-title">Resink Rate</span>
          <div class="kpi-icon-box icon-emerald">📊</div>
        </div>
        <div class="kpi-value">${resinkRate}%</div>
        <div class="kpi-sub">Percent runs requiring resink</div>
      </div>
    </div>

    <!-- Quick Action Banner -->
    ${AppState.currentRole !== 'executive' ? `
      <div class="card-panel animate-fade-in" style="background: linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(248, 250, 252, 0.9)); border-color: rgba(2, 132, 199, 0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <h3 style="font-size: 17px; color: var(--cyan-primary); margin-bottom: 4px;">Need to update Master Data before meeting?</h3>
            <p style="color: var(--text-muted); font-size: 13px;">Manage Master Die Data (Die No, Part Name, Target Die Life, Hammer Unit, Total Qty Produced, Status) or upload Excel sheets with 500+ dies.</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="AppState.switchTab('master-fleet')">
              <span>🛡️ Manage Master Fleet</span>
            </button>
            <button class="btn btn-secondary" onclick="openExcelImportModal()">
              <span>📥 Import 500+ Excel Master</span>
            </button>
            <button class="btn btn-primary" onclick="AppState.switchTab('meeting')">
              <span>➕ Enter Pull Out Meeting</span>
            </button>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Recent Pull Out Meetings Table -->
    <div class="card-panel animate-fade-in">
      <div class="panel-header">
        <h3 class="panel-title"><span>🔍</span> Die Pull Out Inspection Meetings Log (${AppState.dateFilter})</h3>
        <button class="btn btn-secondary btn-sm" onclick="AppState.switchTab('history')">View Full History Registry</button>
      </div>

      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Meeting ID</th>
              <th>Die No</th>
              <th>Run Type</th>
              <th>Qty Produced</th>
              <th>Total Qty Produced</th>
              <th>Hammer Unit</th>
              <th>Issues Faced</th>
              <th>Cross-Functional Decision</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMeetings.length === 0 ? `
              <tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 20px;">No meeting records found for selected filter.</td></tr>
            ` : filteredMeetings.map(m => {
              const die = AppState.dieSets.find(d => (d.dieNo || d.id) === (m.dieNo || m.dieId)) || {};
              let badgeClass = 'badge-cyan';
              if (m.decision.includes('Resink')) badgeClass = 'badge-amber';
              if (m.decision.includes('Design')) badgeClass = 'badge-rose';
              if (m.decision.includes('As-Is')) badgeClass = 'badge-emerald';

              return `
                <tr>
                  <td style="font-weight: 700; color: var(--cyan-primary);">${m.id}</td>
                  <td>
                    <div><strong>${m.dieNo || m.dieId}</strong></div>
                    <div style="font-size: 11px; color: var(--text-muted);">${die.partName || ''}</div>
                  </td>
                  <td><span class="badge badge-indigo">${m.dieRunType || 'Running Die'}</span></td>
                  <td><strong>${(m.qtyProducedIfRunning || m.strokesInRun || 0).toLocaleString()}</strong> parts</td>
                  <td><strong style="color: var(--emerald-success);">${(m.totalQtyProduced || m.totalCumulativeStrokes || 0).toLocaleString()} parts</strong></td>
                  <td><strong style="color: var(--cyan-primary);">${m.hammerUnit || die.forgingLine || '2.5 Ton (New)'}</strong></td>
                  <td style="max-width: 180px; font-size: 12px; color: var(--text-muted);">${m.issuesFaced || m.reasonForPullout}</td>
                  <td><span class="badge ${badgeClass}">${m.decision}</span></td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" onclick="viewMeetingDetails('${m.id}')">Review</button>
                      ${isAdmin ? `
                        <button class="btn btn-warning btn-sm" onclick="editMeetingModal('${m.id}')">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMeeting('${m.id}')">🗑️ Delete</button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Global modal view handler with Department Comments & Analysis
window.viewMeetingDetails = function(meetingId) {
  const meeting = AppState.pullOutMeetings.find(m => m.id === meetingId);
  if (!meeting) return;
  
  const modal = document.getElementById('global-modal');
  const modalBody = document.getElementById('modal-body');
  const modalTitle = document.getElementById('modal-title');

  const s = meeting.signoffs || {};

  modalTitle.textContent = `Die Pull Out Meeting Report - ${meeting.id}`;
  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: var(--bg-input); padding: 14px; border-radius: 8px;">
        <div><strong>Die No:</strong> ${meeting.dieNo || meeting.dieId}</div>
        <div><strong>Run Type:</strong> ${meeting.dieRunType || 'Running Die'}</div>
        <div><strong>Hammer Unit:</strong> ${meeting.hammerUnit || '2.5 Ton (New)'}</div>
        <div><strong>Die Released On:</strong> ${meeting.dieReleasedOn || meeting.meetingDate}</div>
        <div><strong>Qty Produced (Running):</strong> ${(meeting.qtyProducedIfRunning || meeting.strokesInRun || 0).toLocaleString()} parts</div>
        <div><strong>Die Life Target:</strong> ${(meeting.dieLifeTarget || 30000).toLocaleString()} parts</div>
        <div><strong>Total Qty Produced:</strong> <strong style="color: var(--emerald-success);">${(meeting.totalQtyProduced || meeting.totalCumulativeStrokes || 0).toLocaleString()} parts</strong></div>
      </div>

      <div style="background: #fffbebf8; border: 1px solid var(--amber-warning); padding: 12px; border-radius: 8px;">
        <h4 style="color: var(--amber-warning); font-size: 13px;">🚨 Issues Faced During Production:</h4>
        <p style="font-size: 13px; color: var(--text-main); margin-top: 4px;">${meeting.issuesFaced || meeting.reasonForPullout}</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
        <div style="background: #f0fdf4; border: 1px solid var(--emerald-success); padding: 12px; border-radius: 8px;">
          <h4 style="color: var(--emerald-success); font-size: 13px;">🔎 Root Cause Analysis:</h4>
          <p style="font-size: 12px; color: var(--text-main); margin-top: 4px;">${meeting.rootCause || 'Pending Root Cause review'}</p>
        </div>

        <div style="background: #f0f9ff; border: 1px solid var(--cyan-primary); padding: 12px; border-radius: 8px;">
          <h4 style="color: var(--cyan-primary); font-size: 13px;">🛠️ Corrective Action Planned:</h4>
          <p style="font-size: 12px; color: var(--text-main); margin-top: 4px;">${meeting.correctiveAction || 'Pending Corrective Action plan'}</p>
        </div>
      </div>

      <div style="background: var(--bg-input); padding: 14px; border-radius: 8px; border-left: 4px solid var(--cyan-primary);">
        <h4>Meeting Consensus & Decision</h4>
        <div style="font-size: 16px; font-weight: 700; color: var(--cyan-primary); margin: 6px 0;">${meeting.decision}</div>
        <p style="font-size: 13px; color: var(--text-muted);">${meeting.notes}</p>
      </div>

      <h4>Departmental Comments & Sign-Offs</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; font-size: 12px;">
          <strong style="color: var(--cyan-primary);">Quality Team:</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">${(s.quality && s.quality.comment) ? s.quality.comment : 'Signed & Approved'}</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; font-size: 12px;">
          <strong style="color: var(--indigo-accent);">Die Shop Master:</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">${(s.dieShop && s.dieShop.comment) ? s.dieShop.comment : 'Signed & Approved'}</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; font-size: 12px;">
          <strong style="color: var(--amber-warning);">Design Team Lead:</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">${(s.design && s.design.comment) ? s.design.comment : 'Signed & Approved'}</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; font-size: 12px;">
          <strong style="color: var(--emerald-success);">Production Lead:</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">${(s.production && s.production.comment) ? s.production.comment : 'Signed & Approved'}</p>
        </div>
      </div>

      ${AppState.currentRole === 'admin' ? `
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 10px;">
          <button class="btn btn-warning btn-sm" onclick="document.getElementById('global-modal').classList.remove('active'); editMeetingModal('${meeting.id}')">✏️ Edit Meeting Record</button>
          <button class="btn btn-danger btn-sm" onclick="document.getElementById('global-modal').classList.remove('active'); deleteMeeting('${meeting.id}')">🗑️ Delete Meeting Record</button>
        </div>
      ` : ''}
    </div>
  `;

  modal.classList.add('active');
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AppState.init();

  // Modal close setup
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        document.getElementById('global-modal').classList.remove('active');
      }
    });
  });
});
