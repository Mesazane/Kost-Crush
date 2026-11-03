# 🍜 Kost Crush: Perang Tanggal Tua

Parodi dari `01-Candy-Crush-Game`. Kamu adalah mahasiswa semester 13 yang harus bertahan hidup
sampai kiriman orang tua datang. Permen diganti makanan bertahan hidup anak kost:
🍜 Mie · 🍤 Gorengan · ☕ Kopi Saset · 🥚 Telur · 🍚 Nasi · 🍡 Cilok.

Cara main: buka `index.html` di browser (tanpa instalasi, tanpa aset eksternal selain Google Fonts).
Semua grafis memakai emoji + CSS, semua musik & SFX disintesis dengan WebAudio.

## Cerita (tema humor)
Prolog → 4 area → 12 level + 1 level rahasia → 4 ending.

| Area | Level | Bos |
|---|---|---|
| 🛏️ Kamar Kost No. 13 | Bangun Siang, Stok Menipis | 🐀 Tikus Got Raksasa |
| 🍛 Warteg Bu Tejo | Ngutang di Warteg, Kondangan Gratis | 👵 Bu Sri, Ibu Kost |
| 🏫 Kampus Tercinta | Absen Titip, Tugas Kelompok Sendirian | 👨‍🏫 Pak Dosen Killer |
| ⚖️ Ruang Sidang | Begadang Bab 5, Antre Tanda Tangan | 🧑‍⚖️ Sidang Skripsi (2 fase) |
| 📦 Gudang Rahasia (tersembunyi) | Cilok misterius | — |

## Cerita yang menyatu dengan gameplay (bukan sekadar latar)
- **Misi = kebutuhan cerita**: "kumpulkan 18 mie & 14 telur", "lunasi 10 nota warteg" (🧾 penghalang).
- **Bos mengubah papan sesuai karakternya**: Tikus menaruh sampah & mencuri makanan, Ibu Kost
  menaruh tagihan, memotong langkah ("uang kost naik!"), dan mematikan listrik; Dosen menaruh 📝 Revisi (HP 2),
  mengadakan kuis dadakan (papan diacak), dan memulihkan HP sambil minum kopi.
- **Makanan bisa bicara** saat di-match ("Rebus aku, Kak!").
- **Pilihan bercabang** di level 2, 5, 8, 10. Pilihan memberi bonus nyata di level berikutnya
  (+langkah / HP bos berkurang / makanan spesial di awal) dan menggeser meter Reputasi & Akademik.
- **Multi-ending**: Wisudawan Tanggal Tua, Selebgram Mie Instan, Juragan Cilok, dan ENDING RAHASIA Juragan Kost.
- **Kejadian acak bertema kost**: mati lampu (papan gelap, pakai senter), kucing tetangga mencuri,
  kiriman datang lebih awal, Joko gajian & traktir, atap bocor, notif grup WA.
- **Grup WA "Kost Mawar"**: para tokoh mengomentari menang, kalah, prestasi, dan skin yang kamu pakai.

## Pemetaan ke catatan Fun Enhancement
| Tipe | Fitur |
|---|---|
| **Achiever** | Visual animasi + partikel, 4 BGM (peta/main/bos/ending) + ~20 SFX, 12+1 level dengan 1–3 bintang, 25 prestasi/badge, gelar, koin, Warung (beli & jual item), 4 item, 5 skin kost, misi harian, bonus streak login 7 hari, level pemain dengan hadiah di level tertentu (affinity) |
| **Explorer** | Cerita berlapis, area peta tertutup kabut, gudang rahasia (klik kucing 🐈 di peta 5x), kode rahasia, 4 ending, kejadian acak, 4 jenis makanan spesial + kombinasinya, meter "Arah Hidupmu" |
| **Killer** | 4 bos dengan HP bar & jurus, FATALITY saat bos kalah, bos final 2 fase (enrage), cheat code, "REVENGE MODE" (tantang ulang), +5 langkah untuk lanjut |
| **Socializer** | Leaderboard melawan NPC yang suka meledek, Grup WA (balas cepat, pamer skor), gelar & skin untuk dipamerkan, callout FIRST BLOOD / DOUBLE KILL / TRIPLE KILL / MANIAC / SAVAGE / GOD MODE dengan suara |
| **Not Fun → Fun** | Bisa geser atau klik (mouse & sentuh), hint otomatis setelah 6 detik, undo 1x per level, papan diacak otomatis kalau buntu, sisa langkah jadi bonus "KIRIMAN CAIR!", tombol lewati dialog |

## Kontrol & makanan spesial
- Geser makanan ke sebelahnya, atau klik dua makanan yang bersebelahan.
- Jejer 4 → 🌶️ Garis Pedas (hapus baris/kolom) · Bentuk L/T → 💥 Bom Kompor (3x3) ·
  Jejer 5 → 🍲 Rice Cooker Ajaib (geser ke makanan apa pun untuk menghapus semua jenis itu).
- Gabungkan dua makanan spesial untuk ledakan super.

## Kode rahasia (spoiler)
<details><summary>Klik untuk lihat</summary>

`SKS` (+10 langkah) · `SULTAN` (+1000 koin) · `HUJANMIE` (mie lebih sering jatuh).
Ketik saat bermain, atau masukkan lewat ⚙️ Atur.
</details>

## Struktur
```
index.html
css/style.css     visual, skin, animasi, responsif
js/data.js        cerita, tokoh, level, bos, pilihan, ending, item, prestasi, misi
js/board.js       engine match-3 (spesial, penghalang, gravitasi, kaskade, undo, hint)
js/audio.js       BGM & SFX WebAudio + teriakan via Speech Synthesis
js/main.js        alur game, peta, dialog, toko, misi harian, grup WA, simpanan (localStorage)
```

## Kredit
Terinspirasi dari [Candy Crush Game](https://github.com/he-is-talha/html-css-javascript-games/tree/main/01-Candy-Crush-Game)
di repositori [html-css-javascript-games](https://github.com/he-is-talha/html-css-javascript-games) karya Talha Bin Yousaf
(lisensi MIT). Kode, cerita, dan aset parodi ini ditulis ulang. Gambar permen dari game aslinya tidak dipakai.
