// js/step2-1.js

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
        const amount = parseFloat(row.querySelector('.item-amount').value) || 0;

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
            type="number"
            class="item-amount"
            data-save="true"
            placeholder="0"
            min="0"
            value="${amount}">
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
        .addEventListener('input', calculateSectionTotal);

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