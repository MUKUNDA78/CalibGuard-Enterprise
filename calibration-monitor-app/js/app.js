const { INITIAL_AGENCIES, INITIAL_USERS, INITIAL_INSTRUMENTS, INITIAL_LOGS } = window.CalibData;
const { 
  getDaysUntilDue, 
  getCalibrationAlertInfo, 
  calculateNextDueDate, 
  formatDate, 
  exportToCSV, 
  StorageManager,
  TODAY_DATE 
} = window.CalibUtils;

class CalibGuardApp {
  constructor() {
    this.state = {
      instruments: StorageManager.get('instruments', INITIAL_INSTRUMENTS),
      agencies: StorageManager.get('agencies', INITIAL_AGENCIES),
      users: StorageManager.get('users', INITIAL_USERS),
      logs: StorageManager.get('logs', INITIAL_LOGS),
      activeUserId: StorageManager.get('activeUserId', 'USR-001'),
      alertThresholdDays: StorageManager.get('alertThresholdDays', 7),
      activeTab: 'dashboard',
      searchQuery: '',
      statusFilter: 'all',
      categoryFilter: 'all',
      agencyFilter: 'all',
      alertFilter: 'all',
      viewMode: 'table', // 'table' or 'grid'
      selectedInstrument: null,
      selectedCertificate: null
    };

    this.init();
  }

  init() {
    this.renderAppStructure();
    this.bindEvents();
    this.updateActiveUserUI();
    this.renderCurrentTab();
  }

  getActiveUser() {
    return this.state.users.find(u => u.id === this.state.activeUserId) || this.state.users[0];
  }

  saveState(key) {
    StorageManager.set(key, this.state[key]);
  }

  // --- UI Structure & Navigation ---
  renderAppStructure() {
    const root = document.getElementById('app');
    root.innerHTML = `
      <!-- Top Navigation Bar -->
      <header class="sticky top-0 z-40 glass-panel border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <i data-lucide="gauge" class="w-5 h-5 text-cyan-400"></i>
            </div>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="font-bold text-lg tracking-tight text-slate-100">CalibGuard</h1>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v2.5 Configurable Alerts</span>
            </div>
            <p class="text-xs text-slate-400">Measuring Instruments Calibration & Alert System</p>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Configurable Alert Window Selector -->
          <div class="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <i data-lucide="sliders" class="w-3.5 h-3.5 text-cyan-400"></i>
            <span class="text-[11px] text-slate-400 font-medium hidden sm:inline">Alert Window:</span>
            <select id="globalThresholdSelect" class="bg-transparent text-slate-200 text-xs font-bold focus:outline-none cursor-pointer">
              <option value="3" ${this.state.alertThresholdDays === 3 ? 'selected' : ''} class="bg-slate-900 text-slate-200">3 Days Prior</option>
              <option value="7" ${this.state.alertThresholdDays === 7 ? 'selected' : ''} class="bg-slate-900 text-slate-200">7 Days Prior (Default)</option>
              <option value="14" ${this.state.alertThresholdDays === 14 ? 'selected' : ''} class="bg-slate-900 text-slate-200">14 Days Prior</option>
              <option value="30" ${this.state.alertThresholdDays === 30 ? 'selected' : ''} class="bg-slate-900 text-slate-200">30 Days Prior</option>
            </select>
          </div>

          <!-- Alert Notification Quick Badge -->
          <button id="quickAlertBtn" class="relative group flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all">
            <i data-lucide="bell" class="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform"></i>
            <span id="quickAlertLabel" class="text-xs font-semibold text-slate-200">${this.state.alertThresholdDays}-Day Alerts</span>
            <span id="urgentAlertCountBadge" class="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-slate-950 badge-glow-amber">0</span>
          </button>

          <!-- User Role Switcher Dropdown -->
          <div class="relative flex items-center space-x-2 pl-3 border-l border-slate-800">
            <div id="userRoleBadge" class="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 cursor-pointer hover:border-cyan-500/50 transition-all">
              <div id="userAvatar" class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center">
                MV
              </div>
              <div class="text-left hidden md:block">
                <div id="userName" class="text-xs font-semibold text-slate-200 leading-tight">Marcus Vance</div>
                <div id="userRoleTag" class="text-[10px] text-cyan-400 font-medium leading-tight">System Admin</div>
              </div>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
            </div>

            <!-- Role Selector Dropdown -->
            <div id="userSelectorMenu" class="hidden absolute right-0 top-12 w-64 glass-panel rounded-xl border border-slate-700 p-2 shadow-2xl z-50">
              <div class="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                Switch Active User / Role
              </div>
              <div id="userListOptions" class="space-y-1"></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Layout Container -->
      <div class="flex min-h-[calc(100vh-65px)]">
        <!-- Sidebar Navigation -->
        <aside class="w-64 glass-panel border-r border-slate-800/80 p-4 shrink-0 hidden lg:block flex flex-col justify-between">
          <div class="space-y-6">
            <div class="space-y-1">
              <div class="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Core Navigation</div>
              
              <button data-tab="dashboard" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-300 hover:bg-slate-800/60 hover:text-cyan-400">
                <div class="flex items-center space-x-3">
                  <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                  <span>Dashboard</span>
                </div>
              </button>

              <button data-tab="alerts" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-300 hover:bg-slate-800/60 hover:text-amber-400">
                <div class="flex items-center space-x-3">
                  <i data-lucide="shield-alert" class="w-4 h-4 text-amber-400"></i>
                  <span>7-Day Alerts</span>
                </div>
                <span id="sidebarAlertBadge" class="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">0</span>
              </button>

              <button data-tab="instruments" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-300 hover:bg-slate-800/60 hover:text-cyan-400">
                <div class="flex items-center space-x-3">
                  <i data-lucide="compass" class="w-4 h-4"></i>
                  <span>Instruments</span>
                </div>
                <span id="sidebarTotalInstruments" class="text-xs text-slate-500">0</span>
              </button>

              <button data-tab="agencies" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-300 hover:bg-slate-800/60 hover:text-cyan-400">
                <div class="flex items-center space-x-3">
                  <i data-lucide="building-2" class="w-4 h-4"></i>
                  <span>Agencies & Labs</span>
                </div>
                <span id="sidebarAgenciesCount" class="text-xs text-slate-500">0</span>
              </button>

              <button data-tab="users" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-300 hover:bg-slate-800/60 hover:text-cyan-400">
                <div class="flex items-center space-x-3">
                  <i data-lucide="users" class="w-4 h-4"></i>
                  <span>User Roles</span>
                </div>
              </button>

              <button data-tab="reports" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-300 hover:bg-slate-800/60 hover:text-cyan-400">
                <div class="flex items-center space-x-3">
                  <i data-lucide="file-bar-chart" class="w-4 h-4"></i>
                  <span>Audit Reports</span>
                </div>
              </button>
            </div>

            <!-- Quick Action Box -->
            <div class="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
              <div class="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                <i data-lucide="plus-circle" class="w-4 h-4 text-cyan-400"></i>
                <span>Quick Actions</span>
              </div>
              <button id="btnQuickCalibrate" class="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-1.5">
                <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                <span>Log Calibration</span>
              </button>
              <button id="btnQuickAddInstrument" class="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-1.5">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>Add Instrument</span>
              </button>
            </div>
          </div>

          <!-- Bottom Footer Note -->
          <div class="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div class="flex items-center justify-between">
              <span>System Date:</span>
              <span class="font-mono text-slate-400">2026-07-18</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Alert Window:</span>
              <span class="font-semibold text-amber-400">7 Days Prior</span>
            </div>
          </div>
        </aside>

        <!-- Main Content Canvas -->
        <main class="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl mx-auto space-y-6">
          <!-- Toast Notifications Container -->
          <div id="toastContainer" class="fixed bottom-6 right-6 z-50 space-y-2"></div>

          <!-- Dynamic Tab Content Container -->
          <div id="tabContent"></div>
        </main>
      </div>

      <!-- Shared Modal Container -->
      <div id="modalContainer" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"></div>
    `;

    lucide.createIcons();
  }

