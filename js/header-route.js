// ==========================================
// 1. Title List (Dictionary)
// ==========================================
const STEP_TITLES = {
  0: "Tahap 0 : Pendahuluan",
  1: "Tahap 1 : Literasi Keuangan",
  2: "Tahap 2 : Riset Bisnis Keluarga",
  "2-1": "Tahap 2-1 : Profil Bisnis Keluarga", 
  "2-2": "Tahap 2-2 : Kalender Bisnis Keluarga",
  3: "Tahap 3 : Ide Bisnis",
  4: "Tahap 4 : Bisnis Plan",             
  "4-1": "Tahap 4-1 : Profil Bisnis", 
  "4-2": "Tahap 4-2 : Struktur Modal & Aset",
  "4-3": "Tahap 4-3 : Kalender Bisnis",
  5: "Tahap 5 : Hasil Riset Bisnis Superstar",
  "5-1": "Tahap 5-1 : Analisis Bisnis Superstar",
  "5-2": "Tahap 5-2 : Analisis Keuangan Bisnis Superstar",
  6: "Tahap 6 : Struktur Bisnis",
  7: "Tahap 7 : Analisa SWOT",
  8: "Tahap 8 : Payoff Matriks Bisnis Plan",
  9: "Tahap 9 : Hasil Riset Bisnis Superstar Jepang",
  10: "Tahap 10 : Pengajuan Sertifikat"
};

// ==========================================
// 2. Automatically Get Step Key From URL
// ==========================================
function getStepKeyFromURL() {
  const filename = window.location.pathname.split('/').pop();
  
  if (filename === "" || filename === "index.html") {
    return "0";
  }
  
  const match = filename.match(/step([\d-]+)\.html/i);
  return match ? match[1] : "1";
}

// 🌟 Key localStorage per halaman dipakai konsisten di SEMUA stepX.js
// lewat pola: document.body.dataset.page || window.location.pathname
// (bukan getStepKeyFromURL() di atas, yang formatnya sedikit beda).
// Dipakai oleh fitur "Hapus Data" supaya menghapus key yang PERSIS
// sama dengan yang dipakai untuk menyimpan.
function getPageStorageKey() {
  return document.body.dataset.page || window.location.pathname;
}

// ==========================================
// 3. Shared Function to Load HTML Components
// ==========================================
function loadComponent(url, containerId, callback = null) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then(html => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
        if (callback) callback();
      }
    })
    .catch(err => console.error(`Error loading ${url}:`, err));
}

// ==========================================
// 4. Main Initialization on DOM Load
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const stepKey = getStepKeyFromURL();

  // ① Load Common Header
  loadComponent('components/header.html', 'header-container', () => {
    const subtitleElement = document.getElementById("header-sub-title");
    if (subtitleElement && STEP_TITLES[stepKey]) {
      subtitleElement.innerText = STEP_TITLES[stepKey];
      document.title = STEP_TITLES[stepKey];
    }
    
    // 【ヘッダー読み込み完了後】に、CSV/PDF関連のイベントとナビ色変更を起動
    initHeaderEvents();
    highlightHeaderNav(stepKey);
  });

  // ② Load Common Footer
  loadComponent('components/footer.html', 'footer-container');

  // ③【ロードマップ画面（Tahap 0 の中身）】のボタンの色を変更
  highlightRoadmapNav();
});

// ==========================================
// 5. Highlight Navigation Links
// ==========================================
function highlightHeaderNav(stepKey) {
  const activeNavBtn = document.getElementById(`nav-step-${stepKey}`);
  if (activeNavBtn) {
    activeNavBtn.style.backgroundColor = "#0F172A";
    activeNavBtn.style.color = "#FFFFFF";
  }
}

function highlightRoadmapNav() {
  const filename = window.location.pathname.split('/').pop();
  const currentStep = (filename === "" || filename === "index.html") ? "index.html" : filename;

  const allLinks = document.querySelectorAll(".step-box, .step-sub-box");
  allLinks.forEach(link => {
    if (link.getAttribute("href") === currentStep) {
      link.classList.add("active-step");
    }
  });
}

