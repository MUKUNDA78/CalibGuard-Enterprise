/**
 * DIE PULL OUT ANALYSIS - ANALYTICS & WEAR OPTIMIZATION MODULE
 * Chart.js statistical visualizations, wear trends & failure mode Pareto
 */

function renderAnalyticsView(container) {
  container.innerHTML = `
    <div class="animate-fade-in">
      <!-- Top Overview Row -->
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title"><span>📊</span> Tooling Wear & Resink Performance Analytics</h3>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
          Statistical insights derived from Die Pull Out Meetings, dimensional wear deltas & cross-functional action items.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 24px;">
          <!-- Chart 1: Cumulative Parts per Die Set -->
          <div style="background: var(--bg-card); padding: 18px; border-radius: var(--border-radius); border: 1px solid var(--border-color);">
            <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 14px;">Total Parts Produced per Die Set</h4>
            <div style="position: relative; height: 260px;">
              <canvas id="strokes-chart"></canvas>
            </div>
          </div>

          <!-- Chart 2: Defect Failure Mode Pareto -->
          <div style="background: var(--bg-card); padding: 18px; border-radius: var(--border-radius); border: 1px solid var(--border-color);">
            <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 14px;">Root Cause Failure Mode Pareto</h4>
            <div style="position: relative; height: 260px;">
              <canvas id="pareto-chart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Panel: Resink Rate per Hammer Unit -->
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title"><span>📈</span> Resink Rate & Refurbishment Efficiency by Drop Hammer Unit</h3>
        </div>
        
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Hammer Unit</th>
                <th>Total Active Dies</th>
                <th>Avg. Parts Produced Per Run</th>
                <th>Resink Frequency</th>
                <th>Design Modification Rate</th>
                <th>Tooling Efficiency Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1 Ton</strong></td>
                <td>45 Dies</td>
                <td>7,200 parts</td>
                <td><span class="badge badge-emerald">Every 8,500 parts</span></td>
                <td>5%</td>
                <td><strong style="color: var(--emerald-success);">95.1%</strong></td>
              </tr>
              <tr>
                <td><strong>1.5 Ton</strong></td>
                <td>90 Dies</td>
                <td>6,800 parts</td>
                <td><span class="badge badge-amber">Every 7,400 parts</span></td>
                <td>12%</td>
                <td><strong style="color: var(--amber-warning);">88.4%</strong></td>
              </tr>
              <tr>
                <td><strong>2.5 Ton (Old)</strong></td>
                <td>80 Dies</td>
                <td>8,100 parts</td>
                <td><span class="badge badge-rose">Every 6,200 parts</span></td>
                <td>20%</td>
                <td><strong style="color: var(--rose-danger);">82.0%</strong></td>
              </tr>
              <tr>
                <td><strong>2.5 Ton (New)</strong></td>
                <td>160 Dies</td>
                <td>11,200 parts</td>
                <td><span class="badge badge-emerald">Every 12,000 parts</span></td>
                <td>6%</td>
                <td><strong style="color: var(--emerald-success);">96.5%</strong></td>
              </tr>
              <tr>
                <td><strong>3.5 Ton</strong></td>
                <td>110 Dies</td>
                <td>10,400 parts</td>
                <td><span class="badge badge-cyan">Every 11,000 parts</span></td>
                <td>10%</td>
                <td><strong style="color: var(--cyan-primary);">92.3%</strong></td>
              </tr>
              <tr>
                <td><strong>0.5 Ton Open Hammer</strong></td>
                <td>35 Dies</td>
                <td>5,500 parts</td>
                <td><span class="badge badge-indigo">Every 6,000 parts</span></td>
                <td>4%</td>
                <td><strong style="color: var(--emerald-success);">94.8%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Render Charts after DOM mount
  setTimeout(() => {
    initAnalyticsCharts();
  }, 50);
}

function initAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;

  // 1. Strokes Chart
  const ctxStrokes = document.getElementById('strokes-chart');
  if (ctxStrokes) {
    const labels = AppState.dieSets.map(d => d.dieNo || d.id);
    const dataStrokes = AppState.dieSets.map(d => d.totalStrokesCumulative);

    new Chart(ctxStrokes, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Parts Produced',
          data: dataStrokes,
          backgroundColor: '#0284c7',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: '#475569' }, grid: { color: '#e2e8f0' } },
          y: { ticks: { color: '#475569' }, grid: { color: '#e2e8f0' } }
        }
      }
    });
  }

  // 2. Pareto Failure Mode Chart
  const ctxPareto = document.getElementById('pareto-chart');
  if (ctxPareto) {
    new Chart(ctxPareto, {
      type: 'doughnut',
      data: {
        labels: ['Thermal Fatigue / Heat Checking', 'Impression Washout & Erosion', 'Draft Lockup / Part Drag', 'Flash Line Breakdown', 'Die Corner Chipping'],
        datasets: [{
          data: [42, 28, 15, 10, 5],
          backgroundColor: ['#dc2626', '#d97706', '#0284c7', '#4f46e5', '#7c3aed'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#0f172a', font: { size: 11 } } }
        }
      }
    });
  }
}
