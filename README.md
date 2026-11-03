# Proyek BUMI – Bisnis Plan

Aplikasi web statis untuk menyusun bisnis plan dalam 10 tahap. Ditujukan bagi peserta magang di Jepang yang akan memulai bisnis setelah kembali ke Indonesia. Tampilan menggunakan bahasa Indonesia.

## Tahapan

| Tahap | Halaman | Isi |
|-------|---------|-----|
| 0 | `index.html` | Peta 10 tahap |
| 1 | `step1.html` | Literasi keuangan dan estimasi modal bisnis |
| 2-1, 2-2 | `step2-1.html`, `step2-2.html` | Profil dan kalender bisnis keluarga |
| 3 | `step3.html` | Ide bisnis |
| 4-1, 4-2, 4-3 | `step4-1.html`, `step4-2.html`, `step4-3.html` | Profil bisnis, struktur modal & aset, kalender bisnis |
| 5, 5-1, 5-2 | `step5.html`, `step5-1.html`, `step5-2.html` | Riset bisnis superstar di Indonesia |
| 6 | `step6.html` | Struktur bisnis |
| 7 | `step7.html` | Analisis SWOT |
| 8 | `step8.html` | Analisis payoff matrix |
| 9 | `step9.html` | Riset bisnis superstar di Jepang |
| 10 | `step10.html` | Pengajuan sertifikat bisnis plan |

## Fitur

- **Simpan otomatis**: isian disimpan di `localStorage` browser, jadi data tetap ada saat halaman dibuka kembali.
- **Export / Import CSV**: simpan dan pulihkan isian per halaman.
- **Export PDF**: cetak halaman yang sedang dibuka menjadi PDF.
- **Export Excel**: kalender bisnis (Tahap 2-2 dan 4-3) dapat diekspor ke `.xlsx`.
- **Hapus Data**: menghapus isian halaman yang sedang dibuka. Nama Lengkap tidak ikut terhapus.

## Struktur folder

```
index.html, step*.html   Halaman tiap tahap
components/              Header dan footer yang dimuat bersama (header.html, footer.html)
css/                     style.css (umum) dan CSS per tahap
js/                      header-route.js (header, navigasi, CSV, PDF, Hapus Data) dan JS per tahap
```

## Cara kerja aplikasi

### Susunan halaman

Setiap tahap adalah satu file HTML. Semua halaman memakai pola yang sama:

1. Memuat `css/style.css` (gaya umum) dan CSS tahap tersebut.
2. Menyediakan `<div id="header-container">` dan `<div id="footer-container">` yang masih kosong.
3. Memuat `js/header-route.js` (kode bersama), lalu JS khusus tahap tersebut.

`step4-1.html` memakai `js/step2-1.js` dan `css/step2-1.css` karena formulirnya sama dengan Tahap 2-1.

### Kode bersama (`js/header-route.js`)

Saat halaman dibuka, file ini:

- memuat `components/header.html` dan `components/footer.html` dengan `fetch`, lalu menyisipkannya ke halaman;
- membaca nomor tahap dari nama file (`step4-2.html` → `4-2`), mengisi subjudul dan `document.title` dari daftar `STEP_TITLES`, dan menandai menu navigasi yang aktif;
- mengaktifkan tombol di header: Export PDF, Export CSV, Import CSV, dan Hapus Data;
- menyamakan isian **Nama Lengkap** di semua tahap lewat kunci `global-nama-lengkap`.

Saat menambah tahap baru, daftarkan judulnya di `STEP_TITLES` dan tambahkan tautannya di `components/header.html` serta `index.html`.

### Penyimpanan data

Tidak ada server maupun database. Semua isian disimpan di `localStorage` browser. Pola kunci yang dipakai:

| Pola | Dipakai oleh |
|------|--------------|
| `<halaman>-<id field>` (mis. `step3-...`, `step10-...`), dari `data-page` pada `<body>` atau nama path | Sebagian besar tahap (2-1, 2-2, 3, 5, 6, 7, 8, 9, 10) |
| `<halaman>-<nama>-rows` | Tabel dinamis yang jumlah barisnya bisa bertambah (Tahap 6, 7, 9) |
| `<id field>` dan `financeGroup:<kelompok>` | Tahap 1 |
| `sim-start-date`, `fund-source-amount`, `sim-expected-salary`, `invest-items` | Tahap 4-2 |
| `step4-3-fixed-...`, `step4-3-dynamic-...` | Tahap 4-3 |

Field yang ingin disimpan otomatis diberi atribut `data-save="true"` dan `id` yang unik.

### Alur data antar tahap

- **Tahap 4-2 → 4-3**: Tahap 4-3 membaca tanggal mulai, modal awal, biaya hidup, dan daftar aset (`invest-items`) yang disimpan Tahap 4-2 untuk membuat kalender bisnis. Karena itu, isi Tahap 4-2 lebih dulu.
- **Nama Lengkap**: diisi sekali, lalu otomatis muncul di tahap lain.
- **Tahap 6**: tabel "Analisis" diturunkan dari tabel lain dan diperbarui lewat event `struktur:rows-changed`.

### Export dan Import

- **CSV**: setiap field yang punya `id` atau `name` menjadi satu baris (`ID,Label,Nilai`). Saat import, nilai diisikan ke field dengan ID yang sama lalu event `input` dan `change` dikirim agar perhitungan ikut diperbarui. Tahap 6 menambah baris tabel lebih dulu lewat `window.ensureDynamicRowsForImport`.
- **PDF**: area `.main-container` diubah menjadi gambar dengan html2canvas, lalu disusun menjadi PDF dengan jsPDF dan dikompres agar ukurannya sekitar 1 MB atau kurang.
- **Excel**: `js/calendar-excel.js` mengubah tabel kalender menjadi `.xlsx` dengan SheetJS (hanya di Tahap 2-2 dan 4-3).

### Hapus Data

Tombol ini menghapus kunci `localStorage` milik halaman yang sedang dibuka, kecuali Nama Lengkap. Halaman yang tidak memakai pola `<halaman>-...` didaftarkan di `CUSTOM_CLEAR_KEYS` pada `js/header-route.js`. Jika menambah halaman dengan kunci penyimpanan sendiri, daftarkan juga di sana.

## Menjalankan secara lokal

Tidak perlu build. Namun header dan footer dimuat dengan `fetch`, sehingga halaman harus dibuka lewat server lokal, bukan dengan membuka file langsung (`file://`).

```
python -m http.server 8000
```

Lalu buka `http://localhost:8000/`.

Library eksternal (Chart.js, jsPDF, html2canvas, SheetJS, Font Awesome, Google Fonts) dimuat dari CDN, jadi dibutuhkan koneksi internet.

## Catatan

- Data tersimpan hanya di browser masing-masing pengguna. Berkolaborasi lewat GitHub hanya membagikan kode, bukan isian data.
- Untuk memindahkan data antar perangkat, gunakan Export CSV lalu Import CSV.