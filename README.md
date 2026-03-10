 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index d218dc96386533e0f62b0a63c61934d3ce388faa..4d848c3f22e236396b6c1dc654adc9f93faf11c1 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,100 @@
-# LMS-pembelajaran-islam
\ No newline at end of file
+# LMS Pembelajaran Islami (Web + Firebase)
+
+Aplikasi LMS sederhana berbasis web untuk pembelajaran Islami dengan kategori:
+
+- Bahasa Arab
+- Fikih
+- Ushul Fikih
+
+Fitur utama:
+
+- Login/daftar menggunakan **username + password**.
+- Self paced learning dengan video YouTube embed.
+- Progress belajar per materi.
+- Bisa berjalan dalam 2 mode:
+  - **Demo mode (tanpa Firebase)** untuk melihat visualisasi langsung.
+  - **Firebase mode** untuk autentikasi + database real.
+
+## Cara melihat visualisasi secara langsung (tanpa Python)
+
+Pilih salah satu cara berikut untuk menjalankan server lokal:
+
+1. **Pakai VS Code Live Server (paling mudah)**
+   - Install extension **Live Server** di VS Code.
+   - Klik kanan `index.html` > **Open with Live Server**.
+
+2. **Pakai Node.js (tanpa Python)**
+
+```bash
+npx serve .
+```
+
+Lalu buka URL yang muncul di terminal (biasanya `http://localhost:3000`).
+
+Setelah terbuka:
+- Karena default config belum diisi, aplikasi otomatis masuk **Demo mode**.
+- Isi username/password bebas, klik **Daftar**.
+- Dashboard LMS langsung tampil.
+- Progress selesai materi disimpan di browser (localStorage).
+
+
+## Struktur file yang benar
+
+**Jangan digabung ke `index.html`.** Tetap pisahkan file seperti ini di root project:
+
+- `index.html` → struktur halaman HTML
+- `styles.css` → semua styling/tampilan
+- `app.js` → logika aplikasi (auth, course, Firebase/demo mode)
+- `vercel.json` → konfigurasi deploy Vercel
+
+`index.html` sudah memanggil file terpisah ini:
+- `<link rel="stylesheet" href="styles.css" />`
+- `<script type="module" src="app.js"></script>`
+
+## Setup Firebase (opsional, untuk mode produksi)
+
+1. Buat project Firebase di https://console.firebase.google.com
+2. Aktifkan **Authentication > Sign-in method > Email/Password**.
+3. Aktifkan **Cloud Firestore**.
+4. Buat Web App, lalu salin konfigurasi Firebase.
+5. Buka file `app.js`, lalu isi nilai berikut:
+
+```js
+const firebaseConfig = {
+  apiKey: 'YOUR_FIREBASE_API_KEY',
+  authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
+  projectId: 'YOUR_FIREBASE_PROJECT_ID',
+  storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
+  messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
+  appId: 'YOUR_FIREBASE_APP_ID',
+};
+```
+
+Setelah diisi, aplikasi otomatis menggunakan **Firebase mode**.
+
+## Deploy ke Vercel (fix 404 NOT_FOUND)
+
+Project ini adalah static web app (tanpa framework build). File `vercel.json` sudah ditambahkan agar semua route diarahkan ke `index.html`.
+
+1. Pastikan deploy dari root repo yang berisi `index.html`.
+2. Di Vercel:
+   - **Framework Preset**: `Other`
+   - **Build Command**: kosongkan
+   - **Output Directory**: kosongkan
+3. Redeploy.
+
+Jika sebelumnya muncul `404: NOT_FOUND`, biasanya penyebabnya:
+- Root directory deploy salah (bukan folder yang berisi `index.html`).
+- Konfigurasi project Vercel masih menyangka ini framework tertentu.
+- Belum ada aturan rewrite untuk route aplikasi.
+
+## Struktur data Firestore (Firebase mode)
+
+- `courses/{courseId}`: data materi
+- `users/{uid}`: profil user
+- `users/{uid}/progress/{courseId}`: status penyelesaian materi user
+
+## Catatan
+
+- Pada Firebase mode, username diubah ke email virtual format: `<username>@lms-islam.local` untuk kebutuhan Firebase Auth.
+- Ubah link YouTube di `defaultCourses` (file `app.js`) sesuai kurikulum yang diinginkan.
 
EOF
)
