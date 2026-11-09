// js/step2-2.js

// ==========================================
// Patch export PDF: tabel 12 bulan & isi input tampil utuh
// - tabel yang melebar (scroll horizontal) tidak terpotong di kanan
// - angka panjang di input (mis. 15.000.000) tidak terpotong
// (membungkus html2canvas, kode export lama tidak perlu diubah)
// ==========================================
(function patchHtml2CanvasForWideTable() {

  function applyPatch() {
    if (typeof window.html2canvas !== 'function') return;
    if (window.html2canvas.__wideTablePatched) return;

    const originalHtml2Canvas = window.html2canvas;

    const patched = function (element, options = {}) {
      options = Object.assign({}, options);
      const userOnClone = options.onclone;

      // --- 1. Cari wrapper yang bisa di-scroll horizontal (di dokumen asli) ---
      const originalAll = Array.from(element.querySelectorAll('*'));
      const scrollIdx = [];
      let extraWidth = 0;

      originalAll.forEach((el, i) => {
        const ox = getComputedStyle(el).overflowX;
        if (ox === 'auto' || ox === 'scroll') {
          scrollIdx.push(i);
          extraWidth = Math.max(extraWidth, el.scrollWidth - el.clientWidth);
        }
      });

      // --- 2. Hitung lebar input bulan agar angka terpanjang muat ---
      const monthInputs = Array.from(element.querySelectorAll('.month-input'));
      let neededInputWidth = 65;

      if (monthInputs.length) {
        const ctx = document.createElement('canvas').getContext('2d');
        monthInputs.forEach(inp => {
          const cs = getComputedStyle(inp);
          ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const textWidth = ctx.measureText(inp.value || '').width;
          const padding =
            (parseFloat(cs.paddingLeft) || 0) +
            (parseFloat(cs.paddingRight) || 0) +
            (parseFloat(cs.borderLeftWidth) || 0) +
            (parseFloat(cs.borderRightWidth) || 0);
          neededInputWidth = Math.max(
            neededInputWidth,
            inp.offsetWidth,
            Math.ceil(textWidth + padding + 6)
          );
        });
      }

      const currentWidth = monthInputs[0] ? monthInputs[0].offsetWidth : 65;
      const widenBy = Math.max(0, neededInputWidth - currentWidth) * 12;
      const originalWidth = element.offsetWidth;

      // --- 3. Pastikan jendela render cukup lebar ---
      if (!options.windowWidth) {
        options.windowWidth = Math.max(
          window.innerWidth,
          originalWidth + extraWidth + widenBy + 80
        );
      }

      // --- 4. Ubah salinan (clone) saja, halaman asli tidak tersentuh ---
      options.onclone = function (clonedDoc, clonedElement) {
        const root = clonedElement || clonedDoc.body;

        // Elemen yang diekspor mengikuti lebar isinya
        root.style.minWidth = originalWidth + 'px';
        root.style.width = 'max-content';
        root.style.maxWidth = 'none';
        root.style.overflow = 'visible';

        // Wrapper scroll horizontal -> tampil penuh
        const clonedAll = root.querySelectorAll('*');
        scrollIdx.forEach(i => {
          const el = clonedAll[i];
          if (!el) return;
          el.style.overflow = 'visible';
          el.style.maxWidth = 'none';
          el.style.width = 'auto';
        });

        // Input bulan dilebarkan agar angka tidak terpotong
        root.querySelectorAll('.month-input').forEach(inp => {
          inp.style.width = neededInputWidth + 'px';
          inp.style.minWidth = neededInputWidth + 'px';
          inp.style.textOverflow = 'clip';
        });

        if (typeof userOnClone === 'function') {
          return userOnClone(clonedDoc, clonedElement);
        }
      };

      return originalHtml2Canvas.call(this, element, options);
    };

    // pertahankan properti bawaan html2canvas jika ada
    Object.assign(patched, originalHtml2Canvas);
    patched.__wideTablePatched = true;
    window.html2canvas = patched;
  }

  // Coba langsung; jika html2canvas belum dimuat, coba lagi nanti
  applyPatch();
  document.addEventListener('DOMContentLoaded', applyPatch);
  window.addEventListener('load', applyPatch);
})();

