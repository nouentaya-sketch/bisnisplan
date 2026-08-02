// js/step7.js
// Tahap 7: Analisis SWOT
// Meng-generate 6 tabel (3 kategori x Kesempatan/Ancaman), minimal 1 baris,
// dengan tombol Tambah Baris untuk menambah lebih banyak baris.
// Setiap tabel disimpan sebagai satu array di localStorage.
//
// 🌟 Update layout mobile: tiap <td> diberi atribut data-label supaya di
// layar HP, tabel bisa "berubah bentuk" jadi kartu bertumpuk (lihat
// css/step7.css) dengan label kecil di atas tiap isian, bukan tabel sempit
// yang harus di-scroll ke samping.

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
  // Konfigurasi tiap tabel yang akan dibuat
  // Teks & urutan kolom disamakan PERSIS dengan file Excel
  // "Copy_of_Tahap_7-Analisa_SWOT.xlsx" (termasuk penulisan aslinya).
  //
  // colLabel      = versi HTML (boleh ada <br>) untuk header tabel desktop
  // colLabelPlain = versi teks polos (tanpa HTML) dipakai untuk data-label
  //                 di mode kartu mobile
  // ==========================================
  const tables = [
    {
      containerId: 'swot-alam-kesempatan-wrap',
      storageKey: 'swot-alam-kesempatan',
      title: 'Analisa untuk meningkatkan kesempatan',
      colLabel: 'Faktor Eksternal (Lingkungan Alam): <br>Kelebihan',
      colLabelPlain: 'Faktor Eksternal (Lingkungan Alam): Kelebihan'
    },
    {
      containerId: 'swot-alam-ancaman-wrap',
      storageKey: 'swot-alam-ancaman',
      title: 'Analisa untuk memimimalisir ancaman',
      colLabel: 'Faktor Eksternal (Lingkungan Alam): Kelemahan',
      colLabelPlain: 'Faktor Eksternal (Lingkungan Alam): Kelemahan'
    },
    {
      containerId: 'swot-pasar-kesempatan-wrap',
      storageKey: 'swot-pasar-kesempatan',
      title: 'Analisa untuk meningkatkan kesempatan',
      colLabel: 'Faktor Eksternal (Pasar): <br>Kelebihan',
      colLabelPlain: 'Faktor Eksternal (Pasar): Kelebihan'
    },
    {
      containerId: 'swot-pasar-ancaman-wrap',
      storageKey: 'swot-pasar-ancaman',
      title: 'Analisa untuk memimimalisir ancaman',
      colLabel: 'Faktor Eksternal (Pasar): <br>Kelemahan',
      colLabelPlain: 'Faktor Eksternal (Pasar): Kelemahan'
    },
    {
      containerId: 'swot-sosial-kesempatan-wrap',
      storageKey: 'swot-sosial-kesempatan',
      title: 'Analisa untuk meningkatkan kesempatan',
      colLabel: 'Faktor Eksternal (Sosial & Prasarana): <br>Kelebihan',
      colLabelPlain: 'Faktor Eksternal (Sosial & Prasarana): Kelebihan'
    },
    {
      containerId: 'swot-sosial-ancaman-wrap',
      storageKey: 'swot-sosial-ancaman',
      title: 'Analisa untuk memimimalisir ancaman',
      colLabel: 'Faktor Eksternal: Sosial & Prasarana: Kelemahan',
      colLabelPlain: 'Faktor Eksternal: Sosial & Prasarana: Kelemahan'
    }
  ];

  const INTERNAL_LABEL_PLAIN = 'Faktor Internal yang digunakan';

  // ==========================================
  // Helper: auto-resize textarea mengikuti isi
  // ==========================================
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  // ==========================================
  // Migrasi data lama (format per-sel: key-ext-1, key-int-1, dst)
  // ke format array baru, supaya data yang sudah diisi tidak hilang.
  // ==========================================
  function migrateOldData(storageKey) {
    const rows = [];
    let foundOld = false;
    const OLD_MIGRATION_ROWS = 10; // versi lama selalu pakai 10 baris tetap

    for (let i = 1; i <= OLD_MIGRATION_ROWS; i++) {
      const extKey = `${PAGE_KEY}-${storageKey}-ext-${i}`;
      const intKey = `${PAGE_KEY}-${storageKey}-int-${i}`;
      const ext = localStorage.getItem(extKey);
      const int = localStorage.getItem(intKey);

      if (ext !== null || int !== null) foundOld = true;

      rows.push({ ext: ext || '', int: int || '' });

      if (ext !== null) localStorage.removeItem(extKey);
      if (int !== null) localStorage.removeItem(intKey);
    }

    return foundOld ? rows : null;
  }

  // ==========================================
  // Fungsi utama: buat 1 tabel SWOT
  // ==========================================
  function createSwotTable({ containerId, storageKey, title, colLabel, colLabelPlain }) {

    const container = document.getElementById(containerId);
    if (!container) return;

    const dataKey = `${PAGE_KEY}-${storageKey}-rows`;

    // ---------- Load data (array baru > migrasi data lama > default kosong) ----------
    let rows;
    const savedNew = localStorage.getItem(dataKey);

    if (savedNew) {
      rows = JSON.parse(savedNew);
    } else {
      rows = migrateOldData(storageKey) || Array.from({ length: DEFAULT_ROWS }, () => ({ ext: '', int: '' }));
    }

    if (rows.length < 1) rows.push({ ext: '', int: '' });

    // ---------- Render kerangka tabel ----------
    container.innerHTML = `
      <div class="swot-table-wrapper">
        <div class="swot-table-title">${title}</div>
        <div class="swot-table-scroll">
          <table class="swot-table">
            <thead>
              <tr>
                <th class="no-col">No</th>
                <th>${colLabel}</th>
                <th>Faktor Internal yang digunakan</th>
                <th class="action-col"></th>
              </tr>
            </thead>
            <tbody class="swot-tbody"></tbody>
          </table>
        </div>
        <div class="button-row">
          <button type="button" class="btn-add btn-add-row">
            <i class="fa-solid fa-plus"></i> Tambah Baris
          </button>
        </div>
      </div>
    `;

    const tbody = container.querySelector('.swot-tbody');
    const btnAddRow = container.querySelector('.btn-add-row');

    function saveRows() {
      localStorage.setItem(dataKey, JSON.stringify(rows));
    }

    function renderRows() {
      tbody.innerHTML = '';

      rows.forEach((rowData, index) => {
        const tr = document.createElement('tr');

        // 🌟 data-label dipasang di tiap <td> supaya CSS mode mobile bisa
        // menampilkannya sebagai judul kecil di atas isian (lihat step7.css)
        tr.innerHTML = `
          <td class="no-cell">${index + 1}</td>
          <td data-label="${colLabelPlain}">
            <textarea class="swot-input ext-input" placeholder="Tuliskan faktor eksternal...">${rowData.ext || ''}</textarea>
          </td>
          <td data-label="${INTERNAL_LABEL_PLAIN}">
            <textarea class="swot-input int-input" placeholder="Tuliskan faktor internal yang digunakan...">${rowData.int || ''}</textarea>
          </td>
          <td class="action-cell">
            ${
              rows.length > 1
                ? `<button type="button" class="btn-remove-row" title="Hapus baris"><i class="fa-solid fa-trash"></i> <span class="btn-remove-text">Hapus Baris</span></button>`
                : ''
            }
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
      // Fokuskan ke baris baru & scroll supaya user langsung tahu barisnya nambah
      const lastRow = tbody.querySelector('tr:last-child .ext-input');
      if (lastRow) {
        lastRow.focus();
        lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    renderRows();
    saveRows();
  }

  // ==========================================
  // Inisialisasi semua tabel
  // ==========================================
  tables.forEach(createSwotTable);

});