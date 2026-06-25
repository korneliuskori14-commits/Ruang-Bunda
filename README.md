<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/02f04535-2c71-47f2-ba07-b8c213e13e00

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
---------------------------------------------------------------------------------------------------------------------------------------
Untuk memindahkan kode dari Google AI Studio dan menjalankannya di VS Code, ada dua skenario yang bisa kamu pilih: **Opsi A** jika kamu hanya mengambil potongan kode skrip (misal Python), atau **Opsi B** jika kamu menggunakan *Build Mode* di AI Studio dan ingin mengekspor seluruh proyek aplikasi berbentuk file ZIP.

Sebelum memulai, pastikan kamu sudah mengambil **API Key** terlebih dahulu:

1. Masuk ke [Google AI Studio](https://aistudio.google.com/).
2. Klik tombol **Get API Key** di pojok kiri atas, lalu salin token tersebut dan simpan sementara di notepad.

### Opsi A: Menggunakan Potongan Kode Skrip (Python)

Jika kamu sekadar membuat *prompt* di AI Studio dan ingin mengeksekusinya lewat file skrip tunggal di VS Code, ikuti langkah ini:

1. **Salin Kode:** Di pojok kanan atas Google AI Studio, klik **Get Code**, pilih tab **Python**, lalu klik ikon **Copy**.
2. **Buat File di VS Code:** * Buka VS Code, buat file baru dan beri nama `app.py`.
* Tempel (*paste*) kode yang sudah disalin ke dalam file tersebut.
3. **Install SDK Google GenAI:** Buka terminal di VS Code (`Ctrl + ~` atau `Cmd + ~`), lalu jalankan perintah:
   pip install google-genai

*(Catatan: Jika kode yang kamu salin masih menggunakan versi SDK lama, gunakan perintah `pip install google-generativeai`)*.
4. **Set Up API Key di Terminal:** Supaya kode bisa berjalan tanpa eror autentikasi, masukkan API Key kamu ke dalam *environment variable* terminal:
* **Windows (Command Prompt):**
set GEMINI_API_KEY="ISI_API_KEY_KAMU"

* **Windows (PowerShell):**
$env:GEMINI_API_KEY="ISI_API_KEY_KAMU"

* **Mac / Linux:**
export GEMINI_API_KEY="ISI_API_KEY_KAMU"

5. **Jalankan Kode:** Di terminal VS Code yang sama, jalankan skrip kamu dengan mengetik:

python app.py

### Opsi B: Mengekspor Seluruh Proyek Aplikasi (ZIP)

Jika kamu menggunakan fitur pembuatan aplikasi berbasis teks (*Build Mode*) di AI Studio dan ingin melanjutkannya secara lokal:

1. **Unduh Proyek:** Di pojok kanan atas aplikasi AI Studio milikmu, klik tombol **Download** lalu pilih **Download as ZIP**.
2. **Ekstrak & Buka di VS Code:** Ekstrak file ZIP tersebut ke folder komputer kamu. Buka VS Code, lalu pilih **File** > **Open Folder...** dan arahkan ke folder hasil ekstrak tadi.
3. **Install Dependensi:** Proyek dari AI Studio umumnya berbasis Node.js/Next.js. Buka terminal di VS Code, lalu ketik perintah:
npm install

4. **Masukkan API Key ke File `.env`:** Cari file bernama `.env` atau `.env.local` di dalam struktur folder proyekmu. Jika belum ada, buat file baru dengan nama `.env` lalu masukkan kode berikut:

GEMINI_API_KEY=isi_api_key_kamu_di_sini

5. **Jalankan Aplikasi:** Mulai server lokal dengan mengetik perintah:

npm run dev

Buka *browser* kamu dan akses alamat lokal yang muncul di terminal (biasanya `http://localhost:3000`).

Pilihan mana yang "lebih baik" itu sangat bergantung pada **tujuan akhir** proyek kamu saat ini. Biar gampang memilih, mari kita bedah fungsinya:

### Pilih Opsi A (Potongan Kode / Python) Jika:

* **Hanya ingin tes fungsi:** Kamu cuma pengen tahu bagaimana respon model Gemini terhadap *prompt* tertentu di dalam baris kode.
* **Proyek skrip atau backend:** Kamu sedang membuat bot, skrip otomatisasi, atau mau mengintegrasikan Gemini ke aplikasi yang sudah kamu punya sebelumnya.
* **Lebih suka yang simpel:** Nggak perlu pusing memikirkan UI/tampilan, yang penting kodenya jalan di terminal dan mengeluarkan *output*.

### Pilih Opsi B (Download ZIP / Aplikasi Utuh) Jika:

* **Mau langsung punya aplikasi jadi:** Kamu pengen punya aplikasi web lengkap dengan tombol, kolom *input*, dan tampilan visual yang interaktif tanpa repot *coding* dari nol.
* **Butuh prototype cepat:** Kamu mau bikin demo produk (*Minimum Viable Product*) buat dipresentasikan ke orang lain dengan cepat.
* **Belajar Web Development:** Kamu tertarik memahami bagaimana struktur aplikasi web modern (seperti Next.js atau React) terhubung dengan API AI Studio.

---

> **Kesimpulan Singkat:** Kalau cuma mau eksperimen dengan logika AI-nya saja, **Opsi A** jauh lebih hemat waktu. Tapi kalau kamu butuh visual berupa halaman web yang bisa diklik-klik, **Opsi B** adalah jalan pintas terbaik.
------------------------------------------------------------------------------------------------------------------------------------------

jika mengcopy apikey ke **`.env.example`**. File ini hanya berfungsi sebagai "templat/contoh" dan **tidak akan dibaca** oleh sistem aplikasi saat dijalankan. Kamu harus membuat file konfigurasi yang asli.

Ikuti langkah mudah ini untuk menyempurnakannya:

### Langkah 1: Buat File `.env` yang Asli

1. Di panel kiri (Explorer) VS Code, klik kanan pada area kosong atau klik ikon **New File** (ikon kertas dengan tanda tambah) di samping tulisan *RUANG BUNDA*.
2. Beri nama file baru tersebut: **`.env`** (hanya titik dan kata env, tanpa ada embel-embel `.example`).

### Langkah 2: Salin Isi ke File Baru

1. Blok dan salin (*copy*) semua teks yang ada di dalam `.env.example` milikmu.
2. Tempel (*paste*) teks tersebut ke dalam file **`.env`** yang baru saja kamu buat.
3. Pastikan API Key kamu sudah terisi dengan benar di file `.env` tersebut.
4. Simpan file dengan menekan **`Ctrl + S`** (Windows) atau **`Cmd + S`** (Mac).

### Langkah 3: Amankan File `.env.example` (Opsional tapi Penting untuk Hackathon)

Agar API Key asli kamu tidak tidak sengaja terunggah ke GitHub saat kompetisi:

1. Kembali buka file `.env.example`.
2. Hapus API Key asli kamu di sana, lalu ubah kembali menjadi teks biasa, contohnya: `GEMINI_API_KEY="MASUKKAN_API_KEY_KAMU_DISINI"`.
3. Simpan file `.env.example`.

---

**Selanjutnya:**
Setelah file `.env` yang asli sudah terbuat dan disimpan, kamu bisa langsung menjalankan aplikasinya lewat terminal dengan mengetik perintah berikut (tergantung *framework* yang digunakan di proyek Ruang Bunda ini, biasanya berbasis Vite karena ada file `vite.config.ts`):
npm run dev

atau jika menggunakan skrip start biasa:

npm start
----------------------------------------------------------------------------------------------------------------------------------------
masalah umum yang sering banget muncul saat pertama kali menjalankan `npm` di VS Code baru.
Eror `PSSecurityException` (UnauthorizedAccess) ini terjadi karena sistem keamanan Windows secara *default* memblokir eksekusi skrip luar (termasuk skrip `.ps1` milik `npm`) di terminal PowerShell.

Ada dua cara cepat untuk menyelesaikannya. Kamu bisa pilih salah satu di bawah ini:


### Cara 1: Buka Akses di PowerShell (Paling Direkomendasikan)

Kamu tidak perlu menutup VS Code. Cukup ketik perintah di bawah ini langsung di terminal VS Code kamu yang sedang eror itu, lalu tekan **Enter**:

Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

* **Apa yang dilakukan perintah ini?** Perintah ini mengizinkan akun Windows kamu untuk menjalankan skrip lokal (seperti `npm`) tanpa membuka celah keamanan untuk seluruh sistem komputer.
* Setelah kamu tekan Enter, silakan coba jalankan kembali perintah kamu: npm install


### Cara 2: Ganti Terminal ke Command Prompt (Solusi Alternatif)

Jika Cara 1 masih terkendala, kamu bisa beralih dari PowerShell ke **Command Prompt (cmd)** yang tidak memiliki aturan ketat soal skrip `.ps1`.

1. Perhatikan pojok kanan atas bagian terminal VS Code kamu (di sebelah ikon tong sampah, ada ikon tanda tambah `+` dan tanda panah kecil ke bawah `v`).
2. Klik tanda **panah kecil ke bawah (`v`)** di sebelah ikon `+`.
3. Pilih **Command Prompt**.
4. Terminal baru akan terbuka (tandanya berubah dari `PS D:\...` menjadi `Microsoft Windows...`).
5. Jalankan kembali perintahmu di terminal baru tersebut: npm install
------------------------------------------------------------------------------------------------------------------------------------------
Berikut adalah panduan langkah demi langkah untuk mengaktifkan fitur **VS Code Port Forwarding** agar aplikasi "Ruang Bunda" kamu bisa diuji dari jarak jauh.

---

### Langkah 1: Temukan Tab "Ports"

1. Lihat ke panel bagian bawah VS Code kamu (area yang sama dengan tempat **TERMINAL** berada).
2. Cari tab bernama **PORTS** di baris menu tersebut (biasanya ada di sebelah *PROBLEMS*, *OUTPUT*, atau *TERMINAL*).
3. **Jika tidak ketemu:** Klik ikon **titik tiga (...)** di sebelah tulisan *TERMINAL*, lalu beri centang pada pilihan **Ports** untuk memunculkannya.

### Langkah 2: Daftarkan Port Aplikasi Kamu

1. Setelah tab **PORTS** terbuka, klik tombol **Forward a Port** (atau klik ikon tanda tambah `+`).
2. Ketik angka port aplikasi kamu: **`3000`** (sesuai dengan port localhost kamu yang sedang berjalan).
3. Tekan **Enter**.

### Langkah 3: Login Menggunakan GitHub

1. Jika ini pertama kalinya kamu menggunakan fitur ini, VS Code akan memunculkan notifikasi untuk meminta izin akses.
2. Klik **Allow** atau **Sign In**, lalu ikuti proses *login* menggunakan akun **GitHub** kamu di browser. Setelah selesai, browser akan otomatis mengarahkan kamu kembali ke VS Code.

### Langkah 4: Ubah Status Akses Menjadi Publik

Secara aturan keamanan, VS Code akan mengunci link tersebut agar hanya bisa dibuka oleh pemilik akun (*Private*). Kita harus membukanya agar bisa diakses orang lain:

1. Di dalam tabel port yang baru kamu buat, cari kolom bernama **Port Visibility**. Kamu akan melihat statusnya bertuliskan **Private**.
2. **Klik kanan** pada tulisan *Private* tersebut, lalu pilih **Port Visibility** > **Public**.
3. Jika muncul jendela peringatan, klik saja **Continue** atau **Expose Port**.

### Langkah 5: Salin dan Bagikan Link!

1. Sekarang, perhatikan kolom **Forwarded Address**. Di sana sudah tercipta sebuah link internet resmi yang panjang (berawalan `[https://...github.dev/](https://...github.dev/)`).
2. Arahkan kursor ke link tersebut, lalu klik ikon **salin/copy** (ikon dua kotak bertumpuk) yang muncul.
3. Link sudah tersalin! Sekarang kamu tinggal mengirimkan link tersebut ke teman atau penguji jarak jauh kamu.

---

> ⚠️ **Ingat Aturan Mainnya:**
> Selama orang lain melakukan pengujian, **laptop kamu tidak boleh mati/sleep** dan terminal yang menjalankan perintah `npm run dev` harus tetap dibiarkan menyala. Jika VS Code kamu tutup, jembatan internetnya otomatis terputus.
-----------------------------------------------------------------------------------------------------------------------------------------
Menghapus proyek dari VS Code bisa berarti dua hal: **hanya menutupnya** agar tidak tampil di layar VS Code, atau **menghapus total filenya** dari komputer.

Berikut adalah panduan untuk kedua skenario tersebut agar kamu tidak salah langkah:

### Skenario 1: Hanya Menutup Proyek (Close Folder)

Gunakan cara ini jika kamu hanya ingin membersihkan tampilan VS Code karena ingin pindah mengerjakan proyek lain, tetapi **file proyeknya tetap tersimpan dengan aman** di komputer.

1. Klik menu **File** di pojok kiri atas VS Code.
2. Pilih opsi **Close Folder**.
3. *Cara cepat:* Tekan tombol **`Ctrl + K`**, lalu lepaskan dan tekan tombol **`F`** pada *keyboard*.

> 💡 **Apa yang terjadi?** Layar VS Code kamu akan kembali kosong. Semua proses server lokal (`npm run dev`) dan jembatan *Port Forwarding* internet yang kita buat sebelumnya akan **otomatis mati secara aman**.

---

### Skenario 2: Menghapus Total Proyek dari Laptop (Permanen)

Gunakan cara ini jika kompetisi sudah selesai dan kamu benar-benar ingin **melenyapkan semua file** proyek "Ruang Bunda" dari penyimpanan laptop untuk menghemat memori.

1. **Wajib:** Lakukan **Skenario 1** terlebih dahulu (Close Folder) di VS Code. Jika VS Code masih membuka proyek tersebut, file akan terkunci dan tidak bisa dihapus.
2. Buka **File Explorer** Windows kamu (`Windows + E`).
3. Berdasarkan data dari terminal kamu sebelumnya, proyek kamu disimpan di folder **`D:\`**. Jadi, silakan buka **Drive D:** kamu.
4. Cari folder bernama contoh: **`ruang bunda`**.
5. Klik kanan pada folder tersebut, lalu pilih ikon **Delete** (tempat sampah).
6. *Tips bersih total:* Jika ingin folder langsung terhapus permanen tanpa memenuhi *Recycle Bin* laptop, klik folder contoh:`ruang bunda` tersebut lalu tekan tombol **`Shift + Delete`** secara bersamaan di *keyboard*.

