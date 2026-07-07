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

  // Rentang sumbu tetap per kategori, disesuaikan dengan contoh grafik
  // (bukan auto-scale lagi supaya hasilnya persis sama tiap kali dibuka)
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

    const chart = new Chart(canvas.getContext('2d'), {
      type: 'scatter',
      data: { datasets: [{ data: [], backgroundColor: '#4472C4', pointRadius: 5 }] },
      options: {
        responsive: true,
        aspectRatio: 2,
        layout: {
          padding: { right: 60, top: 30 } // ruang ekstra supaya label teks tidak terpotong
        },
        scales: {
          x: {
            title: { display: true, text: 'Efisiensi' },
            min: axisRange.xMin,
            max: axisRange.xMax,
            ticks: { stepSize: 1 },
            grid: { color: '#E5E7EB' }
          },
          y: {
            title: { display: true, text: 'Kesulitan' },
            min: axisRange.yMin,
            max: axisRange.yMax,
            ticks: { stepSize: 1 },
            grid: { color: '#E5E7EB' }
          }
        },
        plugins: {
          title: {
            display: true,
            text: CHART_TITLES[category] || 'Payoff Matrix',
            font: { size: 15, weight: 'bold' },
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
            offset: 6,
            font: { style: 'italic', size: 11 },
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
    // ------------------------------------
    function createRow(name = '', efisiensi = '', kesulitan = '', isFirst = false) {
      const tr = document.createElement('tr');
      tr.className = 'payoff-row';

      tr.innerHTML = `
        <td class="no-cell font-center">1</td>
        <td><input type="text" class="factor-name" placeholder="Nama faktor..." value="${name}"></td>
        <td><input type="number" class="efisiensi-input font-center" min="-5" max="5" step="1" placeholder="0" value="${efisiensi}"></td>
        <td><input type="number" class="kesulitan-input font-center" min="-5" max="5" step="1" placeholder="0" value="${kesulitan}"></td>
        <td class="font-center">
          ${isFirst ? '' : '<button type="button" class="btn-delete-payoff-row"><i class="fa-solid fa-trash-can"></i></button>'}
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