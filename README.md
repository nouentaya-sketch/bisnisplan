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