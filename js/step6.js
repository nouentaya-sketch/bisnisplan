// js/step6.js
// Tahap 6: Struktur Bisnis
// Mengikuti struktur file "Copy of Tahap 6-Struktur Bisnis.xlsx":
// 6 kategori (Keterampilan, Sarana, Modal, Lingkungan Alam, Pasar,
// Sosial & Prasarana), masing-masing 2 tabel (No | Faktor | Penjelasan),
// ditutup dengan 1 tabel besar "Analisa" (6 kolom gabungan).
// Semua tabel mulai dari 1 baris dan bisa ditambah lewat tombol.
//
// 🌟 FIX (CSV export/import): tiap <textarea> baris sekarang diberi
// atribut id unik berpola "<storageKey>-ext-<index>" / "-int-<index>",
// supaya exportPageToCSV (header-route.js) tidak lagi jatuh ke fallback
// id generik "input" untuk semua field (yang menyebabkan banyak baris
// CSV punya ID sama dan gagal dikenali balik saat import).
//
// 🌟 FIX (CSV import ke tabel dinamis): karena jumlah baris tiap tabel
// bisa berubah-ubah (user bisa Tambah/Hapus Baris), saat import CSV
// jumlah baris yang sedang tampil di halaman bisa lebih sedikit dari
// jumlah baris yang ada di file CSV. window.ensureDynamicRowsForImport()
// diekspos di sini supaya header-route.js bisa memanggilnya SEBELUM
// mengisi value, untuk menambah baris yang kurang terlebih dahulu.
//
// 🌟 Update layout mobile: tiap <td> yang berisi input diberi atribut
// data-label supaya di layar HP, tabel bisa berubah jadi kartu bertumpuk
// dengan label kecil di atas tiap isian (lihat css/step6.css).
//
// 🌟 Update contoh otomatis: tiap tabel sekarang punya placeholder yang
// berisi CONTOH konkret (bukan cuma instruksi generik "Tuliskan
// faktornya..."), supaya pengguna langsung tahu jenis jawaban yang
// diharapkan begitu form dibuka — tanpa perlu baca penjelasan terpisah.
//
// 🌟 Update tabel "Analisa" (bagian 7): dulu diisi MANUAL (user ngetik
// ulang ringkasan), sekarang tabel ini OTOMATIS terisi dari kolom
// "Faktor" pada tabel 1–6 di atasnya. Tiap kali user mengetik/menambah/
// menghapus baris di salah satu tabel Faktor, event 'struktur:rows-changed'
// dipancarkan lewat document, dan tabel Analisa mendengarkan event itu
// untuk langsung merender ulang isinya — tanpa reload halaman. Textarea
// di tabel Analisa dibuat readonly karena isinya sekarang turunan
// (derived), bukan data yang diketik langsung di situ — dan karena itu
// SENGAJA tidak diberi id (tidak perlu ikut diexport/diimport, lihat
// juga pengecualian `input.readOnly` di header-route.js).

