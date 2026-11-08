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

---

# 日本語版

## BUMIプロジェクト — ビジネスプラン

インドネシアへの帰国後に起業を目指す学習者向けの、ビジネスプラン作成補助ツールです。全10段階を通して、事業アイデアの検討や計画づくりを支援します。画面表示はインドネシア語です。

## 学習者の進め方

トップページのロードマップから各段階へ進み、自分や家族の状況を整理しながら事業計画を具体化します。各ステップの課題は、完成したものからステップごとにGoogle Classroomで提出してください。提出形式や締め切りは、Google Classroom上の課題の指示に従ってください。

| 学習段階 | 学ぶこと・作成する内容 |
|---|---|
| 0 | 10段階のロードマップを確認 |
| 1 | 個人の金融リテラシーを学び、起業に使える資金を試算 |
| 2 | 家族の事業プロフィールと事業カレンダーを調査 |
| 3 | 関心・スキル・社会課題をもとに事業アイデアを作成 |
| 4 | 事業プロフィール、資本・資産の構成、事業カレンダーを作成 |
| 5 | インドネシアの参考となる起業家・事業を調査し、財務面を分析 |
| 6 | 事業の構造を整理 |
| 7 | SWOT分析で強み・弱み・機会・脅威を検討 |
| 8 | ペイオフ・マトリックスで事業の優先順位を検討 |
| 9 | 日本の参考となる起業家・事業を調査 |
| 10 | ビジネスプランの提出に向けて情報を整理 |

### おすすめの作業順

1. **現状を把握する** — 段階1・2で自分や家族の資金・事業状況を整理します。
2. **事業の方向性を決める** — 段階3でアイデアをまとめ、段階5・9の事例を参考にします。
3. **計画を具体化する** — 段階4で事業の概要や資金計画を作成します。事業カレンダーを作る前に、同段階の資本・資産に関する内容を入力してください。
4. **分析して提出する** — 段階6〜10で事業を分析し、各ステップの課題をGoogle Classroomから個別に提出します。

## 使い方

### 学習者向け

1. ロードマップまたは画面上部のナビゲーションから、取り組むステップを選びます。
2. 画面の案内に沿って入力し、そのステップの課題を完成させます。
3. 必要に応じて **Export PDF**、**Export CSV**、またはカレンダーの **Excel出力** を使ってファイルを作成します。
4. Google Classroomで該当するステップの課題を開き、指示された形式で提出します。複数ステップ分をまとめず、課題ごとに提出してください。

入力内容は同じブラウザー内に作業用データとして保持される場合がありますが、正式な保存ではありません。ブラウザーのサイトデータを消去すると失われることがあります。提出用ファイルは各ステップの作業後に作成し、Google Classroomへ提出してください。

## 利用環境とプライバシー

- JavaScriptに対応した最新のWebブラウザーとインターネット接続が必要です。
- サイトはGitHub Pagesで公開されており、Webサイト自体は一般公開されています。
- このツールはフロントエンドのみで動作し、入力内容を受け取るバックエンドやデータベースはありません。
- 入力内容は利用中のブラウザー内に作業用データとして保存されます。端末間で共有・同期されるものではありません。
- Google Classroomへの提出はこのサイトとは別に行います。提出には学校から案内されたアカウントが必要です。

## 使用技術

| 技術・ライブラリー | 用途 |
|---|---|
| HTML、CSS、JavaScript | Webページと画面上の機能 |
| Chart.js | グラフ表示 |
| html2canvas、jsPDF | PDF出力 |
| SheetJS（XLSX） | カレンダーのExcel出力 |
| Font Awesome、Google Fonts | アイコンとフォント |

外部ライブラリーとフォントの読み込みにはインターネット接続が必要です。