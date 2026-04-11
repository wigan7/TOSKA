# 📚 Panduan Sistem Scoring Fleksibel TOSKA

## 🎯 Konsep Utama

Sistem scoring TOSKA kini **fully flexible** - Anda dapat mengatur dan menyesuaikan scoring untuk setiap soal sesuai kebutuhan pedagogis.

**Filosofi:** Backend akan menggunakan **exactly** apa yang Anda konfigurasi di JSON. Tidak ada auto-fix, tidak ada hidden logic.

---

## 📋 Tipe Soal & Konfigurasi

### 1️⃣ **PG (Pilihan Ganda Single)**
Jawab satu pilihan saja, scoring sederhana:

```
Benar        → correctPoints (default: 1)
Salah        → wrongPoints (default: 0)
Tidak dijawab → blankPoints (default: 0)
```

**Tidak ada mode simple/manual** - selalu langsung ke poin.

---

### 2️⃣ **PGK (Pilihan Ganda Kompleks)**
Pilih beberapa opsi yang benar (multiple select)

#### **Mode: Simple** 
Gunakan ketika: Anda hanya ingin kategori "Benar/Sebagian/Salah"

```
Konfigurasi Contoh:
- maxPoints: 1
- simpleAllCorrectPoints: 1
- simplePartialPoints: 0
- simpleAllWrongPoints: 0
- simpleBlankPoints: 0

Hasil Scoring:
- Semua opsi benar dipilih, tidak ada salah → 1 poin
- Ada yang benar, ada yang salah atau tidak lengkap → 0 poin
- Tidak ada yang dipilih → 0 poin
```

#### **Mode: Manual**
Gunakan ketika: Anda ingin sistem poin per opsi

```
Konfigurasi Contoh:
- maxPoints: 3
- basePoints: 0
- pointsPerCorrectSelection: +1
- pointsPerWrongSelection: -0.5

Hasil Scoring:
Soal ada 3 opsi benar:
- Pilih 3 benar, 0 salah → 0 + 1+1+1 = 3 poin
- Pilih 2 benar, 1 salah → 0 + 1+1-0.5 = 1.5 poin
- Pilih 0 benar, 3 salah → 0 - 0.5-0.5-0.5 = -1.5 poin (clamped ke min)
```

---

### 3️⃣ **BS (Benar/Salah Multiple)**
Jawab benar/salah untuk setiap pernyataan

#### **Mode: Simple**
```
Konfigurasi Contoh:
- maxPoints: 2
- simpleAllCorrectPoints: 2
- simplePartialPoints: 1
- simpleAllWrongPoints: 0
- simpleBlankPoints: 0

Hasil Scoring (soal ada 5 pernyataan):
- Semua 5 pernyataan dijawab benar → 2 poin
- 3 benar, 2 salah → 1 poin (partial)
- Tidak ada yang benar → 0 poin
```

#### **Mode: Manual**
```
Konfigurasi Contoh:
- maxPoints: 5
- basePoints: 0
- pointsPerCorrectStatement: +1
- pointsPerWrongStatement: -0.5

Hasil Scoring (soal ada 5 pernyataan):
- Semua benar → 0 + 1+1+1+1+1 = 5 poin
- 3 benar, 2 salah → 0 + 1+1+1-0.5-0.5 = 2 poin
```

---

## 🛠️ Skenario Praktis

### Skenario 1: Ujian Klasik (Benar = Benar-Benar Benar)

Anda ingin siswa hanya dapat poin jika **100% benar**, tidak ada partial credit:

```
PGK:
- Mode: Simple
- maxPoints: 1
- simpleAllCorrectPoints: 1
- simplePartialPoints: 0
- simpleAllWrongPoints: 0

BS:
- Mode: Simple
- maxPoints: 1
- simpleAllCorrectPoints: 1
- simplePartialPoints: 0
- simpleAllWrongPoints: 0
```

**Hasil:** Siswa hanya dapat poin jika jawab SEMPURNA, tidak ada partial credit.

---

### Skenario 2: Ujian Dengan Partial Credit

Anda ingin memberi poin untuk jawaban sebagian benar:

```
PGK:
- Mode: Simple
- maxPoints: 3
- simpleAllCorrectPoints: 3
- simplePartialPoints: 2
- simpleAllWrongPoints: 0

BS:
- Mode: Simple
- maxPoints: 1.5
- simpleAllCorrectPoints: 1.5
- simplePartialPoints: 0.75
- simpleAllWrongPoints: 0
```

