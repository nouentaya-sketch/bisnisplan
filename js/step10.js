// js/step10.js
// Tahap 10: Pengajuan Sertifikat
// Semua field (text, number, date, select, checkbox) otomatis tersimpan.
// Checklist di bagian 5 juga menghitung progress secara otomatis.
//
// 🌟 Nama Bisnis Plan & Lokasi Bisnis (Alamat) disederhanakan jadi 1 field
// saja (sebelumnya sempat berupa 4 field tetap, lalu list bernomor 1-4
// yang bisa ditambah). Migrasi ringan di bawah memastikan data yang sudah
// pernah diisi lewat versi-versi sebelumnya tetap muncul di field baru
// ini, supaya tidak hilang begitu saja.

document.addEventListener('DOMContentLoaded', () => {

  const PAGE_KEY = document.body.dataset.page || window.location.pathname;

  // ==========================================
  // 0. Migrasi data lama → field tunggal baru
  //    (jalan SEBELUM autosave di bawah supaya nilai hasil migrasi
  //    ikut ke-render ke input begitu field-nya dibaca).
  // ==========================================
  function migrateToSingleField(newId, legacyListStorageKey, legacyFixedIds) {
    const alreadyHasValue = localStorage.getItem(`${PAGE_KEY}-${newId}`);
    if (alreadyHasValue !== null && alreadyHasValue !== '') return;

    // Coba ambil dari versi "list bernomor 1-4" dulu (item pertama yang terisi)
    const listRaw = localStorage.getItem(`${PAGE_KEY}-${legacyListStorageKey}-rows`);
    if (listRaw) {
      try {
        const rows = JSON.parse(listRaw);
        const firstFilled = (rows || []).find(r => r && r.value && r.value.trim() !== '');
        if (firstFilled) {
          localStorage.setItem(`${PAGE_KEY}-${newId}`, firstFilled.value);
          return;
        }
      } catch (e) { /* abaikan, lanjut coba fallback di bawah */ }
    }

    // Fallback: versi lama sekali, 4 field tetap (mis. biz-plan-1..4)
    for (const legacyId of legacyFixedIds || []) {
      const val = localStorage.getItem(`${PAGE_KEY}-${legacyId}`);
      if (val && val.trim() !== '') {
        localStorage.setItem(`${PAGE_KEY}-${newId}`, val);
        return;
      }
    }
  }

  migrateToSingleField('nama-bisnis-plan', 'list-bisnis-plan', ['biz-plan-1', 'biz-plan-2', 'biz-plan-3', 'biz-plan-4']);
  migrateToSingleField('lokasi-bisnis', 'list-lokasi', ['biz-lokasi-1', 'biz-lokasi-2', 'biz-lokasi-3', 'biz-lokasi-4']);

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
  // 2. Progress bar checklist (bagian 5)
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

});