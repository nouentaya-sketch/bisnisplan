// js/step5.js

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // Page Storage Prefix
  // ==========================================
  const PAGE_KEY = document.body.dataset.page || window.location.pathname;

  // ==========================================
  // Helper: Format & Parse Rupiah
  // ==========================================
  function formatRupiah(value) {
    return 'Rp ' + Math.floor(value || 0).toLocaleString('id-ID');
  }

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
  // 1. Autosave field statis (input & textarea yang punya id)
  //    Tidak termasuk yang ada di dalam dynamic-group / dynamic-finance-group
  // ==========================================
  document.querySelectorAll('input[id], textarea[id]').forEach(el => {
    if (el.closest('.dynamic-group') || el.closest('.dynamic-finance-group')) return;

    const storageKey = `${PAGE_KEY}-${el.id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved !== null) {
      el.value = saved;
    }

    el.addEventListener('input', () => {
      localStorage.setItem(storageKey, el.value);
    });
  });

  // ==========================================
  // 2. Dynamic Group: textarea tunggal (pemasaran, informasi,
  //    hambatan, risiko, perbedaan) — tanpa tombol tambah
  // ==========================================
  document.querySelectorAll('.dynamic-group').forEach(group => {
    const prefix = group.dataset.prefix;
    const textarea = group.querySelector('.item-textarea');
    if (!textarea || !prefix) return;

    const storageKey = `${PAGE_KEY}-${prefix}`;
    const saved = localStorage.getItem(storageKey);

    if (saved !== null) {
      textarea.value = saved;
    }

    textarea.addEventListener('input', () => {
      localStorage.setItem(storageKey, textarea.value);
    });
  });

  // ==========================================
  // 3. Dynamic Finance Group Factory
  //    (investasi, dana, komoditas, biaya)
  // ==========================================
  function setupFinanceGroup(group) {

    const groupName = group.dataset.group;
    const listContainer = group.querySelector('.list-container');
    const btnAdd = group.querySelector('.btn-add');
    const isKomoditas = groupName === 'komoditas';

    if (!listContainer) return;

    const storageKey = `${PAGE_KEY}-fin-${groupName}`;

    const placeholders = {
      investasi: 'Nama barang (Misal: Traktor)...',
      dana: 'Sumber dana (Misal: Hasil Magang)...',
      biaya: 'Jenis biaya (Misal: Pupuk)...'
    };

    function updateTotalDisplay(total) {
      const idMap = {
        investasi: 'total-investasi',
        dana: 'total-dana',
        biaya: 'total-biaya',
        komoditas: 'total-pendapatan-kotor'
      };
      const el = document.getElementById(idMap[groupName]);
      if (el) el.innerText = formatRupiah(total);
    }

    function calculateTotal() {

      let total = 0;
      const rows = listContainer.querySelectorAll('.dynamic-row');
      const saveData = [];

      rows.forEach(row => {

        const nameEl = row.querySelector('.item-name');
        const name = nameEl ? nameEl.value : '';

        if (isKomoditas) {

          const qtyEl = row.querySelector('.item-qty');
          const unitEl = row.querySelector('.item-unit');
          const priceEl = row.querySelector('.item-price');

          const qty = Number(qtyEl ? qtyEl.value : 0) || 0;
          const unit = unitEl ? unitEl.value : '';
          const price = parseAngka(priceEl ? priceEl.value : 0);

          total += qty * price;

          saveData.push({ name, qty, unit, price });

        } else {

          const amountEl = row.querySelector('.item-amount');
          const amount = parseAngka(amountEl ? amountEl.value : 0);

          total += amount;

          saveData.push({ name, amount });
        }

      });

      updateTotalDisplay(total);

      localStorage.setItem(storageKey, JSON.stringify(saveData));

      updateNetProfit();
    }

    function createNewRow(item = {}, isFirst = false) {

      const row = document.createElement('div');
      row.className = 'dynamic-row flex-row-inputs';

      if (isKomoditas) {

        row.innerHTML = `
          <input type="text" class="item-name flex-grow-2" placeholder="Sayur Sawi..." value="${item.name || ''}">
          <input type="number" class="item-qty flex-grow-1 input-calc" placeholder="0" value="${item.qty || ''}">
          <input type="text" class="item-unit flex-grow-1" placeholder="kg" value="${item.unit || ''}">
          <div class="currency-wrapper flex-grow-1-5">
            <span>Rp</span>
            <input type="text" class="item-price currency-input input-calc" placeholder="Harga..." inputmode="numeric" value="${formatRibuan(item.price || '')}">
          </div>
          ${isFirst ? '' : `<button type="button" class="btn-remove-row"><i class="fa-solid fa-trash"></i></button>`}
        `;

      } else {

        row.innerHTML = `
          <input type="text" class="item-name flex-grow-2" placeholder="${placeholders[groupName] || 'Nama item...'}" value="${item.name || ''}">
          <div class="currency-wrapper">
            <span>Rp</span>
            <input type="text" class="item-amount currency-input input-calc" placeholder="${groupName === 'dana' ? 'Nominal...' : 'Harga...'}" inputmode="numeric" value="${formatRibuan(item.amount || '')}">
          </div>
          ${isFirst ? '' : `<button type="button" class="btn-remove-row"><i class="fa-solid fa-trash"></i></button>`}
        `;
      }

      listContainer.appendChild(row);

      row.querySelectorAll('.item-name, .item-qty, .item-unit').forEach(input => {
        input.addEventListener('input', calculateTotal);
      });

      row.querySelectorAll('.item-amount, .item-price').forEach(input => {
        input.addEventListener('input', (e) => {
          formatCurrencyInput(e.target);
          calculateTotal();
        });
      });

      const btnRemove = row.querySelector('.btn-remove-row');
      if (btnRemove) {
        btnRemove.addEventListener('click', () => {
          row.remove();
          calculateTotal();
        });
      }
    }

    // ==========================================
    // Load Saved Data (atau pakai baris default di HTML)
    // ==========================================
    listContainer.innerHTML = '';

    const savedData = localStorage.getItem(storageKey);

    if (savedData) {

      const parsedList = JSON.parse(savedData);

      if (parsedList.length > 0) {
        parsedList.forEach((item, index) => createNewRow(item, index === 0));
      } else {
        createNewRow({}, true);
      }

    } else {
      createNewRow({}, true);
    }

    calculateTotal();

    // ==========================================
    // Tombol Tambah
    // ==========================================
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        createNewRow({}, false);
        calculateTotal();
      });
    }
  }

  // ==========================================
  // 4. Hitung Pendapatan Bersih (Net Profit)
  //    = Pendapatan Kotor (komoditas) - Total Biaya
  // ==========================================
  function updateNetProfit() {
    const pendapatanEl = document.getElementById('total-pendapatan-kotor');
    const biayaEl = document.getElementById('total-biaya');
    const finalEl = document.getElementById('pendapatan-bersih-final');

    if (!pendapatanEl || !biayaEl || !finalEl) return;

    const pendapatan = parseAngka(pendapatanEl.innerText);
    const biaya = parseAngka(biayaEl.innerText);

    finalEl.innerText = formatRupiah(pendapatan - biaya);
  }

  // ==========================================
  // 5. Inisialisasi semua dynamic-finance-group
  // ==========================================
  document.querySelectorAll('.dynamic-finance-group').forEach(group => {
    setupFinanceGroup(group);
  });

});