// ==========================================
// 6. 🌟 Header Actions Linkage (CSV & PDF & Hapus Data 統合)
// ==========================================
function initHeaderEvents() {
  const importBtn = document.getElementById("btn-import-csv");
  const fileInput = document.getElementById("input-import-csv");
  const exportCsvBtn = document.getElementById("btn-export-csv");
  const exportPdfBtn = document.getElementById("btn-export-pdf"); // 🌟 PDFボタン
  const clearDataBtn = document.getElementById("btn-clear-data"); // 🌟 tombol Hapus Data

  // 📥 CSVインポート
  if (importBtn && fileInput) {
    importBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) importCSVToPage(file);
      // reset supaya file yang sama bisa dipilih ulang kalau diperlukan
      fileInput.value = "";
    });
  }

  // 📤 CSVエクスポート
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      exportPageToCSV();
    });
  }

  // 📕 PDFエクスポート
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener("click", () => {
      exportPageToPDF();
    });
  }

  // 🗑️ Hapus Data (khusus halaman yang sedang dibuka)
  if (clearDataBtn) {
    clearDataBtn.addEventListener("click", () => {
      clearCurrentPageData();
    });
  }
}

// 📄 共通CSV生成ロジック
//
// 🌟 FIX: sebelumnya field tanpa id/name diberi fallback id generik
// "input", sehingga banyak baris CSV berbagi ID yang sama persis dan
// tidak bisa dibedakan lagi saat diimport kembali (semua field di
// tabel dinamis seperti Tahap 6 jatuh ke fallback ini). Sekarang field
// tanpa id/name dilewati (tidak diexport) — field seperti itu perlu
// diberi id unik dulu di halaman terkait (lihat step6.js untuk contoh
// polanya) baru bisa ikut export/import CSV dengan benar.
//
// 🌟 FIX: field readonly (mis. tabel "Analisa" Tahap 6, yang isinya
// otomatis/turunan dari tabel lain) juga dilewati — tidak perlu ikut
// diexport karena bukan data primer.
function exportPageToCSV() {
  const stepKey = getStepKeyFromURL();
  const title = STEP_TITLES[stepKey] || "Data";
  const inputs = document.querySelectorAll(".main-container input, .main-container textarea");

  if (inputs.length === 0) {
    alert("Tidak ada data yang bisa diexport di halaman ini.");
    return;
  }

  let csvContent = "\uFEFF"; 
  csvContent += "ID,Label,Nilai\n";
  let exportedCount = 0;

  inputs.forEach((input) => {
    if (input.type === "button" || input.type === "submit" || input.type === "file") return;
    if (input.readOnly) return;

    const inputId = input.id || input.name;
    if (!inputId) return;

    let labelText = "";
    const label = document.querySelector(`label[for="${CSS.escape(inputId)}"]`);
    if (label) labelText = label.innerText.trim();
    if (!labelText) {
      labelText = input.placeholder || input.name || input.type;
    }

    const cleanLabel = labelText.replace(/"/g, '""').replace(/\n/g, ' ');
    const cleanValue = input.value.replace(/"/g, '""');

    csvContent += `"${inputId}","${cleanLabel}","${cleanValue}"\n`;
    exportedCount++;
  });

  if (exportedCount === 0) {
    alert("Tidak ada field yang bisa diexport di halaman ini (belum ada field dengan id/name yang valid).");
    return;
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const formattedTitle = title.replace(/\s+/g, '_').replace(/:/g, '');
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${formattedTitle}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 📥 共通CSVインポートロジック
function parseCSVText(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = "";
      } else if (char === '\r') {
        // abaikan, ditangani oleh \n
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

// 🌟 FIX: sebelum mengisi value, panggil dulu window.ensureDynamicRowsForImport
// (kalau halaman menyediakannya, mis. step6.js) supaya tabel dinamis
// menambah baris terlebih dulu jika CSV punya lebih banyak baris
// daripada yang sedang tampil di halaman. Tanpa ini, baris "kelebihan"
// selalu gagal diisi karena elemennya belum ada di DOM.
//
// 🌟 FIX: pesan hasil import sekarang memisahkan jumlah field yang
// berhasil vs yang tidak ditemukan (skippedCount), supaya kalau masih
// ada yang tidak terisi, penyebabnya jelas kelihatan.
function importCSVToPage(file) {
  const reader = new FileReader();

  reader.onload = () => {
    const rows = parseCSVText(reader.result);

    if (rows.length === 0) {
      alert("File CSV kosong atau formatnya tidak dikenali.");
      return;
    }

    const header = rows[0].map(h => h.trim().toLowerCase());
    const idColIdx = header.indexOf("id") !== -1 ? header.indexOf("id") : 0;
    const valueColIdx = header.indexOf("nilai") !== -1 ? header.indexOf("nilai") : (header.length - 1);

    if (typeof window.ensureDynamicRowsForImport === 'function') {
      const fieldIds = rows.slice(1).map(r => (r[idColIdx] || '').trim()).filter(Boolean);
      window.ensureDynamicRowsForImport(fieldIds);
    }

    let filledCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const fieldId = (cols[idColIdx] || "").trim();
      const fieldValue = cols[valueColIdx] !== undefined ? cols[valueColIdx] : "";

      if (!fieldId) continue;

      let el = document.getElementById(fieldId);
      if (!el) el = document.querySelector(`[name="${CSS.escape(fieldId)}"]`);
      if (!el) {
        skippedCount++;
        continue;
      }

      el.value = fieldValue;

      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      filledCount++;
    }

    if (filledCount === 0) {
      alert("Tidak ada field yang cocok ditemukan di halaman ini untuk data CSV tersebut.");
    } else if (skippedCount > 0) {
      alert(`Berhasil mengisi ${filledCount} field. ${skippedCount} field di CSV tidak ditemukan di halaman ini (mungkin dari halaman lain).`);
    } else {
      alert(`Berhasil mengisi ${filledCount} field dari file CSV.`);
    }
  };

  reader.onerror = () => {
    alert("Gagal membaca file CSV.");
  };

  reader.readAsText(file, "UTF-8");
}

// ==========================================
// 7. 🌟 PDF Helpers: kompresi ukuran file & skala aman untuk HP
// ==========================================

function estimateDataUrlBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  const padding = (base64.endsWith('==')) ? 2 : (base64.endsWith('=') ? 1 : 0);
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function downscaleCanvas(sourceCanvas, factor) {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = Math.max(1, Math.round(sourceCanvas.width * factor));
  newCanvas.height = Math.max(1, Math.round(sourceCanvas.height * factor));
  const ctx = newCanvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0, newCanvas.width, newCanvas.height);
  return newCanvas;
}

function getCaptureScale() {
  const isSmallScreen = window.innerWidth < 768;
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (isSmallScreen || isMobileUA) return 1.5;
  return 2;
}

function forceDownloadPDF(pdf, fileName) {
  const pdfBlob = pdf.output("blob");
  const octetBlob = new Blob([pdfBlob], { type: "application/octet-stream" });

  const blobUrl = URL.createObjectURL(octetBlob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

function buildCompressedPDF(canvas, formattedTitle) {
  const { jsPDF } = window.jspdf;
  const MAX_BYTES = 1024 * 1024; // 1 MB
  const qualitySteps = [0.85, 0.7, 0.55, 0.4, 0.3, 0.2];

  let workingCanvas = canvas;
  let dataUrl = workingCanvas.toDataURL('image/jpeg', qualitySteps[0]);
  let qi = 0;

  while (estimateDataUrlBytes(dataUrl) > MAX_BYTES && qi < qualitySteps.length - 1) {
    qi++;
    dataUrl = workingCanvas.toDataURL('image/jpeg', qualitySteps[qi]);
  }

  let scaleFactor = 1;
  while (estimateDataUrlBytes(dataUrl) > MAX_BYTES && scaleFactor > 0.25) {
    scaleFactor -= 0.15;
    workingCanvas = downscaleCanvas(canvas, scaleFactor);
    qi = 1;
    dataUrl = workingCanvas.toDataURL('image/jpeg', qualitySteps[qi]);
    while (estimateDataUrlBytes(dataUrl) > MAX_BYTES && qi < qualitySteps.length - 1) {
      qi++;
      dataUrl = workingCanvas.toDataURL('image/jpeg', qualitySteps[qi]);
    }
  }

  const pdfWidth = workingCanvas.width * 0.75;
  const pdfHeight = workingCanvas.height * 0.75;
  const orientation = pdfWidth > pdfHeight ? "l" : "p";

  const pdf = new jsPDF({
    orientation,
    unit: "pt",
    format: [pdfWidth, pdfHeight],
    compress: true
  });

  pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);

  const fileName = `${formattedTitle || "Kalender_Bisnis"}.pdf`;

  const finalBlob = pdf.output('blob');
  if (finalBlob.size > MAX_BYTES && scaleFactor > 0.2) {
    const lastScale = Math.max(0.2, scaleFactor - 0.15);
    const lastCanvas = downscaleCanvas(canvas, lastScale);
    const lastDataUrl = lastCanvas.toDataURL('image/jpeg', 0.35);
    const w2 = lastCanvas.width * 0.75;
    const h2 = lastCanvas.height * 0.75;
    const orientation2 = w2 > h2 ? "l" : "p";
    const pdf2 = new jsPDF({ orientation: orientation2, unit: "pt", format: [w2, h2], compress: true });
    pdf2.addImage(lastDataUrl, "JPEG", 0, 0, w2, h2);
    forceDownloadPDF(pdf2, fileName);
    return;
  }

  forceDownloadPDF(pdf, fileName);
}

// 📕 共通PDF出力ロジック
function exportPageToPDF() {
  const dateElement = document.getElementById("current-print-date");

  if (dateElement) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    dateElement.innerText = `Tanggal Cetak: ${day}/${month}/${year} ${hours}:${minutes}`;
  }

  const stepKey = getStepKeyFromURL();
  const title = STEP_TITLES[stepKey] || "Data";
  const formattedTitle = title.replace(/\s+/g, '_').replace(/:/g, '');

  if (typeof html2canvas === "undefined" || typeof window.jspdf === "undefined") {
    console.warn("html2canvas / jsPDF tidak ditemukan, fallback ke window.print().");
    window.print();
    return;
  }

  const target = document.querySelector(".main-container") || document.body;

  const ancestorLockTargets = [
    document.documentElement,
    document.body,
    target
  ].filter(Boolean);

  const scrollWrappers = Array.from(
    document.querySelectorAll(".table-responsive, .matrix-scroll-wrapper")
  );

  const originalStyles = [];

  function lockOpen(el, props) {
    const original = {};
    Object.keys(props).forEach(key => { original[key] = el.style[key]; });
    originalStyles.push({ el, original });
    Object.assign(el.style, props);
  }

  ancestorLockTargets.forEach(el => {
    lockOpen(el, { overflow: "visible", overflowX: "visible" });
  });

  scrollWrappers.forEach(el => {
    lockOpen(el, {
      overflow: "visible",
      overflowX: "visible",
      width: el.scrollWidth + "px",
      maxWidth: "none"
    });
  });

  function restoreStyles() {
    originalStyles.forEach(({ el, original }) => {
      Object.keys(original).forEach(key => { el.style[key] = original[key]; });
    });
  }

  const fullWidth = Math.max(document.documentElement.scrollWidth, target.scrollWidth);
  const fullHeight = Math.max(document.documentElement.scrollHeight, target.scrollHeight);

  const pdfFields = Array.from(target.querySelectorAll("input, textarea"));
  const fieldComputedStyles = pdfFields.map(field => {
    const cs = window.getComputedStyle(field);
    return {
      padding: cs.padding,
      border: cs.border,
      borderRadius: cs.borderRadius,
      font: cs.font,
      color: cs.color,
      textAlign: cs.textAlign,
      backgroundColor: cs.backgroundColor,
      boxSizing: cs.boxSizing,
      width: cs.width,
      height: cs.height,
      lineHeight: cs.lineHeight
    };
  });
  pdfFields.forEach((field, idx) => field.setAttribute("data-pdf-idx", idx));

  function cleanupPdfFieldMarkers() {
    pdfFields.forEach(field => field.removeAttribute("data-pdf-idx"));
  }

  document.body.classList.add("pdf-print-mode");

  html2canvas(target, {
    scale: getCaptureScale(),
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: fullWidth,
    windowHeight: fullHeight,
    width: fullWidth,
    height: fullHeight,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const clonedFields = clonedDoc.querySelectorAll("[data-pdf-idx]");
      clonedFields.forEach(field => {
        const idx = field.getAttribute("data-pdf-idx");
        const cs = fieldComputedStyles[idx];
        if (!cs) return;

        const replacement = clonedDoc.createElement("div");
        if (field.className) replacement.className = field.className;

        Object.assign(replacement.style, {
          padding: cs.padding,
          border: cs.border,
          borderRadius: cs.borderRadius,
          font: cs.font,
          color: cs.color,
          textAlign: cs.textAlign,
          backgroundColor: cs.backgroundColor,
          boxSizing: cs.boxSizing,
          width: cs.width,
          height: cs.height,
          lineHeight: cs.lineHeight,
          display: "flex",
          alignItems: "center",
          whiteSpace: "pre-wrap",
          overflow: "hidden"
        });

        const hasValue = field.value && field.value.trim() !== "";
        replacement.textContent = hasValue ? field.value : (field.placeholder || "");
        if (!hasValue) {
          replacement.style.color = "#94A3B8";
        }

        field.parentNode.replaceChild(replacement, field);
      });
    }
  }).then(canvas => {
    document.body.classList.remove("pdf-print-mode");
    restoreStyles();
    cleanupPdfFieldMarkers();

    buildCompressedPDF(canvas, formattedTitle);
  }).catch(err => {
    document.body.classList.remove("pdf-print-mode");
    restoreStyles();
    cleanupPdfFieldMarkers();
    console.error("Gagal membuat PDF:", err);
    alert("Gagal membuat PDF. Coba lagi, atau gunakan tombol print browser (Ctrl+P) sebagai alternatif.");
  });
}

// ==========================================
// 8. 🌟 Auto-resize Textarea (universal, semua halaman)
// ==========================================
(function () {

  function autoResizeTextarea(el) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function initAutosizeTextareas(root = document) {
    root.querySelectorAll("textarea").forEach(el => {
      if (el.dataset.autosizeBound === "true") return;
      el.dataset.autosizeBound = "true";

      autoResizeTextarea(el);
      el.addEventListener("input", () => autoResizeTextarea(el));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initAutosizeTextareas();

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.tagName === "TEXTAREA") {
            initAutosizeTextareas(node.parentElement || document);
          } else if (node.querySelectorAll) {
            initAutosizeTextareas(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });

})();

// ==========================================
// 9. 🌟 Sinkronisasi "Nama Lengkap" antar semua Tahap
// ==========================================
(function () {

  const GLOBAL_NAME_KEY = 'global-nama-lengkap';

  function findNamaLengkapFields() {
    const found = new Set();

    ['nama-lengkap', 'name', 'nama_lengkap', 'namaLengkap'].forEach(id => {
      const el = document.getElementById(id);
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) found.add(el);
    });

    document.querySelectorAll('label').forEach(label => {
      if (!/nama\s*lengkap/i.test(label.textContent || '')) return;
      const forId = label.getAttribute('for');
      const input = forId ? document.getElementById(forId) : label.querySelector('input, textarea');
      if (input) found.add(input);
    });

    return Array.from(found);
  }

  window.addEventListener('load', () => {
    const fields = findNamaLengkapFields();
    if (fields.length === 0) return;

    const globalValue = localStorage.getItem(GLOBAL_NAME_KEY);

    fields.forEach(field => {
      if (globalValue && !field.value) {
        field.value = globalValue;
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }

      field.addEventListener('input', () => {
        localStorage.setItem(GLOBAL_NAME_KEY, field.value);
      });
    });
  });

})();

// ==========================================
// 10. 🌟 Hapus Data (Clear Data) — khusus halaman yang sedang dibuka
// ==========================================
// Menghapus SEMUA key localStorage yang menjadi milik halaman ini saja
// (key yang diawali "<pageKey>-", persis pola yang dipakai tiap stepX.js
// untuk menyimpan datanya). Setelah dihapus, halaman di-reload supaya
// semua field kembali kosong — termasuk tabel dinamis (Tahap 6, 7, 9)
// yang jumlah barisnya juga tersimpan di localStorage.
//
// Nama Lengkap sengaja DIKECUALIKAN dari penghapusan, karena field itu
// disinkronkan lewat "global-nama-lengkap" (lihat bagian 9) — kalau
// dihapus di sini, nanti otomatis terisi lagi oleh nilai global saat
// halaman reload. Supaya perilaku tombol "Hapus Data" konsisten dengan
// harapan pengguna (nama tidak ikut hilang begitu saja tanpa disadari),
// key nama per-halaman JUGA dikecualikan secara eksplisit.
//
// 🌟 CUSTOM_CLEAR_KEYS: beberapa halaman (Tahap 4-2 & 4-3) menyimpan
// data dengan nama key sendiri (mis. "sim-start-date", "invest-items",
// "step4-3-fixed-fund-source-amount") yang TIDAK diawali "<pageKey>-",
// jadi tidak pernah kedeteksi oleh pencarian prefix di bawah — akibatnya
// tombol "Hapus Data" kelihatan tidak berfungsi di halaman itu. Key-key
// ini didaftarkan di sini supaya ikut dihapus secara eksplisit.
// Kalau nanti ada halaman lain yang ternyata juga pakai skema key
// custom serupa, tinggal tambahkan entri barunya di sini juga.
const CUSTOM_CLEAR_KEYS = {
  '4-2': [
    'sim-start-date',
    'fund-source-amount',
    'sim-expected-salary',
    'invest-items'
    // 'sim-user-name' SENGAJA tidak dimasukkan — ini menyimpan Nama
    // Lengkap (field id="name" di step4-2.html), diperlakukan sama
    // seperti pengecualian Nama Lengkap di halaman lain.
  ],
  '4-3': [
    'step4-3-fixed-fund-source-amount',
    'step4-3-fixed-upah-diharapkan',
    'step4-3-fixed-penggunaan-cadangan',
    'step4-3-dynamic-komoditas',
    'step4-3-dynamic-biaya'
    // 'invest-items' TIDAK dimasukkan di sini — datanya "dimiliki"
    // Tahap 4-2 (di situ tempat menambah/mengedit asetnya), Tahap 4-3
    // cuma ikut membaca & menampilkannya. Menghapusnya dari 4-3 akan
    // mengejutkan user yang tidak sedang membuka 4-2. Kalau ternyata
    // kamu MAU aset ikut terhapus juga dari sini, tinggal tambahkan
    // 'invest-items' ke array ini.
  ]
};

function clearCurrentPageData() {
  const pageKey = getPageStorageKey();
  const prefix = `${pageKey}-`;
  const stepKey = getStepKeyFromURL();

  const namaLengkapKeys = new Set([
    `${prefix}nama-lengkap`,
    `${prefix}name`,
    `${prefix}nama_lengkap`,
    `${prefix}namaLengkap`
  ]);

  const keysToRemove = [];

  // 1. Key berpola umum "<pageKey>-idField" (dipakai kebanyakan halaman)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix) && !namaLengkapKeys.has(key)) {
      keysToRemove.push(key);
    }
  }

  // 2. Key KHUSUS untuk halaman tertentu yang tidak ikut pola di atas
  //    (lihat CUSTOM_CLEAR_KEYS di atas)
  (CUSTOM_CLEAR_KEYS[stepKey] || []).forEach(key => {
    if (localStorage.getItem(key) !== null && !keysToRemove.includes(key)) {
      keysToRemove.push(key);
    }
  });

  if (keysToRemove.length === 0) {
    alert("Tidak ada data tersimpan di halaman ini.");
    return;
  }

  const confirmClear = window.confirm(
    `Semua isian di halaman ini akan DIHAPUS PERMANEN (${keysToRemove.length} field). ` +
    `Nama Lengkap tidak akan ikut terhapus. Lanjutkan?`
  );
  if (!confirmClear) return;

  keysToRemove.forEach(key => localStorage.removeItem(key));

  window.location.reload();
}
