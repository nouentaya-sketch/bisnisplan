// js/step9.js
// Tahap 9: Hasil Riset Bisnis Superstar Jepang
// Item 1-8: field teks biasa (autosave).
// Item 9-17: tabel (Item | Penjelasan) dengan sub-baris berlabel huruf
// (a, b, c, ...), mulai dari 1 baris, bisa ditambah lewat tombol.
// Di layar mobile (<=680px), tabel ini otomatis berubah jadi kartu
// bertumpuk lewat CSS (lihat step9.css), memakai atribut data-label
// yang di-render di sini sebagai judul tiap kolom.

document.addEventListener('DOMContentLoaded', () => {

  const PAGE_KEY = document.body.dataset.page || window.location.pathname;
  const DEFAULT_ROWS = 1;

  // ==========================================
  // 1. Autosave field statis (item 1-8 + Nama Lengkap + Nama Superstar)
  // ==========================================
  document.querySelectorAll('[data-save="true"]').forEach(el => {
    if (!el.id) return;

    const key = `${PAGE_KEY}-${el.id}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) el.value = saved;

    el.addEventListener('input', () => {
      localStorage.setItem(key, el.value);
    });
  });

  // ==========================================
  // Helper: auto-resize textarea
  // ==========================================
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  // ==========================================
  // Helper: index (0,1,2,...) -> huruf (a,b,c,...z,aa,ab,...)
  // ==========================================
  function toLetter(index) {
    let n = index;
    let label = '';
    do {
      label = String.fromCharCode(97 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return label;
  }

  // ==========================================
  // Helper: escape teks yang disisipkan lewat innerHTML,
  // supaya karakter seperti "<" tidak merusak markup
  // dan supaya nilai lama (tanpa escaping) tetap tampil wajar.
  // ==========================================
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ==========================================
  // 2. Konfigurasi tabel item 9-17
  // ==========================================
  const tables = [
    { containerId: 'tbl-sarana-barang-wrap', storageKey: 'tbl-sarana-barang', colLabel: 'Sarana dan Barang Bisnis' },
    { containerId: 'tbl-sumber-dana-wrap', storageKey: 'tbl-sumber-dana', colLabel: 'Sumber Dana' },
    { containerId: 'tbl-hasil-komoditas-wrap', storageKey: 'tbl-hasil-komoditas', colLabel: 'Hasil Komoditas dan Layanan' },
    { containerId: 'tbl-pemasaran-wrap', storageKey: 'tbl-pemasaran', colLabel: 'Pemasaran' },
    { containerId: 'tbl-sumber-informasi-wrap', storageKey: 'tbl-sumber-informasi', colLabel: 'Sumber Informasi Bisnis' },
    { containerId: 'tbl-hambatan-wrap', storageKey: 'tbl-hambatan', colLabel: 'Hambatan Bisnis pada Saat Ini' },
    { containerId: 'tbl-risiko-wrap', storageKey: 'tbl-risiko', colLabel: 'Risiko Bisnis' },
    { containerId: 'tbl-cita-cita-wrap', storageKey: 'tbl-cita-cita', colLabel: 'Cita-cita Masa Depan' },
    { containerId: 'tbl-diterapkan-wrap', storageKey: 'tbl-diterapkan', colLabel: 'Apa yang Bisa Diterapkan dalam Bisnis Anda' }
  ];

  function createItemTable({ containerId, storageKey, colLabel }) {

    const container = document.getElementById(containerId);
    if (!container) return;

    const dataKey = `${PAGE_KEY}-${storageKey}-rows`;

    let rows = JSON.parse(localStorage.getItem(dataKey) || 'null')
      || Array.from({ length: DEFAULT_ROWS }, () => ({ item: '', penjelasan: '' }));

    if (rows.length < 1) rows.push({ item: '', penjelasan: '' });

    container.innerHTML = `
      <div class="riset-table-wrapper">
        <div class="riset-table-scroll">
          <table class="riset-table">
            <thead>
              <tr>
                <th class="huruf-col"></th>
                <th>${colLabel}</th>
                <th>Penjelasan</th>
                <th class="action-col"></th>
              </tr>
            </thead>
            <tbody class="riset-tbody"></tbody>
          </table>
        </div>
        <div class="button-row">
          <button type="button" class="btn-add btn-add-row">
            <i class="fa-solid fa-plus"></i> Tambah Baris
          </button>
        </div>
      </div>
    `;

    const tbody = container.querySelector('.riset-tbody');
    const btnAddRow = container.querySelector('.btn-add-row');

    function saveRows() {
      localStorage.setItem(dataKey, JSON.stringify(rows));
    }

    function renderRows() {
      tbody.innerHTML = '';

      rows.forEach((rowData, index) => {
        const tr = document.createElement('tr');
        const letter = toLetter(index);

        tr.innerHTML = `
          <td class="huruf-cell">${letter}</td>
          <td data-label="${colLabel}"><textarea class="riset-input item-input" placeholder="Tuliskan item...">${escapeHtml(rowData.item || '')}</textarea></td>
          <td data-label="Penjelasan"><textarea class="riset-input penjelasan-input" placeholder="Tuliskan penjelasan...">${escapeHtml(rowData.penjelasan || '')}</textarea></td>
          <td class="action-cell">
            ${rows.length > 1 ? `<button type="button" class="btn-remove-row" title="Hapus baris" aria-label="Hapus baris ${letter}"><i class="fa-solid fa-trash"></i></button>` : ''}
          </td>
        `;

        const itemInput = tr.querySelector('.item-input');
        const penjelasanInput = tr.querySelector('.penjelasan-input');
        const btnRemove = tr.querySelector('.btn-remove-row');

        autoResize(itemInput);
        autoResize(penjelasanInput);

        itemInput.addEventListener('input', () => {
          rows[index].item = itemInput.value;
          autoResize(itemInput);
          saveRows();
        });

        penjelasanInput.addEventListener('input', () => {
          rows[index].penjelasan = penjelasanInput.value;
          autoResize(penjelasanInput);
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
      rows.push({ item: '', penjelasan: '' });
      saveRows();
      renderRows();
      // fokuskan textarea pertama di baris baru supaya user langsung bisa mengetik
      const newRow = tbody.lastElementChild;
      const newInput = newRow && newRow.querySelector('.item-input');
      if (newInput) newInput.focus();
    });

    renderRows();
    saveRows();
  }

  tables.forEach(createItemTable);

});