document.addEventListener('DOMContentLoaded', () => {
  // === 1. Static Fields (data-save="true" di HTML) ===
  // Sama seperti step1 & step2-1: field mana yang disimpan ditentukan
  // lewat atribut data-save="true" di HTML, bukan hardcode di JS.
  function getStaticSavableFields() {
    return document.querySelectorAll(
      '[data-save="true"]:not(.item-name):not(.month-input)'
    );
  }

  getStaticSavableFields().forEach(element => {
    if (!element.id) return;
    const storageKey = `step2-2-${element.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) element.value = saved;

    element.addEventListener('input', () => {
      localStorage.setItem(storageKey, element.value);
    });
  });

  // === Helper Function: Format to Indonesian Rupiah ===
  function formatRupiah(value) {
    return 'Rp ' + Math.floor(value).toLocaleString('id-ID');
  }

  // === Helper: format titik ribuan untuk input angka (mis. 1.000.000) ===
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

  // === 2. Core Logic for Calendar Table Matrix ===
  function setupCalendarEngine({ containerId, buttonId, storageKey, isExpense = false }) {
    const container = document.getElementById(containerId);
    // 古い外部ボタンがHTMLに残っていても動作するようにフォールバックを残します
    const btnAdd = document.getElementById(buttonId);

    if (!container) return;

    // A. Recalculate Totals (Rows & Columns) and Save Matrix
    function calculateCalendar() {
      const rows = container.querySelectorAll('.calendar-dynamic-row');
      const matrixData = [];
      const monthlyTotals = new Array(12).fill(0);
      let grandRowAvgTotal = 0;

      rows.forEach(row => {
        const nameInputEl = row.querySelector('.item-name');
        if (!nameInputEl) return;
        const name = nameInputEl.value;
        const monthInputs = row.querySelectorAll('.month-input');
        const monthsData = [];
        let rowSum = 0;

        monthInputs.forEach((input, mIdx) => {
          const val = parseAngka(input.value);
          monthsData.push(val);
          rowSum += val;
          monthlyTotals[mIdx] += val;
        });

        const rowAvg = rowSum / 12;
        grandRowAvgTotal += rowAvg;
        
        row.querySelector('.row-avg-display').innerText = formatRupiah(rowAvg);
        matrixData.push({ name, months: monthsData });
      });

      localStorage.setItem(storageKey, JSON.stringify(matrixData));

      const targetPrefix = isExpense ? 'exp' : 'inc';
      const totalDisplayLabel = document.getElementById(`avg-total-${isExpense ? 'expense' : 'income'}`);
      if (totalDisplayLabel) totalDisplayLabel.innerText = formatRupiah(grandRowAvgTotal);

      const mCells = document.querySelectorAll(`.m-total-${targetPrefix}`);
      mCells.forEach((cell, idx) => {
        cell.innerText = formatRupiah(monthlyTotals[idx]);
      });

      calculateNetProfitSummary();
    }

    function calculateNetProfitSummary() {
      const avgInc = parseFloat(document.getElementById('avg-total-income')?.innerText.replace(/[^\d]/g, '')) || 0;
      const avgExp = parseFloat(document.getElementById('avg-total-expense')?.innerText.replace(/[^\d]/g, '')) || 0;
      const netAvgLabel = document.getElementById('avg-total-net');
      if (netAvgLabel) netAvgLabel.innerText = formatRupiah(avgInc - avgExp);

      for (let m = 0; m < 12; m++) {
        const incCell = document.querySelector(`.m-total-inc[data-month="${m}"]`);
        const expCell = document.querySelector(`.m-total-exp[data-month="${m}"]`);
        const netCell = document.querySelector(`.m-net[data-month="${m}"]`);

        if (incCell && expCell && netCell) {
          const incVal = parseFloat(incCell.innerText.replace(/[^\d]/g, '')) || 0;
          const expVal = parseFloat(expCell.innerText.replace(/[^\d]/g, '')) || 0;
          const netVal = incVal - expVal;

          netCell.innerText = formatRupiah(netVal);
          netCell.style.color = netVal < 0 ? '#ef4444' : '#10b981';
        }
      }
    }

    // B. Inject Table Row Layout (4-3スタイルに統合)
    function createRow(name = '', monthsArray = [], isFirst = false) {
      const tr = document.createElement('tr');
      tr.className = 'calendar-dynamic-row';

      // 12か月分の入力セル
      const janVal = monthsArray[0] !== undefined ? monthsArray[0] : '';
      let monthCellsHtml = `
        <td>
          <div style="display: flex; align-items: center; gap: 4px; min-width: 150px;">
            <input type="text" inputmode="numeric" class="month-input jan-input" data-save="true" placeholder="0" value="${formatRibuan(janVal)}" style="width:110px; padding:6px; font-size:0.85rem; border-radius:4px; border:1px solid #cbd5e1;">
            <button type="button" class="btn-copy-all" title="Salin ke semua bulan" style="background:#FFFFFF; color:#64748B; border:none; padding:6px; border-radius:50%; cursor:pointer; font-size:0.95rem; display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; transition: all 0.2s ease;">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
        </td>
      `;

      for (let i = 1; i < 12; i++) {
        const val = monthsArray[i] !== undefined ? monthsArray[i] : '';
        monthCellsHtml += `<td><input type="text" inputmode="numeric" class="month-input" data-save="true" placeholder="0" value="${formatRibuan(val)}" style="width:110px; padding:6px; font-size:0.85rem; border-radius:4px; border:1px solid #cbd5e1;"></td>`;
      }

      // 💡 1行目なら「プラスボタン」、2行目以降なら「ゴミ箱ボタン」を Nama item の右隣にインライン配置
      const actionBtnHtml = isFirst ? `
        <button type="button" class="btn-add-inline btn-add-row-trigger" title="Tambah Item" style="background:#475569; border:none; color:#fff; border-radius:4px; width:26px; height:26px; min-width:26px; display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem; cursor:pointer;">
          <i class="fa-solid fa-plus"></i>
        </button>
      ` : `
        <button type="button" class="btn-table-action" style="background:none; border:none; color:#EF4444; width:26px; height:26px; min-width:26px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;">
          <i class="fa-solid fa-trash" style="font-size:0.85rem;"></i>
        </button>
      `;

      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 6px; min-width: 240px;">
            <input type="text" class="item-name" data-save="true" placeholder="Nama item" value="${name}" style="flex: 1; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.85rem;">
            ${actionBtnHtml}
          </div>
        </td>
        <td class="readonly-total row-avg-display" style="font-weight: bold; color: #475569; font-size:0.85rem;">Rp 0</td>
        ${monthCellsHtml}
      `;

      container.appendChild(tr);

      // 行追加イベント（インラインプラスボタン用）
      if (isFirst) {
        tr.querySelector('.btn-add-row-trigger').addEventListener('click', () => {
          createRow('', [], false);
          calculateCalendar();
        });
      }

      // コピペボタンのイベント
      tr.querySelector('.btn-copy-all').addEventListener('click', () => {
        const janValue = tr.querySelector('.jan-input').value;
        const allInputs = tr.querySelectorAll('.month-input');
        allInputs.forEach(input => {
          input.value = janValue;
        });
        calculateCalendar();
      });

      // 入力監視
      tr.querySelector('.item-name').addEventListener('input', calculateCalendar);
      tr.querySelectorAll('.month-input').forEach(input => {
        input.addEventListener('input', () => {
          formatCurrencyInput(input);
          calculateCalendar();
        });
      });

      // 削除イベント
      if (!isFirst) {
        tr.querySelector('.btn-table-action').addEventListener('click', () => {
          tr.remove();
          calculateCalendar();
        });
      }
    }

    // C. Cache Initialization Matrix
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        parsed.forEach((rowData, index) => {
          createRow(rowData.name, rowData.months, index === 0);
        });
      } else {
        createRow('', [], true);
      }
    } else {
      createRow('', [], true);
    }
    calculateCalendar();

    // D. Old Button Event Fallback (HTMLに残っている場合用)
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        createRow('', [], false);
        calculateCalendar();
      });
    }
  }

  // === 3. Run Calendar Engine for Income and Expense Sections ===
  setupCalendarEngine({
    containerId: 'income-rows-container',
    buttonId: 'btn-add-income-row',
    storageKey: 'step2-2-income-matrix',
    isExpense: false
  });

  setupCalendarEngine({
    containerId: 'expense-rows-container',
    buttonId: 'btn-add-expense-row',
    storageKey: 'step2-2-expense-matrix',
    isExpense: true
  });
});