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

インドネシアへの帰国後に起業を目指す、日本で働く実習生向けのビジネスプラン作成アプリです。全10段階の学習を通して、事業アイデアの検討から計画の作成・申請まで進めます。アプリの画面表示言語はインドネシア語です。

## 学習者の進め方

トップページのロードマップから各段階へ進みます。まず自分や家族の資金・事業状況を整理し、その情報をもとに事業アイデアと計画を具体化します。各ページの入力内容は自動保存されるため、途中で中断しても同じブラウザーから再開できます。

| 学習段階 | ページ | 学ぶこと・作成する内容 |
|---|---|---|
| 0 | `index.html` | 10段階のロードマップを確認 |
| 1 | `step1.html` | 個人の金融リテラシーを学び、起業に使える資金を試算 |
| 2 | `step2-1.html`、`step2-2.html` | 家族の事業プロフィールと事業カレンダーを調査 |
| 3 | `step3.html` | 関心・スキル・社会課題をもとに事業アイデアを作成 |
| 4 | `step4-1.html`、`step4-2.html`、`step4-3.html` | 事業プロフィール、資本・資産の構成、事業カレンダーを作成 |
| 5 | `step5.html`、`step5-1.html`、`step5-2.html` | インドネシアの参考となる起業家・事業を調査し、財務面を分析 |
| 6 | `step6.html` | 事業の構造を整理 |
| 7 | `step7.html` | SWOT分析で強み・弱み・機会・脅威を検討 |
| 8 | `step8.html` | ペイオフ・マトリックスで事業の優先順位を検討 |
| 9 | `step9.html` | 日本の参考となる起業家・事業を調査 |
| 10 | `step10.html` | ビジネスプラン証明書の申請情報を入力 |

### おすすめの作業順

1. **現状を把握する** — 段階1で自分の資金計画を考え、段階2で家族の事業・資産・年間計画を調べます。
2. **事業の方向性を決める** — 段階3でアイデアをまとめ、段階5・9の国内外の事例を参考にします。
3. **計画を具体化する** — 段階4-1で事業概要を作り、段階4-2で資本・資産を入力してから段階4-3の事業カレンダーを作成します。段階4-3は段階4-2の開始日、資金、生活費、資産情報を利用するため、4-2を先に入力してください。
4. **分析して仕上げる** — 段階6〜8で事業構造や戦略を検討し、段階10で申請情報を入力します。

各ページはナビゲーションから個別に開けますが、前段階の情報を活用できるよう、上記の順で進めることをおすすめします。

## 使い方

### 学習者向け

- トップページを開き、ロードマップまたは画面上部の番号ナビゲーションから入力したい段階を選びます。
- フォームに入力します。入力内容はブラウザーに自動保存され、ページを再度開くと復元されます。
- 作業内容をファイルに保存する場合は **Export CSV** を選びます。別のブラウザーや端末で続ける場合は、そのページを開いて **Import CSV** から保存済みCSVを読み込みます。
- 現在のページをPDFにする場合は **Export PDF** を選びます。段階2-2または4-3の事業カレンダーはExcel（`.xlsx`）にも出力できます。
- 現在のページの保存データを消す場合は **Hapus Data** を選びます。共通の「Nama Lengkap（氏名）」は削除されません。削除後の復元はできないため、必要なデータは先にCSVへ保存してください。

### 開発者・ローカル実行

ビルドは不要です。ただし、共通ヘッダーとフッターを `fetch` で読み込むため、HTMLファイルを直接開くのではなくローカルサーバー経由で実行してください。

```bash
python -m http.server 8000
```

ブラウザーで `http://localhost:8000/` を開きます。Pythonが利用できる環境であれば、Windows、macOS、Linuxのいずれでも実行できます。

## 利用者に必要な環境

- JavaScriptと`localStorage`に対応した最新のWebブラウザー（Chrome、Edge、Firefox、Safariなど）。
- 初回表示時に共通部品や外部ライブラリーを読み込むためのインターネット接続。
- 開発・ローカル実行時は、Pythonの簡易HTTPサーバーなど、静的ファイルを配信できるローカルサーバー。
- アカウント登録やバックエンドサーバーは不要です。入力データは利用中のブラウザー内に保存され、サービス運営者や他の利用者との間で同期されません。

