/**
 * DIE PULL OUT ANALYSIS - DEPARTMENTAL WORKFLOW MODULE
 * Manages Design Modifications, Die Shop Resinking & Production Trial Run validation
 * Supports Role-Based Access Control and Admin Edit/Delete privileges
 */

function renderWorkflowView(container, tabName) {
  if (tabName === 'design-hub') {
    renderDesignTeamView(container);
  } else if (tabName === 'dieshop-hub') {
    renderDieShopView(container);
  } else if (tabName === 'trial-hub') {
    renderTrialRunView(container);
  }
}

// 1. Tooling Design Team View
function renderDesignTeamView(container) {
  const role = AppState.currentRole;
  const canAct = role === 'admin' || role === 'design';
  const isAdmin = role === 'admin';

  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title"><span>📐</span> Tooling Design Team Station (ECN & CAD Revisions)</h3>
          <span class="badge badge-amber">${AppState.designTasks.length} Design Orders</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
          When a Die Pull Out meeting determines root cause defect requires geometry correction, design tasks land here.
          Upon 3D model revision & ECN sign-off, the die is released to the Die Shop for resinking.
        </p>

        ${!canAct ? `
          <div style="background: #fffbebf8; border: 1px solid var(--amber-warning); padding: 10px 14px; border-radius: 8px; font-size: 13px; color: var(--amber-warning); margin-bottom: 16px;">
            ℹ️ You are viewing as <strong>${AppState.roles[role].name}</strong> (Read-Only mode for Design tasks). Switch role to <em>Tooling Design Team</em> or <em>System Admin</em> to update CAD tasks.
          </div>
        ` : ''}

        <div class="kanban-board">
          <!-- Column 1: Pending ECN -->
          <div class="kanban-column">
            <div class="column-header">
              <h3><span>⏳</span> Pending CAD Redesign</h3>
              <span class="badge badge-rose">${AppState.designTasks.filter(t => t.status === 'Pending ECN').length}</span>
            </div>
            ${renderDesignTasksByStatus('Pending ECN', canAct, isAdmin)}
          </div>

          <!-- Column 2: In Progress -->
          <div class="kanban-column">
            <div class="column-header">
              <h3><span>✏️</span> 3D Modeling & Simulation</h3>
              <span class="badge badge-amber">${AppState.designTasks.filter(t => t.status === 'In Progress').length}</span>
            </div>
            ${renderDesignTasksByStatus('In Progress', canAct, isAdmin)}
          </div>

          <!-- Column 3: Approved & Released -->
          <div class="kanban-column">
            <div class="column-header">
              <h3><span>✅</span> Released to Die Shop</h3>
              <span class="badge badge-emerald">${AppState.designTasks.filter(t => t.status === 'Completed').length}</span>
            </div>
            ${renderDesignTasksByStatus('Completed', canAct, isAdmin)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDesignTasksByStatus(status, canAct, isAdmin) {
  const tasks = AppState.designTasks.filter(t => t.status === status);
  if (tasks.length === 0) {
    return `<p style="font-size: 12px; color: var(--text-dim); text-align: center; margin-top: 20px;">No design tasks in this status</p>`;
  }

  return tasks.map(t => `
    <div class="task-card">
      <div class="task-header">
        <span class="task-id">${t.id}</span>
        <span class="badge badge-cyan">${t.ecnNumber}</span>
      </div>
      <h4 style="font-size: 14px; color: var(--text-main); font-weight: 700;">${t.title}</h4>
      <div class="task-meta">
        <div><strong>Die ID:</strong> ${t.dieId}</div>
        <div><strong>Assigned:</strong> ${t.assignedTo}</div>
        <div><strong>Created:</strong> ${t.createdAt}</div>
      </div>
      <p style="font-size: 12px; color: var(--text-muted); background: var(--bg-input); padding: 8px; border-radius: 6px;">
        ${t.description}
      </p>

      <div class="task-actions" style="flex-wrap: wrap;">
        ${canAct ? (status === 'Pending ECN' ? `
          <button class="btn btn-primary btn-sm" onclick="updateDesignTaskStatus('${t.id}', 'In Progress')">Start 3D CAD Update</button>
        ` : status === 'In Progress' ? `
          <button class="btn btn-success btn-sm" onclick="completeDesignTask('${t.id}')">Approve & Send to Die Shop</button>
        ` : `
          <span style="font-size: 12px; color: var(--emerald-success); font-weight: 600;">✓ ECN Released</span>
        `) : ''}

        ${isAdmin ? `
          <button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}', 'design')">🗑️ Delete</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

window.updateDesignTaskStatus = function(taskId, newStatus) {
  const task = AppState.designTasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    AppState.save();
    AppState.showToast(`Task ${taskId} status updated to ${newStatus}`, 'info');
    renderWorkflowView(document.getElementById('content-area'), 'design-hub');
  }
};

window.completeDesignTask = function(taskId) {
  const task = AppState.designTasks.find(t => t.id === taskId);
  if (!task) return;

  task.status = 'Completed';

  // Automatically trigger Die Shop Resink task!
  const dsTaskId = `DS-2026-${String(AppState.dieShopTasks.length + 1).padStart(3, '0')}`;
  AppState.dieShopTasks.unshift({
    id: dsTaskId,
    meetingId: task.meetingId,
    dieId: task.dieId,
    title: `Resink Die Impression (Post CAD ECN: ${task.ecnNumber})`,
    resinkDepth: 2.0,
    assignedTo: 'Vikram Kumar (Die Shop Master)',
    status: 'Queued',
    estimatedHours: 20,
    createdAt: new Date().toISOString().split('T')[0]
  });

  const die = AppState.dieSets.find(d => d.id === task.dieId);
  if (die) die.status = 'Pending Resink';

  AppState.save();
  AppState.showToast(`Design ECN complete! Die ${task.dieId} sent to Die Shop Queue (${dsTaskId})`, 'success');
  renderWorkflowView(document.getElementById('content-area'), 'design-hub');
};

// 2. Die Shop Resinking View
function renderDieShopView(container) {
  const role = AppState.currentRole;
  const canAct = role === 'admin' || role === 'dieshop';
  const isAdmin = role === 'admin';

  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title"><span>⚙️</span> Die Shop Resinking & Refurbishment Station</h3>
          <span class="badge badge-cyan">${AppState.dieShopTasks.length} Tooling Jobs</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
          Track CNC EDM resink depth, hardfacing welding, stress relief & CMM inspection.
          Once resinking is completed, the die is automatically queued for Production Trial Run.
        </p>

        ${!canAct ? `
          <div style="background: #fffbebf8; border: 1px solid var(--amber-warning); padding: 10px 14px; border-radius: 8px; font-size: 13px; color: var(--amber-warning); margin-bottom: 16px;">
            ℹ️ You are viewing as <strong>${AppState.roles[role].name}</strong> (Read-Only mode for Die Shop tasks). Switch role to <em>Die Shop Master</em> or <em>System Admin</em> to update resink jobs.
          </div>
        ` : ''}

        <div class="kanban-board">
          <!-- Column 1: Queued for Resink -->
          <div class="kanban-column">
            <div class="column-header">
              <h3><span>📥</span> Queued for Resink</h3>
              <span class="badge badge-amber">${AppState.dieShopTasks.filter(t => t.status === 'Queued').length}</span>
            </div>
            ${renderDieShopTasksByStatus('Queued', canAct, isAdmin)}
          </div>

          <!-- Column 2: In CNC / EDM Machining -->
          <div class="kanban-column">
            <div class="column-header">
              <h3><span>🛠️</span> Machining & Polishing</h3>
              <span class="badge badge-indigo">${AppState.dieShopTasks.filter(t => t.status === 'Machining').length}</span>
            </div>
            ${renderDieShopTasksByStatus('Machining', canAct, isAdmin)}
          </div>

          <!-- Column 3: CMM Certified & Passed to Trial -->
          <div class="kanban-column">
            <div class="column-header">
              <h3><span>✨</span> CMM Certified (Sent to Trial)</h3>
              <span class="badge badge-emerald">${AppState.dieShopTasks.filter(t => t.status === 'Completed').length}</span>
            </div>
            ${renderDieShopTasksByStatus('Completed', canAct, isAdmin)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDieShopTasksByStatus(status, canAct, isAdmin) {
  const tasks = AppState.dieShopTasks.filter(t => t.status === status);
  if (tasks.length === 0) {
    return `<p style="font-size: 12px; color: var(--text-dim); text-align: center; margin-top: 20px;">No die shop tasks in this queue</p>`;
  }

  return tasks.map(t => `
    <div class="task-card">
      <div class="task-header">
        <span class="task-id">${t.id}</span>
        <span class="badge badge-rose">Depth: -${t.resinkDepth} mm</span>
      </div>
      <h4 style="font-size: 14px; color: var(--text-main); font-weight: 700;">${t.title}</h4>
      <div class="task-meta">
        <div><strong>Die ID:</strong> ${t.dieId}</div>
        <div><strong>Tool Master:</strong> ${t.assignedTo}</div>
        <div><strong>Est. Time:</strong> ${t.estimatedHours} hrs</div>
      </div>

      <div class="task-actions" style="flex-wrap: wrap;">
        ${canAct ? (status === 'Queued' ? `
          <button class="btn btn-primary btn-sm" onclick="updateDieShopTaskStatus('${t.id}', 'Machining')">Start CNC EDM Resink</button>
        ` : status === 'Machining' ? `
          <button class="btn btn-success btn-sm" onclick="completeDieShopTask('${t.id}')">Complete Resink & Send to Trial</button>
        ` : `
          <span style="font-size: 12px; color: var(--emerald-success); font-weight: 600;">✓ Resink & CMM Passed</span>
        `) : ''}

        ${isAdmin ? `
          <button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}', 'dieshop')">🗑️ Delete</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

window.updateDieShopTaskStatus = function(taskId, newStatus) {
  const task = AppState.dieShopTasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    const die = AppState.dieSets.find(d => d.id === task.dieId);
    if (die) die.status = 'Resink in Progress';

    AppState.save();
    AppState.showToast(`Die Shop Job ${taskId} moved to ${newStatus}`, 'info');
    renderWorkflowView(document.getElementById('content-area'), 'dieshop-hub');
  }
};

window.completeDieShopTask = function(taskId) {
  const task = AppState.dieShopTasks.find(t => t.id === taskId);
  if (!task) return;

  task.status = 'Completed';

  // Increment Die Resink Count
  const die = AppState.dieSets.find(d => d.id === task.dieId);
  if (die) {
    die.currentResinkCount += 1;
    die.status = 'Trial Pending';
  }

  // Trigger Production Trial Task
  const trialId = `TRL-2026-${String(AppState.trialTasks.length + 1).padStart(3, '0')}`;
  AppState.trialTasks.unshift({
    id: trialId,
    dieId: task.dieId,
    title: `First-Piece Forging Trial (Post-Resink #${die ? die.currentResinkCount : 1})`,
    assignedTo: 'Mukesh Patel (Forging Production)',
    status: 'Ready for Trial',
    createdAt: new Date().toISOString().split('T')[0]
  });

  AppState.save();
  AppState.showToast(`Die Shop Resink Completed! Die ${task.dieId} sent to Production Trial (${trialId})`, 'success');
  renderWorkflowView(document.getElementById('content-area'), 'dieshop-hub');
};

// 3. Production Trial Run Station
function renderTrialRunView(container) {
  const role = AppState.currentRole;
  const canAct = role === 'admin' || role === 'production';
  const isAdmin = role === 'admin';

  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title"><span>🧪</span> Production & Trial Run Inspection Station</h3>
          <span class="badge badge-emerald">${AppState.trialTasks.length} Trial Reviews</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
          Perform first-piece dimensional & surface check on refurbished dies before releasing to mass forging runs.
        </p>

        ${!canAct ? `
          <div style="background: #fffbebf8; border: 1px solid var(--amber-warning); padding: 10px 14px; border-radius: 8px; font-size: 13px; color: var(--amber-warning); margin-bottom: 16px;">
            ℹ️ You are viewing as <strong>${AppState.roles[role].name}</strong> (Read-Only mode for Trial runs). Switch role to <em>Production Lead</em> or <em>System Admin</em> to approve trial forging.
          </div>
        ` : ''}

        <div class="kanban-board">
          <!-- Column 1: Awaiting Trial -->
          <div class="kanban-column">
            <div class="column-header">
              <h3><span>⏱️</span> Ready for Trial Run</h3>
              <span class="badge badge-amber">${AppState.trialTasks.filter(t => t.status === 'Ready for Trial').length}</span>
            </div>
            ${renderTrialTasksByStatus('Ready for Trial', canAct, isAdmin)}
          </div>

          <!-- Column 2: Mass Production Approved -->
          <div class="kanban-column">
            <div class="column-header">
              <h3><span>🚀</span> Released to Mass Production</h3>
              <span class="badge badge-emerald">${AppState.trialTasks.filter(t => t.status === 'Approved').length}</span>
            </div>
            ${renderTrialTasksByStatus('Approved', canAct, isAdmin)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTrialTasksByStatus(status, canAct, isAdmin) {
  const tasks = AppState.trialTasks.filter(t => t.status === status);
  if (tasks.length === 0) {
    return `<p style="font-size: 12px; color: var(--text-dim); text-align: center; margin-top: 20px;">No trial run tasks in this column</p>`;
  }

  return tasks.map(t => `
    <div class="task-card">
      <div class="task-header">
        <span class="task-id">${t.id}</span>
        <span class="badge badge-emerald">${t.dieId}</span>
      </div>
      <h4 style="font-size: 14px; color: var(--text-main); font-weight: 700;">${t.title}</h4>
      <div class="task-meta">
        <div><strong>Production Lead:</strong> ${t.assignedTo}</div>
        <div><strong>Created:</strong> ${t.createdAt}</div>
      </div>

      <div class="task-actions" style="flex-wrap: wrap;">
        ${canAct ? (status === 'Ready for Trial' ? `
          <button class="btn btn-success btn-sm" onclick="approveTrialRun('${t.id}')">✓ Approve First-Piece & Release to Production</button>
        ` : `
          <span style="font-size: 12px; color: var(--emerald-success); font-weight: 600;">✓ Mass Production Active</span>
        `) : ''}

        ${isAdmin ? `
          <button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}', 'trial')">🗑️ Delete</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

window.approveTrialRun = function(taskId) {
  const task = AppState.trialTasks.find(t => t.id === taskId);
  if (!task) return;

  task.status = 'Approved';

  const die = AppState.dieSets.find(d => d.id === task.dieId);
  if (die) die.status = 'In Production';

  AppState.save();
  AppState.showToast(`Trial Passed! Die ${task.dieId} is officially active in production!`, 'success');
  renderWorkflowView(document.getElementById('content-area'), 'trial-hub');
};