**Hasil:** 
- Sempurna → 3 poin
- Sebagian benar → 2 poin
- 0 benar → 0 poin

---

### Skenario 3: Maksimal Fleksibilitas

```
PGK:
- Mode: Manual
- maxPoints: 10
- basePoints: 0
- pointsPerCorrectSelection: +2
- pointsPerWrongSelection: -1

BS:
- Mode: Manual
- maxPoints: 5
- basePoints: 0
- pointsPerCorrectStatement: +1
- pointsPerWrongStatement: -0.25
```

**Hasil:** Sistem poin granular, setiap jawaban benar/salah punya nilai.

---

## 📝 Cara Edit Soal & Ubah Scoring

### Langkah-langkah:

1. **Membuka Soal Lama:**
   - Klik tombol "✏️ Edit Soal"
   - Masukkan Kode Soal
   - Soal akan dimuat

2. **Edit Scoring:**
   - Scroll ke section "Pengaturan Nilai/Scoring Soal"
   - Ubah mode (manual/simple) dan nilai-nilainya
   - **Jangan khawatir maxPoints** - sesuaikan sesuai keinginan

3. **Lihat Validasi:**
   - Jika ada warning warna **orange**, itu adalah hint
   - Warning tidak mencegah Anda menyimpan (Anda tetap bisa menyimpan)
   - Warning hanya memberikan informasi

4. **Simpan Soal:**
   - Klik "UPDATE SOAL INI"
   - Scoring config baru akan tersimpan

---

## ⚠️ Warning & Tips

### Validasi Sistem
Sistem akan menampilkan warning jika:

```
⚠️ PGK: maxPoints (3) lebih kecil dari nilai tertinggi (5).
   Siswa tidak bisa dapat nilai penuh.
```

**Artinya:** Nilai tertinggi yang mungkin adalah 5 poin (max dari simpleAllCorrect, 
simplePartial, dll), tapi Anda set maxPoints = 3. Ini berarti nilai akan di-clamp 
(dibatasi) ke 3.

**Apakah itu masalah?** Tergantung:
- ✅ **OK** jika memang sengaja (Anda ingin cap nilai di 3)
- ⚠️ **Pertimbangkan** jika ini tidak sengaja

---

## 🔧 Troubleshooting

### Q: Soal saya sudah ada scoring lama (maxPoints: 3), ingin ubah ke (1, 0, 0, 0), perlu apa?

**A:** 
1. Buka soal untuk edit
2. **Ubah simpleAllCorrectPoints dari 3 → 1**
3. **Ubah simplePartialPoints dari 2 → 0**
4. (Sisanya sudah 0)
5. **Ubah maxPoints dari 3 → 1** (optional tapi recommended untuk clarity)
6. Klik "UPDATE SOAL INI"

Siswa yang sudah mengerjakan tidak terpengaruh (nilai mereka sudah final).

---

### Q: Sistem ini bisa atur scoring per-soal berbeda?

**A:** ✅ **YA!** Setiap soal punya konfigurasinya sendiri. Anda bisa:
- Soal 1: maxPoints = 1, simpleAllCorrect = 1
- Soal 2: maxPoints = 3, simpleAllCorrect = 3
- Soal 3: maxPoints = 2, dengan manual mode

---

### Q: Bagaimana jika saya ingin scoring sama untuk semua soal?

**A:** Gunakan **Preset** (akan segera tersedia):
- Buat soal baru → Klik tombol "Preset: Binary (1-0-0-0)"
- Semua scoring akan langsung terisi dengan optimal

---

## 📊 Best Practices

1. **Mulai dari Simple Mode** - lebih mudah dipahami siswa
2. **Sesuaikan maxPoints dengan jumlah soal** - agar scoring konsisten
3. **Preview scoring** - sebelum ujian beneran, test dengan dummy soal
4. **Dokumentasikan** - tulis aturan scoring di silabus/petunjuk ujian
5. **Konsistensi** - gunakan preset yang sama untuk ujian yang sejenis

---

## 📞 Bantuan

Confusion tentang scoring? Tanyakan:
- Apa tujuan pedagogis? (apakah ingin partial credit?)
- Berapa poin ideal per soal?
- Apakah semua soal harus sama scoring atau berbeda-beda?

Gunakan informasi ini untuk konfigurasi yang tepat! 🚀
