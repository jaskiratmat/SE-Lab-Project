/**
 * HomeLabOS - Infrastructure Management Control Plane
 * Single-Page Browser Proof-of-Concept
 * Vanilla JavaScript (Zero External Dependencies)
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Initial State & Seed Data Store
  // ==========================================================================
  const STORAGE_KEY = 'HOMELAB_OS_STATE_V1.4';

  const DEFAULT_STATE = {
    currentUser: {
      id: 'u-admin-01',
      name: 'Alex Vance',
      email: 'admin@homelab.local',
      role: 'admin',
      mfaActive: true,
      hashMethod: 'Argon2id',
      lastLogin: '2026-10-22 12:30:15 UTC'
    },
    users: [
      {
        id: 'u-admin-01',
        name: 'Alex Vance',
        email: 'admin@homelab.local',
        role: 'admin',
        mfaActive: true,
        hashMethod: 'Argon2id (m=65536, t=3, p=4)',
        profileType: 'ADMIN (Full Root Access)'
      },
      {
        id: 'u-std-02',
        name: 'Jordan Lee',
        email: 'jordan@homelab.local',
        role: 'user',
        mfaActive: false,
        hashMethod: 'Bcrypt (rounds=12)',
        profileType: 'STANDARD_USER (Observer / Restart)'
      }
    ],
    nodes: [
      {
        id: 'node-01',
        hostname: 'node-01.homelab.lan',
        ip: '192.168.1.10',
        os: 'Ubuntu 24.04 LTS',
        arch: 'x86_64',
        cores: 16,
        ramGb: 64,
        diskGb: 2000,
        status: 'Active',
        cpuUsage: 42,
        ramUsage: 68
      },
      {
        id: 'node-02',
        hostname: 'node-02-arm.homelab.lan',
        ip: '192.168.1.11',
        os: 'Debian 12 Bookworm',
        arch: 'ARM64',
        cores: 8,
        ramGb: 32,
        diskGb: 1000,
        status: 'Active',
        cpuUsage: 35,
        ramUsage: 54
      },
      {
        id: 'node-03',
        hostname: 'nas-storage.homelab.lan',
        ip: '192.168.1.12',
        os: 'TrueNAS SCALE (Debian)',
        arch: 'x86_64',
        cores: 12,
        ramGb: 128,
        diskGb: 24000,
        status: 'Maintenance',
        cpuUsage: 14,
        ramUsage: 40
      }
    ],
    containers: [
      {
        id: 'cnt-01',
        name: 'nginx-proxy-manager',
        image: 'jc21/nginx-proxy-manager:latest',
        nodeId: 'node-01',
        hostPort: 80,
        internalPort: 80,
        state: 'Running',
        restartPolicy: 'unless-stopped',
        volume: 'nginx_data',
        mountPath: '/data',
        env: 'DB_SQLITE_FILE=/data/database.sqlite\nDISABLE_IPV6=false',
        uptime: '14d 6h'
      },
      {
        id: 'cnt-02',
        name: 'pihole-dns',
        image: 'pihole/pihole:latest',
        nodeId: 'node-02',
        hostPort: 53,
        internalPort: 53,
        state: 'Running',
        restartPolicy: 'always',
        volume: 'pihole_etc',
        mountPath: '/etc/pihole',
        env: 'TZ=UTC\nWEBPASSWORD=admin_secure_hash',
        uptime: '28d 19h'
      },
      {
        id: 'cnt-03',
        name: 'plex-media-server',
        image: 'plexinc/pms-docker:latest',
        nodeId: 'node-01',
        hostPort: 32400,
        internalPort: 32400,
        state: 'Paused',
        restartPolicy: 'unless-stopped',
        volume: 'media_zfs',
        mountPath: '/media',
        env: 'PLEX_CLAIM=claim-7z9x001\nVERSION=docker',
        uptime: '2d 1h'
      },
      {
        id: 'cnt-04',
        name: 'nextcloud-aio',
        image: 'nextcloud/all-in-one:latest',
        nodeId: 'node-03',
        hostPort: 8443,
        internalPort: 443,
        state: 'Stopped',
        restartPolicy: 'no',
        volume: 'nc_data',
        mountPath: '/mnt/ncdata',
        env: 'APACHE_PORT=11000\nNEXTCLOUD_DATADIR=/mnt/ncdata',
        uptime: 'Offline'
      },
      {
        id: 'cnt-05',
        name: 'prometheus-exporter',
        image: 'prom/node-exporter:v1.8',
        nodeId: 'node-01',
        hostPort: 9100,
        internalPort: 9100,
        state: 'Crashed',
        restartPolicy: 'on-failure',
        volume: 'none',
        mountPath: '',
        env: 'COLLECTOR_TEXTFILE_DIR=/var/lib',
        uptime: 'Exited (137)'
      }
    ],
    storagePools: [
      {
        id: 'pool-zfs',
        name: 'tank-zfs',
        fs: 'ZFS',
        mountPath: '/mnt/tank',
        totalGb: 24000,
        usedGb: 13800,
        redundancy: 'RAID-Z2 (Dual Parity)',
        scrubSchedule: 'Monthly (1st Sunday 01:00)'
      },
      {
        id: 'pool-btrfs',
        name: 'fast-nvme',
        fs: 'BTRFS',
        mountPath: '/var/lib/docker/volumes',
        totalGb: 2000,
        usedGb: 680,
        redundancy: 'Single (Direct Gen4 NVMe)',
        scrubSchedule: 'Bi-weekly auto-balance'
      },
      {
        id: 'pool-ext4',
        name: 'backup-pool',
        fs: 'EXT4',
        mountPath: '/backup/cold',
        totalGb: 4000,
        usedGb: 1100,
        redundancy: 'Standard Local Journal',
        scrubSchedule: 'e2fsck on boot'
      }
    ],
    storageVolumes: [
      {
        id: 'vol-01',
        name: 'nginx_data',
        fs: 'EXT4',
        hostPath: '/var/lib/docker/volumes/nginx_data',
        boundContainer: 'nginx-proxy-manager',
        quotaGb: 20,
        backupCron: '0 2 * * * (Daily 02:00 UTC)'
      },
      {
        id: 'vol-02',
        name: 'pihole_etc',
        fs: 'BTRFS',
        hostPath: '/var/lib/docker/volumes/pihole_etc',
        boundContainer: 'pihole-dns',
        quotaGb: 10,
        backupCron: '0 3 * * * (Daily 03:00 UTC)'
      },
      {
        id: 'vol-03',
        name: 'media_zfs',
        fs: 'ZFS',
        hostPath: '/mnt/tank/media',
        boundContainer: 'plex-media-server',
        quotaGb: 12000,
        backupCron: '0 4 * * 0 (Weekly Sunday)'
      },
      {
        id: 'vol-04',
        name: 'nc_data',
        fs: 'ZFS',
        hostPath: '/mnt/tank/nextcloud',
        boundContainer: 'nextcloud-aio',
        quotaGb: 1500,
        backupCron: '0 1 * * * (Daily 01:00 UTC)'
      }
    ],
    events: [
      { id: 1, time: '12:35:10', level: 'INFO', msg: 'System daemon initialized; Docker socket listener active on /var/run/docker.sock' },
      { id: 2, time: '12:35:18', level: 'SUCCESS', msg: 'Host node-01.homelab.lan heartbeats synchronized (16 Cores, 64GB RAM)' },
      { id: 3, time: '12:35:22', level: 'INFO', msg: 'Container pihole-dns DNS resolution active on host port 53' },
      { id: 4, time: '12:35:30', level: 'WARN', msg: 'Host nas-storage.homelab.lan placed in Scheduled Maintenance' },
      { id: 5, time: '12:35:45', level: 'ERROR', msg: 'prometheus-exporter exited with status code 137 (SIGKILL OOM)' }
    ],
    telemetryHistory: {
      labels: ['-36s', '-32s', '-28s', '-24s', '-20s', '-16s', '-12s', '-8s', '-4s', 'Now'],
      cpu: [36, 42, 38, 55, 48, 41, 62, 44, 49, 45],
      ram: [64, 65, 65, 67, 66, 68, 68, 67, 69, 68],
      net: [18, 22, 30, 42, 28, 24, 38, 31, 35, 34]
    }
  };

  // State in Memory
  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('localStorage read error, defaulting to seed data', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
    renderAll();
  }

  function logEvent(level, msg) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    state.events.unshift({
      id: Date.now() + Math.random(),
      time: timeStr,
      level: level,
      msg: msg
    });
    if (state.events.length > 50) {
      state.events.pop();
    }
    renderEventLog();
  }

  // ==========================================================================
  // 2. Toast Notifications
  // ==========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-text">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 250);
    }, 3800);
  }

  // ==========================================================================
  // 3. RBAC Privilege Enforcement Engine
  // ==========================================================================
  const PERMISSIONS = {
    VIEW_TELEMETRY: ['admin', 'user'],
    RESTART_CONTAINER: ['admin', 'user'],
    DEPLOY_CONTAINER: ['admin'],
    DELETE_CONTAINER: ['admin'],
    TOGGLE_NODE_MAINTENANCE: ['admin'],
    REGISTER_NODE: ['admin'],
    CREATE_STORAGE: ['admin'],
    MODIFY_RBAC: ['admin']
  };

  function hasPermission(permissionKey) {
    const role = state.currentUser.role;
    const allowedRoles = PERMISSIONS[permissionKey] || [];
    return allowedRoles.includes(role);
  }

  function checkRbac(permissionKey, actionName) {
    if (!hasPermission(permissionKey)) {
      const msg = `Security Alert: User [${state.currentUser.name}] lacks privileges for '${actionName}' (Role: ${state.currentUser.role.toUpperCase()})`;
      logEvent('ERROR', msg);
      showToast(`Access Denied: Standard User cannot perform ${actionName}. Switch to Admin in the top-right menu.`, 'error');
      return false;
    }
    return true;
  }

  function switchUser(roleKey) {
    if (roleKey === 'admin') {
      state.currentUser = {
        id: 'u-admin-01',
        name: 'Alex Vance',
        email: 'admin@homelab.local',
        role: 'admin',
        mfaActive: true,
        hashMethod: 'Argon2id',
        lastLogin: new Date().toISOString()
      };
      logEvent('INFO', 'Session upgraded to root Administrator (Argon2id verified)');
      showToast('Switched to Admin Account (Full Privileges)', 'success');
    } else {
      state.currentUser = {
        id: 'u-std-02',
        name: 'Jordan Lee',
        email: 'jordan@homelab.local',
        role: 'user',
        mfaActive: false,
        hashMethod: 'Bcrypt',
        lastLogin: new Date().toISOString()
      };
      logEvent('WARN', 'Session downgraded to Standard User (Restricted RBAC Profile)');
      showToast('Switched to Standard User (Restricted Rights)', 'warning');
    }
    saveState();
  }

  // ==========================================================================
  // 4. Real-Time Telemetry Simulation & Canvas Graph
  // ==========================================================================
  let telemetryInterval = null;

  function initTelemetry() {
    if (telemetryInterval) clearInterval(telemetryInterval);

    telemetryInterval = setInterval(() => {
      // Simulate slight micro-fluctuations
      const cpuDelta = (Math.random() * 8) - 4;
      const ramDelta = (Math.random() * 2) - 1;
      const netDelta = (Math.random() * 10) - 5;

      const lastCpu = state.telemetryHistory.cpu[state.telemetryHistory.cpu.length - 1];
      const lastRam = state.telemetryHistory.ram[state.telemetryHistory.ram.length - 1];
      const lastNet = state.telemetryHistory.net[state.telemetryHistory.net.length - 1];

      let newCpu = Math.min(Math.max(Math.round(lastCpu + cpuDelta), 15), 98);
      let newRam = Math.min(Math.max(Math.round(lastRam + ramDelta), 40), 96);
      let newNet = Math.min(Math.max(Math.round(lastNet + netDelta), 5), 95);

      // Push and shift history
      state.telemetryHistory.cpu.push(newCpu);
      state.telemetryHistory.cpu.shift();

      state.telemetryHistory.ram.push(newRam);
      state.telemetryHistory.ram.shift();

      state.telemetryHistory.net.push(newNet);
      state.telemetryHistory.net.shift();

      // Check safety thresholds
      const banner = document.getElementById('safetyAlertBanner');
      const alertDetail = document.getElementById('alertDetailText');

      if (newCpu >= 88 || newRam >= 90) {
        if (banner) banner.classList.remove('hidden');
        if (alertDetail) {
          alertDetail.textContent = `High Resource Breach: CPU at ${newCpu}%, Memory at ${newRam}%!`;
        }
        if (Math.random() > 0.7) {
          logEvent('WARN', `Host agent threshold breached: cluster memory pressure at ${newRam}%`);
        }
      } else {
        if (banner && !banner.dataset.manualKeep) {
          banner.classList.add('hidden');
        }
      }

      // Update metrics in UI
      const cpuEl = document.getElementById('metricCpuVal');
      const ramEl = document.getElementById('metricRamVal');
      const netEl = document.getElementById('metricNetVal');
      const cpuBar = document.getElementById('metricCpuBar');
      const ramBar = document.getElementById('metricRamBar');

      if (cpuEl) cpuEl.textContent = `${newCpu}%`;
      if (ramEl) ramEl.textContent = `${newRam}%`;
      if (netEl) netEl.textContent = `${newNet.toFixed(1)} MB/s`;

      if (cpuBar) cpuBar.style.width = `${newCpu}%`;
      if (ramBar) ramBar.style.width = `${newRam}%`;

      drawCanvasTelemetry();
    }, 2000);
  }

  function drawCanvasTelemetry() {
    const canvas = document.getElementById('liveTelemetryCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = (h / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Axis label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      const labelVal = 100 - (i * (100 / gridSteps));
      ctx.fillText(`${labelVal}%`, 6, y - 4 > 10 ? y - 4 : 12);
    }

    // Helper to plot a series
    function plotSeries(data, strokeColor, fillColor) {
      const points = data.length;
      const stepX = w / (points - 1);

      ctx.beginPath();
      data.forEach((val, idx) => {
        const x = idx * stepX;
        const y = h - (val / 100) * (h - 20) - 10;
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          // smooth bezier
          const prevX = (idx - 1) * stepX;
          const prevY = h - (data[idx - 1] / 100) * (h - 20) - 10;
          const midX = (prevX + x) / 2;
          ctx.bezierCurveTo(midX, prevY, midX, y, x, y);
        }
      });

      // Stroke
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Area fill
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Plot RAM (purple)
    plotSeries(state.telemetryHistory.ram, '#a855f7', 'rgba(168, 85, 247, 0.08)');
    // Plot CPU (cyan)
    plotSeries(state.telemetryHistory.cpu, '#38bdf8', 'rgba(56, 189, 248, 0.12)');
    // Plot Net (emerald)
    plotSeries(state.telemetryHistory.net, '#10b981', 'rgba(16, 185, 129, 0.05)');
  }

  // ==========================================================================
  // 5. Host Nodes Module
  // ==========================================================================
  function renderNodes() {
    const container = document.getElementById('nodesContainer');
    if (!container) return;

    let activeCount = 0;
    container.innerHTML = state.nodes.map(node => {
      const isMaint = node.status === 'Maintenance';
      if (!isMaint) activeCount++;

      return `
        <div class="node-card ${isMaint ? 'maintenance-mode' : ''}" data-node-id="${node.id}">
          <div class="node-card-top">
            <div class="node-title-box">
              <span class="node-hostname">${node.hostname}</span>
              <span class="node-ip-badge">${node.ip}</span>
            </div>
            <div class="node-badges-row">
              <span class="badge ${isMaint ? 'badge-amber' : 'badge-emerald'}">
                <span class="badge-dot" style="background:${isMaint ? '#f59e0b' : '#10b981'}"></span>
                ${node.status}
              </span>
              <span class="code-badge">${node.arch}</span>
            </div>
          </div>

          <div class="node-details-grid">
            <div class="node-meta-item">
              <span class="node-meta-label">OS Distribution</span>
              <span class="node-meta-val">${node.os}</span>
            </div>
            <div class="node-meta-item">
              <span class="node-meta-label">Compute Engine</span>
              <span class="node-meta-val">${node.cores} Cores / ${node.ramGb} GB RAM</span>
            </div>
            <div class="node-meta-item">
              <span class="node-meta-label">Storage Footprint</span>
              <span class="node-meta-val">${(node.diskGb / 1000).toFixed(1)} TB Local Capacity</span>
            </div>
            <div class="node-meta-item">
              <span class="node-meta-label">Assigned Services</span>
              <span class="node-meta-val text-cyan">${state.containers.filter(c => c.nodeId === node.id).length} Containers</span>
            </div>
          </div>

          <div class="node-metric-bars">
            <div class="metric-bar-group">
              <div class="metric-bar-label">
                <span>CPU Load</span>
                <span>${node.cpuUsage}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill fill-cyan" style="width: ${node.cpuUsage}%"></div>
              </div>
            </div>
            <div class="metric-bar-group">
              <div class="metric-bar-label">
                <span>RAM Usage</span>
                <span>${node.ramUsage}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill fill-purple" style="width: ${node.ramUsage}%"></div>
              </div>
            </div>
          </div>

          <div class="node-card-footer">
            <div style="font-size:0.75rem; color:var(--text-muted);">
              Maintenance Mode
            </div>
            <label class="switch" title="Toggle Maintenance Mode">
              <input type="checkbox" class="node-maint-toggle" data-id="${node.id}" ${isMaint ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `;
    }).join('');

    // Update Quick status
    const quickNodeStatus = document.getElementById('quickNodeStatus');
    if (quickNodeStatus) {
      quickNodeStatus.textContent = `${activeCount}/${state.nodes.length} Online`;
    }
    const badgeNodeCount = document.getElementById('badgeNodeCount');
    if (badgeNodeCount) {
      badgeNodeCount.textContent = state.nodes.length;
    }

    // Attach Toggle Listeners
    container.querySelectorAll('.node-maint-toggle').forEach(chk => {
      chk.addEventListener('change', (e) => {
        if (!checkRbac('TOGGLE_NODE_MAINTENANCE', 'Toggle Host Node Maintenance')) {
          e.target.checked = !e.target.checked;
          return;
        }

        const nodeId = e.target.getAttribute('data-id');
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          node.status = e.target.checked ? 'Maintenance' : 'Active';
          logEvent(
            e.target.checked ? 'WARN' : 'SUCCESS',
            `Host node [${node.hostname}] changed state to ${node.status}`
          );
          showToast(`Node ${node.hostname} is now ${node.status}`, e.target.checked ? 'warning' : 'success');
          saveState();
        }
      });
    });
  }

  // ==========================================================================
  // 6. Containers Module (Lifecycle & Collision Detection)
  // ==========================================================================
  function renderContainers() {
    const tbody = document.getElementById('containersTableBody');
    const snapshotContainer = document.getElementById('dashboardContainerSnapshot');
    const searchTerm = (document.getElementById('containerSearchInput')?.value || '').toLowerCase();
    const stateFilter = document.getElementById('containerStateFilter')?.value || 'ALL';

    const filtered = state.containers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm) ||
                          c.image.toLowerCase().includes(searchTerm) ||
                          c.nodeId.toLowerCase().includes(searchTerm);
      const matchState = (stateFilter === 'ALL') || (c.state === stateFilter);
      return matchSearch && matchState;
    });

    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim);">No container services match the active filter criteria.</td></tr>`;
      } else {
        tbody.innerHTML = filtered.map(c => {
          const nodeObj = state.nodes.find(n => n.id === c.nodeId);
          const nodeName = nodeObj ? nodeObj.hostname : c.nodeId;

          return `
            <tr data-container-id="${c.id}">
              <td>
                <div class="cell-service-name">
                  <span class="status-dot" style="background:${getStateColor(c.state)}"></span>
                  <strong>${c.name}</strong>
                </div>
              </td>
              <td><span class="code-badge">${c.image}</span></td>
              <td><span style="font-family:var(--font-mono); font-size:0.78rem;">${nodeName}</span></td>
              <td>
                <span class="port-pill">${c.hostPort}:${c.internalPort}</span>
              </td>
              <td>
                <span class="badge state-${c.state}">
                  <span class="badge-dot"></span>
                  ${c.state}
                </span>
              </td>
              <td>
                <span style="font-size:0.78rem; font-family:var(--font-mono); color:var(--text-muted);">${c.volume || 'none'}</span>
              </td>
              <td class="text-right">
                <div class="action-btn-group">
                  ${c.state === 'Running' ? `
                    <button class="btn btn-xs btn-outline btn-action" data-action="pause" data-id="${c.id}" title="Pause Service">Pause</button>
                    <button class="btn btn-xs btn-outline btn-action" data-action="stop" data-id="${c.id}" title="Stop Container">Stop</button>
                  ` : ''}
                  ${c.state === 'Paused' ? `
                    <button class="btn btn-xs btn-outline btn-action" data-action="unpause" data-id="${c.id}" title="Resume Service">Resume</button>
                  ` : ''}
                  ${c.state === 'Stopped' || c.state === 'Crashed' ? `
                    <button class="btn btn-xs btn-primary btn-action" data-action="start" data-id="${c.id}" title="Spin Up Container">Start</button>
                  ` : ''}
                  ${c.state === 'Running' ? `
                    <button class="btn btn-xs btn-outline btn-action" data-action="crash" data-id="${c.id}" title="Simulate Process Crash">Crash</button>
                  ` : ''}
                  <button class="btn btn-icon btn-icon-danger btn-action" data-action="delete" data-id="${c.id}" title="Delete Container & Unbind Port">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Snapshot in dashboard
    if (snapshotContainer) {
      snapshotContainer.innerHTML = state.containers.slice(0, 4).map(c => `
        <div class="quick-item">
          <div class="quick-item-info">
            <span class="status-dot" style="background:${getStateColor(c.state)}"></span>
            <div>
              <div class="quick-item-name">${c.name}</div>
              <div class="quick-item-node">${c.hostPort}:${c.internalPort} &bull; ${c.state}</div>
            </div>
          </div>
          <span class="badge state-${c.state}">${c.state}</span>
        </div>
      `).join('');
    }

    // Counters
    const runningCount = state.containers.filter(c => c.state === 'Running').length;
    const runningBadge = document.getElementById('runningCountBadge');
    if (runningBadge) runningBadge.textContent = `${runningCount} Active`;

    const quickCntEl = document.getElementById('quickContainerStatus');
    if (quickCntEl) quickCntEl.textContent = `${runningCount} Running`;

    const badgeContainerCount = document.getElementById('badgeContainerCount');
    if (badgeContainerCount) badgeContainerCount.textContent = state.containers.length;

    // Attach lifecycle button actions
    document.querySelectorAll('.btn-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const containerId = btn.getAttribute('data-id');
        handleContainerLifecycle(containerId, action);
      });
    });
  }

  function getStateColor(stateName) {
    switch (stateName) {
      case 'Running': return '#10b981';
      case 'Paused': return '#f59e0b';
      case 'Stopped': return '#94a3b8';
      case 'Crashed': return '#f43f5e';
      case 'Pulling': return '#38bdf8';
      default: return '#64748b';
    }
  }

  function handleContainerLifecycle(containerId, action) {
    const container = state.containers.find(c => c.id === containerId);
    if (!container) return;

    if (action === 'delete') {
      if (!checkRbac('DELETE_CONTAINER', 'Destroy Container Service')) return;
      if (confirm(`Are you sure you want to stop and remove container '${container.name}'? Host port ${container.hostPort} will be freed.`)) {
        state.containers = state.containers.filter(c => c.id !== containerId);
        logEvent('WARN', `Container service [${container.name}] destroyed and removed from host socket`);
        showToast(`Removed container ${container.name} and unbound port ${container.hostPort}`, 'success');
        saveState();
      }
      return;
    }

    if (!checkRbac('RESTART_CONTAINER', `Perform ${action} on container`)) return;

    switch (action) {
      case 'start':
      case 'unpause':
        container.state = 'Running';
        container.uptime = 'Just started';
        logEvent('SUCCESS', `Container socket agent: Started [${container.name}] on port ${container.hostPort}`);
        showToast(`Service ${container.name} is now RUNNING`, 'success');
        break;
      case 'pause':
        container.state = 'Paused';
        logEvent('INFO', `Sent SIGSTOP cgroup pause to container [${container.name}]`);
        showToast(`Service ${container.name} PAUSED`, 'warning');
        break;
      case 'stop':
        container.state = 'Stopped';
        container.uptime = 'Offline';
        logEvent('INFO', `Sent SIGTERM to container [${container.name}]; state: Stopped`);
        showToast(`Service ${container.name} STOPPED`, 'info');
        break;
      case 'crash':
        container.state = 'Crashed';
        container.uptime = 'Exited (137 OOM)';
        logEvent('ERROR', `SIMULATED EXCEPTION: Process inside [${container.name}] killed by Linux OOM killer!`);
        showToast(`Service ${container.name} CRASHED (Simulated Fail)`, 'error');
        break;
    }

    saveState();
  }

  // ==========================================================================
  // 7. Port Collision Verification Engine
  // ==========================================================================
  function checkPortCollision(hostPort, targetNodeId, excludeContainerId = null) {
    const port = parseInt(hostPort, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      return { conflict: true, message: 'Invalid port range (must be 1 - 65535).' };
    }

    const collision = state.containers.find(c => {
      if (excludeContainerId && c.id === excludeContainerId) return false;
      return c.nodeId === targetNodeId && parseInt(c.hostPort, 10) === port;
    });

    if (collision) {
      return {
        conflict: true,
        message: `Port Collision: Port ${port} is ALREADY BOUND to service '${collision.name}' on this host node!`
      };
    }

    return { conflict: false, message: `Port ${port} is available on this node.` };
  }

  function renderPortsTable() {
    const tbody = document.getElementById('portsTableBody');
    if (!tbody) return;

    const countEl = document.getElementById('allocatedPortsCount');
    if (countEl) countEl.textContent = state.containers.length;

    tbody.innerHTML = state.containers.map(c => {
      const node = state.nodes.find(n => n.id === c.nodeId);
      const isCriticalPort = [80, 443, 53].includes(c.hostPort);

      return `
        <tr>
          <td><strong class="code-badge">${c.hostPort}</strong></td>
          <td><span style="font-family:var(--font-mono); font-size:0.75rem;">${c.hostPort === 53 ? 'UDP / TCP' : 'TCP'}</span></td>
          <td><strong>${c.name}</strong></td>
          <td><span class="port-pill">${c.internalPort}</span></td>
          <td><span style="font-family:var(--font-mono); font-size:0.78rem;">${node ? node.hostname : c.nodeId}</span></td>
          <td>
            ${isCriticalPort ? `
              <span class="badge" style="background:rgba(244,63,94,0.15); color:#fb7185; border:1px solid rgba(244,63,94,0.3);">
                Core Homelab Service
              </span>
            ` : `
              <span class="badge badge-emerald">Standard NAT</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================================================
  // 8. Storage Volumes Module
  // ==========================================================================
  function renderStorage() {
    const poolsContainer = document.getElementById('storagePoolsContainer');
    const bindingsTbody = document.getElementById('storageBindingsTableBody');

    if (poolsContainer) {
      poolsContainer.innerHTML = state.storagePools.map(pool => {
        const pct = Math.round((pool.usedGb / pool.totalGb) * 100);
        return `
          <div class="storage-card">
            <div class="storage-header">
              <span class="storage-title">${pool.name}</span>
              <span class="storage-fs-tag">${pool.fs}</span>
            </div>
            <div style="font-family:var(--font-mono); font-size:0.76rem; color:var(--accent-cyan);">
              ${pool.mountPath}
            </div>
            <div class="metric-bar-group">
              <div class="storage-meta-row">
                <span>Pool Capacity: ${pct}%</span>
                <span>${(pool.usedGb / 1000).toFixed(1)} / ${(pool.totalGb / 1000).toFixed(1)} TB</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill ${pct > 80 ? 'fill-rose' : 'fill-emerald'}" style="width: ${pct}%"></div>
              </div>
            </div>
            <div class="node-details-grid" style="font-size:0.74rem;">
              <div class="node-meta-item">
                <span class="node-meta-label">Protection Mode</span>
                <span class="node-meta-val">${pool.redundancy}</span>
              </div>
              <div class="node-meta-item">
                <span class="node-meta-label">Data Scrub Cron</span>
                <span class="node-meta-val">${pool.scrubSchedule}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (bindingsTbody) {
      bindingsTbody.innerHTML = state.storageVolumes.map(vol => {
        return `
          <tr>
            <td><strong>${vol.name}</strong></td>
            <td><span class="code-badge">${vol.fs}</span></td>
            <td><span style="font-family:var(--font-mono); font-size:0.78rem;">${vol.hostPath}</span></td>
            <td><span class="port-pill">${vol.boundContainer}</span></td>
            <td>${vol.quotaGb} GB</td>
            <td><span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-dim);">${vol.backupCron}</span></td>
            <td class="text-right">
              <button class="btn btn-xs btn-outline btn-unbind-vol" data-id="${vol.id}">Unbind</button>
            </td>
          </tr>
        `;
      }).join('');

      document.querySelectorAll('.btn-unbind-vol').forEach(b => {
        b.addEventListener('click', () => {
          if (!checkRbac('CREATE_STORAGE', 'Unbind / Remove Persistent Volume')) return;
          const volId = b.getAttribute('data-id');
          state.storageVolumes = state.storageVolumes.filter(v => v.id !== volId);
          logEvent('INFO', `Storage volume unmounted and unlinked from container`);
          showToast('Storage volume unmounted successfully', 'info');
          saveState();
        });
      });
    }
  }

  // ==========================================================================
  // 9. RBAC & Security Matrix Module
  // ==========================================================================
  function renderRbac() {
    // Highlight active card
    const adminCard = document.getElementById('adminProfileCard');
    const userCard = document.getElementById('userProfileCard');
    const currentRole = state.currentUser.role;

    if (adminCard && userCard) {
      if (currentRole === 'admin') {
        adminCard.classList.add('active-session-card');
        userCard.classList.remove('active-session-card');
      } else {
        userCard.classList.add('active-session-card');
        adminCard.classList.remove('active-session-card');
      }
    }

    // Permissions Matrix Table
    const matrixTbody = document.getElementById('rbacMatrixTableBody');
    if (!matrixTbody) return;

    const capabilities = [
      { name: 'View Real-Time Node & Cluster Telemetry', scope: 'Read-Only (Global)', admin: true, user: true, key: 'VIEW_TELEMETRY' },
      { name: 'Trigger Container Restart / Pause / Resume', scope: 'Operational (Containers)', admin: true, user: true, key: 'RESTART_CONTAINER' },
      { name: 'Deploy New Container Service (Socket API)', scope: 'Orchestrator Write', admin: true, user: false, key: 'DEPLOY_CONTAINER' },
      { name: 'Destroy / Delete Container Service', scope: 'Orchestrator Destructive', admin: true, user: false, key: 'DELETE_CONTAINER' },
      { name: 'Toggle Host Node Maintenance Mode', scope: 'Infrastructure Control', admin: true, user: false, key: 'TOGGLE_NODE_MAINTENANCE' },
      { name: 'Enroll / Register New Bare-Metal Host', scope: 'Host Clustering', admin: true, user: false, key: 'REGISTER_NODE' },
      { name: 'Create / Format Storage Pools (ZFS/BTRFS)', scope: 'Filesystem Storage Admin', admin: true, user: false, key: 'CREATE_STORAGE' }
    ];

    matrixTbody.innerHTML = capabilities.map(cap => {
      const userHasRight = cap[currentRole];
      return `
        <tr>
          <td><strong>${cap.name}</strong></td>
          <td><span style="font-size:0.75rem; color:var(--text-muted);">${cap.scope}</span></td>
          <td><span class="badge badge-emerald">ALLOWED</span></td>
          <td>${cap.user ? '<span class="badge badge-emerald">ALLOWED</span>' : '<span class="badge" style="background:rgba(244,63,94,0.15); color:#fb7185;">DENIED</span>'}</td>
          <td>
            ${userHasRight ? 
              '<span class="badge badge-emerald"><span class="badge-dot" style="background:#10b981"></span>Active In Session</span>' : 
              '<span class="badge" style="background:rgba(244,63,94,0.15); color:#fb7185;"><span class="badge-dot" style="background:#f43f5e"></span>Blocked By RBAC</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================================================
  // 10. Event Terminal Log Drawer
  // ==========================================================================
  function renderEventLog() {
    const term = document.getElementById('eventTerminalWindow');
    if (!term) return;

    term.innerHTML = state.events.map(ev => `
      <div class="log-entry">
        <span class="log-time">[${ev.time}]</span>
        <span class="log-level ${ev.level}">${ev.level}</span>
        <span class="log-msg">${ev.msg}</span>
      </div>
    `).join('');
  }

  // ==========================================================================
  // 11. Modal Setup & Form Handling
  // ==========================================================================
  function initModals() {
    // Tab Switching
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const breadcrumbActive = document.getElementById('breadcrumbActive');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.getAttribute('data-tab');
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        tabPanes.forEach(pane => {
          if (pane.id === `tab-${targetTab}`) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });

        if (breadcrumbActive) {
          breadcrumbActive.textContent = item.querySelector('span').textContent;
        }

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');

        // Render on tab change
        if (targetTab === 'dashboard') drawCanvasTelemetry();
        if (targetTab === 'nodes') renderNodes();
        if (targetTab === 'containers') renderContainers();
        if (targetTab === 'storage') renderStorage();
        if (targetTab === 'network') renderPortsTable();
        if (targetTab === 'rbac') renderRbac();
      });
    });

    // Mobile Sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const mobileSidebarClose = document.getElementById('mobileSidebarClose');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => sidebar.classList.add('open'));
    }
    if (mobileSidebarClose && sidebar) {
      mobileSidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    // User Dropdown Trigger
    const userBadgeTrigger = document.getElementById('userBadgeTrigger');
    const userDropdown = document.getElementById('userDropdown');

    if (userBadgeTrigger && userDropdown) {
      userBadgeTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });

      document.addEventListener('click', () => {
        userDropdown.classList.add('hidden');
      });
    }

    // Switch account buttons
    const switchAdminBtn = document.getElementById('switchAdminBtn');
    const switchStandardBtn = document.getElementById('switchStandardBtn');
    const btnActivateAdmin = document.getElementById('btnActivateAdmin');
    const btnActivateStandard = document.getElementById('btnActivateStandard');

    if (switchAdminBtn) switchAdminBtn.addEventListener('click', () => switchUser('admin'));
    if (switchStandardBtn) switchStandardBtn.addEventListener('click', () => switchUser('user'));
    if (btnActivateAdmin) btnActivateAdmin.addEventListener('click', () => switchUser('admin'));
    if (btnActivateStandard) btnActivateStandard.addEventListener('click', () => switchUser('user'));

    // Deploy Modal Handlers
    const deployModal = document.getElementById('deployContainerModal');
    const openDeployBtn1 = document.getElementById('btnOpenDeployModal');
    const openDeployBtn2 = document.getElementById('btnQuickDeployModal');
    const closeDeployBtn = document.getElementById('closeDeployModal');
    const cancelDeployBtn = document.getElementById('cancelDeployModal');
    const deployForm = document.getElementById('deployContainerForm');

    function openDeployModal() {
      if (!checkRbac('DEPLOY_CONTAINER', 'Deploy Container Service')) return;
      populateDeploySelects();
      deployModal.classList.remove('hidden');
    }

    if (openDeployBtn1) openDeployBtn1.addEventListener('click', openDeployModal);
    if (openDeployBtn2) openDeployBtn2.addEventListener('click', openDeployModal);
    if (closeDeployBtn) closeDeployBtn.addEventListener('click', () => deployModal.classList.add('hidden'));
    if (cancelDeployBtn) cancelDeployBtn.addEventListener('click', () => deployModal.classList.add('hidden'));

    // Deploy Presets
    const presetButtons = document.querySelectorAll('.preset-btn');
    const inputServiceName = document.getElementById('inputServiceName');
    const inputContainerImage = document.getElementById('inputContainerImage');
    const inputHostPort = document.getElementById('inputHostPort');
    const inputInternalPort = document.getElementById('inputInternalPort');
    const portFeedback = document.getElementById('portFeedback');
    const selectHostNode = document.getElementById('selectHostNode');

    const presets = {
      nginx: { name: 'nginx-proxy', image: 'nginx:alpine', hostPort: 8080, internalPort: 80 },
      pihole: { name: 'pihole-resolver', image: 'pihole/pihole:latest', hostPort: 5353, internalPort: 53 },
      plex: { name: 'plex-media', image: 'plexinc/pms-docker:latest', hostPort: 32400, internalPort: 32400 },
      nextcloud: { name: 'nextcloud-box', image: 'nextcloud:latest', hostPort: 8085, internalPort: 80 },
      custom: { name: '', image: '', hostPort: '', internalPort: '' }
    };

    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const pKey = btn.getAttribute('data-preset');
        const p = presets[pKey];
        if (p) {
          if (p.name) inputServiceName.value = p.name;
          if (p.image) inputContainerImage.value = p.image;
          if (p.hostPort) inputHostPort.value = p.hostPort;
          if (p.internalPort) inputInternalPort.value = p.internalPort;
          triggerPortCheck();
        }
      });
    });

    function triggerPortCheck() {
      if (!inputHostPort || !selectHostNode || !portFeedback) return;
      const portVal = inputHostPort.value;
      const nodeVal = selectHostNode.value;

      if (!portVal) {
        portFeedback.textContent = '';
        return;
      }

      const res = checkPortCollision(portVal, nodeVal);
      if (res.conflict) {
        portFeedback.className = 'port-feedback error';
        portFeedback.textContent = `❌ ${res.message}`;
      } else {
        portFeedback.className = 'port-feedback ok';
        portFeedback.textContent = `✓ ${res.message}`;
      }
    }

    if (inputHostPort) inputHostPort.addEventListener('input', triggerPortCheck);
    if (selectHostNode) selectHostNode.addEventListener('change', triggerPortCheck);

    function populateDeploySelects() {
      if (selectHostNode) {
        selectHostNode.innerHTML = state.nodes
          .filter(n => n.status === 'Active')
          .map(n => `<option value="${n.id}">${n.hostname} (${n.ip})</option>`)
          .join('');
      }

      const selectVol = document.getElementById('selectStorageVolume');
      if (selectVol) {
        selectVol.innerHTML = `
          <option value="none">-- No Persistent Volume --</option>
          ${state.storagePools.map(p => `<option value="${p.name}">${p.name} (${p.fs} Pool)</option>`).join('')}
        `;
      }
      triggerPortCheck();
    }

    // Submit Deploy Form
    if (deployForm) {
      deployForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkRbac('DEPLOY_CONTAINER', 'Deploy Container Service')) return;

        const name = inputServiceName.value.trim();
        const image = inputContainerImage.value.trim();
        const nodeId = selectHostNode.value;
        const hostPort = parseInt(inputHostPort.value, 10);
        const internalPort = parseInt(inputInternalPort.value, 10);
        const restartPolicy = document.getElementById('selectRestartPolicy').value;
        const volume = document.getElementById('selectStorageVolume').value;
        const mountPath = document.getElementById('inputMountPath').value.trim();
        const env = document.getElementById('inputEnvVars').value.trim();

        // Check collision
        const collisionCheck = checkPortCollision(hostPort, nodeId);
        if (collisionCheck.conflict) {
          alert(collisionCheck.message);
          return;
        }

        // Simulate Image Pulling
        const submitBtn = document.getElementById('btnSubmitDeploy');
        const spinner = document.getElementById('deploySpinner');
        if (submitBtn) submitBtn.disabled = true;
        if (spinner) spinner.classList.remove('hidden');

        logEvent('INFO', `Connecting to Docker socket on node [${nodeId}]...`);
        logEvent('INFO', `Pulling container image: ${image} from OCI registry...`);

        setTimeout(() => {
          const newContainer = {
            id: 'cnt-' + Date.now().toString(36),
            name: name,
            image: image,
            nodeId: nodeId,
            hostPort: hostPort,
            internalPort: internalPort,
            state: 'Running',
            restartPolicy: restartPolicy,
            volume: volume,
            mountPath: mountPath,
            env: env,
            uptime: 'Just created'
          };

          state.containers.unshift(newContainer);
          logEvent('SUCCESS', `Image ${image} successfully pulled and initialized in cgroup sandbox.`);
          logEvent('SUCCESS', `Service [${name}] bound to host port 0.0.0.0:${hostPort}->${internalPort}`);
          showToast(`Successfully deployed container '${name}' on port ${hostPort}`, 'success');

          if (submitBtn) submitBtn.disabled = false;
          if (spinner) spinner.classList.add('hidden');
          deployModal.classList.add('hidden');
          deployForm.reset();
          saveState();
        }, 1200);
      });
    }

    // Add Host Node Modal
    const addNodeModal = document.getElementById('addNodeModal');
    const openAddNodeBtn = document.getElementById('btnAddNodeModal');
    const closeAddNodeBtn = document.getElementById('closeAddNodeModal');
    const cancelAddNodeBtn = document.getElementById('cancelAddNodeModal');
    const addNodeForm = document.getElementById('addNodeForm');

    if (openAddNodeBtn) {
      openAddNodeBtn.addEventListener('click', () => {
        if (!checkRbac('REGISTER_NODE', 'Register Host Node')) return;
        addNodeModal.classList.remove('hidden');
      });
    }
    if (closeAddNodeBtn) closeAddNodeBtn.addEventListener('click', () => addNodeModal.classList.add('hidden'));
    if (cancelAddNodeBtn) cancelAddNodeBtn.addEventListener('click', () => addNodeModal.classList.add('hidden'));

    if (addNodeForm) {
      addNodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkRbac('REGISTER_NODE', 'Register Host Node')) return;

        const hostname = document.getElementById('inputNodeHostname').value.trim();
        const ip = document.getElementById('inputNodeIp').value.trim();
        const os = document.getElementById('selectNodeOs').value;
        const arch = document.getElementById('selectNodeArch').value;
        const cores = parseInt(document.getElementById('inputNodeCores').value, 10);
        const ram = parseInt(document.getElementById('inputNodeRam').value, 10);
        const disk = parseInt(document.getElementById('inputNodeDisk').value, 10);

        const newNode = {
          id: 'node-' + Date.now().toString(36),
          hostname: hostname,
          ip: ip,
          os: os,
          arch: arch,
          cores: cores,
          ramGb: ram,
          diskGb: disk,
          status: 'Active',
          cpuUsage: Math.floor(Math.random() * 20) + 10,
          ramUsage: Math.floor(Math.random() * 30) + 20
        };

        state.nodes.push(newNode);
        logEvent('SUCCESS', `Host node [${hostname}] (${ip}, ${arch}) enrolled into orchestration cluster`);
        showToast(`Node ${hostname} registered successfully`, 'success');
        addNodeModal.classList.add('hidden');
        addNodeForm.reset();
        saveState();
      });
    }

    // Add Volume Modal
    const addVolumeModal = document.getElementById('addVolumeModal');
    const openAddVolumeBtn = document.getElementById('btnAddVolumeModal');
    const closeAddVolumeBtn = document.getElementById('closeAddVolumeModal');
    const cancelAddVolumeBtn = document.getElementById('cancelAddVolumeModal');
    const addVolumeForm = document.getElementById('addVolumeForm');

    if (openAddVolumeBtn) {
      openAddVolumeBtn.addEventListener('click', () => {
        if (!checkRbac('CREATE_STORAGE', 'Create Storage Volume / Pool')) return;
        addVolumeModal.classList.remove('hidden');
      });
    }
    if (closeAddVolumeBtn) closeAddVolumeBtn.addEventListener('click', () => addVolumeModal.classList.add('hidden'));
    if (cancelAddVolumeBtn) cancelAddVolumeBtn.addEventListener('click', () => addVolumeModal.classList.add('hidden'));

    if (addVolumeForm) {
      addVolumeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkRbac('CREATE_STORAGE', 'Create Storage Volume / Pool')) return;

        const volName = document.getElementById('inputVolName').value.trim();
        const fsType = document.getElementById('selectVolFs').value;
        const mount = document.getElementById('inputVolMount').value.trim();
        const quota = parseInt(document.getElementById('inputVolQuota').value, 10);
        const cron = document.getElementById('inputVolCron').value.trim();

        const newPool = {
          id: 'pool-' + Date.now().toString(36),
          name: volName,
          fs: fsType,
          mountPath: mount,
          totalGb: quota,
          usedGb: Math.floor(quota * 0.1),
          redundancy: `${fsType} Managed Volume`,
          scrubSchedule: cron
        };

        state.storagePools.push(newPool);
        logEvent('SUCCESS', `Filesystem pool [${volName}] (${fsType} at ${mount}) formatted and mounted`);
        showToast(`Storage pool ${volName} created`, 'success');
        addVolumeModal.classList.add('hidden');
        addVolumeForm.reset();
        saveState();
      });
    }

    // Terminal clear & spike simulation
    const btnClearLogs = document.getElementById('btnClearLogs');
    if (btnClearLogs) {
      btnClearLogs.addEventListener('click', () => {
        state.events = [];
        renderEventLog();
        showToast('Terminal logs cleared', 'info');
      });
    }

    const btnSimulateLoad = document.getElementById('btnSimulateLoad');
    if (btnSimulateLoad) {
      btnSimulateLoad.addEventListener('click', () => {
        state.telemetryHistory.cpu[state.telemetryHistory.cpu.length - 1] = 95;
        state.telemetryHistory.ram[state.telemetryHistory.ram.length - 1] = 92;
        logEvent('WARN', 'SIMULATED SPIKE: Synthetic stress test injected 100% thread load across node-01 cores');
        showToast('Injected artificial CPU/RAM spike (>90%)', 'warning');
        drawCanvasTelemetry();
      });
    }

    // Port conflict simulation test
    const btnTestPortConflict = document.getElementById('btnTestPortConflict');
    if (btnTestPortConflict) {
      btnTestPortConflict.addEventListener('click', () => {
        const testRes = checkPortCollision(80, 'node-01');
        logEvent('WARN', `Port collision scanner evaluated test port 80 on node-01: ${testRes.message}`);
        showToast(`Port Collision Detection Test: ${testRes.message}`, 'error');
      });
    }

    // Search and filter container listeners
    const searchInp = document.getElementById('containerSearchInput');
    const filterSelect = document.getElementById('containerStateFilter');
    if (searchInp) searchInp.addEventListener('input', renderContainers);
    if (filterSelect) filterSelect.addEventListener('change', renderContainers);

    // Reset button
    const btnResetData = document.getElementById('btnResetData');
    if (btnResetData) {
      btnResetData.addEventListener('click', () => {
        if (confirm('Reset application back to initial default demo data?')) {
          localStorage.removeItem(STORAGE_KEY);
          state = JSON.parse(JSON.stringify(DEFAULT_STATE));
          saveState();
          showToast('State reset to clean seed data', 'info');
          logEvent('INFO', 'System restored to clean seed data state');
        }
      });
    }

    // Dismiss Alert Banner
    const btnDismissAlert = document.getElementById('btnDismissAlert');
    const alertBanner = document.getElementById('safetyAlertBanner');
    if (btnDismissAlert && alertBanner) {
      btnDismissAlert.addEventListener('click', () => {
        alertBanner.classList.add('hidden');
        alertBanner.dataset.manualKeep = "false";
      });
    }

    // Toggle MFA button
    const btnToggleMFA = document.getElementById('btnToggleMFA');
    if (btnToggleMFA) {
      btnToggleMFA.addEventListener('click', () => {
        state.currentUser.mfaActive = !state.currentUser.mfaActive;
        const status = state.currentUser.mfaActive ? 'ENABLED' : 'DISABLED';
        logEvent('INFO', `User TOTP 2-Factor Authentication state toggled to ${status}`);
        showToast(`MFA is now ${status}`, state.currentUser.mfaActive ? 'success' : 'warning');
        saveState();
      });
    }
  }

  // ==========================================================================
  // 12. Main UI Render Orchestrator
  // ==========================================================================
  function renderAll() {
    // Topbar User Info
    const userNameEl = document.getElementById('currentUserName');
    const userRoleEl = document.getElementById('currentUserRole');
    const userAvatarEl = document.getElementById('userAvatar');

    if (userNameEl) userNameEl.textContent = state.currentUser.name;
    if (userRoleEl) {
      userRoleEl.textContent = state.currentUser.role.toUpperCase();
      userRoleEl.className = `user-role ${state.currentUser.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}`;
    }
    if (userAvatarEl) {
      userAvatarEl.textContent = state.currentUser.name.charAt(0);
    }

    // Toggle RBAC restricted UI buttons dynamically
    const adminOnlyElements = document.querySelectorAll('.rbac-admin-only');
    adminOnlyElements.forEach(el => {
      if (state.currentUser.role === 'admin') {
        el.style.display = '';
        el.removeAttribute('disabled');
      } else {
        // If standard user, either hide or style as restricted
        el.setAttribute('disabled', 'true');
        el.style.opacity = '0.5';
        el.title = 'Restricted action: Requires Admin role';
      }
    });

    renderNodes();
    renderContainers();
    renderStorage();
    renderPortsTable();
    renderRbac();
    renderEventLog();
    drawCanvasTelemetry();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    initModals();
    initTelemetry();
    renderAll();
    window.addEventListener('resize', drawCanvasTelemetry);
  });

})();
