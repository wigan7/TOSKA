# 🔧 PANDUAN PERBAIKAN LOGIN DEPLOYMENT

## 📋 Masalah yang Diperbaiki

**Gejala:** Login berfungsi di localhost tapi gagal saat di-deploy  
**Penyebab:** URL Google Apps Script di-hardcode tanpa konfigurasi environment

## ✅ Perubahan yang Dilakukan

### 1. **vite.config.ts** - Definisikan Environment Variables
- Menambah `VITE_APPS_SCRIPT_URL` ke bagian `define`
- URL dilembahkan pada saat build time sehingga dapat disesuaikan per environment

### 2. **js/config.js** - Gunakan Environment Variable  
- **Sebelum:**
  ```javascript
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyGmHTBU7NwTrPldCD4hTj_Dfj-1yrJmVDA-963fYlV_lvv3E1msEBQ4Zv5N6TdJNdj/exec";
  ```

- **Sesudah:**
  ```javascript
  const APPS_SCRIPT_URL = process.env.VITE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbyGmHTBU7NwTrPldCD4hTj_Dfj-1yrJmVDA-963fYlV_lvv3E1msEBQ4Zv5N6TdJNdj/exec";
  ```

### 3. **.env.local** (Local Development)
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyGmHTBU7NwTrPldCD4hTj_Dfj-1yrJmVDA-963fYlV_lvv3E1msEBQ4Zv5N6TdJNdj/exec
```

### 4. **.env.example** (Template untuk Documentation)
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyGmHTBU7NwTrPldCD4hTj_Dfj-1yrJmVDA-963fYlV_lvv3E1msEBQ4Zv5N6TdJNdj/exec
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. **README.md** - Dokumentasi Deployment Lengkap
Menambahkan:
- Instruksi konfigurasi untuk Vercel, Netlify, atau server sendiri
- Langkah-langkah mendapatkan Deployment ID dari Apps Script
- Tips debugging jika masih ada error

## 🚀 Cara Menggunakan untuk Deployment

### Langkah 1: Dapatkan Deployment ID Apps Script

1. Buka project Google Apps Script Anda
2. Di menu atas, klik **"Deploy"**
3. Pilih deployment yang ada (atau buat baru dengan "New deployment")
4. Copy URL yang terlihat seperti:
   ```
  https://script.google.com/macros/s/AKfycbyGmHTBU7NwTrPldCD4hTj_Dfj-1yrJmVDA-963fYlV_lvv3E1msEBQ4Zv5N6TdJNdj/exec
   ```

### Langkah 2: Set Environment Variable di Platform Deployment

#### **Untuk Vercel:**
```bash
vercel env add VITE_APPS_SCRIPT_URL
# Masukkan URL Apps Script Anda
```

#### **Untuk Netlify:**
1. Site Settings → Build & Deploy → Environment
2. Tambah variable:
   - Key: `VITE_APPS_SCRIPT_URL`
  - Value: `https://script.google.com/macros/s/AKfycbyGmHTBU7NwTrPldCD4hTj_Dfj-1yrJmVDA-963fYlV_lvv3E1msEBQ4Zv5N6TdJNdj/exec`

#### **Untuk Cloudflare Pages:**
1. Buka project di Cloudflare Pages Dashboard
2. Masuk ke **Settings** → **Environment variables**
3. Klik **Add variable** untuk Production:
   - Variable name: `VITE_APPS_SCRIPT_URL`
  - Value: `https://script.google.com/macros/s/AKfycbyGmHTBU7NwTrPldCD4hTj_Dfj-1yrJmVDA-963fYlV_lvv3E1msEBQ4Zv5N6TdJNdj/exec`
4. Pastikan build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Klik Save dan re-deploy

**Alternatif: Gunakan `wrangler.toml`**

Jika ingin lebih advanced, buat/edit `wrangler.toml`:
```toml
name = "tos-mukti"
type = "javascript"

[env.production]
vars = { VITE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyGmHTBU7NwTrPldCD4hTj_Dfj-1yrJmVDA-963fYlV_lvv3E1msEBQ4Zv5N6TdJNdj/exec" }

[build]
command = "npm run build"
cwd = "./"
watch_paths = ["src/**/*.js", "index.html"]

[[routes]]
pattern = "example.com/*"
```

Deploy dengan:
```bash
wrangler pages deploy dist
```

#### **Untuk Server Sendiri (Azure, AWS, dsb):**
```bash
# Set environment variable sebelum deploy
export VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbyGmHTBU7NwTrPldCD4hTj_Dfj-1yrJmVDA-963fYlV_lvv3E1msEBQ4Zv5N6TdJNdj/exec"

# Kemudian build
npm run build

# Deploy folder `dist/`
```

### Langkah 3: Rebuild dan Deploy
```bash
npm run build
# Push ke platform deployment Anda
```

## 🔍 Debug Checklist

Jika login masih tidak bekerja setelah deployment:

- [ ] **Verifikasi URL Apps Script**
  - Buka DevTools (F12) → Console
  - Paste: `console.log(process.env.VITE_APPS_SCRIPT_URL)`
  - Pastikan URL yang ditampilkan benar

- [ ] **Cek Network Request**
  - DevTools → Network tab
  - Lakukan login
  - Cari request ke `script.google.com`
  - Status should be 200, bukan 404 atau 403

- [ ] **Error CORS?**
  - Di `Code.gs`, pastikan Google Apps Script deployment settings:
    - Type: "Web Application"
    - Execute as: "Me (user yang login)"
    - Who has access: "Anyone"

- [ ] **Error HTTP 404?**
  - URL Apps Script tidak valid
  - Periksa kembali Deployment ID di Apps Script

## 📝 Catatan Penting

- `.env.local` sudah di-ignore oleh `.gitignore` (aman dari commit)
- `.env.example` adalah template dan BOLEH di-commit
- Setiap environment perlu environment variable sendiri
- Fallback URL masih ada untuk backward compatibility

## 🚀 Quick Start: Cloudflare Pages

### Opsi 1: UI Dashboard (Paling Mudah)
1. Login ke [Cloudflare Pages](https://pages.cloudflare.com/)
2. Klik **Create a project** → pilih GitHub repo Anda
3. Konfigurasikan build:
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: `18` atau lebih baru
4. Sebelum deploy, go to **Settings** → **Environment variables**
5. Tambah variable: `VITE_APPS_SCRIPT_URL` = URL Apps Script Anda
6. Deploy!

### Opsi 2: Menggunakan Wrangler CLI (Advanced)
```bash
# Install wrangler
npm install -g wrangler

# Login ke Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=tos-mukti
```

### Opsi 3: Menggunakan wrangler.toml (Recommended)
1. Edit file `wrangler.toml.example` dan rename menjadi `wrangler.toml`
2. Sesuaikan `VITE_APPS_SCRIPT_URL` dengan URL Apps Script Anda
3. Jalankan:
   ```bash
   wrangler pages deploy dist
   ```

## 🎯 Hasil Akhir

Sekarang Anda bisa:
1. ✅ Menjalankan lokal dengan URL default
2. ✅ Deploy ke production dengan URL berbeda
3. ✅ Mengelola multiple deployments dengan mudah
4. ✅ Debug lebih mudah dengan konfigurasi yang jelas
