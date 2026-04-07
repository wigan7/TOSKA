<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1mz-wLY0C33cgKCrL5IFO8UYrQf8ZEj19

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Set the `VITE_APPS_SCRIPT_URL` in [.env.local](.env.local) ke URL deployment Apps Script Anda
4. Run the app:
   `npm run dev`

## Build untuk Production

```bash
npm run build
```

## Deployment

### ⚠️ PENTING: Konfigurasi URL Apps Script

Aplikasi ini menggunakan Google Apps Script sebagai backend. Untuk deployment berhasil, Anda HARUS mengatur URL Apps Script untuk setiap environment:

#### Local Development
- URL sudah dikonfigurasi di `.env.local`

#### Deployment (Vercel, Netlify, atau Server lain)

1. **Dapatkan Deployment ID Apps Script:**
   - Buka `Code.gs` di Google Apps Script
   - Klik "Deploy" > pilih "New deployment" atau gunakan yang ada
   - Copy URL yang berbentuk: `https://script.google.com/macros/s/AKfycbz8BmZIx5RjgRG28OOLi-gi_badBDwPZO1vOglC5IkcGlqx8urRaCdTDDmC-Qx1CkU4/exec`

2. **Set Environment Variable:**
   
   **Untuk Vercel:**
   - Buka Project Settings > Environment Variables
   - Tambah: `VITE_APPS_SCRIPT_URL` = URL Apps Script Anda
   
   **Untuk Netlify:**
   - Buka Site Settings > Build & Deploy > Environment
   - Tambah: `VITE_APPS_SCRIPT_URL` = URL Apps Script Anda
   
   **Untuk Cloudflare Pages:**
   - Buka Project Settings > Environment variables
   - Tambah variable untuk Production:
     - Variable name: `VITE_APPS_SCRIPT_URL`
     - Value: URL Apps Script Anda
   - Build command: `npm run build`
   - Build output directory: `dist`
   
   **Untuk Server Sendiri:**
   - Set environment variable sebelum menjalankan aplikasi:
     ```bash
     export VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbz8BmZIx5RjgRG28OOLi-gi_badBDwPZO1vOglC5IkcGlqx8urRaCdTDDmC-Qx1CkU4/exec"
     npm run build
     ```

3. **CORS Configuration di Google Apps Script:**
   
   Jika masih error saat deploy, pastikan Apps Script menerima request dari domain Anda. Di `Code.gs`, pastikan `doPost()` sudah handle CORS dengan benar (sudah ada di kode saat ini).

### Tips Debug Jika Login Tidak Bekerja:

1. **Buka DevTools** (F12) > Console
2. **Cek Network tab** > lihat request ke Apps Script
3. **Jika error CORS**, pastikan:
   - URL Apps Script benar
   - Apps Script deployment typenya "Web Application"
   - Akses diatur ke "Execute as me" dan "Anyone"
4. **Jika HTTP 404**, URL Apps Script tidak valid - periksa kembali Deployment ID
