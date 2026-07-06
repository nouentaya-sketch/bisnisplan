// Tahap 4-3 : Grid Matrix (Fully Synced with HTML/CSS Grid Layout)
document.addEventListener("DOMContentLoaded", function() {
  const headerRow = document.getElementById('header-months-row');
  const tbody = document.getElementById('calendar-body-rows');
  if (!headerRow || !tbody) return;

  // --- 1. 初期データの読み込み ---
  const startSimDate = localStorage.getItem('sim-start-date') || "2026-04-01";
  const initialModal = parseFloat(localStorage.getItem('fund-source-amount')) || 0; 
  const initialSalary = parseFloat(localStorage.getItem('sim-expected-salary')) || 0; 
  const assetPlans = JSON.parse(localStorage.getItem('invest-items') || "[]");

  // 💡 抜けていた変数の定義を完全に復元
  const [startYear, startMonth] = startSimDate.split('-').map(Number);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  let komoditasCounter = 0, biayaCounter = 0;

  localStorage.removeItem('step4-3-dynamic-modal');

  // --- 2. 36ヶ月分のタイムラインヘッダー生成 ---
  for (let m = 1; m <= 36; m++) {
    const totalM = (startMonth - 1) + (m - 1);
    const th = document.createElement('th');
    th.style = "min-width: 120px; max-width: 120px; width: 120px; text-align: center; font-size: 0.8rem; font-weight: bold; padding: 10px 4px; box-sizing: border-box; background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1; border-right: 1px solid #E2E8F0;";
    th.innerText = `${monthNames[totalM % 12]}-${String(startYear + Math.floor(totalM / 12)).slice(-2)}`;
    headerRow.appendChild(th);
  }

  // --- 入力ボックスHTML生成関数 ---
  function createRpInputHtml(className, month, value, textStyle = "", hasCopyBtn = false) {
    const paddingRight = hasCopyBtn ? "22px" : "6px";
    const copyIconHtml = hasCopyBtn ? `<i class="fa-solid fa-copy btn-copy-fast" style="position:absolute; right:6px; top:50%; transform:translateY(-50%); color:#94A3B8; cursor:pointer; font-size:0.75rem;" title="Copy ke semua bulan"></i>` : "";
    
    return `
      <div style="position: relative; display: flex; align-items: center; width: 105px; height: 30px; margin: 0 auto; box-sizing: border-box;">
        <span style="position: absolute; left: 6px; color: #94A3B8; font-size: 0.8rem; font-weight: normal; pointer-events: none;">Rp</span>
        <input type="number" class="matrix-input ${className}" data-month="${month}" value="${value}" placeholder="0" 
          style="width: 100%; height: 100%; padding: 2px ${paddingRight} 2px 24px; font-size: 0.8rem; font-weight: normal; border-radius: 4px; border: 1px solid #CBD5E1; text-align: right; ${textStyle} box-sizing: border-box;">
        ${copyIconHtml}
      </div>
    `;
  }

  // --- 一括コピーのイベントバインド関数 ---
  function attachCopyFeature(parentRowEl) {
    if (!parentRowEl) return;
    const copyBtn = parentRowEl.querySelector('.btn-copy-fast');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const firstInput = parentRowEl.querySelector('[data-month="1"]');
        if (firstInput) {
          const val = firstInput.value;
          parentRowEl.querySelectorAll('.matrix-input').forEach(inp => inp.value = val);
          window.calcFinancials();
        }
      });
    }
  }

  // --- 3. 動的な入力行を作る関数（売上・経費アイテム用） ---
  function createDynamicRow(type, counter, label, amountsArray = null) {
    const rowId = `${type}-${counter}`;
    const tr = document.createElement('tr');
    tr.id = `row-tr-${rowId}`;
    tr.className = `dynamic-row-item-${type}`;
    
    const isFirst = counter === 1;
    const actionBtn = isFirst 
      ? `<button type="button" style="background:#475569; border:none; color:#fff; border-radius:4px; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem; cursor:pointer;" onclick="window.addDynamicRow('${type}')"><i class="fa-solid fa-plus"></i></button>`
      : `<button type="button" style="background:none; border:none; color:#EF4444; padding:0; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;" onclick="document.getElementById('row-tr-${rowId}').remove(); window.calcFinancials();"><i class="fa-solid fa-trash" style="font-size:0.8rem;"></i></button>`;

    const inputColorStyle = type === 'komoditas' ? "color: #10B981;" : "color: #EF4444;";
    const placeholders = { komoditas: 'Nama Pendapatan...', biaya: 'Nama Biaya...' };

    tr.innerHTML = `
      <td style="min-width: 160px; max-width: 160px; width: 160px; height: 38px; padding: 4px 8px; background-color: #FAFAFA; border-bottom: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; box-sizing: border-box; vertical-align: middle;">
        <div style="display:flex; align-items:center; gap:4px; width: 100%;">
          <span style="color: #94A3B8; font-size: 0.8rem; font-weight: normal; flex-shrink: 0;">└ </span>
          <input type="text" class="matrix-label-input item-name-input" value="${label}" placeholder="${placeholders[type]}" style="width:calc(100% - 28px); border:1px solid #CBD5E1; border-radius:4px; padding:2px 4px; font-size: 0.8rem; font-weight: normal; box-sizing: border-box; height: 26px;">
          ${actionBtn}
        </div>
      </td>
    `;

    for (let m = 1; m <= 36; m++) {
      const td = document.createElement('td');
      td.style = "padding: 4px; text-align: center; min-width: 120px; max-width: 120px; width: 120px; height: 38px; border-bottom: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; box-sizing: border-box; vertical-align: middle;";
      const defaultVal = (amountsArray && amountsArray[m - 1] !== undefined) ? amountsArray[m - 1] : 0;

      td.innerHTML = createRpInputHtml(`cell-input-${rowId}-harga`, m, defaultVal, inputColorStyle, m === 1);
      tr.appendChild(td);
    }
    
    attachCopyFeature(tr);
    return tr;
  }

  window.addDynamicRow = function(type, label = "", amountsArray = null) {
    if (type === 'komoditas') komoditasCounter++; else biayaCounter++;
    const count = type === 'komoditas' ? komoditasCounter : biayaCounter;
    const newRow = createDynamicRow(type, count, label, amountsArray);
    
    const targets = { komoditas: 'row-tr-total-penjualan-total', biaya: 'row-tr-total-biaya-total' };
    const targetRowEl = document.getElementById(targets[type]);
    
    if (targetRowEl) {
      tbody.insertBefore(newRow, targetRowEl);
    } else {
      tbody.appendChild(newRow);
    }

    newRow.querySelectorAll('.matrix-input, .item-name-input').forEach(i => i.addEventListener('input', window.calcFinancials));
    window.calcFinancials();
  };

  // --- 4. 固定行（ベースシェル）の初期化 ---
  function addFixedRow(id, label) {
    const tr = document.createElement('tr');
    tr.id = `row-tr-${id}`;
    const isTitleCell = id.includes('title');
    
    tr.innerHTML = `
      <td style="min-width: 160px; max-width: 160px; width: 160px; height: 38px; padding: 4px 8px; font-size: 0.8rem; font-weight: bold; color: #1E293B; line-height: 1.2; box-sizing: border-box; vertical-align: middle; border-bottom: 1px solid #CBD5E1; border-right: 1px solid #E2E8F0; ${isTitleCell ? 'background-color: #E2E8F0;' : 'background-color: #F8FAFC;' }">
        ${label}
      </td>
    `;
    
    for (let m = 1; m <= 36; m++) {
      const td = document.createElement('td');
      td.style = "padding: 4px; text-align: right; min-width: 120px; max-width: 120px; width: 120px; height: 38px; border-bottom: 1px solid #CBD5E1; border-right: 1px solid #E2E8F0; box-sizing: border-box; vertical-align: middle;";
      td.id = `label-cell-${id}-m${m}`;
      
      const span = document.createElement('span');
      span.className = "label-text-val";
      span.innerText = isTitleCell ? "" : "Rp 0";
      span.style.padding = "2px 8px";
      span.style.display = "block";
      span.style.fontWeight = "bold";
      span.style.fontSize = "0.8rem";
      td.style.backgroundColor = isTitleCell ? "#E2E8F0" : "#F8FAFC";
      
      td.appendChild(span);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  // --- 5. データの自動ローカル保存ロジック ---
  function saveCurrentMatrixState() {
    ['fund-source-amount', 'upah-diharapkan', 'penggunaan-cadangan'].forEach(id => {
      const vals = [];
      for (let m = 1; m <= 36; m++) {
        const inp = document.getElementById(`label-cell-${id}-m${m}`)?.querySelector('input');
        vals.push(parseFloat(inp?.value) || 0);
      }
      localStorage.setItem(`step4-3-fixed-${id}`, JSON.stringify(vals));
    });

    ['komoditas', 'biaya'].forEach(type => {
      const cached = [];
      tbody.querySelectorAll(`.dynamic-row-item-${type}`).forEach(row => {
        const label = row.querySelector('.item-name-input').value;
        const months = [];
        row.querySelectorAll('.matrix-input').forEach(inp => months.push(parseFloat(inp.value) || 0));
        cached.push({ label, months });
      });
      localStorage.setItem(`step4-3-dynamic-${type}`, JSON.stringify(cached));
    });

    if (assetPlans && assetPlans.length > 0) {
      localStorage.setItem('invest-items', JSON.stringify(assetPlans));
    }
  }

  // --- 6. メイン計算ロジック（繰り返し積立・購入リキャスト対応） ---
  window.calcFinancials = function() {
    let remainCapital = 0, accumAssetReserve = 0;

    for (let m = 1; m <= 36; m++) {
      const modalIn = parseFloat(tbody.querySelector(`.cell-input-fund-source-amount[data-month="${m}"]`)?.value || 0);
      const upah = parseFloat(tbody.querySelector(`.cell-input-upah-diharapkan[data-month="${m}"]`)?.value || 0);
      const useCadangan = parseFloat(tbody.querySelector(`.cell-input-penggunaan-cadangan[data-month="${m}"]`)?.value || 0);

      let rev = 0, cost = 0;
      tbody.querySelectorAll('.dynamic-row-item-komoditas').forEach(r => rev += parseFloat(r.querySelector(`.matrix-input[data-month="${m}"]`)?.value || 0));
      tbody.querySelectorAll('.dynamic-row-item-biaya').forEach(r => cost += parseFloat(r.querySelector(`.matrix-input[data-month="${m}"]`)?.value || 0));

      // 1. 総収入合計
      const revCell = document.getElementById(`label-cell-total-penjualan-total-m${m}`);
      if (revCell) {
        const txt = revCell.querySelector('.label-text-val');
        txt.innerText = `Rp ${rev.toLocaleString('id-ID')}`;
        txt.style.color = "#10B981";
        revCell.style.backgroundColor = rev > 0 ? "#E6F4EA" : "#F8FAFC"; 
      }

      // 2. 総経費合計
      const costCell = document.getElementById(`label-cell-total-biaya-total-m${m}`);
      if (costCell) {
        const txt = costCell.querySelector('.label-text-val');
        txt.innerText = `Rp ${cost.toLocaleString('id-ID')}`;
        txt.style.color = "#EF4444";
        costCell.style.backgroundColor = cost > 0 ? "#FCE8E6" : "#F8FAFC"; 
      }

      // 3. 営業利益
      const laba = rev - cost;
      const labaCell = document.getElementById(`label-cell-laba-usaha-m${m}`);
      if (labaCell) {
        const txt = labaCell.querySelector('.label-text-val');
        txt.innerText = `Rp ${laba.toLocaleString('id-ID')}`;
        txt.style.color = laba < 0 ? "#FFFFFF" : "#10B981";
        labaCell.style.backgroundColor = laba < 0 ? "#EF4444" : "#ECFDF5";
      }

      // ★★★ 4 & 5. 繰り返し積立・購入リキャスト処理 ★★★
      let investEventAmount = 0, monthlyAssetReserveTotal = 0;
      let assetBoughtLabels = [];

      assetPlans.forEach(a => {
        if (a.price <= 0) return;

        if (a.isExisting) {
          const cycle = a.span; 
          if (cycle > 0) {
            if (m % cycle === 0) {
              investEventAmount += a.price;
              assetBoughtLabels.push(a.name);
            }
            monthlyAssetReserveTotal += Math.round(a.price / cycle);
          }
        } else {
          const firstShop = a.shopMonth;
          const cycle = a.span;

          if (m <= firstShop) {
            if (firstShop > 0) {
              monthlyAssetReserveTotal += Math.round(a.price / firstShop);
            }
            if (m === firstShop) {
              investEventAmount += a.price;
              assetBoughtLabels.push(a.name);
            }
          } else if (cycle > 0) {
            const monthsAfterFirst = m - firstShop;
            if (monthsAfterFirst % cycle === 0) {
              investEventAmount += a.price;
              assetBoughtLabels.push(a.name);
            }
            monthlyAssetReserveTotal += Math.round(a.price / cycle);
          }
        }
      });

      // 4. Rencana Sarana Investasi 枠への流し込み
      const invCell = document.getElementById(`label-cell-sarana-investasi-m${m}`);
      if (invCell) {
        invCell.style.color = investEventAmount > 0 ? "#EF4444" : "#475569";
        invCell.innerHTML = `<span class="label-text-val" style="padding:2px 8px; display:block; font-weight:bold; font-size: 0.8rem;">Rp ${investEventAmount.toLocaleString('id-ID')}</span>` + assetBoughtLabels.map(l => `<span style="font-size:0.75rem; color:#475569; background:#E2E8F0; padding:1px 3px; border-radius:3px; margin:2px 4px; display:inline-block; font-weight:normal;">${l}</span>`).join('');
      }

      // 5. 当月積立金
      const resMonthCell = document.getElementById(`label-cell-cadangan-aset-bulan-m${m}`);
      if (resMonthCell) resMonthCell.querySelector('.label-text-val').innerText = `Rp ${monthlyAssetReserveTotal.toLocaleString('id-ID')}`;

      // 6. 積立累計額
      accumAssetReserve = accumAssetReserve + monthlyAssetReserveTotal - useCadangan - investEventAmount;
      const resAccumCell = document.getElementById(`label-cell-akumulasi-cadangan-aset-m${m}`);
      if (resAccumCell) resAccumCell.querySelector('.label-text-val').innerText = `Rp ${accumAssetReserve.toLocaleString('id-ID')}`;

      // 10. 最終手元資金の残高計算
      const cashFlowReal = (modalIn + laba) - (investEventAmount + monthlyAssetReserveTotal + upah);
      remainCapital = (m === 1) ? cashFlowReal : remainCapital + cashFlowReal;

      const capCell = document.getElementById(`label-cell-modal-tersisa-m${m}`);
      if (capCell) {
        const txt = capCell.querySelector('.label-text-val');
        txt.innerText = `Rp ${remainCapital.toLocaleString('id-ID')}`;
        txt.style.color = remainCapital < 0 ? "#FFFFFF" : "#10B981";
        capCell.style.backgroundColor = remainCapital < 0 ? "#EF4444" : "#FAFAFA";
      }
    }
    saveCurrentMatrixState();
  };

  // 手入力ボックスの埋め込み関数
  function injectManualInputs(id, colorStyle) {
    const cachedFixedData = JSON.parse(localStorage.getItem(`step4-3-fixed-${id}`) || "[]");
    const parentRow = document.getElementById(`row-tr-${id}`);

    for (let m = 1; m <= 36; m++) {
      const cell = document.getElementById(`label-cell-${id}-m${m}`);
      if (cell) {
        let defaultVal = cachedFixedData[m - 1] !== undefined ? cachedFixedData[m - 1] : 0;
        
        // --- 自動連動の最優先ガード処理 ---
        if (id === 'fund-source-amount' && m === 1) {
          if (defaultVal === 0 || cachedFixedData[m - 1] === undefined) {
            defaultVal = initialModal;
          }
        } else if (id === 'upah-diharapkan') {
          if (defaultVal === 0 || cachedFixedData[m - 1] === undefined) {
            defaultVal = initialSalary;
          }
        }
        cell.innerHTML = createRpInputHtml(`cell-input-${id}`, m, defaultVal, colorStyle, m === 1);
      }
    }
    attachCopyFeature(parentRow);
  }

  // --- 7. 固定ベース行の組み立て ---
  const fixedRows = [
    ['total-penjualan-title', '1. Kategori Pendapatan'],
    ['total-penjualan-total', '└ Total Pendapatan'], 
    
    ['total-biaya-title', '2. Kategori Biaya'],
    ['total-biaya-total', '└ Total Biaya'], 

    ['laba-usaha', '3. Laba Usaha'],
    ['sarana-investasi', '4. Rencana Sarana Investasi'], 
    ['cadangan-aset-bulan', '5. Cadangan Aset / Bln'],
    ['akumulasi-cadangan-aset', '6. Akumulasi Cadangan'], 
    ['penggunaan-cadangan', '7. Penggunaan Cadangan'], 

    ['upah-diharapkan', '8. Biaya Hidup (Upah)'],      
    ['fund-source-amount', '9. Penambahan Modal'],     
    ['modal-tersisa', '10. Sisa Kas']
  ];
  fixedRows.forEach(r => addFixedRow(r[0], r[1]));

  injectManualInputs('penggunaan-cadangan', "color: #EF4444;");
  injectManualInputs('upah-diharapkan', "color: #EF4444;");
  injectManualInputs('fund-source-amount', "color: #10B981;");

  // --- 8. データの復元ロード ---
  const savedKomoditas = JSON.parse(localStorage.getItem('step4-3-dynamic-komoditas') || "[]");
  const savedBiaya = JSON.parse(localStorage.getItem('step4-3-dynamic-biaya') || "[]");

  if (savedKomoditas.length > 0) savedKomoditas.forEach(item => window.addDynamicRow('komoditas', item.label, item.months));
  else window.addDynamicRow('komoditas', "", null);

  if (savedBiaya.length > 0) savedBiaya.forEach(item => window.addDynamicRow('biaya', item.label, item.months));
  else window.addDynamicRow('biaya', "", null);

  tbody.addEventListener('input', (e) => { 
    if (e.target.classList.contains('matrix-input') || e.target.classList.contains('item-name-input')) window.calcFinancials(); 
  });
});