document.addEventListener('DOMContentLoaded', () => {

  const PAGE_KEY = document.body.dataset.page || window.location.pathname;
  const DEFAULT_ROWS = 1;

  // 🌟 Registry kecil: storageKey -> { getRowCount, addRow }
  // Diisi oleh createTwoColTable untuk tiap tabel Faktor, dipakai oleh
  // window.ensureDynamicRowsForImport (lihat paling bawah).
  const tableInstances = {};

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
  //
  // 🌟 extPlaceholder / intPlaceholder = contoh konkret yang otomatis
  // tampil di kolom "Faktor" dan "Penjelasan" sebelum pengguna mengetik.
  //
  // 🌟 storageKey di sini JUGA dipakai sebagai kunci pemetaan ke tabel
  // Analisa di bagian bawah (lihat ANALISA_COLUMNS_A / _B) DAN sebagai
  // prefix id unik tiap textarea (lihat renderRows) — jangan ubah
  // storageKey tanpa menyesuaikan kedua pemetaan itu juga.
  // ==========================================================
  const twoColTables = [
    // ---- 1. Keterampilan (hijau) ----
    {
      containerId: 'struktur-keterampilan-sudah-wrap', storageKey: 'struktur-keterampilan-sudah', theme: 'green',
      colLabel: 'Faktor Keterampilan yang Sudah Dimiliki',
      extPlaceholder: 'Contoh: Menjahit, Mengelas, Bertani Organik, Memasak...',
      intPlaceholder: 'Contoh: Sudah dikuasai sejak 2 tahun lalu dan terbiasa dipakai membantu usaha keluarga.'
    },
    {
      containerId: 'struktur-keterampilan-akan-wrap', storageKey: 'struktur-keterampilan-akan', theme: 'green',
      colLabel: 'Faktor Keterampilan yang Akan Dimiliki',
      extPlaceholder: 'Contoh: Pemasaran Digital, Akuntansi Dasar, Manajemen Stok...',
      intPlaceholder: 'Contoh: Akan dipelajari lewat pelatihan online sebelum kembali ke Indonesia.'
    },

    // ---- 2. Sarana (hijau) ----
    {
      containerId: 'struktur-sarana-sudah-wrap', storageKey: 'struktur-sarana-sudah', theme: 'green',
      colLabel: 'Faktor Sarana yang Sudah Dimiliki',
      extPlaceholder: 'Contoh: Traktor Tangan, Mesin Jahit, Lahan Sawah...',
      intPlaceholder: 'Contoh: Dibeli tahun 2023, kondisi masih layak pakai.'
    },
    {
      containerId: 'struktur-sarana-akan-wrap', storageKey: 'struktur-sarana-akan', theme: 'green',
      colLabel: 'Faktor Sarana yang Akan Dimiliki',
      extPlaceholder: 'Contoh: Cold Storage, Kendaraan Pengangkut, Gudang...',
      intPlaceholder: 'Contoh: Akan dibeli dari hasil tabungan magang setelah kembali.'
    },

    // ---- 3. Modal (hijau) ----
    {
      containerId: 'struktur-modal-sekarang-wrap', storageKey: 'struktur-modal-sekarang', theme: 'green',
      colLabel: 'Faktor Modal yang Dapat Diakses Sekarang',
      extPlaceholder: 'Contoh: Tabungan Pribadi, Modal dari Keluarga...',
      intPlaceholder: 'Contoh: Rp 20.000.000 dari hasil menabung selama magang.'
    },
    {
      containerId: 'struktur-modal-akan-wrap', storageKey: 'struktur-modal-akan', theme: 'green',
      colLabel: 'Faktor Modal yang Akan Dapat Diakses',
      extPlaceholder: 'Contoh: Pinjaman KUR, Investor, Koperasi Desa...',
      intPlaceholder: 'Contoh: Akan diajukan setelah usaha berjalan stabil ± 6 bulan.'
    },

    // ---- 4. Lingkungan Alam (oranye) ----
    {
      containerId: 'struktur-alam-kelebihan-wrap', storageKey: 'struktur-alam-kelebihan', theme: 'orange',
      colLabel: 'Faktor Lingkungan Alam: Kelebihan',
      extPlaceholder: 'Contoh: Tanah Subur, Sumber Air Melimpah, Iklim Sejuk...',
      intPlaceholder: 'Contoh: Curah hujan stabil sepanjang tahun sehingga cocok untuk pertanian.'
    },
    {
      containerId: 'struktur-alam-kelemahan-wrap', storageKey: 'struktur-alam-kelemahan', theme: 'orange',
      colLabel: 'Faktor Lingkungan Alam: Kelemahan',
      extPlaceholder: 'Contoh: Rawan Banjir, Cuaca Ekstrem, Tanah Kering...',
      intPlaceholder: 'Contoh: Sering terjadi kekeringan panjang saat musim kemarau.'
    },

    // ---- 5. Pasar (oranye) ----
    {
      containerId: 'struktur-pasar-kelebihan-wrap', storageKey: 'struktur-pasar-kelebihan', theme: 'orange',
      colLabel: 'Faktor Pasar: Kelebihan',
      extPlaceholder: 'Contoh: Permintaan Tinggi, Harga Jual Stabil...',
      intPlaceholder: 'Contoh: Dekat dengan pasar tradisional dan pusat perbelanjaan.'
    },
    {
      containerId: 'struktur-pasar-kelemahan-wrap', storageKey: 'struktur-pasar-kelemahan', theme: 'orange',
      colLabel: 'Faktor Pasar: Kelemahan',
      extPlaceholder: 'Contoh: Persaingan Ketat, Harga Fluktuatif...',
      intPlaceholder: 'Contoh: Banyak pesaing menjual produk sejenis di area yang sama.'
    },

    // ---- 6. Sosial & Prasarana (oranye) ----
    {
      containerId: 'struktur-sosial-kelebihan-wrap', storageKey: 'struktur-sosial-kelebihan', theme: 'orange',
      colLabel: 'Faktor Sosial & Prasarana: Kelebihan',
      extPlaceholder: 'Contoh: Akses Jalan Baik, Dukungan Warga Sekitar...',
      intPlaceholder: 'Contoh: Jalan desa sudah diaspal sehingga distribusi lebih mudah.'
    },
    {
      containerId: 'struktur-sosial-kelemahan-wrap', storageKey: 'struktur-sosial-kelemahan', theme: 'orange',
      colLabel: 'Faktor Sosial & Prasarana: Kelemahan',
      extPlaceholder: 'Contoh: Listrik Sering Padam, Jalan Rusak, Sinyal Lemah...',
      intPlaceholder: 'Contoh: Sinyal internet lemah sehingga menyulitkan pemasaran online.'
    }
  ];

  function createTwoColTable({ containerId, storageKey, theme, colLabel, extPlaceholder, intPlaceholder }) {

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

    // 🌟 Setiap kali data tabel Faktor ini berubah (ketik/tambah/hapus
    // baris), simpan ke localStorage LALU beri tahu bagian lain halaman
    // (khususnya tabel Analisa di bagian 7) lewat custom event, supaya
    // ringkasan otomatis di Analisa ikut ter-update tanpa reload.
    function saveRows() {
      localStorage.setItem(dataKey, JSON.stringify(rows));
      document.dispatchEvent(new CustomEvent('struktur:rows-changed', { detail: { storageKey } }));
    }

    function renderRows() {
      tbody.innerHTML = '';

      rows.forEach((rowData, index) => {
        const tr = document.createElement('tr');

        // 🌟 id unik per baris ("<storageKey>-ext-<index>" / "-int-<index>")
        // supaya Export/Import CSV (header-route.js) bisa mengenali tiap
        // field secara pasti — sebelumnya textarea ini tidak punya id
        // sama sekali sehingga export/import CSV gagal mencocokkannya.
        //
        // 🌟 data-label pada td dipakai CSS untuk mode kartu di HP.
        // Sel nomor sengaja TIDAK diberi data-label (jadi badge bulat polos).
        // 🌟 placeholder textarea sekarang berisi CONTOH konkret (bukan
        // instruksi generik), muncul otomatis selama sel masih kosong.
        tr.innerHTML = `
          <td class="no-cell">${index + 1}</td>
          <td data-label="${colLabel}"><textarea id="${storageKey}-ext-${index}" name="${storageKey}-ext-${index}" class="struktur-input ext-input" placeholder="${extPlaceholder}">${rowData.ext || ''}</textarea></td>
          <td data-label="Penjelasan"><textarea id="${storageKey}-int-${index}" name="${storageKey}-int-${index}" class="struktur-input int-input" placeholder="${intPlaceholder}">${rowData.int || ''}</textarea></td>
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

    // 🌟 Daftarkan tabel ini ke registry supaya bisa "diminta menambah
    // baris" dari luar (dipakai window.ensureDynamicRowsForImport saat
    // import CSV membutuhkan lebih banyak baris daripada yang tampil).
    tableInstances[storageKey] = {
      getRowCount: () => rows.length,
      addRow: () => {
        rows.push({ ext: '', int: '' });
        saveRows();
        renderRows();
      }
    };
  }

  twoColTables.forEach(createTwoColTable);

  // ==========================================================
  // 🌟 HOOK untuk header-route.js: dipanggil SEBELUM CSV diisikan ke
  // form, supaya tiap tabel Faktor menambah baris dulu kalau file CSV
  // yang diimport ternyata punya lebih banyak baris daripada yang
  // sedang tampil di halaman saat ini. Tanpa ini, baris "kelebihan"
  // di CSV tidak akan pernah ketemu elemen tujuannya (karena barisnya
  // belum ada di DOM) dan otomatis dilewati saat import.
  //
  // fieldIds: array id mentah dari kolom "ID" file CSV, contoh:
  //   ["struktur-keterampilan-sudah-ext-0", "struktur-keterampilan-sudah-int-0", ...]
  // ==========================================================
  window.ensureDynamicRowsForImport = function (fieldIds) {
    const neededCounts = {}; // storageKey -> jumlah baris yang dibutuhkan

    fieldIds.forEach(id => {
      const match = id.match(/^(.+)-(ext|int)-(\d+)$/);
      if (!match) return;
      const storageKey = match[1];
      const idx = parseInt(match[3], 10);
      if (!Number.isFinite(idx)) return;
      const needed = idx + 1;
      if (!neededCounts[storageKey] || neededCounts[storageKey] < needed) {
        neededCounts[storageKey] = needed;
      }
    });

    Object.keys(neededCounts).forEach(storageKey => {
      const table = tableInstances[storageKey];
      if (!table) return;
      while (table.getRowCount() < neededCounts[storageKey]) {
        table.addRow();
      }
    });
  };

  // ==========================================================
  // BAGIAN B — Tabel "Analisa" (6 kolom gabungan)
  //
  // 🌟 Sekarang tabel ini TIDAK diisi manual lagi. Tiap kolom memetakan
  // ke salah satu tabel Faktor di bagian 1–6 (lewat storageKey yang
  // sama persis dengan yang dipakai di twoColTables di atas), dan
  // isinya diambil otomatis dari kolom "Faktor" (bukan "Penjelasan")
  // tabel sumber tsb — digabung jadi daftar bertanda "•" per baris.
  //
  // 🌟 Textarea di tabel ini SENGAJA tidak diberi id/name — isinya
  // turunan (derived), bukan data primer, jadi tidak perlu (dan tidak
  // boleh) ikut diexport/diimport lewat CSV. Lihat pengecualian
  // `input.readOnly` di exportPageToCSV (header-route.js).
  // ==========================================================
  function createAnalisaTable() {

    const container = document.getElementById('struktur-analisa-wrap');
    if (!container) return;

    // Grup A = sisi "Sudah Dimiliki / Kelebihan" (baris atas tiap kategori)
    const ANALISA_COLUMNS_A = [
      { storageKey: 'struktur-keterampilan-sudah', label: 'Keterampilan yang Sudah Dimiliki', theme: 'theme-green' },
      { storageKey: 'struktur-sarana-sudah', label: 'Sarana yang Sudah Dimiliki', theme: 'theme-green' },
      { storageKey: 'struktur-modal-sekarang', label: 'Modal yang Sudah Dimiliki', theme: 'theme-green' },
      { storageKey: 'struktur-alam-kelebihan', label: 'Lingkungan Alam: Kelebihan', theme: 'theme-orange' },
      { storageKey: 'struktur-pasar-kelebihan', label: 'Pasar: Kelebihan', theme: 'theme-orange' },
      { storageKey: 'struktur-sosial-kelebihan', label: 'Sosial & Prasarana: Kelebihan', theme: 'theme-orange' }
    ];

    // Grup B = sisi "Akan Dimiliki / Kelemahan" (baris bawah tiap kategori)
    const ANALISA_COLUMNS_B = [
      { storageKey: 'struktur-keterampilan-akan', label: 'Keterampilan yang Akan Dimiliki', theme: 'theme-green' },
      { storageKey: 'struktur-sarana-akan', label: 'Sarana yang Akan Dimiliki', theme: 'theme-green' },
      { storageKey: 'struktur-modal-akan', label: 'Modal yang Akan Dapat Diakses', theme: 'theme-green' },
      { storageKey: 'struktur-alam-kelemahan', label: 'Lingkungan Alam: Kelemahan', theme: 'theme-orange' },
      { storageKey: 'struktur-pasar-kelemahan', label: 'Pasar: Kelemahan', theme: 'theme-orange' },
      { storageKey: 'struktur-sosial-kelemahan', label: 'Sosial & Prasarana: Kelemahan', theme: 'theme-orange' }
    ];

    container.innerHTML = `
      <div class="analisa-table-wrapper">
        <div class="analisa-title-bar">Struktur Bisnis Anda</div>
        <p class="analisa-auto-note">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          Kolom di bawah ini terisi otomatis dari kolom "Faktor" pada tabel 1–6 di atas.
        </p>

        <div class="analisa-group-bar">
          <div class="analisa-group-cell group-internal">Internal</div>
          <div class="analisa-group-cell group-eksternal">Eksternal</div>
        </div>

        <div class="analisa-scroll">
          <table class="analisa-table">
            <thead>
              <tr class="head-a">
                ${ANALISA_COLUMNS_A.map(c => `<th class="${c.theme}">${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="analisa-tbody-a"></tbody>
          </table>
        </div>

        <div class="analisa-scroll mt-16">
          <table class="analisa-table">
            <thead>
              <tr class="head-b">
                ${ANALISA_COLUMNS_B.map(c => `<th class="${c.theme}">${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="analisa-tbody-b"></tbody>
          </table>
        </div>
      </div>
    `;

    const tbodyA = container.querySelector('.analisa-tbody-a');
    const tbodyB = container.querySelector('.analisa-tbody-b');

    // Ambil daftar isian kolom "Faktor" (ext) yang tidak kosong dari
    // tabel sumber tertentu, langsung dari localStorage (sumber
    // kebenarannya sama dengan yang dipakai createTwoColTable di atas).
    function getFactorList(storageKey) {
      const dataKey = `${PAGE_KEY}-${storageKey}-rows`;
      let rows = [];
      try {
        rows = JSON.parse(localStorage.getItem(dataKey) || '[]');
        if (!Array.isArray(rows)) rows = [];
      } catch (e) {
        rows = [];
      }
      return rows
        .map(row => (row.ext || '').trim())
        .filter(text => text !== '');
    }

    function renderGroup(tbody, columns) {
      tbody.innerHTML = '';
      const tr = document.createElement('tr');

      tr.innerHTML = columns.map(c => `
        <td data-label="${c.label}">
          <textarea
            class="analisa-input analisa-input-auto"
            data-source="${c.storageKey}"
            readonly
            placeholder="Otomatis muncul di sini setelah kolom Faktor pada tabel di atas diisi..."
          ></textarea>
        </td>
      `).join('');

      tbody.appendChild(tr);

      columns.forEach(c => {
        const textarea = tr.querySelector(`textarea[data-source="${c.storageKey}"]`);
        const items = getFactorList(c.storageKey);
        textarea.value = items.map(item => `• ${item}`).join('\n');
        autoResize(textarea);
      });
    }

    function renderAll() {
      renderGroup(tbodyA, ANALISA_COLUMNS_A);
      renderGroup(tbodyB, ANALISA_COLUMNS_B);
    }

    renderAll();

    // 🌟 Render ulang setiap kali salah satu tabel Faktor di atas
    // berubah (event dipancarkan dari saveRows() di createTwoColTable).
    document.addEventListener('struktur:rows-changed', renderAll);
  }

  createAnalisaTable();

});
