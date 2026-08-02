// js/step10.js
// Tahap 10: Pengajuan Sertifikat
// Semua field (text, number, date, select, checkbox) otomatis tersimpan.
// Checklist di bagian 8 juga menghitung progress secara otomatis.
//
// Nama Bisnis Plan & Lokasi Bisnis (Alamat) tadinya 4 field tetap
// (biz-plan-1..4 / biz-lokasi-1..4). Sekarang keduanya jadi list yang
// mulai dari 1 field dan bisa ditambah lewat tombol, maksimal 4 sesuai
// aturan sertifikat aslinya. Data lama yang sudah tersimpan di 4 field
// tetap tersebut otomatis dipindahkan ke list baru (lihat createNumberedList).

document.addEventListener('DOMContentLoaded', () => {

  const PAGE_KEY = document.body.dataset.page || window.location.pathname;

  // ==========================================
  // 1. Autosave semua field (text, number, date, select, checkbox)
  // ==========================================
  document.querySelectorAll('[data-save="true"]').forEach(el => {
    if (!el.id) return;

    const key = `${PAGE_KEY}-${el.id}`;
    const isCheckbox = el.type === 'checkbox';

    const saved = localStorage.getItem(key);

    if (saved !== null) {
      if (isCheckbox) {
        el.checked = saved === 'true';
      } else {
        el.value = saved;
      }
    }

    el.addEventListener(isCheckbox ? 'change' : 'input', () => {
      localStorage.setItem(key, isCheckbox ? el.checked : el.value);
      if (isCheckbox) updateChecklistProgress();
    });
  });

  // ==========================================
  // 2. Progress bar checklist (bagian 8)
  // ==========================================
  const checklistBoxes = document.querySelectorAll('#checklist-container input[type="checkbox"]');
  const progressText = document.getElementById('checklist-progress-text');
  const progressFill = document.getElementById('checklist-progress-fill');

  function updateChecklistProgress() {
    if (!progressText || !progressFill) return;

    const total = checklistBoxes.length;
    const done = Array.from(checklistBoxes).filter(cb => cb.checked).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    progressText.innerText = `${done} dari ${total} tahap selesai`;
    progressFill.style.width = `${percent}%`;

    // Warna progress bar berdasarkan syarat minimal (Tahap 1-4)
    const first4Done = Array.from(checklistBoxes).slice(0, 4).every(cb => cb.checked);
    progressFill.classList.toggle('progress-ok', first4Done);
    progressFill.classList.toggle('progress-warning', !first4Done);
  }

  updateChecklistProgress();

  // ==========================================
  // 3. List bernomor (1, 2, 3, ...) yang bisa tambah/hapus baris,
  //    dipakai untuk Nama Bisnis Plan & Lokasi Bisnis (Alamat).
  //    Menggantikan 4 field tetap yang lama.
  // ==========================================
  function createNumberedList({ containerId, storageKeyPrefix, itemLabel, placeholderPrefix, legacyIds, maxRows }) {

    const container = document.getElementById(containerId);
    if (!container) return;

    const dataKey = `${PAGE_KEY}-${storageKeyPrefix}-rows`;

    let rows = JSON.parse(localStorage.getItem(dataKey) || 'null');

    if (!rows) {
      // Migrasi dari field lama yang jumlahnya tetap (mis. biz-plan-1..4).
      // Ambil semua nilainya, lalu buang slot kosong di ujung supaya
      // tampilan awal tidak menampilkan banyak field kosong.
      const legacyValues = (legacyIds || []).map(id => localStorage.getItem(`${PAGE_KEY}-${id}`) || '');

      while (legacyValues.length > 1 && legacyValues[legacyValues.length - 1] === '') {
        legacyValues.pop();
      }

      rows = legacyValues.length ? legacyValues.map(v => ({ value: v })) : [{ value: '' }];

      (legacyIds || []).forEach(id => localStorage.removeItem(`${PAGE_KEY}-${id}`));
    }

    if (rows.length < 1) rows.push({ value: '' });

    container.innerHTML = `
      <div class="riset-list-wrapper">
        <div class="riset-list-items"></div>
        <div class="button-row">
          <button type="button" class="btn-add btn-add-list-item">
            <i class="fa-solid fa-plus"></i> Tambah ${itemLabel}
          </button>
          <p class="list-max-note" style="display:none;">Maksimal ${maxRows} ${itemLabel}.</p>
        </div>
      </div>
    `;

    const itemsWrap = container.querySelector('.riset-list-items');
    const btnAdd = container.querySelector('.btn-add-list-item');
    const maxNote = container.querySelector('.list-max-note');

    function saveRows() {
      localStorage.setItem(dataKey, JSON.stringify(rows));
    }

    function updateAddButtonState() {
      const atMax = maxRows != null && rows.length >= maxRows;
      btnAdd.style.display = atMax ? 'none' : '';
      if (maxNote) maxNote.style.display = atMax ? '' : 'none';
    }

    function renderRows() {
      itemsWrap.innerHTML = '';

      rows.forEach((rowData, index) => {
        const number = index + 1;
        const row = document.createElement('div');
        row.className = 'riset-list-row';

        row.innerHTML = `
          <span class="huruf-badge">${number}</span>
          <input type="text" class="list-input" placeholder="${placeholderPrefix} ${number}...">
          ${rows.length > 1 ? `<button type="button" class="btn-remove-row" title="Hapus ${itemLabel.toLowerCase()} ${number}" aria-label="Hapus ${itemLabel.toLowerCase()} ${number}"><i class="fa-solid fa-trash"></i></button>` : ''}
        `;

        const input = row.querySelector('.list-input');
        input.value = rowData.value || '';
        const btnRemove = row.querySelector('.btn-remove-row');

        input.addEventListener('input', () => {
          rows[index].value = input.value;
          saveRows();
        });

        if (btnRemove) {
          btnRemove.addEventListener('click', () => {
            rows.splice(index, 1);
            saveRows();
            renderRows();
            updateAddButtonState();
          });
        }

        itemsWrap.appendChild(row);
      });
    }

    btnAdd.addEventListener('click', () => {
      if (maxRows != null && rows.length >= maxRows) return;
      rows.push({ value: '' });
      saveRows();
      renderRows();
      updateAddButtonState();
      const lastRow = itemsWrap.lastElementChild;
      const lastInput = lastRow && lastRow.querySelector('.list-input');
      if (lastInput) lastInput.focus();
    });

    renderRows();
    updateAddButtonState();
    saveRows();
  }

  createNumberedList({
    containerId: 'list-bisnis-plan-wrap',
    storageKeyPrefix: 'list-bisnis-plan',
    itemLabel: 'Bisnis Plan',
    placeholderPrefix: 'Masukkan nama bisnis plan',
    legacyIds: ['biz-plan-1', 'biz-plan-2', 'biz-plan-3', 'biz-plan-4'],
    maxRows: 4
  });

  createNumberedList({
    containerId: 'list-lokasi-wrap',
    storageKeyPrefix: 'list-lokasi',
    itemLabel: 'Lokasi Bisnis',
    placeholderPrefix: 'Masukkan alamat lokasi bisnis',
    legacyIds: ['biz-lokasi-1', 'biz-lokasi-2', 'biz-lokasi-3', 'biz-lokasi-4'],
    maxRows: 4
  });

});