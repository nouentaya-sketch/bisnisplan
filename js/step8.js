// js/step8.js

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. Field statis (Nama Pemagang) — pola data-save="true" yang sama
  //    dengan halaman-halaman lain di project ini.
  // ==========================================
  document.querySelectorAll('[data-save="true"]').forEach(element => {
    if (!element.id) return;
    const storageKey = `step8-${element.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) element.value = saved;

    element.addEventListener('input', () => {
      localStorage.setItem(storageKey, element.value);
    });
  });

  // Palet judul per kategori, meniru judul grafik Excel di buku panduan
  const CHART_TITLES = {
    keterampilan: 'Faktor Keterampilan yang akan diperlukan',
    sarana: 'Faktor Sarana yang akan diperlukan',
    modal: 'Faktor Modal yang akan diperlukan'
  };

  // Label kolom "Faktor" per kategori, dipakai sbg data-label di mode kartu mobile
  const FACTOR_COL_LABELS = {
    keterampilan: 'Faktor Keterampilan yang Diperlukan',
    sarana: 'Faktor Sarana yang Diperlukan',
    modal: 'Faktor Modal yang Diperlukan'
  };

  // Rentang sumbu tetap per kategori, disesuaikan dengan contoh grafik.
  // PENTING: kalau kamu mengisi angka Efisiensi/Kesulitan di luar rentang
  // ini, titiknya TIDAK akan kelihatan (sengaja dipatok, bukan auto-scale).
  // Sesuaikan angka min/max di bawah ini kalau butuh rentang yang lebih lebar.
  const CHART_AXIS_RANGES = {
    keterampilan: { xMin: 0, xMax: 6, yMin: -2, yMax: 5 },
    sarana: { xMin: 0, xMax: 6, yMin: 0, yMax: 6 },
    modal: { xMin: 0, xMax: 6, yMin: -3, yMax: 4 }
  };

  // Daftarkan plugin datalabels sekali di awal (kalau library-nya ke-load)
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  // ==========================================
  // 🌟 Helper responsif untuk grafik
  // Di layar sempit (HP), ukuran huruf/label diperkecil supaya tidak
  // numpuk/kepotong. CATATAN: rasio tinggi-lebar grafik TIDAK lagi diatur
  // lewat JS (chart.resize() manual sebelumnya menyebabkan kanvas
  // tergambar miring/skewed di beberapa HP). Sekarang rasio diatur murni
  // lewat CSS `aspect-ratio` pada .chart-canvas-wrap (lihat step8.css),
  // dan Chart.js dibiarkan pakai ResizeObserver bawaannya sendiri
  // (options: maintainAspectRatio:false) supaya selalu sinkron dengan
  // ukuran wrapper — jauh lebih stabil daripada resize() manual.
  // ==========================================
  function isMobileView() {
    return window.matchMedia('(max-width: 640px)').matches;
  }

  function getChartResponsiveSettings() {
    const mobile = isMobileView();
    return {
      titleFontSize: mobile ? 12 : 15,
      axisTitleFontSize: mobile ? 10 : 12,
      tickFontSize: mobile ? 9 : 11,
      dataLabelFontSize: mobile ? 9 : 11,
      dataLabelOffset: mobile ? 4 : 6,
      paddingRight: mobile ? 34 : 60,
      paddingTop: mobile ? 20 : 30,
      pointRadius: mobile ? 4 : 5
    };
  }

  // ==========================================
  // 2. Setup tiap section Payoff Matrix
  //    (Keterampilan / Sarana / Modal)
  // ==========================================
  function setupPayoffSection(sectionEl) {
    const category = sectionEl.dataset.payoff;
    const tbody = sectionEl.querySelector('.payoff-rows-container');
    const addBtn = sectionEl.querySelector('.btn-add-payoff');
    const canvas = sectionEl.querySelector('.payoff-chart');
    const storageKey = `step8-payoff-${category}`;

    if (!tbody || !addBtn || !canvas) return;

    const axisRange = CHART_AXIS_RANGES[category] || { xMin: 0, xMax: 6, yMin: -5, yMax: 5 };
    const factorColLabel = FACTOR_COL_LABELS[category] || 'Faktor';
    const rs = getChartResponsiveSettings();

    const chart = new Chart(canvas.getContext('2d'), {
      type: 'scatter',
      data: { datasets: [{ data: [], backgroundColor: '#4472C4', pointRadius: rs.pointRadius }] },
      options: {
        responsive: true,
        // 🌟 Rasio tinggi grafik sekarang ditentukan oleh CSS
        // `aspect-ratio` di .chart-canvas-wrap, bukan opsi Chart.js ini.
        maintainAspectRatio: false,
        layout: {
          padding: { right: rs.paddingRight, top: rs.paddingTop } // ruang ekstra supaya label teks tidak terpotong
        },
        scales: {
          x: {
            title: { display: true, text: 'Efisiensi', font: { size: rs.axisTitleFontSize } },
            min: axisRange.xMin,
            max: axisRange.xMax,
            ticks: { stepSize: 1, font: { size: rs.tickFontSize } },
            grid: { color: '#E5E7EB' }
          },
          y: {
            title: { display: true, text: 'Kesulitan', font: { size: rs.axisTitleFontSize } },
            min: axisRange.yMin,
            max: axisRange.yMax,
            ticks: { stepSize: 1, font: { size: rs.tickFontSize } },
            grid: { color: '#E5E7EB' }
          }
        },
        plugins: {
          title: {
            display: true,
            text: CHART_TITLES[category] || 'Payoff Matrix',
            font: { size: rs.titleFontSize, weight: 'bold' },
            padding: { bottom: 16 }
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const item = ctx.dataset.itemLabels?.[ctx.dataIndex];
                const name = item || '';
                return `${name}: Efisiensi ${ctx.parsed.x}, Kesulitan ${ctx.parsed.y}`;
              }
            }
          },
          datalabels: {
            color: '#374151',
            anchor: 'end',
            align: 'right',
            offset: rs.dataLabelOffset,
            font: { style: 'italic', size: rs.dataLabelFontSize },
            formatter: (value, ctx) => {
              const labels = ctx.dataset.itemLabels || [];
              return labels[ctx.dataIndex] || '';
            }
          }
        }
      }
    });

    // ------------------------------------
    // Nomor urut otomatis di kolom "No"
    // ------------------------------------
    function renumberRows() {
      tbody.querySelectorAll('.payoff-row').forEach((row, index) => {
        const noCell = row.querySelector('.no-cell');
        if (noCell) noCell.innerText = index + 1;
      });
    }

    // ------------------------------------
    // Update grafik + simpan ke localStorage
    // ------------------------------------
    function updateChartAndSave() {
      const items = [];

      tbody.querySelectorAll('.payoff-row').forEach(row => {
        const name = row.querySelector('.factor-name').value;
        const efisiensi = row.querySelector('.efisiensi-input').value;
        const kesulitan = row.querySelector('.kesulitan-input').value;
        items.push({ name, efisiensi, kesulitan });
      });

      // Hanya baris yang sudah lengkap (nama + kedua angka) yang muncul di grafik.
      // Sumbu X = Efisiensi, sumbu Y = Kesulitan (sesuai contoh buku panduan).
      const validItems = items.filter(
        item => item.name.trim() !== '' && item.efisiensi !== '' && item.kesulitan !== ''
      );

      chart.data.datasets[0].data = validItems.map(item => ({
        x: parseFloat(item.efisiensi) || 0,
        y: parseFloat(item.kesulitan) || 0
      }));
      chart.data.datasets[0].itemLabels = validItems.map(item => item.name);

      chart.update();

      localStorage.setItem(storageKey, JSON.stringify(items));
    }

    // ------------------------------------
    // Buat baris baru (dipakai oleh tombol + dan saat restore)
    // 🌟 data-label pada td dipakai CSS untuk mode kartu di HP.
    // Sel nomor sengaja TIDAK diberi data-label (jadi badge bulat polos).
    // ------------------------------------
    function createRow(name = '', efisiensi = '', kesulitan = '', isFirst = false) {
      const tr = document.createElement('tr');
      tr.className = 'payoff-row';

      tr.innerHTML = `
        <td class="no-cell font-center">1</td>
        <td data-label="${factorColLabel}"><input type="text" class="factor-name" placeholder="Nama faktor..." value="${name}"></td>
        <td data-label="Efisiensi"><input type="number" class="efisiensi-input font-center" min="-5" max="5" step="1" placeholder="0" value="${efisiensi}"></td>
        <td data-label="Kesulitan"><input type="number" class="kesulitan-input font-center" min="-5" max="5" step="1" placeholder="0" value="${kesulitan}"></td>
        <td class="font-center action-cell">
          ${isFirst ? '' : '<button type="button" class="btn-delete-payoff-row"><i class="fa-solid fa-trash-can"></i> <span class="btn-delete-text">Hapus Baris</span></button>'}
        </td>
      `;

      tbody.appendChild(tr);

      tr.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateChartAndSave);
      });

      const deleteBtn = tr.querySelector('.btn-delete-payoff-row');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          tr.remove();
          renumberRows();
          updateChartAndSave();
        });
      }

      renumberRows();
    }

    // ------------------------------------
    // Restore dari localStorage
    // ------------------------------------
    let savedItems = [];
    const savedRaw = localStorage.getItem(storageKey);
    if (savedRaw) {
      try {
        savedItems = JSON.parse(savedRaw);
        if (!Array.isArray(savedItems)) savedItems = [];
      } catch (e) {
        savedItems = [];
      }
    }

    if (savedItems.length > 0) {
      savedItems.forEach((item, index) => {
        createRow(item.name || '', item.efisiensi || '', item.kesulitan || '', index === 0);
      });
    } else {
      createRow('', '', '', true);
    }

    updateChartAndSave();

    // ------------------------------------
    // Tombol tambah baris
    // ------------------------------------
    addBtn.addEventListener('click', () => {
      createRow('', '', '', false);
      updateChartAndSave();
    });
  }

  document.querySelectorAll('.payoff-section').forEach(setupPayoffSection);

});