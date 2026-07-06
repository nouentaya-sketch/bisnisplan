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

// 📕 共通PDF出力ロジック
// Menggunakan html2canvas + jsPDF (bukan window.print()) supaya tabel lebar
// (mis. matriks 36 bulan) ikut tercetak SELURUHNYA di PDF, tanpa terpotong
// oleh lebar kertas atau oleh scroll container di layar.
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

  // pdf-print-mode dipakai kalau ada style khusus (mis. sembunyikan tombol)
  // yang ingin diterapkan hanya saat capture berlangsung.
  document.body.classList.add("pdf-print-mode");

  html2canvas(target, {
    scale: 2,               // resolusi lebih tajam
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: fullWidth,
    windowHeight: fullHeight,
    width: fullWidth,       // 🔑 paksa area render selebar ini, bukan cuma kotak asli target
    height: fullHeight,
    scrollX: 0,
    scrollY: 0
  }).then(canvas => {
    document.body.classList.remove("pdf-print-mode");
    restoreStyles();

    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL("image/png");

    // Ukuran halaman PDF dibuat mengikuti ukuran gambar hasil capture
    // (dalam satuan pt, 1px canvas ≈ 0.75pt), supaya tidak ada bagian
    // yang harus dipotong ke halaman berikutnya.
    const pdfWidth = canvas.width * 0.75;
    const pdfHeight = canvas.height * 0.75;
    const orientation = pdfWidth > pdfHeight ? "l" : "p";

    const pdf = new jsPDF({
      orientation,
      unit: "pt",
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${formattedTitle || "Kalender_Bisnis"}.pdf`);
  }).catch(err => {
    document.body.classList.remove("pdf-print-mode");
    restoreStyles();
    console.error("Gagal membuat PDF:", err);
    alert("Gagal membuat PDF. Coba lagi, atau gunakan tombol print browser (Ctrl+P) sebagai alternatif.");
  });
}