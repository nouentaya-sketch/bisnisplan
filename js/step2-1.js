// js/step2-1.js
// ==========================================
// Perbaikan universal export PDF: seluruh isi textarea harus terlihat.
// Cukup dimuat sekali di setiap halaman HTML, tanpa mengubah kode lain.
// - Membungkus html2canvas (kapan pun dimuat, sebelum atau sesudah file ini)
// - Mendukung juga export lewat window.print()
// ==========================================
(function () {

  // ---------- 1. html2canvas ----------
  function wrap(original) {
    if (typeof original !== 'function' || original.__textareaPatched) return original;

    const patched = function (element, options) {
      options = Object.assign({}, options || {});
      const userOnClone = options.onclone;

      // Tinggi isi sebenarnya dari textarea asli (termasuk teks yang tersembunyi)
      const heights = Array.from(document.querySelectorAll('textarea'))
        .map(ta => ta.scrollHeight + 4);

      options.onclone = function (clonedDoc, clonedElement) {
        // Hanya salinan yang diubah, halaman asli tidak tersentuh
        clonedDoc.querySelectorAll('textarea').forEach((ta, i) => {
          const h = heights[i] !== undefined ? heights[i] : ta.scrollHeight + 4;
          ta.style.overflow = 'hidden';
          ta.style.resize = 'none';
          ta.style.height = h + 'px';
          ta.style.minHeight = h + 'px';
          ta.scrollTop = 0;
        });

        if (typeof userOnClone === 'function') {
          return userOnClone(clonedDoc, clonedElement);
        }
      };

      return original.call(this, element, options);
    };

    Object.assign(patched, original);
    patched.__textareaPatched = true;
    return patched;
  }

  let current = wrap(window.html2canvas);

  try {
    Object.defineProperty(window, 'html2canvas', {
      configurable: true,
      get: function () { return current; },
      set: function (value) { current = wrap(value); }
    });
  } catch (e) {
    // Jika gagal, coba bungkus setelah semua script dimuat
    window.addEventListener('load', function () {
      if (typeof window.html2canvas === 'function') {
        window.html2canvas = wrap(window.html2canvas);
      }
    });
  }

  // ---------- 2. window.print() ----------
  let savedForPrint = [];

  window.addEventListener('beforeprint', function () {
    savedForPrint = [];
    document.querySelectorAll('textarea').forEach(ta => {
      savedForPrint.push({ ta: ta, height: ta.style.height, overflow: ta.style.overflow });
      ta.style.overflow = 'hidden';
      ta.style.height = 'auto';
      ta.style.height = (ta.scrollHeight + 4) + 'px';
    });
  });

  window.addEventListener('afterprint', function () {
    savedForPrint.forEach(s => {
      s.ta.style.height = s.height;
      s.ta.style.overflow = s.overflow;
    });
    savedForPrint = [];
  });

})();

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // Page Storage Prefix
  // ==========================================
  const PAGE_KEY = document.body.dataset.page || window.location.pathname;

  // ==========================================
  // 1. Static Text Fields (data-save="true")
  // ==========================================
  function getStaticSavableFields() {
    return document.querySelectorAll(
      '[data-save="true"]:not(.item-name):not(.item-amount)'
    );
  }

  getStaticSavableFields().forEach(element => {
    if (!element.id) return;

    const storageKey = `${PAGE_KEY}-${element.id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved !== null) {
      element.value = saved;
    }

    element.addEventListener('input', () => {
      localStorage.setItem(storageKey, element.value);
    });
  });

  // ==========================================
  // Helper Function: Format Rupiah
  // ==========================================
  function formatRupiah(value) {
    return 'Rp ' + Math.floor(value).toLocaleString('id-ID');
  }

  // ==========================================
  // Helper: format titik ribuan untuk input angka (mis. 1.000.000)
  // ==========================================
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

  // ==========================================
  // 2. Dynamic Section Factory
  // ==========================================
  function setupDynamicSection({
    containerId,
    buttonId,
    totalDisplayId,
    storageKey,
    placeholderText
  }) {

    const container = document.getElementById(containerId);
    const btnAdd = document.getElementById(buttonId);
    const totalDisplay = document.getElementById(totalDisplayId);

    if (!container || !btnAdd || !totalDisplay) return;

    const finalStorageKey = `${PAGE_KEY}-${storageKey}`;

    function calculateSectionTotal() {

      let total = 0;
      const rows = container.querySelectorAll('.dynamic-row');
      const saveData = [];

      rows.forEach(row => {

        const name = row.querySelector('.item-name').value;
        const amount = parseAngka(row.querySelector('.item-amount').value);

        total += amount;

        saveData.push({
          name,
          amount
        });

      });

      totalDisplay.innerText = formatRupiah(total);

      localStorage.setItem(finalStorageKey, JSON.stringify(saveData));
    }

    function createNewRow(name = '', amount = '', isFirst = false) {

      const newRow = document.createElement('div');
      newRow.className = 'input-group dynamic-row';

      newRow.innerHTML = `
        <div class="row-inputs">
          <input
            type="text"
            class="item-name"
            data-save="true"
            placeholder="${placeholderText}"
            value="${name}">

          <span class="rp-text">Rp</span>

          <input
            type="text"
            inputmode="numeric"
            class="item-amount"
            data-save="true"
            placeholder="0"
            value="${formatRibuan(amount)}">
        </div>

        ${
          isFirst
            ? `<div class="spacer-width" style="width:38px;"></div>`
            : `
              <button type="button" class="btn-table-action">
                <i class="fa-solid fa-trash"></i>
              </button>
            `
        }
      `;

      container.appendChild(newRow);

      newRow
        .querySelector('.item-name')
        .addEventListener('input', calculateSectionTotal);

      newRow
        .querySelector('.item-amount')
        .addEventListener('input', (e) => {
          formatCurrencyInput(e.target);
          calculateSectionTotal();
        });

      if (!isFirst) {

        newRow
          .querySelector('.btn-table-action')
          .addEventListener('click', () => {

            newRow.remove();

            calculateSectionTotal();

          });

      }

    }

    // ==========================================
    // Load Saved Data
    // ==========================================
    const savedData = localStorage.getItem(finalStorageKey);

    if (savedData) {

      const parsedList = JSON.parse(savedData);

      if (parsedList.length > 0) {

        parsedList.forEach((item, index) => {

          createNewRow(
            item.name,
            item.amount,
            index === 0
          );

        });

      } else {

        createNewRow('', '', true);

      }

    } else {

      createNewRow('', '', true);

    }

    calculateSectionTotal();

    // ==========================================
    // Add New Row
    // ==========================================
    btnAdd.addEventListener('click', () => {

      createNewRow('', '', false);

      calculateSectionTotal();

    });

  }

  // ==========================================
  // 3. Initialize Dynamic Sections
  // ==========================================

  setupDynamicSection({
    containerId: 'assets-container',
    buttonId: 'btn-add-asset',
    totalDisplayId: 'total-assets-display',
    storageKey: 'assets',
    placeholderText: 'Nama item'
  });

  setupDynamicSection({
    containerId: 'sumber-dana-container',
    buttonId: 'btn-add-sumber-dana',
    totalDisplayId: 'total-sumber-dana-display',
    storageKey: 'sumber-dana',
    placeholderText: 'Nama item'
  });

});