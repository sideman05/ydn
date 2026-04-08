const authApi = './api/auth.php';
const dataApi = './api/data.php';
const publicationsUploadApi = './api/publications_upload.php';

const GROUPS = [
  { key: 'content', label: 'Content' },
  { key: 'communications', label: 'Communications' },
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'applications', label: 'Applications' },
  { key: 'comments', label: 'Comments' },
  { key: 'other', label: 'Other' },
];

const ENTITY_GROUP_MAP = {
  hero_stats: 'content',
  programs: 'content',
  involvement: 'content',
  resources: 'content',
  publications: 'content',
  fellowships: 'content',
  contact_details: 'communications',
  contact_messages: 'communications',
  program_inquiries: 'inquiries',
  involvement_inquiries: 'inquiries',
  fellowship_applications: 'applications',
  publication_comments: 'comments',
};

const state = {
  csrfToken: '',
  entities: [],
  activeGroup: 'content',
  activeEntity: null,
  rows: [],
  entityQuery: '',
  rowQuery: '',
};

const el = {
  loginView: document.getElementById('loginView'),
  dashboardView: document.getElementById('dashboardView'),
  loginForm: document.getElementById('loginForm'),
  loginError: document.getElementById('loginError'),
  loginConfigNotice: document.getElementById('loginConfigNotice'),
  logoutBtn: document.getElementById('logoutBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  createBtn: document.getElementById('createBtn'),
  statEntities: document.getElementById('statEntities'),
  statRows: document.getElementById('statRows'),
  statUpdated: document.getElementById('statUpdated'),
  groupTabs: document.getElementById('groupTabs'),
  groupTitle: document.getElementById('groupTitle'),
  entitySearch: document.getElementById('entitySearch'),
  entityList: document.getElementById('entityList'),
  entityTitle: document.getElementById('entityTitle'),
  entityMeta: document.getElementById('entityMeta'),
  rowSearch: document.getElementById('rowSearch'),
  tableError: document.getElementById('tableError'),
  tableEmpty: document.getElementById('tableEmpty'),
  dataHead: document.getElementById('dataHead'),
  dataBody: document.getElementById('dataBody'),
  recordDialog: document.getElementById('recordDialog'),
  recordForm: document.getElementById('recordForm'),
  dialogTitle: document.getElementById('dialogTitle'),
  recordFields: document.getElementById('recordFields'),
  recordError: document.getElementById('recordError'),
  cancelDialogBtn: document.getElementById('cancelDialogBtn'),
  adminToastRoot: document.getElementById('adminToastRoot'),
};

let dialogContext = { mode: 'create', row: null };

function showToast(message, type = 'info') {
  if (!el.adminToastRoot || !message) return;

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type === 'success' ? 'success' : type === 'error' ? 'error' : ''}`;
  toast.textContent = String(message);
  el.adminToastRoot.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => toast.remove(), 220);
  }, 2600);
}

function setButtonBusy(button, busy, busyText = 'Loading...') {
  if (!button) return;

  if (busy) {
    button.dataset.prevText = button.textContent || '';
    button.textContent = busyText;
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.prevText || button.textContent;
  delete button.dataset.prevText;
  button.disabled = false;
}

function displayEntityName(entityKey) {
  return entityKey.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getEntityMeta(entityKey) {
  return state.entities.find((entity) => entity.key === entityKey) || null;
}

function getEntityGroup(entityKey) {
  return ENTITY_GROUP_MAP[entityKey] || 'other';
}

function getEntitiesForActiveGroup() {
  const query = state.entityQuery.trim().toLowerCase();

  return state.entities.filter((entity) => {
    if (getEntityGroup(entity.key) !== state.activeGroup) {
      return false;
    }

    if (!query) return true;
    const label = displayEntityName(entity.key).toLowerCase();
    return label.includes(query) || entity.key.toLowerCase().includes(query);
  });
}

function updateStats() {
  if (el.statEntities) {
    el.statEntities.textContent = String(state.entities.length);
  }

  if (el.statRows) {
    el.statRows.textContent = String(state.rows.length);
  }

  if (el.statUpdated) {
    el.statUpdated.textContent = new Date().toLocaleTimeString();
  }
}

function showLogin(error = '') {
  el.loginView.classList.remove('hidden');
  el.dashboardView.classList.add('hidden');
  el.loginError.textContent = error;
}

function showDashboard() {
  el.loginView.classList.add('hidden');
  el.dashboardView.classList.remove('hidden');
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(state.csrfToken ? { 'X-CSRF-Token': state.csrfToken } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Unexpected server response (${response.status})`);
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

