// js/step4-2.js

document.addEventListener("DOMContentLoaded", function() {
  const existingContainer = document.getElementById('existing-asset-container');
  const btnAddExisting = document.getElementById('btn-add-existing');
  const newAssetContainer = document.getElementById('new-asset-container');
  const btnAddNewAsset = document.getElementById('btn-add-new-asset');

  const startDateInput = document.getElementById('sim-start-date');
  const fundSourceInput = document.getElementById('fund-source-amount');
  const salaryInput = document.getElementById('expected-salary-amount');
  const nameInput = document.getElementById('name');

  if (!existingContainer || !newAssetContainer) return;

  // --- Helper format titik ribuan (mis. 1.000.000), sama pola dengan step4-3.js ---
  function formatRibuan(value) {
    const digitsOnly = String(value).replace(/\D/g, '');
    if (digitsOnly === '') return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function parseAngka(value) {
    return Number(String(value).replace(/\D/g, '')) || 0;
  }

  function formatCurrencyInput(input) {
    const distanceFromEnd = input.value.length - input.selectionStart;
    input.value = formatRibuan(input.value);
    const newPos = Math.max(input.value.length - distanceFromEnd, 0);
    input.setSelectionRange(newPos, newPos);
  }

  // Field nominal uang tetap (Modal Usaha Awal & Biaya Hidup) diubah jadi
  // text+inputmode="numeric" supaya bisa menampilkan titik ribuan
  // (type="number" bawaan HTML tidak mengizinkan karakter selain angka).
  [fundSourceInput, salaryInput].forEach(inp => {
    if (!inp) return;
    inp.type = 'text';
    inp.setAttribute('inputmode', 'numeric');
    inp.addEventListener('input', () => formatCurrencyInput(inp));
  });

  // --- 1. LocalStorage 一括保存 ---
  function saveAllToStorage() {
    if (nameInput) localStorage.setItem('sim-user-name', nameInput.value);
    if (startDateInput) localStorage.setItem('sim-start-date', startDateInput.value);
    if (fundSourceInput) localStorage.setItem('fund-source-amount', fundSourceInput.value);
    if (salaryInput) localStorage.setItem('sim-expected-salary', salaryInput.value);

    const allAssetItems = [];

    // A. 既存アセット回収
    existingContainer.querySelectorAll('.existing-row').forEach(row => {
      const name = row.querySelector('.ex-name')?.value || "";
      const price = parseAngka(row.querySelector('.ex-price')?.value);
      const span = parseInt(row.querySelector('.ex-span')?.value) || 0;
      if (name || price > 0) {
        allAssetItems.push({ name, price, shopMonth: 1, span, isExisting: true });
      }
    });

    // B. 新規アセット回収
    newAssetContainer.querySelectorAll('.new-row').forEach(row => {
      const name = row.querySelector('.new-name')?.value || "";
      const price = parseAngka(row.querySelector('.new-price')?.value);
      const shopMonth = parseInt(row.querySelector('.new-month')?.value) || 1;
      const span = parseInt(row.querySelector('.inv-span')?.value) || 0;
      if (name || price > 0) {
        allAssetItems.push({ name, price, shopMonth, span, isExisting: false });
      }
    });

    localStorage.setItem('invest-items', JSON.stringify(allAssetItems));
  }

  // --- 2. 各行のリアルタイム自動計算 ---
  function calculateTotals() {
    existingContainer.querySelectorAll('.existing-row').forEach(row => {
      const price = parseAngka(row.querySelector('.ex-price')?.value);
      const span = parseInt(row.querySelector('.ex-span')?.value) || 0;
      let reserve = (price > 0 && span > 0) ? Math.round(price / span) : 0;
      const resInput = row.querySelector('.ex-reserve-needed');
      if (resInput) resInput.value = reserve > 0 ? "Rp " + reserve.toLocaleString('id-ID') : "Rp 0";
    });

    newAssetContainer.querySelectorAll('.new-row').forEach(row => {
      const price = parseAngka(row.querySelector('.new-price')?.value);
      const shopMonth = parseInt(row.querySelector('.new-month')?.value) || 1;
      let reserve = (price > 0 && shopMonth > 0) ? Math.round(price / shopMonth) : 0;
      const resInput = row.querySelector('.new-reserve-needed');
      if (resInput) resInput.value = reserve > 0 ? "Rp " + reserve.toLocaleString('id-ID') : "Rp 0";
    });

    saveAllToStorage();
  }

  // --- コピー機能（一括反映） ---
  function attachAssetCopyFeature(row, targetClassName) {
    const copyBtn = row.querySelector('.btn-copy-fast');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', () => {
      const baseInput = row.querySelector(targetClassName);
      if (!baseInput) return;
      const val = baseInput.value;
      const container = row.closest('#existing-asset-container, #new-asset-container');
      if (!container) return;
      container.querySelectorAll(targetClassName).forEach(inp => {
        inp.value = val;
      });
      calculateTotals();
    });
  }

  // --- 3. 行追加関数：既存アセット（Aset Lama） ---
  function createExistingRowHtml(name = "", price = "", span = "") {
    const tr = document.createElement('tr');
    tr.className = 'existing-row';
    
    tr.innerHTML = `
      <td><input type="text" class="ex-name" placeholder="Nama Item Aset (Lama)" value="${name}"></td>
      <td class="td-currency">
        <span>Rp</span>
        <input type="text" inputmode="numeric" class="ex-price" placeholder="Harga" value="${formatRibuan(price)}">
        <i class="fa-solid fa-copy btn-copy-fast" title="Copy ke semua"></i>
      </td>
      <td><input type="number" class="ex-span font-center" placeholder="Sisa" value="${span}"></td>
      <td><input type="text" class="ex-reserve-needed font-center font-bold readonly-style" placeholder="Rp 0" readonly></td>
      <td class="font-center">
        <button type="button" class="btn-delete-row"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    `;
    existingContainer.appendChild(tr);
    attachAssetCopyFeature(tr, '.ex-price');
  }

  // --- 4. 行追加関数：新規アセット（Aset Baru） ---
  function createNewRowHtml(name = "", price = "", shopMonth = "1", span = "") {
    const tr = document.createElement('tr');
    tr.className = 'new-row';

    tr.innerHTML = `
      <td><input type="text" class="new-name" placeholder="Nama Komponen Aset Baru" value="${name}"></td>
      <td class="td-currency">
        <span>Rp</span>
        <input type="text" inputmode="numeric" class="new-price" placeholder="Harga" value="${formatRibuan(price)}">
        <i class="fa-solid fa-copy btn-copy-fast" title="Copy ke semua"></i>
      </td>
      <td><input type="number" class="new-month font-center" placeholder="Beli" min="1" value="${shopMonth}"></td>
      <td><input type="number" class="inv-span font-center" placeholder="Pakai" value="${span}"></td>
      <td><input type="text" class="new-reserve-needed font-center font-bold readonly-style" placeholder="Rp 0" readonly></td>
      <td class="font-center">
        <button type="button" class="btn-delete-row"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    `;
    newAssetContainer.appendChild(tr);
    attachAssetCopyFeature(tr, '.new-price');
  }

  // --- 5. 初期ロード時のデータ復元展開 ---
  if (nameInput) nameInput.value = localStorage.getItem('sim-user-name') || "";
  if (startDateInput) startDateInput.value = localStorage.getItem('sim-start-date') || "2026-04";
  if (fundSourceInput) fundSourceInput.value = formatRibuan(localStorage.getItem('fund-source-amount') || "");
  if (salaryInput) salaryInput.value = formatRibuan(localStorage.getItem('sim-expected-salary') || "");

  const savedItems = JSON.parse(localStorage.getItem('invest-items') || "[]");
  if (savedItems.length > 0) {
    savedItems.forEach(item => {
      if (item.isExisting) createExistingRowHtml(item.name, item.price || "", item.span || "");
      else createNewRowHtml(item.name, item.price || "", item.shopMonth || "1", item.span || "");
    });
  } else {
    createExistingRowHtml();
    createNewRowHtml();
  }

  // --- 6. イベント監視（バブリング活用） ---
  [nameInput, startDateInput, fundSourceInput, salaryInput].forEach(inp => {
    if (inp) inp.addEventListener('input', saveAllToStorage);
  });

  existingContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('ex-price')) {
      formatCurrencyInput(e.target);
    }
    calculateTotals();
  });

  newAssetContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('new-price')) {
      formatCurrencyInput(e.target);
    }
    calculateTotals();
  });

  if (btnAddExisting) btnAddExisting.addEventListener('click', () => { createExistingRowHtml(); calculateTotals(); });
  if (btnAddNewAsset) btnAddNewAsset.addEventListener('click', () => { createNewRowHtml(); calculateTotals(); });

  // 削除ボタンの処理
  document.body.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete-row');
    if (deleteBtn) {
      const row = deleteBtn.closest('.existing-row, .new-row');
      if (row) {
        row.remove();
        calculateTotals();
      }
    }
  });

  calculateTotals();
});