  bindEvents() {
    // Navigation tab switching
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Configurable Alert Window threshold selector listener
    document.getElementById('globalThresholdSelect')?.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      this.state.alertThresholdDays = val;
      this.saveState('alertThresholdDays');
      
      const label = document.getElementById('quickAlertLabel');
      if (label) label.innerText = `${val}-Day Alerts`;

      this.showToast(`Alert Window threshold updated to ${val} days!`, 'info');
      this.updateGlobalBadges();
      this.renderCurrentTab();
    });

    // Quick Alert Header Button
    document.getElementById('quickAlertBtn').addEventListener('click', () => {
      this.switchTab('alerts');
    });

    // User Role Switcher Menu Toggle
    const roleBadge = document.getElementById('userRoleBadge');
    const roleMenu = document.getElementById('userSelectorMenu');
    roleBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      roleMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      roleMenu.classList.add('hidden');
    });

    // Quick Action Sidebar Buttons
    document.getElementById('btnQuickCalibrate').addEventListener('click', () => {
      this.openCalibrationModal();
    });

    document.getElementById('btnQuickAddInstrument').addEventListener('click', () => {
      this.openInstrumentModal();
    });
  }

  updateActiveUserUI() {
    const user = this.getActiveUser();
    document.getElementById('userAvatar').innerText = user.avatar;
    document.getElementById('userName').innerText = user.name;
    document.getElementById('userRoleTag').innerText = this.formatRoleLabel(user.role);

    // Populate user switcher dropdown
    const optionsContainer = document.getElementById('userListOptions');
    optionsContainer.innerHTML = this.state.users.map(u => `
      <div class="user-select-option p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between ${u.id === user.id ? 'bg-cyan-500/10 border border-cyan-500/30' : ''}" data-user-id="${u.id}">
        <div class="flex items-center space-x-2.5">
          <div class="w-6 h-6 rounded bg-slate-800 text-cyan-400 text-[10px] font-bold flex items-center justify-center border border-slate-700">
            ${u.avatar}
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-200">${u.name}</div>
            <div class="text-[10px] text-slate-400">${this.formatRoleLabel(u.role)}</div>
          </div>
        </div>
        ${u.id === user.id ? '<i data-lucide="check" class="w-3.5 h-3.5 text-cyan-400"></i>' : ''}
      </div>
    `).join('');

    // Attach switch listener
    optionsContainer.querySelectorAll('.user-select-option').forEach(el => {
      el.addEventListener('click', (e) => {
        const userId = e.currentTarget.dataset.userId;
        this.state.activeUserId = userId;
        this.saveState('activeUserId');
        this.updateActiveUserUI();
        this.showToast(`Switched active user to ${this.getActiveUser().name} (${this.formatRoleLabel(this.getActiveUser().role)})`, 'info');
        this.renderCurrentTab();
      });
    });

    // Update alert counts
    this.updateGlobalBadges();
    lucide.createIcons();
  }

  formatRoleLabel(role) {
    switch (role) {
      case 'Admin': return 'System Admin';
      case 'Technician': return 'Metrology Inspector';
      case 'AgencyRep': return 'Agency Representative';
      case 'Auditor': return 'Compliance Auditor';
      default: return role;
    }
  }

  updateGlobalBadges() {
    const threshold = this.state.alertThresholdDays;
    const dueUrgentCount = this.state.instruments.filter(ins => {
      const days = getDaysUntilDue(ins.nextDueDate);
      return days >= 0 && days <= threshold;
    }).length;

    const overdueCount = this.state.instruments.filter(ins => {
      return getDaysUntilDue(ins.nextDueDate) < 0;
    }).length;

    const totalAlerts = dueUrgentCount + overdueCount;

    const badge = document.getElementById('urgentAlertCountBadge');
    const sidebarBadge = document.getElementById('sidebarAlertBadge');
    
    if (badge) badge.innerText = totalAlerts;
    if (sidebarBadge) sidebarBadge.innerText = totalAlerts;

    if (badge) {
      if (totalAlerts > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    const totalIns = document.getElementById('sidebarTotalInstruments');
    if (totalIns) totalIns.innerText = this.state.instruments.length;
    const totalAgencies = document.getElementById('sidebarAgenciesCount');
    if (totalAgencies) totalAgencies.innerText = this.state.agencies.length;
  }

  switchTab(tabName) {
    this.state.activeTab = tabName;
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('nav-tab-active');
      } else {
        btn.classList.remove('nav-tab-active');
      }
    });
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    const container = document.getElementById('tabContent');
    container.innerHTML = '';

    switch (this.state.activeTab) {
      case 'dashboard':
        this.renderDashboard(container);
        break;
      case 'alerts':
        this.renderAlertsCenter(container);
        break;
      case 'instruments':
        this.renderInstrumentsView(container);
        break;
      case 'agencies':
        this.renderAgenciesView(container);
        break;
      case 'users':
        this.renderUsersView(container);
        break;
      case 'reports':
        this.renderReportsView(container);
        break;
      default:
        this.renderDashboard(container);
    }
    this.updateGlobalBadges();
    lucide.createIcons();
  }

  // ==========================================
  // VIEW 1: DASHBOARD
  // ==========================================
  renderDashboard(container) {
    const threshold = this.state.alertThresholdDays;
    const totalCount = this.state.instruments.length;
    const overdueList = this.state.instruments.filter(i => getDaysUntilDue(i.nextDueDate) < 0);
    const dueUrgentList = this.state.instruments.filter(i => {
      const days = getDaysUntilDue(i.nextDueDate);
      return days >= 0 && days <= threshold;
    });
    const validCount = this.state.instruments.filter(i => getDaysUntilDue(i.nextDueDate) > 30).length;
    const upcomingCount = this.state.instruments.filter(i => {
      const days = getDaysUntilDue(i.nextDueDate);
      return days > threshold && days <= 30;
    }).length;

    const complianceRate = totalCount > 0 
      ? Math.round(((totalCount - overdueList.length) / totalCount) * 100) 
      : 100;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Dashboard Header & Greeting -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Calibration Dashboard</span>
              <span class="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-normal border border-slate-700">Live Status (${threshold}-Day Alert Window)</span>
            </h2>
            <p class="text-sm text-slate-400">Monitoring ${totalCount} measuring instruments across ${this.state.agencies.length} agencies</p>
          </div>
          <div class="flex items-center space-x-3">
            <button id="btnExportDashboardCSV" class="px-3.5 py-2 rounded-xl glass-panel glass-panel-hover text-xs font-semibold text-slate-200 flex items-center space-x-2">
              <i data-lucide="download" class="w-4 h-4 text-cyan-400"></i>
              <span>Export Summary CSV</span>
            </button>
            <button id="btnLogCalibDash" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center space-x-2">
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
              <span>Log Calibration</span>
            </button>
          </div>
        </div>

        <!-- KPI Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Instruments Card -->
          <div class="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-slate-400">
              <span class="text-xs font-semibold uppercase tracking-wider">Total Instruments</span>
              <div class="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <i data-lucide="compass" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-slate-100">${totalCount}</div>
            <div class="text-xs text-slate-400 flex items-center space-x-1">
              <span class="text-emerald-400 font-semibold">${complianceRate}% Compliance Rate</span>
            </div>
          </div>

          <!-- OVERDUE Alert Card -->
          <div class="glass-panel rounded-2xl p-4 border border-red-500/30 ${overdueList.length > 0 ? 'bg-red-950/20 badge-glow-red' : ''} space-y-2 cursor-pointer hover:border-red-500/60 transition-all" id="cardFilterOverdue">
            <div class="flex items-center justify-between text-red-400">
              <span class="text-xs font-semibold uppercase tracking-wider">Overdue Calibrations</span>
              <div class="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                <i data-lucide="alert-triangle" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-red-400">${overdueList.length}</div>
            <div class="text-xs text-red-300 font-medium">🚨 Action required immediately</div>
          </div>

          <!-- DUE WITHIN THRESHOLD DAYS (URGENT ALERT) CARD -->
          <div class="glass-panel rounded-2xl p-4 border border-amber-500/30 ${dueUrgentList.length > 0 ? 'bg-amber-950/20 badge-glow-amber' : ''} space-y-2 cursor-pointer hover:border-amber-500/60 transition-all" id="cardFilterDue7Days">
            <div class="flex items-center justify-between text-amber-400">
              <span class="text-xs font-semibold uppercase tracking-wider">Due within ${threshold} Days</span>
              <div class="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <i data-lucide="bell" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-amber-400">${dueUrgentList.length}</div>
            <div class="text-xs text-amber-300 font-medium">⚠️ ${threshold}-Day Warning Window Active</div>
          </div>

          <!-- COMPLIANT CARD -->
          <div class="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-emerald-400">
              <span class="text-xs font-semibold uppercase tracking-wider">Compliant Instruments</span>
              <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <i data-lucide="shield-check" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-emerald-400">${validCount + upcomingCount}</div>
            <div class="text-xs text-slate-400">${validCount} valid >30d | ${upcomingCount} due ${threshold + 1}-30d</div>
          </div>
        </div>

        <!-- URGENT ALERT BANNER / WIDGET -->
        ${(dueUrgentList.length > 0 || overdueList.length > 0) ? `
          <div class="glass-panel rounded-2xl p-5 border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-red-950/30 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <i data-lucide="alert-circle" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="font-bold text-base text-slate-100">${threshold}-Day Calibration Alert Center</h3>
                  <p class="text-xs text-slate-400">Attention: ${dueUrgentList.length} instruments due within ${threshold} days & ${overdueList.length} overdue instruments require agency calibration</p>
                </div>
              </div>
              <button id="btnViewAllAlerts" class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all">
                Open Alert Center (${dueUrgentList.length + overdueList.length})
              </button>
            </div>

            <!-- Quick Alert Instrument Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${[...overdueList, ...dueUrgentList].slice(0, 3).map(ins => {
                const info = getCalibrationAlertInfo(ins.nextDueDate, threshold);
                const agency = this.state.agencies.find(a => a.id === ins.agencyId);
                return `
                  <div class="p-3.5 rounded-xl glass-panel border ${info.badgeClass} flex flex-col justify-between space-y-3">
                    <div class="flex items-start justify-between">
                      <div>
                        <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">${ins.tagId}</span>
                        <h4 class="font-bold text-sm text-slate-100 mt-1 line-clamp-1">${ins.name}</h4>
                      </div>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.badgeClass}">
                        ${info.shortLabel}
                      </span>
                    </div>

                    <div class="text-xs space-y-1 text-slate-300">
                      <div class="flex justify-between"><span class="text-slate-400">Due Date:</span> <span class="font-semibold text-slate-200">${formatDate(ins.nextDueDate)}</span></div>
                      <div class="flex justify-between"><span class="text-slate-400">Agency:</span> <span class="font-medium text-cyan-300">${agency ? agency.name : 'Unassigned'}</span></div>
                      <div class="flex justify-between"><span class="text-slate-400">Location:</span> <span class="text-slate-300">${ins.location}</span></div>
                    </div>

                    <button class="btnCalibrateThis w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all flex items-center justify-center space-x-1" data-ins-id="${ins.id}">
                      <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                      <span>Perform Calibration</span>
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Recent Calibration Activity Log & Agency Summary -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Recent Calibration Logs (2 cols) -->
          <div class="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-base text-slate-100 flex items-center space-x-2">
                <i data-lucide="history" class="w-4 h-4 text-cyan-400"></i>
                <span>Recent Calibration Records</span>
              </h3>
              <button id="btnViewAllLogs" class="text-xs text-cyan-400 hover:underline">View All</button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th class="py-2.5 px-3">Certificate #</th>
                    <th class="py-2.5 px-3">Instrument</th>
                    <th class="py-2.5 px-3">Agency</th>
                    <th class="py-2.5 px-3">Calib Date</th>
                    <th class="py-2.5 px-3">Result</th>
                    <th class="py-2.5 px-3 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  ${this.state.logs.slice(0, 5).map(log => {
                    const ins = this.state.instruments.find(i => i.id === log.instrumentId);
                    return `
                      <tr class="hover:bg-slate-800/40 transition-colors">
                        <td class="py-3 px-3 font-mono text-cyan-400 font-semibold">${log.certificateNo}</td>
                        <td class="py-3 px-3">
                          <div class="font-semibold text-slate-200">${ins ? ins.name : 'Instrument'}</div>
                          <div class="text-[10px] text-slate-400 font-mono">${ins ? ins.tagId : ''}</div>
                        </td>
                        <td class="py-3 px-3 text-slate-300">${log.agencyName}</td>
                        <td class="py-3 px-3 text-slate-400">${formatDate(log.calibrationDate)}</td>
                        <td class="py-3 px-3">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${log.result === 'Passed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}">
                            ${log.result}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-right">
                          <button class="btnViewCert text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-slate-800" data-log-id="${log.id}">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Agency Workload Summary Sidebar (1 col) -->
          <div class="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 class="font-bold text-base text-slate-100 flex items-center space-x-2">
              <i data-lucide="building-2" class="w-4 h-4 text-cyan-400"></i>
              <span>Calibration Agencies</span>
            </h3>

            <div class="space-y-3">
              ${this.state.agencies.map(agency => {
                const assignedIns = this.state.instruments.filter(i => i.agencyId === agency.id);
                const urgentCount = assignedIns.filter(i => getDaysUntilDue(i.nextDueDate) <= 7).length;

                return `
                  <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-xs text-slate-200 line-clamp-1">${agency.name}</span>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">${agency.code}</span>
                    </div>
                    <div class="flex items-center justify-between text-xs text-slate-400">
                      <span>Assigned Instruments:</span>
                      <span class="font-bold text-slate-200">${assignedIns.length}</span>
                    </div>
                    ${urgentCount > 0 ? `
                      <div class="flex items-center justify-between text-[11px] text-amber-400 font-medium">
                        <span>Urgent (< 7d):</span>
                        <span class="px-2 py-0.5 rounded bg-amber-500/20 font-bold">${urgentCount} items</span>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach Dashboard Listeners
    container.querySelector('#btnExportDashboardCSV')?.addEventListener('click', () => {
      this.exportInstrumentsCSV();
    });

    container.querySelector('#btnLogCalibDash')?.addEventListener('click', () => {
      this.openCalibrationModal();
    });

    container.querySelector('#btnViewAllAlerts')?.addEventListener('click', () => {
      this.switchTab('alerts');
    });

    container.querySelector('#cardFilterOverdue')?.addEventListener('click', () => {
      this.state.statusFilter = 'overdue';
      this.switchTab('instruments');
    });

    container.querySelector('#cardFilterDue7Days')?.addEventListener('click', () => {
      this.state.statusFilter = 'due-7days';
      this.switchTab('instruments');
    });

    container.querySelectorAll('.btnCalibrateThis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const insId = e.currentTarget.dataset.insId;
        this.openCalibrationModal(insId);
      });
    });

    container.querySelectorAll('.btnViewCert').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const logId = e.currentTarget.dataset.logId;
        this.openCertificateModal(logId);
      });
    });
  }

  // ==========================================
  // VIEW 2: 7-DAY ALERTS CENTER
  // ==========================================
  renderAlertsCenter(container) {
    const threshold = this.state.alertThresholdDays;
    const overdueList = this.state.instruments.filter(i => getDaysUntilDue(i.nextDueDate) < 0);
    const dueUrgentList = this.state.instruments.filter(i => {
      const days = getDaysUntilDue(i.nextDueDate);
      return days >= 0 && days <= threshold;
    });

    let displayList = [...overdueList, ...dueUrgentList];

    if (this.state.alertFilter === 'critical') {
      displayList = overdueList;
    } else if (this.state.alertFilter === 'warning') {
      displayList = dueUrgentList;
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <i data-lucide="shield-alert" class="w-6 h-6 text-amber-400"></i>
              <span>${threshold}-Day Calibration Alerts Engine</span>
            </h2>
            <p class="text-sm text-slate-400">Instruments with calibration due dates occurring within the ${threshold}-day notification window or overdue</p>
          </div>
          
          <div class="flex items-center space-x-2">
            <button id="btnNotifyAgencies" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2">
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>Broadcast Alert Emails</span>
            </button>
          </div>
        </div>

        <!-- Filter Sub-Header -->
        <div class="glass-panel p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <button class="btnAlertFilter px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.state.alertFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}" data-filter="all">
              All Active Alerts (${overdueList.length + dueUrgentList.length})
            </button>
            <button class="btnAlertFilter px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.state.alertFilter === 'critical' ? 'bg-red-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}" data-filter="critical">
              🚨 Overdue (${overdueList.length})
            </button>
            <button class="btnAlertFilter px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.state.alertFilter === 'warning' ? 'bg-amber-500/80 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}" data-filter="warning">
              ⚠️ Due in ≤ ${threshold} Days (${dueUrgentList.length})
            </button>
          </div>

          <span class="text-xs text-slate-400 hidden sm:inline">Active Window: ${threshold} Days</span>
        </div>

        <!-- Alert Cards Grid -->
        ${displayList.length === 0 ? `
          <div class="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
            <i data-lucide="check-circle-2" class="w-12 h-12 text-emerald-400 mx-auto"></i>
            <h3 class="font-bold text-lg text-slate-200">No Pending Alerts!</h3>
            <p class="text-xs text-slate-400 max-w-md mx-auto">All instruments are compliant and have calibration due dates beyond the ${threshold}-day alert threshold.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${displayList.map(ins => {
              const alertInfo = getCalibrationAlertInfo(ins.nextDueDate, threshold);
              const agency = this.state.agencies.find(a => a.id === ins.agencyId);
              const days = getDaysUntilDue(ins.nextDueDate);

              return `
                <div class="glass-panel rounded-2xl p-5 border ${alertInfo.badgeClass} flex flex-col justify-between space-y-4">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-700">${ins.tagId}</span>
                      <span class="text-xs font-bold px-3 py-1 rounded-full border ${alertInfo.badgeClass}">
                        ${alertInfo.label}
                      </span>
                    </div>

                    <h3 class="font-bold text-base text-slate-100 mt-2">${ins.name}</h3>
                    <p class="text-xs text-slate-400">${ins.manufacturer} ${ins.model} | Serial: <span class="font-mono text-slate-300">${ins.serialNo}</span></p>
                  </div>

                  <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1.5">
                    <div class="flex justify-between">
                      <span class="text-slate-400">Location / Dept:</span>
                      <span class="font-medium text-slate-200">${ins.location}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Assigned Agency:</span>
                      <span class="font-semibold text-cyan-400">${agency ? agency.name : 'Not Assigned'}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Last Calibrated:</span>
                      <span class="text-slate-300">${formatDate(ins.lastCalibratedDate)}</span>
                    </div>
                    <div class="flex justify-between pt-1 border-t border-slate-800">
                      <span class="text-slate-400">Next Due Date:</span>
                      <span class="font-bold ${days < 0 ? 'text-red-400' : 'text-amber-400'}">${formatDate(ins.nextDueDate)}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <button class="btnSendAgencyEmail px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center space-x-1" data-ins-id="${ins.id}" data-agency-name="${agency ? agency.name : ''}">
                      <i data-lucide="mail" class="w-3.5 h-3.5 text-amber-400"></i>
                      <span>Send Alert Email</span>
                    </button>

                    <button class="btnCalibrateThis px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center space-x-1" data-ins-id="${ins.id}">
                      <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                      <span>Calibrate Now</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    // Attach Alert Filter listeners
    container.querySelectorAll('.btnAlertFilter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.state.alertFilter = e.currentTarget.dataset.filter;
        this.renderAlertsCenter(container);
        lucide.createIcons();
      });
    });

    container.querySelector('#btnNotifyAgencies')?.addEventListener('click', () => {
      this.showToast(`Alert notifications dispatched to all assigned agencies (${this.state.agencies.length} agencies updated)`, 'success');
    });

    container.querySelectorAll('.btnSendAgencyEmail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const agencyName = e.currentTarget.dataset.agencyName || 'Calibration Agency';
        this.showToast(`Urgent 7-day calibration request email sent to ${agencyName}!`, 'info');
      });
    });

    container.querySelectorAll('.btnCalibrateThis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const insId = e.currentTarget.dataset.insId;
        this.openCalibrationModal(insId);
      });
    });
  }

  // ==========================================
  // VIEW 3: INSTRUMENTS INVENTORY
  // ==========================================
  renderInstrumentsView(container) {
    const threshold = this.state.alertThresholdDays;
    const categories = ['all', ...new Set(this.state.instruments.map(i => i.category))];

    // Filter instruments
    let filtered = this.state.instruments.filter(ins => {
      const q = this.state.searchQuery.toLowerCase();
      const matchesSearch = ins.name.toLowerCase().includes(q) || 
                            ins.tagId.toLowerCase().includes(q) || 
                            ins.serialNo.toLowerCase().includes(q) ||
                            ins.location.toLowerCase().includes(q);

      const matchesCat = this.state.categoryFilter === 'all' || ins.category === this.state.categoryFilter;
      const matchesAgency = this.state.agencyFilter === 'all' || ins.agencyId === this.state.agencyFilter;

      let matchesStatus = true;
      const days = getDaysUntilDue(ins.nextDueDate);
      if (this.state.statusFilter === 'overdue') matchesStatus = days < 0;
      else if (this.state.statusFilter === 'due-7days') matchesStatus = days >= 0 && days <= threshold;
      else if (this.state.statusFilter === 'valid') matchesStatus = days > 30;

      return matchesSearch && matchesCat && matchesAgency && matchesStatus;
    });

    const user = this.getActiveUser();
    const canAddEdit = user.role === 'Admin' || user.role === 'Technician';

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-100">Instruments Inventory</h2>
            <p class="text-sm text-slate-400">Comprehensive list of all measuring equipment, calibration schedules & agency assignments</p>
          </div>

          <div class="flex items-center space-x-3">
            ${canAddEdit ? `
              <button id="btnAddInstrumentMain" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center space-x-2">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Add New Instrument</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Filter Controls Bar -->
        <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- Search -->
            <div class="relative">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
              <input type="text" id="searchInput" placeholder="Search ID, Name, Serial, Dept..." value="${this.state.searchQuery}" class="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs">
            </div>

            <!-- Category Filter -->
            <select id="categoryFilter" class="glass-input px-3 py-2 rounded-xl text-xs">
              <option value="all">All Categories (${categories.length - 1})</option>
              ${categories.filter(c => c !== 'all').map(c => `<option value="${c}" ${this.state.categoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>

            <!-- Status Filter -->
            <select id="statusFilter" class="glass-input px-3 py-2 rounded-xl text-xs">
              <option value="all">All Alert Statuses</option>
              <option value="due-7days" ${this.state.statusFilter === 'due-7days' ? 'selected' : ''}>⚠️ Due within ${threshold} Days</option>
              <option value="overdue" ${this.state.statusFilter === 'overdue' ? 'selected' : ''}>🚨 Overdue</option>
              <option value="valid" ${this.state.statusFilter === 'valid' ? 'selected' : ''}>🟢 Compliant</option>
            </select>

            <!-- Agency Filter -->
            <select id="agencyFilter" class="glass-input px-3 py-2 rounded-xl text-xs">
              <option value="all">All Calibration Agencies</option>
              ${this.state.agencies.map(a => `<option value="${a.id}" ${this.state.agencyFilter === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Instruments List Table -->
        <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3 px-4">Tag ID / Name</th>
                  <th class="py-3 px-4">Category & Model</th>
                  <th class="py-3 px-4">Location</th>
                  <th class="py-3 px-4">Assigned Agency</th>
                  <th class="py-3 px-4">Last Calib</th>
                  <th class="py-3 px-4">Next Due Date</th>
                  <th class="py-3 px-4">${threshold}-Day Alert Status</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="8" class="py-8 text-center text-slate-400">No instruments matched your filter criteria.</td>
                  </tr>
                ` : filtered.map(ins => {
                  const alertInfo = getCalibrationAlertInfo(ins.nextDueDate, threshold);
                  const agency = this.state.agencies.find(a => a.id === ins.agencyId);

                  return `
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-3.5 px-4">
                        <div class="font-bold text-slate-100 text-sm">${ins.name}</div>
                        <div class="font-mono text-[10px] text-cyan-400 mt-0.5">${ins.tagId}</div>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="text-slate-200 font-medium">${ins.category}</div>
                        <div class="text-[10px] text-slate-400">${ins.manufacturer} ${ins.model}</div>
                      </td>
                      <td class="py-3.5 px-4 text-slate-300">${ins.location}</td>
                      <td class="py-3.5 px-4 font-medium text-cyan-300">
                        ${agency ? agency.name : 'Unassigned'}
                      </td>
                      <td class="py-3.5 px-4 text-slate-400">${formatDate(ins.lastCalibratedDate)}</td>
                      <td class="py-3.5 px-4 font-bold text-slate-200">${formatDate(ins.nextDueDate)}</td>
                      <td class="py-3.5 px-4">
                        <span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${alertInfo.badgeClass}">
                          <span>${alertInfo.label}</span>
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-right space-x-1">
                        <button class="btnCalibrateThis p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30" data-ins-id="${ins.id}" title="Log Calibration">
                          <i data-lucide="check-square" class="w-4 h-4"></i>
                        </button>
                        ${canAddEdit ? `
                          <button class="btnEditIns p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700" data-ins-id="${ins.id}" title="Edit Instrument">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                          </button>
                        ` : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Attach Instrument View Event Listeners
    container.querySelector('#searchInput')?.addEventListener('input', (e) => {
      this.state.searchQuery = e.target.value;
      this.renderInstrumentsView(container);
      lucide.createIcons();
    });

    container.querySelector('#categoryFilter')?.addEventListener('change', (e) => {
      this.state.categoryFilter = e.target.value;
      this.renderInstrumentsView(container);
      lucide.createIcons();
    });

    container.querySelector('#statusFilter')?.addEventListener('change', (e) => {
      this.state.statusFilter = e.target.value;
      this.renderInstrumentsView(container);
      lucide.createIcons();
    });

    container.querySelector('#agencyFilter')?.addEventListener('change', (e) => {
      this.state.agencyFilter = e.target.value;
      this.renderInstrumentsView(container);
      lucide.createIcons();
    });

    container.querySelector('#btnAddInstrumentMain')?.addEventListener('click', () => {
      this.openInstrumentModal();
    });

    container.querySelectorAll('.btnCalibrateThis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const insId = e.currentTarget.dataset.insId;
        this.openCalibrationModal(insId);
      });
    });

    container.querySelectorAll('.btnEditIns').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const insId = e.currentTarget.dataset.insId;
        this.openInstrumentModal(insId);
      });
    });
  }

  // ==========================================
  // VIEW 4: AGENCIES MANAGEMENT
  // ==========================================
  renderAgenciesView(container) {
    const user = this.getActiveUser();
    const canAddEdit = user.role === 'Admin';

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <i data-lucide="building-2" class="w-6 h-6 text-cyan-400"></i>
              <span>Calibration Agencies & External Service Providers</span>
            </h2>
            <p class="text-sm text-slate-400">Manage multiple calibration laboratories, ISO 17025 accreditations, and contacts</p>
          </div>

          ${canAddEdit ? `
            <button id="btnAddAgencyMain" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center space-x-2">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Register New Agency</span>
            </button>
          ` : ''}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${this.state.agencies.map(agency => {
            const assignedInstruments = this.state.instruments.filter(i => i.agencyId === agency.id);
            const urgent7Days = assignedInstruments.filter(i => getDaysUntilDue(i.nextDueDate) <= 7);

            return `
              <div class="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
                <div class="space-y-3">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 font-bold border border-slate-800">${agency.code}</span>
                      <h3 class="font-bold text-lg text-slate-100 mt-1">${agency.name}</h3>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      ${agency.status}
                    </span>
                  </div>

                  <div class="text-xs text-slate-300 space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div class="flex items-center space-x-2 text-slate-300">
                      <i data-lucide="award" class="w-4 h-4 text-cyan-400"></i>
                      <span class="font-medium">${agency.accreditation}</span>
                    </div>
                    <div class="flex items-center space-x-2 text-slate-400">
                      <i data-lucide="user" class="w-4 h-4 text-slate-500"></i>
                      <span>Contact: <strong class="text-slate-200">${agency.contactPerson}</strong></span>
                    </div>
                    <div class="flex items-center space-x-2 text-slate-400">
                      <i data-lucide="mail" class="w-4 h-4 text-slate-500"></i>
                      <span>${agency.email}</span>
                    </div>
                    <div class="flex items-center space-x-2 text-slate-400">
                      <i data-lucide="phone" class="w-4 h-4 text-slate-500"></i>
                      <span>${agency.phone}</span>
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-slate-400">Assigned Equipment:</span>
                    <span class="font-bold text-cyan-400 ml-1.5">${assignedInstruments.length} items</span>
                  </div>
                  ${urgent7Days.length > 0 ? `
                    <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                      ⚠️ ${urgent7Days.length} Due Soon
                    </span>
                  ` : `
                    <span class="text-slate-500 text-[11px]">Turnaround: ${agency.avgTurnaroundDays} days</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelector('#btnAddAgencyMain')?.addEventListener('click', () => {
      this.openAgencyModal();
    });
  }

  // ==========================================
  // VIEW 5: USER MANAGEMENT & ROLES
  // ==========================================
  renderUsersView(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <i data-lucide="users" class="w-6 h-6 text-cyan-400"></i>
              <span>Multi-User System & Access Roles</span>
            </h2>
            <p class="text-sm text-slate-400">Manage user accounts, department assignments, and role permissions</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${this.state.users.map(u => {
            const isCurrent = u.id === this.state.activeUserId;
            const agency = u.assignedAgencyId ? this.state.agencies.find(a => a.id === u.assignedAgencyId) : null;

            return `
              <div class="glass-panel rounded-2xl p-5 border ${isCurrent ? 'border-cyan-500 shadow-cyan-500/10' : 'border-slate-800'} flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-sm flex items-center justify-center border border-cyan-500/40">
                      ${u.avatar}
                    </div>
                    <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900 text-cyan-400 border border-slate-700">
                      ${this.formatRoleLabel(u.role)}
                    </span>
                  </div>

                  <div>
                    <h3 class="font-bold text-base text-slate-100">${u.name}</h3>
                    <p class="text-xs text-slate-400">${u.email}</p>
                  </div>

                  <div class="text-xs text-slate-400 space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>Dept: <strong class="text-slate-300">${u.department}</strong></div>
                    ${agency ? `<div>Agency: <strong class="text-cyan-400">${agency.name}</strong></div>` : ''}
                  </div>
                </div>

                <button class="btnSwitchToThisUser w-full py-2 rounded-xl text-xs font-bold transition-all ${isCurrent ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}" data-user-id="${u.id}">
                  ${isCurrent ? 'Active Current User' : 'Switch To User'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.btnSwitchToThisUser').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.currentTarget.dataset.userId;
        this.state.activeUserId = uid;
        this.saveState('activeUserId');
        this.updateActiveUserUI();
        this.showToast(`Switched active profile to ${this.getActiveUser().name}`, 'info');
        this.renderUsersView(container);
      });
    });
  }

  // ==========================================
  // VIEW 6: REPORTS & CSV EXPORT
  // ==========================================
  renderReportsView(container) {
    const total = this.state.instruments.length;
    const overdue = this.state.instruments.filter(i => getDaysUntilDue(i.nextDueDate) < 0).length;
    const due7 = this.state.instruments.filter(i => {
      const d = getDaysUntilDue(i.nextDueDate);
      return d >= 0 && d <= 7;
    }).length;
    const compliant = total - overdue;
    const rate = total > 0 ? Math.round((compliant / total) * 100) : 100;

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <i data-lucide="file-bar-chart" class="w-6 h-6 text-cyan-400"></i>
              <span>Calibration Compliance & Audit Reports</span>
            </h2>
            <p class="text-sm text-slate-400">Generate compliance audit logs and download raw CSV datasets</p>
          </div>

          <button id="btnExportFullCSV" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center space-x-2">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Export Calibration Audit Report (CSV)</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-2">
            <div class="text-4xl font-extrabold text-emerald-400">${rate}%</div>
            <div class="text-xs font-semibold uppercase text-slate-400">Compliance Rate</div>
          </div>
          <div class="glass-panel p-6 rounded-2xl border border-amber-500/30 text-center space-y-2">
            <div class="text-4xl font-extrabold text-amber-400">${due7}</div>
            <div class="text-xs font-semibold uppercase text-slate-400">7-Day Alert Window Items</div>
          </div>
          <div class="glass-panel p-6 rounded-2xl border border-red-500/30 text-center space-y-2">
            <div class="text-4xl font-extrabold text-red-400">${overdue}</div>
            <div class="text-xs font-semibold uppercase text-slate-400">Non-Compliant (Overdue)</div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btnExportFullCSV')?.addEventListener('click', () => {
      this.exportInstrumentsCSV();
    });
  }

  // ==========================================
  // MODALS & ACTIONS
  // ==========================================
  openCalibrationModal(insId = null) {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.classList.remove('hidden');

    const defaultIns = insId ? this.state.instruments.find(i => i.id === insId) : this.state.instruments[0];
    const user = this.getActiveUser();

    modalContainer.innerHTML = `
      <div class="glass-panel modal-enter w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="font-bold text-lg text-slate-100 flex items-center space-x-2">
            <i data-lucide="check-square" class="w-5 h-5 text-cyan-400"></i>
            <span>Log Calibration Record</span>
          </h3>
          <button id="btnCloseModal" class="text-slate-400 hover:text-slate-200">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="calibForm" class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold">Select Instrument</label>
            <select id="calibInstrumentSelect" class="glass-input w-full p-2.5 rounded-xl">
              ${this.state.instruments.map(i => `<option value="${i.id}" ${defaultIns && defaultIns.id === i.id ? 'selected' : ''}>${i.tagId} - ${i.name}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 font-semibold">Calibration Date</label>
              <input type="date" id="calibDate" value="2026-07-18" class="glass-input w-full p-2 rounded-xl">
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-semibold">Next Due Date (Auto)</label>
              <input type="date" id="calibNextDue" value="${calculateNextDueDate('2026-07-18', defaultIns ? defaultIns.frequencyMonths : 6)}" class="glass-input w-full p-2 rounded-xl bg-slate-900/90">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 font-semibold">Calibration Agency</label>
              <select id="calibAgency" class="glass-input w-full p-2 rounded-xl">
                ${this.state.agencies.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-semibold">Calibration Result</label>
              <select id="calibResult" class="glass-input w-full p-2 rounded-xl">
                <option value="Passed">Passed (Compliant)</option>
                <option value="Failed">Failed (Out of Tolerance)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-semibold">Certificate Number</label>
            <input type="text" id="calibCertNo" value="CERT-2026-${Math.floor(10000 + Math.random() * 90000)}" class="glass-input w-full p-2 rounded-xl font-mono text-cyan-300">
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-semibold">Notes / Environmental Parameters</label>
            <textarea id="calibNotes" rows="2" class="glass-input w-full p-2 rounded-xl" placeholder="Temp: 20°C, RH: 50%, Standard Gauge Blocks used..."></textarea>
          </div>

          <div class="pt-3 flex justify-end space-x-3 border-t border-slate-800">
            <button type="button" id="btnCancelCalib" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">Save & Generate Certificate</button>
          </div>
        </form>
      </div>
    `;

    lucide.createIcons();

    // Event handlers
    const closeModal = () => modalContainer.classList.add('hidden');
    modalContainer.querySelector('#btnCloseModal').addEventListener('click', closeModal);
    modalContainer.querySelector('#btnCancelCalib').addEventListener('click', closeModal);

    modalContainer.querySelector('#calibInstrumentSelect').addEventListener('change', (e) => {
      const ins = this.state.instruments.find(i => i.id === e.target.value);
      if (ins) {
        document.getElementById('calibNextDue').value = calculateNextDueDate(document.getElementById('calibDate').value, ins.frequencyMonths);
      }
    });

    modalContainer.querySelector('#calibDate').addEventListener('change', (e) => {
      const ins = this.state.instruments.find(i => i.id === document.getElementById('calibInstrumentSelect').value);
      if (ins) {
        document.getElementById('calibNextDue').value = calculateNextDueDate(e.target.value, ins.frequencyMonths);
      }
    });

    modalContainer.querySelector('#calibForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const insId = document.getElementById('calibInstrumentSelect').value;
      const calibDate = document.getElementById('calibDate').value;
      const nextDue = document.getElementById('calibNextDue').value;
      const agencyId = document.getElementById('calibAgency').value;
      const result = document.getElementById('calibResult').value;
      const certNo = document.getElementById('calibCertNo').value;
      const notes = document.getElementById('calibNotes').value;

      const agency = this.state.agencies.find(a => a.id === agencyId);

      // Create log
      const newLog = {
        id: `LOG-${Date.now()}`,
        instrumentId: insId,
        calibrationDate: calibDate,
        nextDueDate: nextDue,
        agencyId: agencyId,
        agencyName: agency ? agency.name : 'Unknown Agency',
        performedBy: user.name,
        certificateNo: certNo,
        result: result,
        notes: notes || 'Calibrated successfully in accordance with ISO 17025 procedures.'
      };

      this.state.logs.unshift(newLog);
      this.saveState('logs');

      // Update instrument status & dates
      const insIndex = this.state.instruments.findIndex(i => i.id === insId);
      if (insIndex !== -1) {
        this.state.instruments[insIndex].lastCalibratedDate = calibDate;
        this.state.instruments[insIndex].nextDueDate = nextDue;
        this.state.instruments[insIndex].status = result === 'Passed' ? 'Active' : 'Out of Calibration';
        this.saveState('instruments');
      }

      closeModal();
      this.showToast(`Calibration recorded! Alert cleared for ${this.state.instruments[insIndex].tagId}`, 'success');
      this.renderCurrentTab();
      this.openCertificateModal(newLog.id);
    });
  }

  openInstrumentModal(insId = null) {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.classList.remove('hidden');

    const isEdit = !!insId;
    const ins = isEdit ? this.state.instruments.find(i => i.id === insId) : null;

    modalContainer.innerHTML = `
      <div class="glass-panel modal-enter w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="font-bold text-lg text-slate-100">${isEdit ? 'Edit Instrument' : 'Add Measuring Instrument'}</h3>
          <button id="btnCloseInsModal" class="text-slate-400 hover:text-slate-200">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="insForm" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Tag ID</label>
              <input type="text" id="insTagId" value="${ins ? ins.tagId : 'EQ-NEW-' + Math.floor(100 + Math.random()*900)}" class="glass-input w-full p-2 rounded-xl font-mono text-cyan-300" required>
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Instrument Name</label>
              <input type="text" id="insName" value="${ins ? ins.name : ''}" class="glass-input w-full p-2 rounded-xl" placeholder="e.g. Vernier Caliper" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Category</label>
              <select id="insCategory" class="glass-input w-full p-2 rounded-xl">
                <option value="Dimensional" ${ins && ins.category === 'Dimensional' ? 'selected' : ''}>Dimensional</option>
                <option value="Pressure" ${ins && ins.category === 'Pressure' ? 'selected' : ''}>Pressure</option>
                <option value="Torque & Force" ${ins && ins.category === 'Torque & Force' ? 'selected' : ''}>Torque & Force</option>
                <option value="Thermal" ${ins && ins.category === 'Thermal' ? 'selected' : ''}>Thermal</option>
                <option value="Electrical" ${ins && ins.category === 'Electrical' ? 'selected' : ''}>Electrical</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Serial Number</label>
              <input type="text" id="insSerialNo" value="${ins ? ins.serialNo : ''}" class="glass-input w-full p-2 rounded-xl font-mono" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Calib Frequency (Months)</label>
              <input type="number" id="insFreq" value="${ins ? ins.frequencyMonths : 6}" class="glass-input w-full p-2 rounded-xl" required>
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Assigned Agency</label>
              <select id="insAgency" class="glass-input w-full p-2 rounded-xl">
                ${this.state.agencies.map(a => `<option value="${a.id}" ${ins && ins.agencyId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Last Calibration Date</label>
              <input type="date" id="insLastCalib" value="${ins ? ins.lastCalibratedDate : '2026-01-18'}" class="glass-input w-full p-2 rounded-xl">
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Location / Shop Floor</label>
              <input type="text" id="insLocation" value="${ins ? ins.location : 'Plant A - Bay 1'}" class="glass-input w-full p-2 rounded-xl">
            </div>
          </div>

          <div class="pt-3 flex justify-end space-x-3 border-t border-slate-800">
            <button type="button" id="btnCancelIns" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">Save Instrument</button>
          </div>
        </form>
      </div>
    `;

    lucide.createIcons();
    const closeModal = () => modalContainer.classList.add('hidden');
    modalContainer.querySelector('#btnCloseInsModal').addEventListener('click', closeModal);
    modalContainer.querySelector('#btnCancelIns').addEventListener('click', closeModal);

    modalContainer.querySelector('#insForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const tagId = document.getElementById('insTagId').value;
      const name = document.getElementById('insName').value;
      const category = document.getElementById('insCategory').value;
      const serialNo = document.getElementById('insSerialNo').value;
      const freq = parseInt(document.getElementById('insFreq').value, 10);
      const agencyId = document.getElementById('insAgency').value;
      const lastCalib = document.getElementById('insLastCalib').value;
      const location = document.getElementById('insLocation').value;

      const nextDue = calculateNextDueDate(lastCalib, freq);

      if (isEdit) {
        const idx = this.state.instruments.findIndex(i => i.id === insId);
        if (idx !== -1) {
          this.state.instruments[idx] = {
            ...this.state.instruments[idx],
            tagId, name, category, serialNo, frequencyMonths: freq, agencyId, lastCalibratedDate: lastCalib, nextDueDate: nextDue, location
          };
        }
      } else {
        const newIns = {
          id: `INS-${Date.now()}`,
          tagId, name, category, manufacturer: 'Generic', model: 'M-1', serialNo, location, frequencyMonths: freq,
          lastCalibratedDate: lastCalib, nextDueDate: nextDue, agencyId, assignedUser: this.getActiveUser().name,
          tolerance: '±0.01', status: 'Active', criticality: 'Medium'
        };
        this.state.instruments.unshift(newIns);
      }

      this.saveState('instruments');
      closeModal();
      this.showToast(`Instrument ${tagId} saved successfully!`, 'success');
      this.renderCurrentTab();
    });
  }

  openCertificateModal(logId) {
    const log = this.state.logs.find(l => l.id === logId);
    if (!log) return;

    const ins = this.state.instruments.find(i => i.id === log.instrumentId);
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.classList.remove('hidden');

    modalContainer.innerHTML = `
      <div class="glass-panel modal-enter w-full max-w-2xl rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-6 bg-slate-950 text-slate-100">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center space-x-2">
            <i data-lucide="award" class="w-6 h-6 text-amber-400"></i>
            <h3 class="font-bold text-lg">Official Calibration Certificate</h3>
          </div>
          <button id="btnCloseCertModal" class="text-slate-400 hover:text-slate-200">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 text-xs">
          <div class="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <div class="font-bold text-base text-cyan-400">${log.agencyName}</div>
              <div class="text-[11px] text-slate-400">ISO/IEC 17025 Accredited Calibration Laboratory</div>
            </div>
            <div class="text-right font-mono">
              <div class="text-slate-400 text-[10px]">CERTIFICATE NO</div>
              <div class="font-bold text-amber-400 text-sm">${log.certificateNo}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-slate-400">Equipment Name:</span>
              <div class="font-bold text-slate-100 text-sm mt-0.5">${ins ? ins.name : 'N/A'}</div>
            </div>
            <div>
              <span class="text-slate-400">Tag / Asset ID:</span>
              <div class="font-mono font-bold text-cyan-300 mt-0.5">${ins ? ins.tagId : 'N/A'}</div>
            </div>
            <div>
              <span class="text-slate-400">Calibration Date:</span>
              <div class="font-semibold text-slate-200 mt-0.5">${formatDate(log.calibrationDate)}</div>
            </div>
            <div>
              <span class="text-slate-400">Next Recalibration Due:</span>
              <div class="font-bold text-amber-400 mt-0.5">${formatDate(log.nextDueDate)}</div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div class="text-slate-400 font-semibold">Calibration Result:</div>
            <div class="text-emerald-400 font-bold text-sm">PASSED (COMPLIANT WITHIN ISO SPECIFICATIONS)</div>
            <div class="text-slate-400 text-[11px] mt-1">${log.notes}</div>
          </div>

          <div class="flex justify-between items-center pt-2 text-slate-400 text-[11px]">
            <div>Inspected & Certified by: <strong class="text-slate-200">${log.performedBy}</strong></div>
            <div class="font-mono text-[10px]">Digital Verification Stamp ✓</div>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button id="btnPrintCert" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2">
            <i data-lucide="printer" class="w-4 h-4"></i>
            <span>Print Certificate</span>
          </button>
        </div>
      </div>
    `;

    lucide.createIcons();
    const closeModal = () => modalContainer.classList.add('hidden');
    modalContainer.querySelector('#btnCloseCertModal').addEventListener('click', closeModal);
    modalContainer.querySelector('#btnPrintCert').addEventListener('click', () => window.print());
  }

  openAgencyModal() {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.classList.remove('hidden');

    modalContainer.innerHTML = `
      <div class="glass-panel modal-enter w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 class="font-bold text-base text-slate-100">Register Calibration Agency</h3>
          <button id="btnCloseAgencyModal" class="text-slate-400"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>

        <form id="agencyForm" class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1">Agency Name</label>
            <input type="text" id="agName" placeholder="e.g. MetroCal Standards Lab" class="glass-input w-full p-2 rounded-xl" required>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-400 mb-1">Agency Code</label>
              <input type="text" id="agCode" placeholder="MCL-LAB" class="glass-input w-full p-2 rounded-xl font-mono" required>
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Contact Person</label>
              <input type="text" id="agContact" placeholder="Dr. Jane Doe" class="glass-input w-full p-2 rounded-xl" required>
            </div>
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Email Address</label>
            <input type="email" id="agEmail" placeholder="contact@agency.com" class="glass-input w-full p-2 rounded-xl" required>
          </div>
          <div class="pt-2 flex justify-end space-x-2">
            <button type="submit" class="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">Register Agency</button>
          </div>
        </form>
      </div>
    `;

    lucide.createIcons();
    const closeModal = () => modalContainer.classList.add('hidden');
    modalContainer.querySelector('#btnCloseAgencyModal').addEventListener('click', closeModal);

    modalContainer.querySelector('#agencyForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const newAgency = {
        id: `AGN-${Date.now()}`,
        name: document.getElementById('agName').value,
        code: document.getElementById('agCode').value,
        contactPerson: document.getElementById('agContact').value,
        email: document.getElementById('agEmail').value,
        phone: '+1 (555) 000-1122',
        accreditation: 'ISO/IEC 17025 Accredited',
        status: 'Active',
        avgTurnaroundDays: 3
      };
      this.state.agencies.push(newAgency);
      this.saveState('agencies');
      closeModal();
      this.showToast(`Agency ${newAgency.name} registered!`, 'success');
      this.renderCurrentTab();
    });
  }

  exportInstrumentsCSV() {
    const data = this.state.instruments.map(ins => {
      const agency = this.state.agencies.find(a => a.id === ins.agencyId);
      const days = getDaysUntilDue(ins.nextDueDate);
      return {
        TagID: ins.tagId,
        Name: ins.name,
        Category: ins.category,
        Location: ins.location,
        Agency: agency ? agency.name : 'Unassigned',
        LastCalibrated: ins.lastCalibratedDate,
        NextDueDate: ins.nextDueDate,
        DaysRemaining: days,
        Status: days < 0 ? 'OVERDUE' : (days <= 7 ? 'DUE WITHIN 7 DAYS' : 'COMPLIANT')
      };
    });

    exportToCSV('CalibGuard_Instruments_Audit_Report.csv', data);
    this.showToast('CSV Audit Report exported successfully!', 'success');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    let bg = 'bg-slate-900 border-cyan-500/50 text-cyan-300';
    if (type === 'success') bg = 'bg-slate-900 border-emerald-500/50 text-emerald-300';
    if (type === 'warning') bg = 'bg-slate-900 border-amber-500/50 text-amber-300';

    toast.className = `p-3.5 rounded-xl border glass-panel shadow-xl text-xs font-semibold flex items-center space-x-2.5 transform transition-all duration-300 ${bg}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle-2' : 'info'}" class="w-4 h-4"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CalibGuardApp();
});