async function requestFormJson(url, formData, options = {}) {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      ...(state.csrfToken ? { 'X-CSRF-Token': state.csrfToken } : {}),
      ...(options.headers || {}),
    },
    body: formData,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Unexpected server response (${response.status})`);
  }

  if (!response.ok || data.success === false) {
    const firstError = data?.errors ? Object.values(data.errors)[0] : data?.message;
    throw new Error(firstError || `Request failed (${response.status})`);
  }

  return data;
}

function renderGroupTabs() {
  if (!el.groupTabs) return;

  el.groupTabs.innerHTML = '';

  GROUPS.forEach((group) => {
    const count = state.entities.filter((entity) => getEntityGroup(entity.key) === group.key).length;
    if (!count) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'group-tab';
    button.classList.toggle('active', group.key === state.activeGroup);
    button.innerHTML = `<span>${group.label}</span><strong>${count}</strong>`;
    button.addEventListener('click', async () => {
      state.activeGroup = group.key;
      state.entityQuery = '';
      if (el.entitySearch) el.entitySearch.value = '';
      const entities = getEntitiesForActiveGroup();
      if (!entities.some((entity) => entity.key === state.activeEntity)) {
        state.activeEntity = entities[0]?.key || null;
      }
      renderGroupTabs();
      renderEntityList();
      await loadEntityRows();
    });

    el.groupTabs.appendChild(button);
  });
}

function renderEntityList() {
  if (!el.entityList) return;

  const entities = getEntitiesForActiveGroup();
  const groupLabel = GROUPS.find((group) => group.key === state.activeGroup)?.label || 'Modules';

  if (el.groupTitle) {
    el.groupTitle.textContent = groupLabel;
  }

  el.entityList.innerHTML = '';

  entities.forEach((entity) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'module-item';
    button.classList.toggle('active', entity.key === state.activeEntity);
    button.innerHTML = `
      <span class="module-name">${displayEntityName(entity.key)}</span>
      <span class="module-meta">${entity.read_only_table ? 'Read only' : 'CRUD enabled'}</span>
    `;
    button.addEventListener('click', async () => {
      state.activeEntity = entity.key;
      renderEntityList();
      await loadEntityRows();
    });

    item.appendChild(button);
    el.entityList.appendChild(item);
  });

  if (!entities.length) {
    const item = document.createElement('li');
    item.className = 'subtle';
    item.textContent = 'No modules in this section.';
    el.entityList.appendChild(item);
  }
}

function renderTable() {
  const entity = getEntityMeta(state.activeEntity);

  if (!entity) {
    el.dataHead.innerHTML = '';
    el.dataBody.innerHTML = '';
    el.entityTitle.textContent = 'Select a module';
    el.entityMeta.textContent = '';
    if (el.tableEmpty) el.tableEmpty.classList.add('hidden');
    if (el.createBtn) el.createBtn.disabled = true;
    return;
  }

  const query = state.rowQuery.trim().toLowerCase();
  const displayRows = state.rows.filter((row) => {
    if (!query) return true;
    return Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(query));
  });

  el.entityTitle.textContent = displayEntityName(entity.key);
  el.entityMeta.textContent = `${displayRows.length} row(s)`;

  const columns = [entity.pk, ...entity.columns, ...(entity.readonly || [])];
  const uniqueColumns = [...new Set(columns)];

  const headRow = document.createElement('tr');
  uniqueColumns.forEach((column) => {
    const th = document.createElement('th');
    th.textContent = column;
    headRow.appendChild(th);
  });
  const actionsTh = document.createElement('th');
  actionsTh.textContent = 'Actions';
  headRow.appendChild(actionsTh);

  el.dataHead.innerHTML = '';
  el.dataHead.appendChild(headRow);
  el.dataBody.innerHTML = '';

  displayRows.forEach((row) => {
    const tr = document.createElement('tr');

    uniqueColumns.forEach((column) => {
      const td = document.createElement('td');
      const value = row[column] ?? '';

      if (typeof value === 'string' && value.length > 120) {
        const pre = document.createElement('pre');
        pre.textContent = value;
        td.appendChild(pre);
      } else {
        td.textContent = String(value);
      }

      tr.appendChild(td);
    });

    const actionsTd = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'row-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openDialog('edit', row));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'btn-danger';
    deleteBtn.addEventListener('click', async () => {
      const id = Number(row[entity.pk]);
      if (!Number.isFinite(id) || id <= 0) return;

      const confirmed = window.confirm('Delete this record permanently?');
      if (!confirmed) return;

      try {
        await requestJson(`${dataApi}?action=delete`, {
          method: 'POST',
          body: JSON.stringify({ entity: entity.key, id }),
        });
        showToast('Record deleted.', 'success');
        await loadEntityRows();
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

    if (entity.read_only_table) {
      editBtn.disabled = true;
      deleteBtn.disabled = true;
    }

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    actionsTd.appendChild(actions);
    tr.appendChild(actionsTd);
    el.dataBody.appendChild(tr);
  });

  if (el.tableEmpty) {
    el.tableEmpty.classList.toggle('hidden', displayRows.length > 0);
  }

  if (el.createBtn) {
    el.createBtn.disabled = Boolean(entity.read_only_table);
    el.createBtn.textContent = entity.read_only_table
      ? 'Read Only Module'
      : `Create ${displayEntityName(entity.key)}`;
  }

  updateStats();
}

function createFieldInput(column, value, entity) {
  const wrap = document.createElement('label');
  wrap.textContent = column;

  if (column === 'status' && Array.isArray(entity.status_values)) {
    const select = document.createElement('select');
    entity.status_values.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
    select.name = column;
    select.value = String(value ?? entity.status_values[0] ?? '');
    wrap.appendChild(select);
    return wrap;
  }

  const longColumns = ['description', 'message', 'comment', 'motivation'];
  const isLong = longColumns.includes(column);
  const input = isLong ? document.createElement('textarea') : document.createElement('input');
  input.name = column;
  input.value = value == null ? '' : String(value);

  if (['sort_order', 'publication_id'].includes(column)) {
    input.type = 'number';
    input.step = '1';
  } else if (column === 'email') {
    input.type = 'email';
  } else if (!isLong) {
    input.type = 'text';
  }

  wrap.appendChild(input);
  return wrap;
}

function openDialog(mode, row = null) {
  const entity = getEntityMeta(state.activeEntity);
  if (!entity || entity.read_only_table) return;

  dialogContext = { mode, row };
  el.recordError.textContent = '';
  el.recordFields.innerHTML = '';

  el.dialogTitle.textContent = mode === 'edit'
    ? `Edit ${displayEntityName(entity.key)}`
    : `Create ${displayEntityName(entity.key)}`;

  const columns = entity.columns.filter((column) => !(entity.key === 'publications' && mode === 'create' && column === 'image_path'));

  columns.forEach((column) => {
    const value = row ? row[column] : '';
    el.recordFields.appendChild(createFieldInput(column, value, entity));
  });

  if (entity.key === 'publications' && mode === 'create') {
    const wrap = document.createElement('label');
    wrap.textContent = 'image';
    const input = document.createElement('input');
    input.type = 'file';
    input.name = 'publication_image';
    input.accept = 'image/png,image/jpeg,image/webp,image/gif';
    input.required = true;
    wrap.appendChild(input);
    el.recordFields.appendChild(wrap);
  }

  el.recordDialog.showModal();
}

async function loadEntityRows() {
  if (!state.activeEntity) {
    state.rows = [];
    renderTable();
    return;
  }

  if (el.tableError) el.tableError.textContent = '';

  const result = await requestJson(`${dataApi}?action=list&entity=${encodeURIComponent(state.activeEntity)}`);
  state.rows = Array.isArray(result.data) ? result.data : [];
  renderTable();
}

async function loadEntities() {
  const result = await requestJson(`${dataApi}?action=entities`);
  state.entities = Array.isArray(result.data) ? result.data : [];

  const activeGroupEntities = state.entities.filter((entity) => getEntityGroup(entity.key) === state.activeGroup);
  if (!activeGroupEntities.length) {
    state.activeGroup = GROUPS.find((group) => state.entities.some((entity) => getEntityGroup(entity.key) === group.key))?.key || 'other';
  }

  const entitiesForGroup = state.entities.filter((entity) => getEntityGroup(entity.key) === state.activeGroup);
  if (!entitiesForGroup.some((entity) => entity.key === state.activeEntity)) {
    state.activeEntity = entitiesForGroup[0]?.key || null;
  }

  renderGroupTabs();
  renderEntityList();
  await loadEntityRows();
}

async function bootstrap() {
  try {
    const status = await requestJson(`${authApi}?action=status`, { method: 'GET', headers: {} });
    state.csrfToken = status.csrf_token || '';

    if (!status.has_password) {
      el.loginConfigNotice.classList.remove('hidden');
    }

    if (status.authenticated) {
      showDashboard();
      await loadEntities();
      return;
    }

    showLogin();
  } catch {
    showLogin('Unable to initialize admin panel.');
  }
}

el.loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  el.loginError.textContent = '';
  setButtonBusy(el.loginForm.querySelector('button[type="submit"]'), true, 'Signing In...');

  const formData = new FormData(el.loginForm);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');

  try {
    const result = await requestJson(`${authApi}?action=login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    state.csrfToken = result.csrf_token || state.csrfToken;
    showDashboard();
    await loadEntities();
    el.loginForm.reset();
    showToast('Login successful.', 'success');
  } catch (error) {
    el.loginError.textContent = error.message;
    showToast(error.message, 'error');
  } finally {
    setButtonBusy(el.loginForm.querySelector('button[type="submit"]'), false);
  }
});