## 使用技術

| 技術・ライブラリー | 用途 |
|---|---|
| HTML、CSS、JavaScript | 各段階のページ、画面デザイン、入力・画面動作 |
| `localStorage` | ブラウザー内への入力内容の保存 |
| Fetch API | 共通ヘッダー・フッターの読み込み |
| Chart.js | グラフ表示 |
| html2canvas、jsPDF | ページのPDF出力 |
| SheetJS（XLSX） | 事業カレンダーのExcel出力 |
| Font Awesome、Google Fonts | アイコンとフォント |

外部ライブラリーとフォントはCDNから読み込まれます。利用者のデータを保存するアプリケーションサーバーやデータベースはありません。

## フォルダー構成

```text
index.html、step*.html   各段階のページ
components/              共通ヘッダーとフッター
css/                     共通スタイルと段階別スタイル
js/                      共通処理と段階別スクリプト
```

## アプリケーションの構成とデータの流れ

### ページと共通処理

各段階は独立したHTMLファイルです。ページごとに共通CSSと段階別CSSを読み込み、共通ヘッダー・フッター用の領域を用意してから、`js/header-route.js`と段階別JavaScriptを読み込みます。段階4-1は段階2-1と同じフォームを使うため、`js/step2-1.js`と`css/step2-1.css`を共有します。

`js/header-route.js`は、共通ヘッダーとフッターの読み込み、ページタイトルと段階番号の設定、現在位置の表示、CSV/PDF出力、CSV読み込み、ページデータの削除を担当します。「Nama Lengkap」は`global-nama-lengkap`を使って各段階で共有されます。段階を追加する場合は、`STEP_TITLES`、`components/header.html`、`index.html`にもページ情報を追加してください。

### 保存データ

データベースやサーバーは使わず、入力内容はブラウザーの`localStorage`に保存されます。自動保存対象の入力欄には`data-save="true"`と一意な`id`を設定します。ページによって保存キーは異なり、主に次の形式を使用しています。

| キーの形式 | 主な利用箇所 |
|---|---|
| `<ページ>-<入力欄ID>`（例：`step3-...`） | 多くの段階 |
| `<ページ>-<名前>-rows` | 段階6・7・9の可変行テーブル |
| `<入力欄ID>`、`financeGroup:<グループ>` | 段階1 |
| `sim-start-date`、`fund-source-amount`、`sim-expected-salary`、`invest-items` | 段階4-2 |
| `step4-3-fixed-...`、`step4-3-dynamic-...` | 段階4-3 |

段階4-3は段階4-2で保存した開始日、初期資金、生活費、資産一覧を使ってカレンダーを作成します。段階6の「Analisis」テーブルは他のテーブルから生成され、`struktur:rows-changed`イベントで更新されます。

### CSV・PDF・Excel

- **CSV**：ページ内のIDまたは`name`を持つ入力欄を`ID,Label,Nilai`形式で保存します。読み込み時は一致するIDの入力欄に値を戻し、再計算用のイベントを発火します。
- **PDF**：`.main-container`をhtml2canvasで画像化し、jsPDFでPDFにします。
- **Excel**：`js/calendar-excel.js`で事業カレンダーのテーブルを`.xlsx`に変換します。対象は段階2-2と4-3です。

### データ削除

**Hapus Data**は、氏名を除き、現在のページで使用している保存データを削除します。通常のページキー規則に当てはまらない保存データは、`js/header-route.js`の`CUSTOM_CLEAR_KEYS`に登録されています。独自の保存キーを使うページを追加する場合は、削除対象にも登録してください。

## 利用上の注意

- 入力内容は現在の端末・ブラウザーにのみ保存されます。GitHubでコードを共有しても、学習者の入力データは共有されません。
- 端末間でデータを移す場合は、各ページからCSVをエクスポートし、移行先で同じページのCSVインポートを行ってください。
- ブラウザーのデータ削除や別ブラウザーへの切り替えで入力内容が失われる可能性があります。大切なデータは定期的にCSVへ保存してください。
- 外部ライブラリー、アイコン、フォントの読み込みにはインターネット接続が必要です。