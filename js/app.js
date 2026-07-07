import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, addDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Every write is a create — never an update. Firestore merges unspecified
// fields from the existing document into partial updates, so an update-based
// rule check (e.g. "does the resulting doc have the right editKey") can be
// satisfied by a request that never supplies the key at all, as long as it
// targets a document that already has a valid key stored. Creates have no
// prior document to merge from, so this can't be bypassed. Each "member" is
// therefore an append-only event log grouped by personId; the UI renders
// only the latest (by createdAt) non-deleted event per person.

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const membersCol = collection(db, 'members');
const settingsCol = collection(db, 'settings');

const params = new URLSearchParams(location.search);
const canEdit = params.get('key') === EDIT_KEY;

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

const CLASS_ORDER = Object.keys(CLASS_SPECS);

function playerCardHtml(m) {
  const color = CLASS_COLORS[m.main] || '#ccc';
  const second = (m.second && m.second !== 'Role Fill')
    ? specBadge(m.second, m.spec2)
    : m.second === 'Role Fill' ? `<span class="spec-badge rolefill"><span class="role-icon">🔀</span><span class="spec-name">Role Fill</span></span>` : '';
  const roles = [SPEC_ROLE[m.spec], m.second && m.second !== 'Role Fill' ? SPEC_ROLE[m.spec2] : null].filter(Boolean).join(' ');
  return `
    <article class="player-card" data-main="${m.main}" data-roles="${roles}">
      <div class="card-top">
        <h3 class="player-name" style="color:${color}">${m.name}</h3>
        ${canEdit ? `<span class="card-actions">
          <button class="icon-btn edit-member" data-id="${m.personId}" title="Edit">✏️</button>
          <button class="icon-btn delete-member" data-id="${m.personId}" title="Delete">🗑️</button>
        </span>` : ''}
      </div>
      <div class="badges">
        ${specBadge(m.main, m.spec)}
        ${second}
      </div>
      ${m.note ? `<p class="note">${m.note}</p>` : ''}
    </article>`;
}

function renderRoster(members) {
  const container = document.getElementById('roster-grid');

  const groups = CLASS_ORDER
    .map(cls => ({ cls, list: members.filter(m => m.main === cls) }))
    .filter(g => g.list.length > 0);

  container.innerHTML = groups.map(({ cls, list }) => `
    <section class="class-group" data-class="${cls}">
      <h2 class="class-group-title" style="color:${CLASS_COLORS[cls]}">
        ${cls} <span class="class-group-count">${list.length}</span>
      </h2>
      <div class="class-group-grid">${list.map(playerCardHtml).join('')}</div>
    </section>`).join('');

  container.querySelectorAll('.edit-member').forEach(btn => btn.addEventListener('click', () => {
    const member = members.find(m => m.personId === btn.dataset.id);
    openForm(member);
  }));
  container.querySelectorAll('.delete-member').forEach(btn => btn.addEventListener('click', async () => {
    const member = members.find(m => m.personId === btn.dataset.id);
    if (confirm(`Remove ${member.name} from the roster?`)) {
      await addDoc(membersCol, {
        personId: member.personId,
        name: member.name,
        deleted: true,
        createdAt: Date.now(),
        editKey: EDIT_KEY,
      });
    }
  }));

  applyFilters();
}

function computeCounts(members) {
  const roles = { Tank: 0, Healer: 0, Melee: 0, Ranged: 0 };
  const armor = { Cloth: 0, Leather: 0, Mail: 0, Plate: 0 };
  const classes = {};
  CLASS_ORDER.forEach(c => { classes[c] = 0; });
  members.forEach(m => {
    const role = SPEC_ROLE[m.spec];
    if (role) roles[role]++;
    if (CLASS_ARMOR[m.main]) armor[CLASS_ARMOR[m.main]]++;
    if (classes[m.main] !== undefined) classes[m.main]++;
  });
  return { roles, armor, classes };
}

function renderStats(members) {
  const { roles, armor, classes } = computeCounts(members);

  const rowsHtml = (counts, order, colorOf) => order.map(key => `
    <div class="stat-row">
      <span class="stat-label" style="${colorOf ? `color:${colorOf(key)}` : ''}">${ROLE_ICON[key] ? ROLE_ICON[key] + ' ' : ''}${key}</span>
      <span class="stat-count">${counts[key] || 0}</span>
    </div>`).join('');

  document.getElementById('role-stats').innerHTML = rowsHtml(roles, ['Tank', 'Healer', 'Melee', 'Ranged']);
  document.getElementById('class-stats').innerHTML = rowsHtml(classes, CLASS_ORDER, c => CLASS_COLORS[c]);
  document.getElementById('armor-stats').innerHTML = rowsHtml(armor, ['Cloth', 'Leather', 'Mail', 'Plate']);
  document.getElementById('total-count').textContent = `${members.length} members`;
}

