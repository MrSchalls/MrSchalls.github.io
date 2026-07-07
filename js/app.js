function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f !== ''));
}

function specBadge(cls, spec) {
  const color = CLASS_COLORS[cls] || '#ccc';
  const role = SPEC_ROLE[spec];
  const icon = role ? ROLE_ICON[role] : '';
  return `<span class="spec-badge" style="--class-color:${color}">
    <span class="role-icon">${icon}</span>
    <span class="spec-name">${spec}</span>
    <span class="class-name" style="color:${color}">${cls}</span>
  </span>`;
}

function renderRoster(members) {
  const grid = document.getElementById('roster-grid');
  grid.innerHTML = members.map(m => {
    const color = CLASS_COLORS[m.main] || '#ccc';
    const second = (m.second && m.second !== 'Role Fill')
      ? specBadge(m.second, m.spec2)
      : m.second === 'Role Fill' ? `<span class="spec-badge rolefill"><span class="role-icon">🔀</span><span class="spec-name">Role Fill</span></span>` : '';
    return `
      <article class="player-card" data-main="${m.main}" data-roles="${[m.role1, m.role2].filter(Boolean).join(' ')}">
        <h3 class="player-name" style="color:${color}">${m.name}</h3>
        <div class="badges">
          ${specBadge(m.main, m.spec)}
          ${second}
        </div>
        ${m.note ? `<p class="note">${m.note}</p>` : ''}
      </article>`;
  }).join('');
}

function computeCounts(members) {
  const roles = { Tank: 0, Healer: 0, Melee: 0, Ranged: 0 };
  const armor = { Cloth: 0, Leather: 0, Mail: 0, Plate: 0 };
  members.forEach(m => {
    if (m.role1) roles[m.role1]++;
    if (CLASS_ARMOR[m.main]) armor[CLASS_ARMOR[m.main]]++;
  });
  return { roles, armor };
}

function renderStats(members) {
  const { roles, armor } = computeCounts(members);

  const barsHtml = (counts, targets, order) => order.map(key => {
    const have = counts[key] || 0;
    const need = targets[key];
    const pct = Math.min(100, Math.round((have / need) * 100));
    const status = have >= need ? 'met' : 'under';
    return `
      <div class="stat-row">
        <span class="stat-label">${ROLE_ICON[key] || ''} ${key}</span>
        <div class="stat-bar"><div class="stat-fill ${status}" style="width:${pct}%"></div></div>
        <span class="stat-count">${have}/${need}</span>
      </div>`;
  }).join('');

  document.getElementById('role-stats').innerHTML = barsHtml(roles, TARGETS.roles, ['Tank', 'Healer', 'Melee', 'Ranged']);
  document.getElementById('armor-stats').innerHTML = barsHtml(armor, TARGETS.armor, ['Cloth', 'Leather', 'Mail', 'Plate']);
  document.getElementById('total-count').textContent = `${members.length} / ${TARGETS.total} signed up`;
}

function renderTribute(name, note) {
  const el = document.getElementById('tribute');
  if (!name) { el.style.display = 'none'; return; }
  el.innerHTML = `<span class="tribute-name">${name}</span> — <span class="tribute-note">${note}</span>`;
  el.style.display = 'block';
}

function setupFilter(members) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const role = btn.dataset.role;
    document.querySelectorAll('.player-card').forEach(card => {
      card.style.display = (role === 'all' || card.dataset.roles.includes(role)) ? '' : 'none';
    });
  }));
}

async function init() {
  const statusEl = document.getElementById('status');
  try {
    const res = await fetch(CSV_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseCSV(text).slice(1); // drop header

    const members = [];
    let tributeName = null, tributeNote = null;

    rows.forEach(r => {
      const [name, main, spec, second, spec2, note] = r;
      if (!name) return;
      if (!main) {
        if (note) { tributeName = name; tributeNote = note; }
        return;
      }
      members.push({
        name, main, spec, second, spec2, note,
        role1: SPEC_ROLE[spec] || null,
        role2: second && second !== 'Role Fill' ? SPEC_ROLE[spec2] : null,
      });
    });

    renderStats(members);
    renderRoster(members);
    renderTribute(tributeName, tributeNote);
    setupFilter(members);

    statusEl.textContent = `Last loaded ${new Date().toLocaleString()}`;
  } catch (err) {
    statusEl.textContent = `Failed to load roster: ${err.message}`;
    statusEl.classList.add('error');
  }
}

init();