el.logoutBtn?.addEventListener('click', async () => {
  setButtonBusy(el.logoutBtn, true, 'Logging Out...');
  try {
    await requestJson(`${authApi}?action=logout`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    showToast('Logged out.', 'success');
  } finally {
    state.csrfToken = '';
    showLogin();
    setButtonBusy(el.logoutBtn, false);
  }
});

el.refreshBtn?.addEventListener('click', async () => {
  setButtonBusy(el.refreshBtn, true, 'Refreshing...');
  try {
    await loadEntityRows();
    showToast('Refreshed.', 'success');
  } catch (error) {
    if (el.tableError) el.tableError.textContent = error.message;
    showToast(error.message, 'error');
  } finally {
    setButtonBusy(el.refreshBtn, false);
  }
});

el.createBtn?.addEventListener('click', () => {
  openDialog('create');
});

el.cancelDialogBtn?.addEventListener('click', () => {
  el.recordDialog.close();
});

el.recordForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const entity = getEntityMeta(state.activeEntity);
  if (!entity) return;

  const values = {};
  const formData = new FormData(el.recordForm);

  entity.columns.forEach((column) => {
    if (formData.has(column)) {
      values[column] = formData.get(column);
    }
  });

  const id = dialogContext.mode === 'edit' && dialogContext.row
    ? Number(dialogContext.row[entity.pk] || 0)
    : 0;

  const submitBtn = el.recordForm.querySelector('button[type="submit"]');
  setButtonBusy(submitBtn, true, 'Saving...');

  try {
    if (entity.key === 'publications' && dialogContext.mode === 'create') {
      const image = formData.get('publication_image');
      if (!(image instanceof File) || !image.name) {
        throw new Error('Cover image is required');
      }

      const upload = new FormData();
      upload.append('title', String(values.title || ''));
      upload.append('tag', String(values.tag || ''));
      upload.append('description', String(values.description || ''));
      upload.append('sort_order', String(values.sort_order || '0'));
      upload.append('image', image);

      await requestFormJson(publicationsUploadApi, upload);
    } else {
      await requestJson(`${dataApi}?action=save`, {
        method: 'POST',
        body: JSON.stringify({
          entity: entity.key,
          id,
          values,
        }),
      });
    }

    el.recordDialog.close();
    await loadEntityRows();
    showToast(entity.key === 'publications' && dialogContext.mode === 'create'
      ? 'Publication uploaded successfully.'
      : 'Record saved successfully.', 'success');
  } catch (error) {
    el.recordError.textContent = error.message;
    showToast(error.message, 'error');
  } finally {
    setButtonBusy(submitBtn, false);
  }
});

el.entitySearch?.addEventListener('input', () => {
  state.entityQuery = String(el.entitySearch.value || '');
  renderEntityList();
});

el.rowSearch?.addEventListener('input', () => {
  state.rowQuery = String(el.rowSearch.value || '');
  renderTable();
});

bootstrap();
