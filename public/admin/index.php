<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YDNEA Admin Panel</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/admin.css?v=20260324e" />
</head>
<body>
  <main class="admin-root">
    <section id="loginView" class="card login-card hidden">
      <div class="login-brand">
        <h1>YDNEA Admin</h1>
        <p class="subtle">Secure access for website management.</p>
      </div>

      <div id="loginConfigNotice" class="notice hidden">
        Admin credentials are not configured. Set <strong>ADMIN_USERNAME</strong> and either <strong>ADMIN_PASSWORD</strong> or <strong>ADMIN_PASSWORD_HASH</strong> in your environment.
      </div>

      <form id="loginForm" novalidate>
        <label>
          Username
          <input type="text" name="username" autocomplete="username" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autocomplete="current-password" required />
        </label>
        <button type="submit" class="btn-primary">Sign In</button>
      </form>
      <p id="loginError" class="error"></p>
    </section>

    <section id="dashboardView" class="dashboard hidden">
      <header class="topbar card panel">
        <div class="topbar-copy">
          <p class="eyebrow">YDNEA Administration</p>
          <h2>Operations Dashboard</h2>
          <p class="subtle">Separated workspaces for content, inquiries, applications, and communications.</p>
        </div>
        <div class="topbar-actions">
          <button id="refreshBtn">Refresh</button>
          <button id="logoutBtn" class="btn-danger">Logout</button>
        </div>
      </header>

      <section class="stats-grid">
        <article class="card stat-card panel">
          <p class="stat-label">Modules</p>
          <p id="statEntities" class="stat-value">0</p>
        </article>
        <article class="card stat-card panel">
          <p class="stat-label">Rows Loaded</p>
          <p id="statRows" class="stat-value">0</p>
        </article>
        <article class="card stat-card panel">
          <p class="stat-label">Last Sync</p>
          <p id="statUpdated" class="stat-value stat-value-small">-</p>
        </article>
      </section>

      <nav id="groupTabs" class="group-tabs card panel"></nav>

      <div class="workspace-grid">
        <aside class="module-pane card panel">
          <div class="module-head">
            <h3 id="groupTitle">Modules</h3>
            <input id="entitySearch" type="search" placeholder="Search module" />
          </div>
          <ul id="entityList" class="module-list"></ul>
        </aside>

        <section class="data-pane card panel">
          <div class="content-head">
            <div>
              <h3 id="entityTitle">Select a module</h3>
              <span id="entityMeta" class="subtle"></span>
            </div>
            <div class="content-head-actions">
              <input id="rowSearch" type="search" placeholder="Search rows" />
              <button id="createBtn" class="btn-primary">Create Record</button>
            </div>
          </div>

          <p id="tableError" class="error"></p>
          <p id="tableEmpty" class="subtle table-empty hidden">No records found for this view.</p>

          <div class="table-wrap">
            <table id="dataTable">
              <thead id="dataHead"></thead>
              <tbody id="dataBody"></tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  </main>

  <dialog id="recordDialog">
    <form id="recordForm" method="dialog" class="record-form">
      <div class="dialog-head">
        <h3 id="dialogTitle">Edit Record</h3>
      </div>
      <div id="recordFields" class="record-fields"></div>
      <p id="recordError" class="error"></p>
      <div class="dialog-actions">
        <button type="button" id="cancelDialogBtn">Cancel</button>
        <button type="submit" class="btn-primary">Save</button>
      </div>
    </form>
  </dialog>

  <div id="adminToastRoot" class="admin-toast-root" aria-live="polite" aria-atomic="true"></div>

  <script src="assets/admin.js?v=20260324f"></script>
</body>
</html>
