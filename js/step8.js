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

  // Palet warna untuk tiap titik/baris di grafik (dipakai bergiliran)
  const CHART_COLORS = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];

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

    const chart = new Chart(canvas.getContext('2d'), {
      type: 'scatter',
      data: { datasets: [] },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: 'Kesulitan (Sulit -5 ↔ Mudah 5)' },
            min: -5.5,
            max: 5.5,
            ticks: { stepSize: 1 }
          },
          y: {
            title: { display: true, text: 'Efisiensi (Rendah -5 ↔ Tinggi 5)' },
            min: -5.5,
            max: 5.5,
            ticks: { stepSize: 1 }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: Efisiensi ${ctx.parsed.y}, Kesulitan ${ctx.parsed.x}`
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

      // Satu dataset per baris yang sudah lengkap (nama + kedua angka),
      // supaya legend grafik menampilkan nama tiap faktor seperti di buku panduan.
      chart.data.datasets = items
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.name.trim() !== '' && item.efisiensi !== '' && item.kesulitan !== '')
        .map(({ item, idx }) => ({
          label: item.name,
          data: [{ x: parseFloat(item.kesulitan) || 0, y: parseFloat(item.efisiensi) || 0 }],
          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
          pointRadius: 7,
          pointHoverRadius: 9
        }));

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