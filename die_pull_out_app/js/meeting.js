/**
 * DIE PULL OUT ANALYSIS - MEETING & EVALUATION MODULE
 * Forging Run & Tooling Metadata: Die No, Run Type, Qty Produced if Running, Die Released On, Hammer Unit, Die Life Target, Total Qty Produced, Die Status, Issues Faced
 */

let selectedDecision = 'Die Shop Resink Required';

function renderMeetingView(container) {
  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="animate-fade-in">
      <form id="meeting-form" onsubmit="savePullOutMeeting(event)">
        <!-- Section 1: Forging Run & Tooling Metadata -->
        <div class="card-panel">
          <div class="panel-header">
            <h3 class="panel-title"><span>🏭</span> 1. Forging Run & Tooling Metadata</h3>
            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openDieMasterModal()">+ Register New Die / Edit Line</button>
              <button type="submit" class="btn btn-success btn-sm">💾 Save Data Entry</button>
            </div>
          </div>

          <div class="form-grid">
            <!-- Field 1: Die No -->
            <div class="form-group">
              <label class="form-label">Die No *</label>
              <select class="form-control" id="die-select" onchange="onDieSelectChange(this.value)" required>
                <option value="">-- Select Die No --</option>
                ${AppState.dieSets.map(d => `<option value="${d.id}">${d.dieNo || d.id} - ${d.partName}</option>`).join('')}
              </select>
            </div>

            <!-- Field 2: New Sink / Resink Die / Running Die -->
            <div class="form-group">
              <label class="form-label">Die Status / Run Type *</label>
              <select class="form-control" id="die-run-type" required>
                <option value="New Sink">New Sink</option>
                <option value="Resink Die" selected>Resink Die</option>
                <option value="Running Die">Running Die</option>
              </select>
            </div>

            <!-- Field 3: Qty Produced if Running -->
            <div class="form-group">
              <label class="form-label">Qty Produced if Running *</label>
              <input type="number" class="form-control" id="qty-produced-running" value="8500" required placeholder="e.g. 8500 parts" oninput="updateTotalQtyCalc()" />
              <small style="color: var(--text-muted); font-size: 11px; margin-top: 3px; display: block;">
                🔹 Number of parts forged in this current run.
              </small>
            </div>

            <!-- Field 4: Die Released On -->
            <div class="form-group">
              <label class="form-label">Die Released On *</label>
              <input type="date" class="form-control" id="die-released-on" value="${todayStr}" required />
            </div>

            <!-- Field 5: Hammer Unit -->
            <div class="form-group">
              <label class="form-label">Hammer Unit *</label>
              <select class="form-control" id="hammer-unit" required>
                <option value="">-- Select Hammer Unit --</option>
                ${AppState.forgingLines.map(l => `<option value="${l}">${l}</option>`).join('')}
              </select>
            </div>

            <!-- Field 6: Die Life Target -->
            <div class="form-group">
              <label class="form-label">Die Life Target (Parts Target) *</label>
              <input type="number" class="form-control" id="die-life-target" value="40000" required placeholder="e.g. 40000 parts" />
            </div>

            <!-- Field 7: Total Qty Produced (Auto-Calculated & User Overridable) -->
            <div class="form-group">
              <label class="form-label">Total Qty Produced (Cumulative) *</label>
              <input type="number" class="form-control" id="total-qty-produced" required placeholder="Auto-calculated or enter manually" />
              <small id="qty-calc-hint" style="color: var(--cyan-primary); font-size: 11px; margin-top: 3px; display: block; font-weight: 600;">
                💡 Auto-Calculated: (Master Previous Qty) + (Qty Produced in Current Run). You can also type manually.
              </small>
            </div>

            <!-- Field 8: Die Status (User Set Status) -->
            <div class="form-group">
              <label class="form-label">Die Set Status (Updated by You) *</label>
              <select class="form-control" id="meeting-die-status" required>
                ${AppState.dieStatusOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
              </select>
            </div>

            <!-- Meeting Date -->
            <div class="form-group">
              <label class="form-label">Pull Out Meeting Date *</label>
              <input type="date" class="form-control" id="meeting-date" value="${todayStr}" required />
            </div>

            <!-- Issues Faced During Production -->
            <div class="form-group full-width">
              <label class="form-label" style="color: var(--cyan-primary); font-weight: 700;">🚨 Issues Faced During Production *</label>
              <textarea class="form-control" id="issues-faced" required placeholder="Describe specific production issues observed during forging (e.g., sticky part ejection, corner underfill, flash land wear, high hammering pressure)...">Underfill observed on upper boss corner during final forging strokes. Part sticky during ejection from lower die cavity.</textarea>
            </div>
          </div>
        </div>

        <!-- Section 2: Root Cause Analysis, Corrective Action & Decision -->
        <div class="card-panel">
          <div class="panel-header">
            <h3 class="panel-title"><span>🔍</span> 2. Root Cause Analysis & Corrective Action Plan</h3>
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label" style="color: var(--amber-warning); font-weight: 700;">🔎 Root Cause Analysis *</label>
              <textarea class="form-control" id="root-cause" required placeholder="Explain technical root cause analysis (e.g., insufficient draft angle, impression washout > 0.25mm, thermal fatigue micro-cracking)...">Impression washout on lower radius transition exceeded 0.25mm limit. Draft angle 7° is tight causing friction drag during high temperature forging.</textarea>
            </div>

            <div class="form-group full-width">
              <label class="form-label" style="color: var(--emerald-success); font-weight: 700;">🛠️ Corrective Action Planned *</label>
              <textarea class="form-control" id="corrective-action" required placeholder="Specify technical corrective action (e.g., 1.5mm CNC EDM resinking, CAD ECN draft update to 8.5°, stress relieving heat treatment)...">Execute 1.5mm CNC EDM resink of lower impression cavity and recut flash gutter. Polish radius to Ra 0.8µm.</textarea>
            </div>
          </div>

          <div style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Cross-Functional Meeting Decision Matrix</h4>
            <div class="decision-matrix-grid">
              <div class="decision-option" onclick="selectDecisionOption(this, 'Run As-Is')">
                <div class="option-icon">✅</div>
                <h4>Run As-Is</h4>
                <p>Die condition is good for next production run without maintenance.</p>
              </div>

              <div class="decision-option" onclick="selectDecisionOption(this, 'Minor Touch-Up')">
                <div class="option-icon">🧹</div>
                <h4>Minor Touch-Up</h4>
                <p>Routine bench polishing / grinding in Die Shop. No resinking.</p>
              </div>

              <div class="decision-option selected" onclick="selectDecisionOption(this, 'Die Shop Resink Required')">
                <div class="option-icon">⚙️</div>
                <h4>Die Shop Resink Required</h4>
                <p>Impression worn beyond specs. Resink depth machining required.</p>
              </div>

              <div class="decision-option" onclick="selectDecisionOption(this, 'Design Modification + Resink')">
                <div class="option-icon">📐</div>
                <h4>Design Mod + Resink</h4>
                <p>Root cause requires CAD redesign before resink by Die Shop.</p>
              </div>

              <div class="decision-option" onclick="selectDecisionOption(this, 'Scrap Die')">
                <div class="option-icon">🚫</div>
                <h4>Scrap Die Set</h4>
                <p>Die body cracked or max resink limit reached. Retire tooling.</p>
              </div>
            </div>

            <div class="form-grid" style="margin-top: 18px;">
              <div class="form-group" id="resink-depth-group">
                <label class="form-label">Authorized Resink Depth (mm)</label>
                <input type="number" step="0.1" class="form-control" id="resink-depth" value="1.5" />
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Departmental Comments & Digital Sign-Off Matrix -->
        <div class="card-panel">
          <div class="panel-header">
            <h3 class="panel-title"><span>✍️</span> 3. Multi-Department Comments & Digital Sign-Off Matrix</h3>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Comments updated by Quality, Die Shop, Design, & Production leads during pull out meeting.</p>
          
          <div class="signoff-grid">
            <div class="signoff-box">
              <h5 style="color: var(--cyan-primary);">📋 Quality Assurance Team</h5>
              <input type="text" class="form-control" id="sign-qa" value="R. Sharma (QA Lead)" required />
              <textarea class="form-control" id="comment-qa" placeholder="Quality comments & inspection notes..." style="min-height: 60px;">First part approved; last part web thickness out by +0.25mm. Resink recommended.</textarea>
              <div class="signoff-status" style="color: var(--emerald-success); margin-top: 4px;">✓ Approved & Signed</div>
            </div>

            <div class="signoff-box">
              <h5 style="color: var(--indigo-accent);">⚙️ Die Shop Master</h5>
              <input type="text" class="form-control" id="sign-dieshop" value="V. Kumar (Tooling Lead)" required />
              <textarea class="form-control" id="comment-dieshop" placeholder="Die shop resink feasibility comments..." style="min-height: 60px;">Die block thickness sufficient for 1.5mm resink. Machine setup ready in CNC room.</textarea>
              <div class="signoff-status" style="color: var(--emerald-success); margin-top: 4px;">✓ Approved & Signed</div>
            </div>

            <div class="signoff-box">
              <h5 style="color: var(--amber-warning);">📐 Tooling Design Team</h5>
              <input type="text" class="form-control" id="sign-design" value="A. Roy (Design Lead)" required />
              <textarea class="form-control" id="comment-design" placeholder="Design CAD modification comments..." style="min-height: 60px;">Draft angle to be reviewed. If sticky continues, ECN will increase draft to 8.5°.</textarea>
              <div class="signoff-status" style="color: var(--emerald-success); margin-top: 4px;">✓ Approved & Signed</div>
            </div>

            <div class="signoff-box">
              <h5 style="color: var(--emerald-success);">🚜 Forging Production Lead</h5>
              <input type="text" class="form-control" id="sign-prod" value="M. Patel (Forging Sup)" required />
              <textarea class="form-control" id="comment-prod" placeholder="Production batch observations..." style="min-height: 60px;">Batch target of 8,500 parts completed. Die pulled for scheduled resink.</textarea>
              <div class="signoff-status" style="color: var(--emerald-success); margin-top: 4px;">✓ Approved & Signed</div>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 14px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary" onclick="AppState.switchTab('dashboard')">Cancel</button>
            <button type="submit" class="btn btn-success" style="font-size: 15px; padding: 12px 24px;">
              <span>💾 SAVE MEETING ENTRY & TRIGGER WORKFLOWS</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  `;

  // Auto populate on load
  setTimeout(() => {
    if (AppState.dieSets.length > 0) {
      const select = document.getElementById('die-select');
      if (select && select.options.length > 1) {
        select.selectedIndex = 1;
        onDieSelectChange(select.value);
      }
    }
  }, 50);
}

// Die Selection Change Handler
window.onDieSelectChange = function(dieId) {
  const die = AppState.dieSets.find(d => d.id === dieId);
  if (die) {
    const hammerSelect = document.getElementById('hammer-unit');
    if (hammerSelect) {
      hammerSelect.value = die.forgingLine || die.pressLine || '2.5 Ton (New)';
    }

    const targetInput = document.getElementById('die-life-target');
    if (targetInput) {
      targetInput.value = die.dieLifeTarget || 40000;
    }

    const statusSelect = document.getElementById('meeting-die-status');
    if (statusSelect) {
      statusSelect.value = die.status || 'Pending Resink';
    }

    const releasedInput = document.getElementById('die-released-on');
    if (releasedInput) {
      releasedInput.value = die.dieReleasedOn || new Date().toISOString().split('T')[0];
    }

    updateTotalQtyCalc();
  }
};

window.updateTotalQtyCalc = function() {
  const dieId = document.getElementById('die-select').value;
  const die = AppState.dieSets.find(d => d.id === dieId);
  const runningQty = parseInt(document.getElementById('qty-produced-running').value) || 0;
  const totalEl = document.getElementById('total-qty-produced');
  const hintEl = document.getElementById('qty-calc-hint');

  const baseStrokes = die ? (die.totalStrokesCumulative || 0) : 0;
  const calculatedTotal = baseStrokes + runningQty;

  if (totalEl) {
    totalEl.value = calculatedTotal;
  }

  if (hintEl) {
    if (die) {
      hintEl.textContent = `💡 Formula: Master Baseline (${baseStrokes.toLocaleString()}) + Current Run (${runningQty.toLocaleString()}) = ${calculatedTotal.toLocaleString()} parts. (Editable)`;
    } else {
      hintEl.textContent = `💡 Auto-Calculated: (Master Previous Qty) + (Qty Produced in Current Run). You can also type manually.`;
    }
  }
};

// Decision Option Selection
window.selectDecisionOption = function(card, decision) {
  document.querySelectorAll('.decision-option').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedDecision = decision;

  const resinkGroup = document.getElementById('resink-depth-group');
  if (decision.includes('Resink')) {
    resinkGroup.style.display = 'flex';
  } else {
    resinkGroup.style.display = 'none';
  }

  // Update Status Dropdown based on Decision
  const statusSelect = document.getElementById('meeting-die-status');
  if (statusSelect) {
    if (decision.includes('Design')) {
      statusSelect.value = 'Pending Design Mod';
    } else if (decision.includes('Resink')) {
      statusSelect.value = 'Pending Resink';
    } else if (decision.includes('As-Is')) {
      statusSelect.value = 'In Production';
    } else if (decision.includes('Scrap')) {
      statusSelect.value = 'Scrapped';
    }
  }
};

// Save Meeting Form & Trigger Workflow Tasks
window.savePullOutMeeting = function(e) {
  e.preventDefault();

  const dieId = document.getElementById('die-select').value;
  if (!dieId) {
    AppState.showToast('Please select a Die No before saving', 'warning');
    return;
  }

  const meetingId = `POM-2026-${String(AppState.pullOutMeetings.length + 1).padStart(3, '0')}`;
  const dieRunType = document.getElementById('die-run-type').value;
  const qtyProducedIfRunning = parseInt(document.getElementById('qty-produced-running').value) || 0;
  const dieReleasedOn = document.getElementById('die-released-on').value;
  const hammerUnit = document.getElementById('hammer-unit').value;
  const dieLifeTarget = parseInt(document.getElementById('die-life-target').value) || 0;
  const userTotalQty = parseInt(document.getElementById('total-qty-produced').value) || 0;
  const chosenStatus = document.getElementById('meeting-die-status').value;

  const meetingDate = document.getElementById('meeting-date').value;
  const issuesFaced = document.getElementById('issues-faced').value;
  const rootCause = document.getElementById('root-cause').value;
  const correctiveAction = document.getElementById('corrective-action').value;
  const resinkDepth = parseFloat(document.getElementById('resink-depth').value) || 0;

  const die = AppState.dieSets.find(d => d.id === dieId);
  const totalQtyProduced = userTotalQty > 0 ? userTotalQty : ((die ? die.totalStrokesCumulative : 0) + qtyProducedIfRunning);

  const newMeeting = {
    id: meetingId,
    dieNo: dieId,
    dieId,
    dieRunType,
    qtyProducedIfRunning,
    strokesInRun: qtyProducedIfRunning,
    dieReleasedOn,
    hammerUnit,
    dieLifeTarget,
    totalQtyProduced,
    totalCumulativeStrokes: totalQtyProduced,
    meetingDate,
    reasonForPullout: document.getElementById('pullout-reason').value,
    issuesFaced,
    rootCause,
    correctiveAction,
    decision: selectedDecision,
    designRequired: selectedDecision.includes('Design'),
    resinkDepthRequired: resinkDepth,
    signoffs: {
      quality: { signed: true, name: document.getElementById('sign-qa').value, comment: document.getElementById('comment-qa').value, date: meetingDate },
      dieShop: { signed: true, name: document.getElementById('sign-dieshop').value, comment: document.getElementById('comment-dieshop').value, date: meetingDate },
      design: { signed: true, name: document.getElementById('sign-design').value, comment: document.getElementById('comment-design').value, date: meetingDate },
      production: { signed: true, name: document.getElementById('sign-prod').value, comment: document.getElementById('comment-prod').value, date: meetingDate }
    },
    notes: `${issuesFaced} | Root Cause: ${rootCause} | Action: ${correctiveAction}`
  };

  AppState.pullOutMeetings.unshift(newMeeting);

  // Update Die Set Status & Cumulative Strokes directly to user choice!
  if (die) {
    die.totalStrokesCumulative = totalQtyProduced;
    die.dieReleasedOn = dieReleasedOn;
    die.forgingLine = hammerUnit;
    die.dieLifeTarget = dieLifeTarget;
    die.status = chosenStatus;
    die.lastPullOutDate = meetingDate;
  }

  // Auto-Trigger Closed-Loop Workflows!
  if (selectedDecision.includes('Design')) {
    // Generate Design Task
    const designTaskId = `DES-2026-${String(AppState.designTasks.length + 1).padStart(3, '0')}`;
    AppState.designTasks.unshift({
      id: designTaskId,
      meetingId,
      dieId,
      title: `CAD Geometry Modification for ${dieId}`,
      description: `Issues: ${issuesFaced}. Root Cause: ${rootCause}. Action: ${correctiveAction}`,
      assignedTo: 'Anish Roy (Design Lead)',
      status: 'Pending ECN',
      ecnNumber: `ECN-FG-2026-${Math.floor(Math.random() * 90 + 10)}`,
      createdAt: meetingDate
    });
    AppState.showToast(`✓ DATA SAVED! Meeting ${meetingId} & Design Task ${designTaskId} created.`, 'success');
  } else if (selectedDecision.includes('Resink')) {
    // Generate Die Shop Resink Task
    const dsTaskId = `DS-2026-${String(AppState.dieShopTasks.length + 1).padStart(3, '0')}`;
    AppState.dieShopTasks.unshift({
      id: dsTaskId,
      meetingId,
      dieId,
      title: `Die Resink & Refurbishment (${resinkDepth}mm)`,
      resinkDepth,
      assignedTo: 'Vikram Kumar (Die Shop Master)',
      status: 'Queued',
      estimatedHours: 16,
      createdAt: meetingDate
    });
    AppState.showToast(`✓ DATA SAVED! Meeting ${meetingId} & Die Shop Task ${dsTaskId} created.`, 'success');
  } else {
    AppState.showToast(`✓ DATA SAVED! Meeting ${meetingId} logged successfully.`, 'success');
  }

  AppState.save();
  AppState.switchTab('dashboard');
};
