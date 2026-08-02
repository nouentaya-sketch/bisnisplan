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
// 6. 🌟 Header Actions Linkage (CSV & PDF 統合)
// ==========================================
function initHeaderEvents() {
  const importBtn = document.getElementById("btn-import-csv");
  const fileInput = document.getElementById("input-import-csv");
  const exportCsvBtn = document.getElementById("btn-export-csv");
  const exportPdfBtn = document.getElementById("btn-export-pdf"); // 🌟 PDFボタン

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
}

// 📄 共通CSV生成ロジック
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

  inputs.forEach((input) => {
    if (input.type === "button" || input.type === "submit" || input.type === "file") return;

    let labelText = "";
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) labelText = label.innerText.trim();
    }
    if (!labelText) {
      labelText = input.placeholder || input.name || input.type;
    }

    const cleanLabel = labelText.replace(/"/g, '""').replace(/\n/g, ' ');
    const cleanValue = input.value.replace(/"/g, '""');
    const inputId = input.id || input.name || "input";

    csvContent += `"${inputId}","${cleanLabel}","${cleanValue}"\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const formattedTitle = title.replace(/\s+/g, '_').replace(/:/g, '');
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${formattedTitle}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 📥 共通CSVインポートロジック
// Membaca file CSV yang formatnya sama dengan hasil exportPageToCSV
// ("ID","Label","Nilai") lalu mengisi kembali nilai tiap field
// berdasarkan ID/name yang cocok di halaman saat ini.
function parseCSVText(text) {
  // Buang BOM (\uFEFF) kalau ada di awal file
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

  // baris terakhir (kalau file tidak diakhiri newline)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

function importCSVToPage(file) {
  const reader = new FileReader();

  reader.onload = () => {
    const rows = parseCSVText(reader.result);

    if (rows.length === 0) {
      alert("File CSV kosong atau formatnya tidak dikenali.");
      return;
    }

    // Baris pertama adalah header (ID,Label,Nilai) → lewati
    const header = rows[0].map(h => h.trim().toLowerCase());
    const idColIdx = header.indexOf("id") !== -1 ? header.indexOf("id") : 0;
    const valueColIdx = header.indexOf("nilai") !== -1 ? header.indexOf("nilai") : (header.length - 1);

    let filledCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const fieldId = (cols[idColIdx] || "").trim();
      const fieldValue = cols[valueColIdx] !== undefined ? cols[valueColIdx] : "";

      if (!fieldId) continue;

      // Cari elemen berdasarkan id, lalu fallback ke name
      let el = document.getElementById(fieldId);
      if (!el) el = document.querySelector(`[name="${CSS.escape(fieldId)}"]`);
      if (!el) continue;

      el.value = fieldValue;

      // Trigger event "input" supaya listener autosave/kalkulasi milik
      // masing-masing halaman (mis. step1.js, step2-1.js, dst.) ikut jalan
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      filledCount++;
    }

    if (filledCount === 0) {
      alert("Tidak ada field yang cocok ditemukan di halaman ini untuk data CSV tersebut.");
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

// Perkiraan ukuran byte dari sebuah data URL base64 (tanpa perlu decode penuh)
function estimateDataUrlBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  // setiap 4 karakter base64 ≈ 3 byte data asli
  const padding = (base64.endsWith('==')) ? 2 : (base64.endsWith('=') ? 1 : 0);
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

// Membuat canvas baru yang lebih kecil (dipakai kalau kompresi JPEG saja
// masih belum cukup untuk turun di bawah batas ukuran)
function downscaleCanvas(sourceCanvas, factor) {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = Math.max(1, Math.round(sourceCanvas.width * factor));
  newCanvas.height = Math.max(1, Math.round(sourceCanvas.height * factor));
  const ctx = newCanvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0, newCanvas.width, newCanvas.height);
  return newCanvas;
}

// Skala capture html2canvas: dikecilkan otomatis di layar HP supaya tidak
// berat/crash saat merender tabel lebar (mis. matriks 36 bulan) di memori
// terbatas milik browser mobile.
function getCaptureScale() {
  const isSmallScreen = window.innerWidth < 768;
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (isSmallScreen || isMobileUA) return 1.5;
  return 2;
}

// 🩹 FIX "PDF cuma kebuka preview, tidak langsung terdownload":
// pdf.save() bawaan jsPDF kadang membuka tab baru dulu di sebagian browser
// HP alih-alih langsung mengunduh. Solusinya: ambil file sebagai Blob,
// lalu paksa download lewat <a download> yang diklik otomatis — pola yang
// sama persis dipakai di exportPageToCSV() supaya perilakunya konsisten.
//
// Catatan jujur: di Safari iOS, membuka PDF di tab (dengan tombol
// share/download di viewer bawaan) adalah batasan sistem dari Apple
// sendiri — tidak ada cara dari sisi website untuk memaksa auto-save ke
// Files di iOS. Untuk Chrome/Edge Android dan browser desktop, fungsi ini
// akan langsung mengunduh.
function forceDownloadPDF(pdf, fileName) {
  const pdfBlob = pdf.output("blob");

  // 🩹 FIX "masih buka preview dulu, tidak langsung download":
  // Banyak browser (terutama Chrome Android) mengenali tipe MIME
  // "application/pdf" lalu otomatis membukanya di PDF viewer bawaan
  // browser, meskipun link-nya sudah punya atribut `download`. Trik
  // umum untuk memaksa dialog "Simpan File": bungkus ulang byte yang
  // SAMA PERSIS ke dalam Blob baru dengan tipe generik
  // "application/octet-stream" (bukan "application/pdf"). Browser jadi
  // tidak tahu cara menampilkannya inline, sehingga langsung
  // menawarkan unduh/simpan. Isi filenya tetap PDF valid — hanya label
  // tipe MIME saat proses download ini saja yang disamarkan.
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

// Mengubah canvas hasil html2canvas menjadi PDF yang dijamin (sebisa mungkin)
// berada di bawah MAX_BYTES, dengan menurunkan kualitas JPEG dulu, baru
// menurunkan resolusi kalau kualitas saja belum cukup.
function buildCompressedPDF(canvas, formattedTitle) {
  const { jsPDF } = window.jspdf;
  const MAX_BYTES = 1024 * 1024; // 1 MB
  const qualitySteps = [0.85, 0.7, 0.55, 0.4, 0.3, 0.2];

  let workingCanvas = canvas;
  let dataUrl = workingCanvas.toDataURL('image/jpeg', qualitySteps[0]);
  let qi = 0;

  // Tahap 1: turunkan kualitas JPEG dulu (paling murah, tidak mengurangi ukuran gambar)
  while (estimateDataUrlBytes(dataUrl) > MAX_BYTES && qi < qualitySteps.length - 1) {
    qi++;
    dataUrl = workingCanvas.toDataURL('image/jpeg', qualitySteps[qi]);
  }

  // Tahap 2: kalau kualitas terendah masih kebesaran, turunkan resolusi canvas
  let scaleFactor = 1;
  while (estimateDataUrlBytes(dataUrl) > MAX_BYTES && scaleFactor > 0.25) {
    scaleFactor -= 0.15;
    workingCanvas = downscaleCanvas(canvas, scaleFactor);
    qi = 1; // mulai lagi dari kualitas menengah untuk resolusi baru ini
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

  // Cek akhir terhadap ukuran blob PDF sesungguhnya (bisa sedikit berbeda
  // dari perkiraan base64). Kalau masih di atas batas, kompres sekali lagi
  // lebih agresif sebagai upaya terakhir.
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
    forceDownloadPDF(pdf2, fileName); // 🩹 download paksa, bukan pdf2.save()
    return;
  }

  forceDownloadPDF(pdf, fileName); // 🩹 download paksa, bukan pdf.save()
}

// 📕 共通PDF出力ロジック
// Menggunakan html2canvas + jsPDF (bukan window.print()) supaya tabel lebar
// (mis. matriks 36 bulan) ikut tercetak SELURUHNYA di PDF, tanpa terpotong
// oleh lebar kertas atau oleh scroll container di layar.
// 🌟 File PDF dijaga maksimal ±1 MB (lihat buildCompressedPDF), skala
// capture disesuaikan otomatis di HP (lihat getCaptureScale), dan hasil
// akhirnya dipaksa langsung terdownload (lihat forceDownloadPDF).
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

  // Fallback: kalau library belum ke-load (mis. lupa ditambahkan di HTML),
  // tetap pakai window.print() biasa supaya tombolnya tidak mati total.
  if (typeof html2canvas === "undefined" || typeof window.jspdf === "undefined") {
    console.warn("html2canvas / jsPDF tidak ditemukan, fallback ke window.print().");
    window.print();
    return;
  }

  const target = document.querySelector(".main-container") || document.body;

  // 🩹 Fix menyeluruh: bukan cuma wrapper tabel yang perlu dibuka overflow-nya,
  // tapi juga <html>, <body>, dan .main-container itu sendiri — karena banyak
  // template CSS sengaja set "overflow-x: hidden" di body/html supaya tidak
  // muncul scrollbar horizontal tak sengaja. Kalau itu tidak dibuka juga,
  // begitu tabel "meluber" keluar wrapper-nya, langsung dipotong lagi di
  // level body/html.
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

  // Ukur lebar/tinggi PENUH setelah semua batasan overflow di atas dibuka
  const fullWidth = Math.max(document.documentElement.scrollWidth, target.scrollWidth);
  const fullHeight = Math.max(document.documentElement.scrollHeight, target.scrollHeight);

  // 🩹 Fix teks input kepotong: html2canvas sering merender teks di dalam
  // <input>/<textarea> dengan terpotong vertikal — solusinya ganti jadi
  // <div> biasa saat capture. TAPI banyak CSS di project ini pakai selector
  // berbasis tag ("... input { padding-left: ... }") untuk menyisakan ruang
  // bagi prefix "Rp" atau ikon copy yang posisinya absolute. Begitu elemen
  // diganti <div>, selector tag itu tidak lagi cocok, jadi padding-nya
  // hilang dan teks jadi numpuk/tabrakan dengan elemen lain.
  //
  // Solusi: ambil dulu COMPUTED STYLE asli tiap input/textarea (hasil akhir
  // CSS yang benar-benar dipakai browser, apapun cara CSS itu ditulis),
  // simpan, lalu terapkan langsung sebagai style eksplisit ke <div>
  // penggantinya — jadi tidak bergantung lagi pada selector yang mungkin
  // sudah tidak cocok.
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

  // pdf-print-mode dipakai kalau ada style khusus (mis. sembunyikan tombol)
  // yang ingin diterapkan hanya saat capture berlangsung.
  document.body.classList.add("pdf-print-mode");

  html2canvas(target, {
    scale: getCaptureScale(), // 🌟 otomatis lebih kecil di HP supaya tidak berat/crash
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: fullWidth,
    windowHeight: fullHeight,
    width: fullWidth,       // 🔑 paksa area render selebar ini, bukan cuma kotak asli target
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
          replacement.style.color = "#94A3B8"; // mirip warna placeholder asli
        }

        field.parentNode.replaceChild(replacement, field);
      });
    }
  }).then(canvas => {
    document.body.classList.remove("pdf-print-mode");
    restoreStyles();
    cleanupPdfFieldMarkers();

    // 🌟 Bangun PDF dengan kompresi bertahap sampai maksimal ±1 MB,
    // lalu paksa langsung download (bukan buka tab preview).
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
// Membuat SEMUA <textarea> di halaman otomatis melebar mengikuti
// panjang tulisan, supaya tidak ada teks yang "hilang"/kepotong saat
// diketik di layar HP. Berlaku juga untuk textarea yang dibuat belakangan
// lewat JavaScript (mis. tombol "Tambah Baris" di Tahap 6, 7, 9).
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

    // Pantau textarea baru yang muncul belakangan (dibuat dinamis oleh
    // stepX.js saat user klik "Tambah Baris", dsb).
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