function applyFilters() {
  const role = document.querySelector('#role-filters .filter-btn.active')?.dataset.role || 'all';
  const cls = document.querySelector('#class-filters .filter-btn.active')?.dataset.class || 'all';

  document.querySelectorAll('.class-group').forEach(group => {
    let anyVisible = false;
    group.querySelectorAll('.player-card').forEach(card => {
      const roleMatch = role === 'all' || card.dataset.roles.includes(role);
      const classMatch = cls === 'all' || card.dataset.main === cls;
      const show = roleMatch && classMatch;
      card.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    group.style.display = anyVisible ? '' : 'none';
  });
}

function setupFilter() {
  const classFilters = document.getElementById('class-filters');
  classFilters.innerHTML = ['<button class="filter-btn active" data-class="all">All</button>']
    .concat(CLASS_ORDER.map(c => `<button class="filter-btn" data-class="${c}" style="--class-color:${CLASS_COLORS[c]}">${c}</button>`))
    .join('');

  document.querySelectorAll('#role-filters .filter-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('#role-filters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  }));
  document.querySelectorAll('#class-filters .filter-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('#class-filters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  }));
}

// ---- Add / edit form ----

const dialog = document.getElementById('member-form-dialog');
const form = document.getElementById('member-form');
const classOptions = Object.keys(CLASS_SPECS);

function fillClassSelect(select, { allowNone, allowRoleFill } = {}) {
  const opts = [];
  if (allowNone) opts.push('<option value="">— None —</option>');
  classOptions.forEach(c => opts.push(`<option value="${c}">${c}</option>`));
  if (allowRoleFill) opts.push('<option value="Role Fill">Role Fill</option>');
  select.innerHTML = opts.join('');
}

function fillSpecSelect(select, className) {
  const specs = CLASS_SPECS[className] || [];
  select.innerHTML = specs.map(s => `<option value="${s}">${s}</option>`).join('');
  select.disabled = specs.length === 0;
}

function openForm(member) {
  form.reset();
  form.dataset.personId = member ? member.personId : '';
  document.getElementById('form-title').textContent = member ? `Edit ${member.name}` : 'Add member';

  fillClassSelect(form.main, {});
  fillClassSelect(form.second, { allowNone: true, allowRoleFill: true });

  form.name.value = member?.name || '';
  form.main.value = member?.main || classOptions[0];
  fillSpecSelect(form.spec, form.main.value);
  if (member?.spec) form.spec.value = member.spec;

  form.second.value = member?.second || '';
  if (form.second.value && form.second.value !== 'Role Fill') {
    fillSpecSelect(form.spec2, form.second.value);
    form.spec2.value = member.spec2 || '';
  } else {
    form.spec2.innerHTML = '';
    form.spec2.disabled = true;
  }

  form.note.value = member?.note || '';
  dialog.showModal();
}

form.main.addEventListener('change', () => fillSpecSelect(form.spec, form.main.value));
form.second.addEventListener('change', () => {
  if (form.second.value && form.second.value !== 'Role Fill') {
    fillSpecSelect(form.spec2, form.second.value);
  } else {
    form.spec2.innerHTML = '';
    form.spec2.disabled = true;
  }
});

document.getElementById('cancel-form').addEventListener('click', () => dialog.close());

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    personId: form.dataset.personId || crypto.randomUUID(),
    name: form.name.value.trim(),
    main: form.main.value,
    spec: form.spec.value,
    second: form.second.value || '',
    spec2: (form.second.value && form.second.value !== 'Role Fill') ? form.spec2.value : '',
    note: form.note.value.trim(),
    createdAt: Date.now(),
    editKey: EDIT_KEY,
  };
  if (!data.name) return;

  await addDoc(membersCol, data);
  dialog.close();
});

document.getElementById('add-member-btn')?.addEventListener('click', () => openForm(null));

// ---- Site settings (subtitle / footer text) ----

const settingsDialog = document.getElementById('settings-form-dialog');
const settingsForm = document.getElementById('settings-form');
let currentSettings = {};

function renderSettings(settings) {
  currentSettings = settings;
  document.querySelector('.subtitle').textContent = settings.subtitle || '';
  const el = document.getElementById('footer-text');
  if (!settings.footerText) { el.style.display = 'none'; return; }
  el.textContent = settings.footerText;
  el.style.display = 'block';
}

document.getElementById('edit-settings-btn')?.addEventListener('click', () => {
  settingsForm.subtitle.value = currentSettings.subtitle || '';
  settingsForm.footerText.value = currentSettings.footerText || '';
  settingsDialog.showModal();
});

document.getElementById('cancel-settings-form').addEventListener('click', () => settingsDialog.close());

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await addDoc(settingsCol, {
    subtitle: settingsForm.subtitle.value.trim(),
    footerText: settingsForm.footerText.value.trim(),
    createdAt: Date.now(),
    editKey: EDIT_KEY,
  });
  settingsDialog.close();
});

// ---- Live sync ----

function init() {
  const statusEl = document.getElementById('status');
  if (canEdit) document.body.classList.add('edit-mode');
  setupFilter();

  onSnapshot(membersCol, (snapshot) => {
    const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const latestByPerson = new Map();
    for (const ev of events) {
      const pid = ev.personId || ev.id;
      const current = latestByPerson.get(pid);
      if (!current || (ev.createdAt || 0) > (current.createdAt || 0)) {
        latestByPerson.set(pid, { ...ev, personId: pid });
      }
    }
    const members = [...latestByPerson.values()].filter(m => !m.deleted);
    renderStats(members);
    renderRoster(members);
    statusEl.textContent = canEdit
      ? `Live — editing enabled`
      : `Live — ${new Date().toLocaleTimeString()}`;
  }, (err) => {
    statusEl.textContent = `Failed to load roster: ${err.message}`;
    statusEl.classList.add('error');
  });

  onSnapshot(settingsCol, (snapshot) => {
    const events = snapshot.docs.map(d => d.data());
    const latest = events.reduce((a, b) => ((b.createdAt || 0) > (a?.createdAt || 0) ? b : a), null);
    if (latest) renderSettings(latest);
  });
}

init();
