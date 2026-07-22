/**
 * DIE PULL OUT ANALYSIS - LIFECYCLE HISTORY & REPORT EXPORT MODULE
 * Timeline audit log per tooling set, daily filters & printable inspection report generator
 */

function renderHistoryView(container) {
  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title"><span>📜</span> Die Set Lifecycle Audit & Daily Shift History</h3>
          <div style="display: flex; gap: 10px;">
            <select class="form-control" id="history-die-filter" onchange="renderDieTimeline(this.value)">
              <option value="ALL">-- All Tooling Sets --</option>
              ${AppState.dieSets.map(d => `<option value="${d.id}">${d.dieNo || d.id} - ${d.partName}</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="timeline-container">
          <!-- Rendered via JS -->
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    renderDieTimeline('ALL');
  }, 50);
}

window.renderDieTimeline = function(dieIdFilter) {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  let filteredMeetings = AppState.getFilteredMeetings();
  if (dieIdFilter !== 'ALL') {
    filteredMeetings = filteredMeetings.filter(m => (m.dieNo || m.dieId) === dieIdFilter);
  }

  const isAdmin = AppState.currentRole === 'admin';

  if (filteredMeetings.length === 0) {
    container.innerHTML = `<p style="font-size: 13px; color: var(--text-muted); padding: 20px; text-align: center;">No history logs found for the selected date/die filter.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="timeline">
      ${filteredMeetings.map(m => {
        const die = AppState.dieSets.find(d => (d.dieNo || d.id) === (m.dieNo || m.dieId)) || {};
        const s = m.signoffs || {};

        return `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <h4 style="font-size: 15px; font-weight: 700; color: var(--cyan-primary);">
                    ${m.id} - Die Pull Out Meeting (Die No: ${m.dieNo || m.dieId})
                  </h4>
                  <span style="font-size: 12px; color: var(--text-muted);">${die.partName || ''} | Date: ${m.meetingDate}</span>
                </div>
                <span class="badge ${m.decision.includes('Resink') ? 'badge-amber' : m.decision.includes('Design') ? 'badge-rose' : 'badge-emerald'}">
                  ${m.decision}
                </span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 12px 0; font-size: 13px; background: var(--bg-input); padding: 10px; border-radius: 6px;">
                <div><strong>Run Type:</strong> ${m.dieRunType || 'Running Die'}</div>
                <div><strong>Qty Produced (Running):</strong> ${(m.qtyProducedIfRunning || m.strokesInRun || 0).toLocaleString()} parts</div>
                <div><strong>Hammer Unit:</strong> ${m.hammerUnit || die.forgingLine || '2.5 Ton (New)'}</div>
                <div><strong>Die Released On:</strong> ${m.dieReleasedOn || m.meetingDate}</div>
                <div><strong>Die Life Target:</strong> ${(m.dieLifeTarget || 30000).toLocaleString()} parts</div>
                <div><strong>Total Qty Produced:</strong> ${(m.totalQtyProduced || m.totalCumulativeStrokes || 0).toLocaleString()} parts</div>
              </div>

              <div style="background: #fffbebf8; border-left: 4px solid var(--amber-warning); padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; font-size: 13px;">
                <strong style="color: var(--amber-warning);">🚨 Issues Faced:</strong> ${m.issuesFaced || m.notes}
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; margin-bottom: 12px; font-size: 12px;">
                <div style="background: #f0fdf4; border-left: 3px solid var(--emerald-success); padding: 6px 10px; border-radius: 4px;">
                  <strong style="color: var(--emerald-success);">🔎 Root Cause:</strong> ${m.rootCause || 'Under review'}
                </div>
                <div style="background: #f0f9ff; border-left: 3px solid var(--cyan-primary); padding: 6px 10px; border-radius: 4px;">
                  <strong style="color: var(--cyan-primary);">🛠️ Corrective Action:</strong> ${m.correctiveAction || 'Under review'}
                </div>
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-secondary btn-sm" onclick="viewMeetingDetails('${m.id}')">🔍 Review Details</button>
                <button class="btn btn-primary btn-sm" onclick="printMeetingReport('${m.id}')">🖨️ Print Inspection Report</button>
                ${isAdmin ? `
                  <button class="btn btn-warning btn-sm" onclick="editMeetingModal('${m.id}')">✏️ Edit Record</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteMeeting('${m.id}')">🗑️ Delete Record</button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

// Print Official Die Pull Out Inspection & Decision Report
window.printMeetingReport = function(meetingId) {
  const meeting = AppState.pullOutMeetings.find(m => m.id === meetingId);
  if (!meeting) return;

  const die = AppState.dieSets.find(d => (d.dieNo || d.id) === (meeting.dieNo || meeting.dieId)) || {};
  const s = meeting.signoffs || {};

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Die Pull Out Inspection Report - ${meeting.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #111; line-height: 1.5; }
        h1 { font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #555; text-transform: uppercase; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: bold; background: #eee; padding: 6px 10px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .decision-box { border: 2px solid #000; padding: 12px; font-weight: bold; font-size: 16px; margin: 10px 0; background: #f9f9f9; }
        .sign-grid { display: flex; justify-content: space-between; margin-top: 40px; }
        .sign-line { width: 22%; text-align: center; border-top: 1px solid #000; padding-top: 6px; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>FORGING DIE PULL OUT INSPECTION & CONDITION REPORT</h1>
      <div class="subtitle">Cross-Functional Meeting Sign-Off & Tooling Action Authorization</div>

      <div class="section">
        <div class="section-title">1. FORGING RUN & TOOLING METADATA</div>
        <table>
          <tr>
            <td><strong>Die No:</strong> ${meeting.dieNo || meeting.dieId}</td>
            <td><strong>Die Status / Run Type:</strong> ${meeting.dieRunType || 'Running Die'}</td>
          </tr>
          <tr>
            <td><strong>Qty Produced if Running:</strong> ${(meeting.qtyProducedIfRunning || meeting.strokesInRun || 0).toLocaleString()} parts</td>
            <td><strong>Die Released On:</strong> ${meeting.dieReleasedOn || meeting.meetingDate}</td>
          </tr>
          <tr>
            <td><strong>Hammer Unit:</strong> ${meeting.hammerUnit || die.forgingLine || 'N/A'}</td>
            <td><strong>Die Life Target:</strong> ${(meeting.dieLifeTarget || 30000).toLocaleString()} parts</td>
          </tr>
          <tr>
            <td><strong>Total Qty Produced:</strong> ${(meeting.totalQtyProduced || meeting.totalCumulativeStrokes || 0).toLocaleString()} parts</td>
            <td><strong>Pull Out Meeting Date:</strong> ${meeting.meetingDate}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">2. ISSUES FACED, ROOT CAUSE & CORRECTIVE ACTION</div>
        <table>
          <tr>
            <td style="width: 30%;"><strong>Issues Faced During Production:</strong></td>
            <td>${meeting.issuesFaced || meeting.notes}</td>
          </tr>
          <tr>
            <td><strong>Root Cause Analysis:</strong></td>
            <td>${meeting.rootCause || 'Under inspection'}</td>
          </tr>
          <tr>
            <td><strong>Corrective Action Planned:</strong></td>
            <td>${meeting.correctiveAction || 'Under inspection'}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">3. CROSS-FUNCTIONAL MEETING DECISION</div>
        <div class="decision-box">DECISION: ${meeting.decision}</div>
        ${meeting.resinkDepthRequired ? `<p><strong>Authorized Resink Depth:</strong> ${meeting.resinkDepthRequired} mm</p>` : ''}
      </div>

      <div class="section">
        <div class="section-title">4. DEPARTMENTAL COMMENTS & SIGN-OFFS</div>
        <table>
          <tr>
            <th>Department</th>
            <th>Authorized Representative</th>
            <th>Departmental Comment / Recommendation</th>
          </tr>
          <tr>
            <td><strong>Quality Assurance</strong></td>
            <td>${(s.quality && s.quality.name) ? s.quality.name : 'QA Representative'}</td>
            <td>${(s.quality && s.quality.comment) ? s.quality.comment : 'Approved'}</td>
          </tr>
          <tr>
            <td><strong>Die Shop Master</strong></td>
            <td>${(s.dieShop && s.dieShop.name) ? s.dieShop.name : 'Die Shop Master'}</td>
            <td>${(s.dieShop && s.dieShop.comment) ? s.dieShop.comment : 'Approved'}</td>
          </tr>
          <tr>
            <td><strong>Tooling Design</strong></td>
            <td>${(s.design && s.design.name) ? s.design.name : 'Design Lead'}</td>
            <td>${(s.design && s.design.comment) ? s.design.comment : 'Approved'}</td>
          </tr>
          <tr>
            <td><strong>Forging Production</strong></td>
            <td>${(s.production && s.production.name) ? s.production.name : 'Production Lead'}</td>
            <td>${(s.production && s.production.comment) ? s.production.comment : 'Approved'}</td>
          </tr>
        </table>
      </div>

      <div class="section" style="margin-top: 50px;">
        <div class="sign-grid">
          <div class="sign-line">Quality Lead<br/>${(s.quality && s.quality.name) ? s.quality.name : ''}</div>
          <div class="sign-line">Die Shop Master<br/>${(s.dieShop && s.dieShop.name) ? s.dieShop.name : ''}</div>
          <div class="sign-line">Tooling Design Lead<br/>${(s.design && s.design.comment) ? s.design.name : ''}</div>
          <div class="sign-line">Forging Sup<br/>${(s.production && s.production.name) ? s.production.name : ''}</div>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
