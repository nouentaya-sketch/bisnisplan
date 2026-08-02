// js/step6.js
// Tahap 6: Struktur Bisnis
// Mengikuti struktur file "Copy of Tahap 6-Struktur Bisnis.xlsx":
// 6 kategori (Keterampilan, Sarana, Modal, Lingkungan Alam, Pasar,
// Sosial & Prasarana), masing-masing 2 tabel (No | Faktor | Penjelasan),
// ditutup dengan 1 tabel besar "Analisa" (6 kolom gabungan).
// Semua tabel mulai dari 1 baris dan bisa ditambah lewat tombol.
//
// 🌟 Update layout mobile: tiap <td> yang berisi input diberi atribut
// data-label supaya di layar HP, tabel bisa berubah jadi kartu bertumpuk
// dengan label kecil di atas tiap isian (lihat css/step6.css).

document.addEventListener('DOMContentLoaded', () => {

  const PAGE_KEY = document.body.dataset.page || window.location.pathname;
  const DEFAULT_ROWS = 1;

  // ==========================================
  // Autosave field Nama Lengkap
  // ==========================================
  const namaLengkapEl = document.getElementById('nama-lengkap');
  if (namaLengkapEl) {
    const key = `${PAGE_KEY}-nama-lengkap`;
    const saved = localStorage.getItem(key);
    if (saved !== null) namaLengkapEl.value = saved;
    namaLengkapEl.addEventListener('input', () => {
      localStorage.setItem(key, namaLengkapEl.value);
    });
  }

  // ==========================================
  // Helper: auto-resize textarea
  // ==========================================
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  // ==========================================================
  // BAGIAN A — Tabel 2 kolom (No | Faktor | Penjelasan)
  // Dipakai untuk 6 kategori: Keterampilan, Sarana, Modal,
  // Lingkungan Alam, Pasar, Sosial & Prasarana
  // ==========================================================
  const twoColTables = [
    // ---- 1. Keterampilan (hijau) ----
    { containerId: 'struktur-keterampilan-sudah-wrap', storageKey: 'struktur-keterampilan-sudah', theme: 'green', colLabel: 'Faktor Keterampilan yang Sudah Dimiliki' },
    { containerId: 'struktur-keterampilan-akan-wrap', storageKey: 'struktur-keterampilan-akan', theme: 'green', colLabel: 'Faktor Keterampilan yang Akan Dimiliki' },

    // ---- 2. Sarana (hijau) ----
    { containerId: 'struktur-sarana-sudah-wrap', storageKey: 'struktur-sarana-sudah', theme: 'green', colLabel: 'Faktor Sarana yang Sudah Dimiliki' },
    { containerId: 'struktur-sarana-akan-wrap', storageKey: 'struktur-sarana-akan', theme: 'green', colLabel: 'Faktor Sarana yang Akan Dimiliki' },

    // ---- 3. Modal (hijau) ----
    { containerId: 'struktur-modal-sekarang-wrap', storageKey: 'struktur-modal-sekarang', theme: 'green', colLabel: 'Faktor Modal yang Dapat Diakses Sekarang' },
    { containerId: 'struktur-modal-akan-wrap', storageKey: 'struktur-modal-akan', theme: 'green', colLabel: 'Faktor Modal yang Akan Dapat Diakses' },

    // ---- 4. Lingkungan Alam (oranye) ----
    { containerId: 'struktur-alam-kelebihan-wrap', storageKey: 'struktur-alam-kelebihan', theme: 'orange', colLabel: 'Faktor Lingkungan Alam: Kelebihan' },
    { containerId: 'struktur-alam-kelemahan-wrap', storageKey: 'struktur-alam-kelemahan', theme: 'orange', colLabel: 'Faktor Lingkungan Alam: Kelemahan' },

    // ---- 5. Pasar (oranye) ----
    { containerId: 'struktur-pasar-kelebihan-wrap', storageKey: 'struktur-pasar-kelebihan', theme: 'orange', colLabel: 'Faktor Pasar: Kelebihan' },
    { containerId: 'struktur-pasar-kelemahan-wrap', storageKey: 'struktur-pasar-kelemahan', theme: 'orange', colLabel: 'Faktor Pasar: Kelemahan' },

    // ---- 6. Sosial & Prasarana (oranye) ----
    { containerId: 'struktur-sosial-kelebihan-wrap', storageKey: 'struktur-sosial-kelebihan', theme: 'orange', colLabel: 'Faktor Sosial & Prasarana: Kelebihan' },
    { containerId: 'struktur-sosial-kelemahan-wrap', storageKey: 'struktur-sosial-kelemahan', theme: 'orange', colLabel: 'Faktor Sosial & Prasarana: Kelemahan' }
  ];

  function createTwoColTable({ containerId, storageKey, theme, colLabel }) {

    const container = document.getElementById(containerId);
    if (!container) return;

    const dataKey = `${PAGE_KEY}-${storageKey}-rows`;

    let rows;
    const saved = localStorage.getItem(dataKey);
    rows = saved ? JSON.parse(saved) : Array.from({ length: DEFAULT_ROWS }, () => ({ ext: '', int: '' }));
    if (rows.length < 1) rows.push({ ext: '', int: '' });

    container.innerHTML = `
      <div class="struktur-table-wrapper theme-${theme}">
        <div class="struktur-table-scroll">
          <table class="struktur-table">
            <thead>
              <tr>
                <th class="no-col">No</th>
                <th>${colLabel}</th>
                <th>Penjelasan</th>
                <th class="action-col"></th>
              </tr>
            </thead>
            <tbody class="struktur-tbody"></tbody>
          </table>
        </div>
        <div class="button-row">
          <button type="button" class="btn-add btn-add-row">
            <i class="fa-solid fa-plus"></i> Tambah Baris
          </button>
        </div>
      </div>
    `;

    const tbody = container.querySelector('.struktur-tbody');
    const btnAddRow = container.querySelector('.btn-add-row');

    function saveRows() {
      localStorage.setItem(dataKey, JSON.stringify(rows));
    }

    function renderRows() {
      tbody.innerHTML = '';

      rows.forEach((rowData, index) => {
        const tr = document.createElement('tr');

        // 🌟 data-label pada td dipakai CSS untuk mode kartu di HP.
        // Sel nomor sengaja TIDAK diberi data-label (jadi badge bulat polos).
        tr.innerHTML = `
          <td class="no-cell">${index + 1}</td>
          <td data-label="${colLabel}"><textarea class="struktur-input ext-input" placeholder="Tuliskan faktornya...">${rowData.ext || ''}</textarea></td>
          <td data-label="Penjelasan"><textarea class="struktur-input int-input" placeholder="Tuliskan penjelasan...">${rowData.int || ''}</textarea></td>
          <td class="action-cell">
            ${rows.length > 1 ? `<button type="button" class="btn-remove-row" title="Hapus baris"><i class="fa-solid fa-trash"></i> <span class="btn-remove-text">Hapus Baris</span></button>` : ''}
          </td>
        `;

        const extInput = tr.querySelector('.ext-input');
        const intInput = tr.querySelector('.int-input');
        const btnRemove = tr.querySelector('.btn-remove-row');

        autoResize(extInput);
        autoResize(intInput);

        extInput.addEventListener('input', () => {
          rows[index].ext = extInput.value;
          autoResize(extInput);
          saveRows();
        });

        intInput.addEventListener('input', () => {
          rows[index].int = intInput.value;
          autoResize(intInput);
          saveRows();
        });

        if (btnRemove) {
          btnRemove.addEventListener('click', () => {
            rows.splice(index, 1);
            saveRows();
            renderRows();
          });
        }

        tbody.appendChild(tr);
      });
    }

    btnAddRow.addEventListener('click', () => {
      rows.push({ ext: '', int: '' });
      saveRows();
      renderRows();
      const lastRow = tbody.querySelector('tr:last-child .ext-input');
      if (lastRow) {
        lastRow.focus();
        lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    renderRows();
    saveRows();
  }

  twoColTables.forEach(createTwoColTable);

  // ==========================================================
  // BAGIAN B — Tabel "Analisa" (6 kolom gabungan)
  // ==========================================================
  function createAnalisaTable() {

    const container = document.getElementById('struktur-analisa-wrap');
    if (!container) return;

    const keyA = `${PAGE_KEY}-struktur-analisa-a-rows`;
    const keyB = `${PAGE_KEY}-struktur-analisa-b-rows`;

    const emptyRow = () => ({ c1: '', c2: '', c3: '', c4: '', c5: '', c6: '' });

    let rowsA = JSON.parse(localStorage.getItem(keyA) || 'null') || [emptyRow()];
    let rowsB = JSON.parse(localStorage.getItem(keyB) || 'null') || [emptyRow()];
    if (rowsA.length < 1) rowsA = [emptyRow()];
    if (rowsB.length < 1) rowsB = [emptyRow()];

    // Label per kolom untuk masing-masing grup (dipakai sbg data-label di
    // mode kartu mobile, harus sesuai persis dengan header tabel desktop).
    const labelsA = [
      'Keterampilan yang Sudah Dimiliki',
      'Sarana yang Sudah Dimiliki',
      'Modal yang Sudah Dimiliki',
      'Lingkungan Alam: Kelebihan',
      'Pasar: Kelebihan',
      'Sosial & Prasarana: Kelebihan'
    ];
    const labelsB = [
      'Keterampilan yang Akan Dimiliki',
      'Sarana yang Akan Dimiliki',
      'Modal yang Akan Dapat Diakses',
      'Lingkungan Alam: Kelemahan',
      'Pasar: Kelemahan',
      'Sosial & Prasarana: Kelemahan'
    ];

    container.innerHTML = `
      <div class="analisa-table-wrapper">
        <div class="analisa-title-bar">Struktur Bisnis Anda</div>

        <div class="analisa-group-bar">
          <div class="analisa-group-cell group-internal">Internal</div>
          <div class="analisa-group-cell group-eksternal">Eksternal</div>
        </div>

        <div class="analisa-scroll">
          <table class="analisa-table">
            <thead>
              <tr class="head-a">
                <th class="theme-green">Keterampilan yang Sudah Dimiliki</th>
                <th class="theme-green">Sarana yang Sudah Dimiliki</th>
                <th class="theme-green">Modal yang Sudah Dimiliki</th>
                <th class="theme-orange">Lingkungan Alam: Kelebihan</th>
                <th class="theme-orange">Pasar: Kelebihan</th>
                <th class="theme-orange">Sosial & Prasarana: Kelebihan</th>
                <th class="action-col"></th>
              </tr>
            </thead>
            <tbody class="analisa-tbody-a"></tbody>
          </table>
        </div>
        <div class="button-row">
          <button type="button" class="btn-add btn-add-analisa-a">
            <i class="fa-solid fa-plus"></i> Tambah Baris
          </button>
        </div>

        <div class="analisa-scroll mt-16">
          <table class="analisa-table">
            <thead>
              <tr class="head-b">
                <th class="theme-green">Keterampilan yang Akan Dimiliki</th>
                <th class="theme-green">Sarana yang Akan Dimiliki</th>
                <th class="theme-green">Modal yang Akan Dapat Diakses</th>
                <th class="theme-orange">Lingkungan Alam: Kelemahan</th>
                <th class="theme-orange">Pasar: Kelemahan</th>
                <th class="theme-orange">Sosial & Prasarana: Kelemahan</th>
                <th class="action-col"></th>
              </tr>
            </thead>
            <tbody class="analisa-tbody-b"></tbody>
          </table>
        </div>
        <div class="button-row">
          <button type="button" class="btn-add btn-add-analisa-b">
            <i class="fa-solid fa-plus"></i> Tambah Baris
          </button>
        </div>
      </div>
    `;

    const tbodyA = container.querySelector('.analisa-tbody-a');
    const tbodyB = container.querySelector('.analisa-tbody-b');
    const btnAddA = container.querySelector('.btn-add-analisa-a');
    const btnAddB = container.querySelector('.btn-add-analisa-b');

    function saveA() { localStorage.setItem(keyA, JSON.stringify(rowsA)); }
    function saveB() { localStorage.setItem(keyB, JSON.stringify(rowsB)); }

    function renderGroup(tbody, rows, saveFn, labels) {
      tbody.innerHTML = '';

      rows.forEach((rowData, index) => {
        const tr = document.createElement('tr');

        const keys = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
        const cellsHtml = keys.map((key, i) => `
          <td data-label="${labels[i]}"><textarea class="analisa-input" data-key="${key}" placeholder="...">${rowData[key] || ''}</textarea></td>
        `).join('');

        tr.innerHTML = `
          ${cellsHtml}
          <td class="action-cell">
            ${rows.length > 1 ? `<button type="button" class="btn-remove-row" title="Hapus baris"><i class="fa-solid fa-trash"></i> <span class="btn-remove-text">Hapus Baris</span></button>` : ''}
          </td>
        `;

        tr.querySelectorAll('.analisa-input').forEach(input => {
          autoResize(input);
          input.addEventListener('input', () => {
            rowData[input.dataset.key] = input.value;
            autoResize(input);
            saveFn();
          });
        });

        const btnRemove = tr.querySelector('.btn-remove-row');
        if (btnRemove) {
          btnRemove.addEventListener('click', () => {
            rows.splice(index, 1);
            saveFn();
            renderGroup(tbody, rows, saveFn, labels);
          });
        }

        tbody.appendChild(tr);
      });
    }

    btnAddA.addEventListener('click', () => {
      rowsA.push(emptyRow());
      saveA();
      renderGroup(tbodyA, rowsA, saveA, labelsA);
    });

    btnAddB.addEventListener('click', () => {
      rowsB.push(emptyRow());
      saveB();
      renderGroup(tbodyB, rowsB, saveB, labelsB);
    });

    renderGroup(tbodyA, rowsA, saveA, labelsA);
    renderGroup(tbodyB, rowsB, saveB, labelsB);
    saveA();
    saveB();
  }

  createAnalisaTable();

});