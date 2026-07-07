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

function renderRoster(members) {
  const grid = document.getElementById('roster-grid');
  grid.innerHTML = members.filter(m => !m.tribute).map(m => {
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
  }).join('');

  grid.querySelectorAll('.edit-member').forEach(btn => btn.addEventListener('click', () => {
    const member = members.find(m => m.personId === btn.dataset.id);
    openForm(member);
  }));
  grid.querySelectorAll('.delete-member').forEach(btn => btn.addEventListener('click', async () => {
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
}

function computeCounts(members) {
  const roles = { Tank: 0, Healer: 0, Melee: 0, Ranged: 0 };
  const armor = { Cloth: 0, Leather: 0, Mail: 0, Plate: 0 };
  members.filter(m => !m.tribute).forEach(m => {
    const role = SPEC_ROLE[m.spec];
    if (role) roles[role]++;
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
  const total = members.filter(m => !m.tribute).length;
  document.getElementById('total-count').textContent = `${total} / ${TARGETS.total} signed up`;
}

function renderTribute(members) {
  const tribute = members.find(m => m.tribute);
  const el = document.getElementById('tribute');
  if (!tribute) { el.style.display = 'none'; return; }
  el.innerHTML = `<span class="tribute-name">${tribute.name}</span> — <span class="tribute-note">${tribute.note}</span>`;
  el.style.display = 'block';
}

function setupFilter() {
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

// ---- Live sync ----

function init() {
  const statusEl = document.getElementById('status');
  if (canEdit) document.body.classList.add('edit-mode');

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
    renderTribute(members);
    statusEl.textContent = canEdit
      ? `Live — editing enabled`
      : `Live — ${new Date().toLocaleTimeString()}`;
  }, (err) => {
    statusEl.textContent = `Failed to load roster: ${err.message}`;
    statusEl.classList.add('error');
  });

  setupFilter();
}

init();
