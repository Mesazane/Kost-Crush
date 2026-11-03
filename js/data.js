// =====================================================================
//  KOST CRUSH: Perang Tanggal Tua — data cerita, level, item, achievement
//  Parodi dari 01-Candy-Crush-Game
// =====================================================================

// ---------- Makanan (pengganti permen) ----------
// Setiap makanan punya "kepribadian" & celetukan saat di-match.
const TILES = [
  { name: "Mie Instan", emoji: "🍜", color: "#ff7043",
    lines: ["Rebus aku, Kak!", "Kuah atau goreng? Dua-duanya!", "Aku pahlawan tanggal tua!", "Jangan lupa telurnya..."] },
  { name: "Gorengan", emoji: "🍤", color: "#ffb300",
    lines: ["Kriuk! Minyaknya bekas 3 hari.", "Lima ribu dapat tiga!", "Aku gorengan, bukan gebetan."] },
  { name: "Kopi Saset", emoji: "☕", color: "#8d6e63",
    lines: ["Begadang lagi kita!", "Saset terakhir, hargai aku!", "Mata melek, hati ngantuk."] },
  { name: "Telur", emoji: "🥚", color: "#fff176",
    lines: ["Protein termurah se-kost!", "Ceplok atau dadar?", "Jangan dibanting, aku rapuh."] },
  { name: "Nasi", emoji: "🍚", color: "#90caf9",
    lines: ["Belum makan kalau belum nasi!", "Nasi + mie = karbo combo!", "Aku nasi kemarin, tapi masih layak."] },
  { name: "Cilok", emoji: "🍡", color: "#f48fb1",
    lines: ["Kenyal-kenyal tapi setia!", "Saus kacang atau sambal?", "Seribu dapet lima, mantap!"] },
];

// ---------- Penghalang (blocker) ----------
const BLOCKS = {
  bill:   { name: "Tagihan",      emoji: "🧾", hp: 1 },
  revisi: { name: "Revisi",       emoji: "📝", hp: 2 },
  trash:  { name: "Sampah Tikus", emoji: "🗑️", hp: 1 },
  ember:  { name: "Ember Bocor",  emoji: "🪣", hp: 1 },
};

const SPECIAL_INFO = {
  h: "Garis Pedas 🌶️ (hapus 1 baris)",
  v: "Garis Pedas 🌶️ (hapus 1 kolom)",
  bomb: "Bom Kompor 💥 (ledakan 3x3)",
  color: "Rice Cooker Ajaib 🍲 (hapus 1 jenis)",
};

// ---------- Tokoh ----------
const CHARS = {
  narator: { name: "Narator",                emoji: "📜", color: "#8d6e63" },
  budi:    { name: "{NAME}",                 emoji: "🧑‍🎓", color: "#1e88e5" },
  joko:    { name: "Joko (Tetangga Kost)",   emoji: "🧔", color: "#43a047" },
  ibukost: { name: "Bu Sri (Ibu Kost)",      emoji: "👵", color: "#e53935" },
  tikus:   { name: "Tikus Got Raksasa",      emoji: "🐀", color: "#6d4c41" },
  butejo:  { name: "Bu Tejo (Warteg)",       emoji: "👩‍🍳", color: "#fb8c00" },
  siti:    { name: "Siti (Si Ambis)",        emoji: "👩‍💻", color: "#00897b" },
  dosen:   { name: "Pak Dr. Revisi, M.Kom.", emoji: "👨‍🏫", color: "#5e35b1" },
  penguji: { name: "Dewan Penguji",          emoji: "🧑‍⚖️", color: "#37474f" },
  mama:    { name: "Mama (via telpon)",      emoji: "📱", color: "#d81b60" },
  kucing:  { name: "Kucing Tetangga",        emoji: "🐈", color: "#ffa000" },
  satpam:  { name: "Pak Satpam",             emoji: "💂", color: "#546e7a" },
};

// ---------- Area peta ----------
const AREAS = [
  { name: "Kamar Kost No. 13", emoji: "🛏️", desc: "Tempat tidur, belajar, makan, dan meratapi hidup." },
  { name: "Warteg Bu Tejo",    emoji: "🍛", desc: "Surga utang mahasiswa. Nota menumpuk setinggi harapan." },
  { name: "Kampus Tercinta",   emoji: "🏫", desc: "Tempat absen dititip & mimpi dikubur revisi." },
  { name: "Ruang Sidang",      emoji: "⚖️", desc: "Pintu terakhir menuju toga... atau semester 14." },
];

// ---------- Level ----------
// goals: score (target skor), collect {tipe: jumlah}, blockers (hancurkan semua), boss
const LEVELS = [
  { id: 1, area: 0, name: "Bangun Siang", moves: 20, colors: 5,
    goals: { score: 1500 }, stars: [1500, 2600, 3800], intro: "l1i", outro: "l1o" },
  { id: 2, area: 0, name: "Stok Menipis", moves: 22, colors: 5,
    goals: { collect: { 0: 18, 3: 14 } }, stars: [1800, 3000, 4200], intro: "l2i", outro: "l2o", choice: "c1" },
  { id: 3, area: 0, name: "BOSS: Tikus Got Raksasa", moves: 24, colors: 5, music: "boss",
    goals: {}, stars: [2000, 3400, 4800], intro: "l3i", outro: "l3o",
    boss: { key: "tikus", hp: 70, every: 3,
      fatal: "Tikus Got dipulangkan ke got asalnya. Pakai sandal.",
      hurt: ["CIIIT!", "Aduh ekorku!", "Itu curang, manusia!"],
      actions: [
        { do: "spawn", block: "trash", n: 3, say: "CIIIT! Kuacak-acak stokmu!" },
        { do: "spawn", block: "trash", n: 2, say: "Sampah ini... hadiah dariku!" },
        { do: "steal", n: 4, say: "Nyam! Mie-mu kumakan!" },
      ] } },

  { id: 4, area: 1, name: "Ngutang di Warteg", moves: 22, colors: 5,
    goals: { blockers: true }, start: { bill: 10 }, stars: [1800, 3000, 4200], intro: "l4i", outro: "l4o" },
  { id: 5, area: 1, name: "Kondangan Gratis", moves: 20, colors: 6,
    goals: { score: 3000, collect: { 5: 20 } }, stars: [3000, 4500, 6000], intro: "l5i", outro: "l5o", choice: "c2" },
  { id: 6, area: 1, name: "BOSS: Bu Sri, Ibu Kost", moves: 26, colors: 5, music: "boss",
    goals: {}, start: { bill: 4 }, stars: [2800, 4400, 6000], intro: "l6i", outro: "l6o",
    boss: { key: "ibukost", hp: 120, every: 3,
      fatal: "Bu Sri pingsan melihat kamu bayar kost tepat waktu. (Pakai uang Joko.)",
      hurt: ["Astaghfirullah!", "Anak zaman sekarang!", "Saya laporkan ke RT!"],
      actions: [
        { do: "spawn", block: "bill", n: 3, say: "JURUS: TAGIHAN BERTUBI-TUBI!" },
        { do: "moves", n: 2, say: "Uang kost NAIK! Langkahmu kupotong 2!" },
        { do: "dark", n: 3, say: "Token listrik habis! Rasakan GELAP!" },
      ] } },

  { id: 7, area: 2, name: "Absen Titip", moves: 20, colors: 5,
    goals: { collect: { 2: 25 } }, start: { bill: 4 }, stars: [2200, 3600, 5000], intro: "l7i", outro: "l7o" },
  { id: 8, area: 2, name: "Tugas Kelompok Sendirian", moves: 24, colors: 5,
    goals: { blockers: true }, start: { revisi: 8 }, stars: [2600, 4000, 5600], intro: "l8i", outro: "l8o", choice: "c3" },
  { id: 9, area: 2, name: "BOSS: Pak Dosen Killer", moves: 28, colors: 5, music: "boss",
    goals: {}, start: { revisi: 3 }, stars: [3200, 5000, 7000], intro: "l9i", outro: "l9o",
    boss: { key: "dosen", hp: 160, every: 3,
      fatal: "Pak Dosen menandatangani lembar ACC... lalu pensiun dini.",
      hurt: ["Hmm, lumayan.", "Sitasi kamu salah!", "Siapa yang ngajarin kamu?!"],
      actions: [
        { do: "spawn", block: "revisi", n: 3, say: "REVISI! REVISI! REVISI!" },
        { do: "shuffle", say: "KUIS DADAKAN! Semua materi diacak!" },
        { do: "dark", n: 2, say: "Matikan lampu, kita nonton slide 300 halaman." },
        { do: "heal", n: 15, say: "*nyeruput kopi dosen* ...HP pulih." },
      ] } },

  { id: 10, area: 3, name: "Begadang Bab 5", moves: 24, colors: 6,
    goals: { score: 4500, collect: { 2: 30 } }, stars: [4500, 6500, 8500], intro: "l10i", outro: "l10o", choice: "c4" },
  { id: 11, area: 3, name: "Antre Tanda Tangan", moves: 26, colors: 5,
    goals: { blockers: true }, start: { bill: 6, revisi: 6 }, stars: [3000, 4800, 6600], intro: "l11i", outro: "l11o" },
  { id: 12, area: 3, name: "FINAL BOSS: Sidang Skripsi", moves: 32, colors: 5, music: "boss",
    goals: {}, start: { revisi: 4 }, stars: [4000, 6500, 9000], intro: "l12i", outro: "l12o",
    boss: { key: "penguji", hp: 230, every: 3, enrage: true,
      fatal: "Dewan Penguji kehabisan pertanyaan. Untuk pertama kalinya dalam sejarah kampus.",
      hurt: ["Menarik...", "Jawaban Anda ngawur, tapi PD.", "Saya terkesan. Sedikit."],
      actions: [
        { do: "spawn", block: "revisi", n: 3, say: "Pertanyaan: kenapa font-nya Comic Sans?!" },
        { do: "spawn", block: "bill", n: 3, say: "Sudah bayar UKT semester ini?" },
        { do: "moves", n: 2, say: "Waktu presentasi Anda saya kurangi." },
        { do: "shuffle", say: "Coba jelaskan ulang dari BAB 1!" },
        { do: "dark", n: 2, say: "Proyektornya mati. Silakan lanjut." },
        { do: "heal", n: 20, say: "Penguji ketiga datang terlambat. HP pulih!" },
      ] } },
];

// Level rahasia (ditemukan lewat eksplorasi peta)
const SECRET_LEVEL = {
  id: 13, area: -1, name: "Gudang Rahasia Kost", moves: 20, colors: 4,
  goals: { collect: { 5: 35 }, score: 5000 }, stars: [5000, 7500, 10000], intro: "l13i", outro: "l13o",
};

// ---------- Dialog ----------
// Format: [tokoh, teks]
const DIALOG = {
  prologue: [
    ["narator", "Tanggal 20. Sepuluh hari lagi menuju kiriman. Saldo e-wallet: Rp 4.700."],
    ["budi", "Empat ribu tujuh ratus... cukup buat beli harga diri? Nggak. Cukup buat bayar parkir doang."],
    ["narator", "Di bawah kasur, tersisa harta karun terakhir: MIE, GORENGAN, KOPI SASET, TELUR, NASI, dan CILOK."],
    ["budi", "Satu-satunya cara bertahan: menjejerkan mereka tiga-tiga, biar dimasak sekaligus. Hemat gas."],
    ["joko", "Bro... lu ngomong sama mie?"],
    ["budi", "Diam, Jok. Ini strategi."],
    ["narator", "Maka dimulailah perjuangan {NAME}, mahasiswa semester 13, melawan tanggal tua, Ibu Kost, Dosen Killer... dan SIDANG SKRIPSI."],
  ],
  l1i: [
    ["budi", "Bangun jam 11. Kuliah jam 7. Ya sudah, sekalian aja nggak usah."],
    ["narator", "TUTORIAL: Geser (atau klik 2x) makanan yang bersebelahan untuk menjejerkan 3 yang sama."],
    ["narator", "Jejer 4 = 🌶️ Garis Pedas. Bentuk L/T = 💥 Bom Kompor. Jejer 5 = 🍲 Rice Cooker Ajaib. Geser Rice Cooker ke makanan apa pun!"],
  ],
  l1o: [
    ["joko", "Wih, masak apaan? Baunya sampe kamar gue."],
    ["budi", "Resep rahasia: Mie Instan Merek Bebas, pakai air galon isi ulang."],
  ],
  l2i: [
    ["budi", "Stok makin tipis. Harus nimbun mie & telur. Ekonomi mahasiswa: beli 1 telur, makan 3 hari."],
  ],
  l2o: [
    ["joko", "Bro... minta mie satu dong. Gue belum makan dari kemarin."],
    ["narator", "(Bohong. Tadi siang dia makan seblak level 5.)"],
  ],
  l3i: [
    ["narator", "Tengah malam. Suara kresek-kresek dari bawah kasur..."],
    ["tikus", "CIIIT! Stok mie ini milikku sekarang, wahai manusia semester tua!"],
    ["budi", "Itu tabungan hidupku! Kembalikan!"],
    ["tikus", "Kalahkan aku dulu! Setiap beberapa langkah, aku akan mengacak-acak dapurmu!"],
  ],
  l3o: [
    ["tikus", "Ciiit... aku akan kembali... lewat got..."],
    ["budi", "Pergi sana. Dan bawa temanmu si kecoa terbang."],
    ["narator", "Stok aman. Tapi perut tetap lapar. Saatnya ke... WARTEG."],
  ],
  l4i: [
    ["butejo", "Mas {NAME}, utangnya udah 10 lembar nota loh. Lunasi atau cuci piring!"],
    ["budi", "Bu, cuci piringnya pakai strategi match-3 boleh?"],
    ["butejo", "Terserah! Yang penting notanya ilang semua!"],
    ["narator", "Hancurkan 🧾 Tagihan dengan membuat match di sebelahnya."],
  ],
  l4o: [
    ["butejo", "Lho, kok bisa lunas? Ya udah, ini bonus: kerupuk... yang kemarin."],
    ["budi", "Melempem, Bu."],
    ["butejo", "Melempem itu tekstur premium, Mas."],
  ],
  l5i: [
    ["joko", "Bro! Ada kondangan di gang sebelah. Prasmanan GRATIS."],
    ["budi", "Kita kenal pengantinnya?"],
    ["joko", "Nggak. Tapi pengantinnya pasti kenal sama CILOK."],
  ],
  l5o: [
    ["narator", "Kalian makan 4 piring, lalu ditanya: 'Dari pihak mana, Mas?'"],
    ["joko", "Dari pihak yang lapar, Pak."],
    ["narator", "Sepulang kondangan... terdengar langkah kaki berat menuju kamar no. 13. Bu Sri membawa BUKU TAGIHAN."],
  ],
  l6i: [
    ["ibukost", "TANGGAL 25! Uang kost bulan ini, Mas {NAME}!"],
    ["budi", "Bu, bulan ini saya bayar pakai... doa dan semangat."],
    ["ibukost", "Semangat nggak bisa buat bayar listrik! Rasakan JURUS-JURUS IBU KOST!"],
  ],
  l6o: [
    ["ibukost", "Hhh... baiklah. Kamu boleh nunggak sampai kiriman datang. Tapi... skripsimu udah sampai mana?"],
    ["budi", "...Bab 1, Bu."],
    ["ibukost", "BAB 1?! KAMU SEMESTER 13!"],
    ["narator", "Dan perjalanan pun berlanjut ke tempat paling mengerikan di muka bumi: KAMPUS."],
  ],
  l7i: [
    ["siti", "{NAME}! Kamu udah absen 13 kali. Batasnya 3."],
    ["budi", "Siti, kamu kan baik hati, rajin menabung, dan ambis. Absenin aku dong."],
    ["siti", "Kumpulin 25 kopi buat tim begadang, baru aku pertimbangkan."],
  ],
  l7o: [
    ["siti", "Oke. Tapi ini terakhir kalinya! ...Kamu ngomong gitu juga semester lalu."],
    ["budi", "Dan semester sebelumnya. Konsistensi itu penting, Sit."],
  ],
  l8i: [
    ["narator", "Tugas kelompok. 5 anggota. Yang kerja: kamu. Yang lain: 'nanti aku bantu doa ya'."],
    ["narator", "📝 Revisi butuh 2 kali hantaman untuk hancur."],
  ],
  l8o: [
    ["budi", "SELESAI! Nama anggota lain tetap kutulis... dengan font ukuran 2."],
    ["narator", "Besok kamu harus menghadap dosen pembimbing paling legendaris: Pak Dr. Revisi."],
  ],
  l9i: [
    ["dosen", "Selamat siang. Skripsi kamu sudah saya baca semalam."],
    ["budi", "Wah, terima kasih, Pak!"],
    ["dosen", "Sambil tidur. REVISI! Semua! Termasuk nama kamu di cover!"],
  ],
  l9o: [
    ["dosen", "...Baiklah. ACC. Silakan daftar sidang."],
    ["budi", "(menangis) Pak... Bapak bilang ACC?"],
    ["dosen", "Jangan lebay. Pergi sebelum saya berubah pikiran."],
  ],
  l10i: [
    ["narator", "H-3 sidang. Bab 5 belum ditulis. Kopi sekarang adalah darahmu."],
    ["mama", "Nak, kapan wisuda? Tetangga nanya terus. Anak Bu RT udah S2 loh."],
    ["budi", "Ma... anak Bu RT kan pinter dari lahir."],
  ],
  l10o: [
    ["budi", "BAB 5 SELESAI! Kesimpulan: 'Penelitian ini perlu dilanjutkan oleh orang lain.'"],
    ["narator", "Malam sebelum mengurus berkas sidang..."],
  ],
  l11i: [
    ["narator", "Untuk daftar sidang butuh 12 tanda tangan dari 12 orang di 12 gedung berbeda."],
    ["satpam", "Mas, berkasnya kurang tanda tangan saya."],
    ["budi", "Kenapa harus tanda tangan Bapak??"],
    ["satpam", "Prosedur, Mas. Saya juga nggak ngerti."],
  ],
  l11o: [
    ["budi", "Tanda tangan ke-12 didapat. Dari Pak Satpam. Masih nggak tahu kenapa."],
    ["narator", "Besok pagi. Ruang Sidang. Tidak ada jalan kembali."],
  ],
  l12i: [
    ["penguji", "Saudara {NAME}. Silakan presentasi. Waktu Anda... secukupnya."],
    ["budi", "Baik, Pak. Assalamualaikum, selamat pagi, salam sejahtera, om swastiastu, namo buddhaya..."],
    ["penguji", "LANGSUNG KE INTI! Pertanyaan pertama: kenapa skripsi ini ada?"],
    ["budi", "...Karena syarat lulus, Pak?"],
    ["penguji", "JAWABAN JUJUR, TAPI SALAH! Rasakan PERTANYAAN BERUNTUN!"],
  ],
  l12o: [
    ["penguji", "...Setelah musyawarah panjang... Saudara {NAME} dinyatakan..."],
    ["narator", "(drum roll ala acara TV)"],
    ["penguji", "...LULUS. Dengan revisi minor. Sangat minor. Cuma 47 halaman."],
  ],
  l13i: [
    ["kucing", "Meong. (Kucing itu menuntunmu ke gudang kost yang terkunci sejak 1998.)"],
    ["budi", "Ada kotak tua... isinya cilok yang... MASIH ANGET?!"],
    ["kucing", "Meong meong. (Kumpulkan ciloknya kalau mau tahu rahasianya.)"],
  ],
  l13o: [
    ["narator", "Di dasar kotak ada secarik kertas: KODE RAHASIA — 'SKS', 'SULTAN', 'HUJANMIE'. (Ketik saat bermain, atau masukkan di ⚙️ Pengaturan.)"],
    ["narator", "Dan sebuah map berisi... SERTIFIKAT TANAH KOST INI, atas nama kakekmu."],
    ["budi", "Tunggu... jadi AKU pemilik kost ini?!"],
    ["ibukost", "(dari kejauhan) MAS {NAME}! UANG KOST!"],
    ["budi", "...Nanti dulu, Bu. Kita perlu bicara."],
  ],
};

// ---------- Pilihan (memengaruhi ending & bonus level berikutnya) ----------
const CHOICES = {
  c1: { who: "joko", q: "Joko minta mie. Gimana?", next: 3, options: [
    { text: "Kasih deh, kasihan 🤝", rep: 1, aka: 0,
      reply: [["joko", "Lu emang sahabat sejati! Gue bantu lawan tikus nanti. (Tikus mulai dengan HP -15%)"]],
      bonus: { bossHp: -0.15 } },
    { text: "Pura-pura tidur 😴", rep: -1, aka: 0,
      reply: [["joko", "...Gue denger lu ngorok palsu, bro."], ["narator", "Stok aman. (+3 langkah di level berikutnya)"]],
      bonus: { moves: 3 } },
  ] },
  c2: { who: "ibukost", q: "Bu Sri datang menagih. Apa yang kamu lakukan?", next: 6, options: [
    { text: "Hadapi dengan gagah ⚔️", rep: 1, aka: 1,
      reply: [["budi", "Saya siap, Bu! (Bu Sri mulai dengan HP -15%)"]], bonus: { bossHp: -0.15 } },
    { text: "Kabur lewat jendela 🏃", rep: -1, aka: 0,
      reply: [["narator", "Kamu tersangkut di jendela. Tapi dapat pemanasan. (+4 langkah)"]], bonus: { moves: 4 } },
  ] },
  c3: { who: "budi", q: "Malam sebelum bimbingan dengan Pak Revisi...", next: 9, options: [
    { text: "Begadang baca jurnal 📚", rep: 0, aka: 2,
      reply: [["budi", "Aku jadi paham metodologi! (Mulai dengan 3 makanan spesial)"]], bonus: { specials: 3 } },
    { text: "Maraton drakor 📺", rep: 1, aka: -1,
      reply: [["budi", "Oppa... kenapa kau tinggalkan dia... (Otak fresh: +4 langkah)"]], bonus: { moves: 4 } },
  ] },
  c4: { who: "budi", q: "Malam terakhir sebelum sidang...", next: 12, options: [
    { text: "Telpon Mama minta doa 🙏", rep: 0, aka: 2,
      reply: [["mama", "Mama doain, Nak. Jangan lupa makan sayur. (Penguji mulai dengan HP -15%)"]], bonus: { bossHp: -0.15 } },
    { text: "Bikin konten TikTok 'POV: besok sidang' 📸", rep: 2, aka: -1,
      reply: [["narator", "Videomu FYP! Dapat endorse 150 koin & +3 langkah."]], bonus: { moves: 3 }, coins: 150 },
  ] },
};

// ---------- Ending ----------
const ENDINGS = {
  juragan: { emoji: "🏘️", name: "ENDING RAHASIA: Juragan Kost",
    text: "Kamu lulus DAN ternyata pemilik sah kost ini. Bu Sri sekarang bayar uang kost ke kamu. Joko tetap nunggak. Beberapa hal memang tidak berubah." },
  wisuda: { emoji: "🎓", name: "ENDING: Wisudawan Tanggal Tua",
    text: "IPK 2,76. Toga pinjaman, sepatu pinjaman, senyum asli. Mama menangis bahagia. Bu RT menangis iri." },
  seleb: { emoji: "📸", name: "ENDING: Selebgram Mie Instan",
    text: "Video 'Masak mie sambil sidang' ditonton 12 juta kali. Kamu di-endorse merek mie. Skripsimu? Dijadikan konten 'Day 1 of revisi'." },
  cilok: { emoji: "🍡", name: "ENDING: Juragan Cilok Nusantara",
    text: "Lulus pas-pasan, kamu buka gerobak cilok. Tiga tahun kemudian: 120 cabang. Pak Dosen Revisi jadi pelanggan tetap. Masih minta revisi saus." },
};

// ---------- Kejadian acak ----------
const EVENTS = [
  { key: "dark",    emoji: "💡", title: "MATI LAMPU!",         desc: "Token listrik habis. Papan gelap 3 langkah. Arahkan kursor buat nyenter!" },
  { key: "cat",     emoji: "🐈", title: "KUCING TETANGGA!",    desc: "Kucing mencuri 4 makananmu. Meong." },
  { key: "money",   emoji: "💸", title: "KIRIMAN DATANG!",     desc: "Mama transfer lebih awal! +3 langkah & +25 koin." },
  { key: "treat",   emoji: "🎉", title: "JOKO GAJIAN!",        desc: "Joko traktir! 2 makanan berubah jadi spesial." },
  { key: "leak",    emoji: "🌧️", title: "ATAP BOCOR!",         desc: "Hujan deras. Ember bocor muncul di papan." },
  { key: "wa",      emoji: "📱", title: "NOTIF GRUP WA!",       desc: "Ada yang nge-tag kamu di grup kost..." },
];

// ---------- Toko Warung Bu Tejo ----------
const ITEMS = {
  sandal:     { name: "Sandal Jepit",       emoji: "🩴", price: 80,  desc: "Pukul 1 petak sampai hancur (termasuk penghalang).", target: true },
  goyang:     { name: "Goyang Meja",        emoji: "🌀", price: 60,  desc: "Acak ulang seluruh papan." },
  esteh:      { name: "Es Teh Jumbo",       emoji: "🧋", price: 100, desc: "+3 langkah. Gula tinggi, semangat tinggi." },
  ricecooker: { name: "Rice Cooker Ajaib",  emoji: "🍲", price: 200, desc: "Ubah 1 makanan jadi Rice Cooker Ajaib.", target: true },
};

const SKINS = {
  standar: { name: "Kost Standar", emoji: "🏠", price: 0,    desc: "Dinding krem, kipas angin bunyi." },
  horor:   { name: "Kost Horor",   emoji: "👻", price: 300,  desc: "Kamar bekas... ah sudahlah." },
  wibu:    { name: "Kost Wibu",    emoji: "🌸", price: 400,  desc: "Poster anime di setiap sudut. Desu." },
  elit:    { name: "Kost Elit",    emoji: "🏙️", price: 800,  desc: "AC, WiFi kencang, kamar mandi dalam." },
  sultan:  { name: "Kost Sultan",  emoji: "👑", price: 2000, desc: "Lantai emas. Uang kost: satu ginjal." },
};

// ---------- Achievement ----------
const ACH = [
  { id: "first",    emoji: "🩸", name: "First Blood",              desc: "Lakukan match pertamamu.",                 reward: 20,  cond: s => s.stats.matches >= 1 },
  { id: "combo5",   emoji: "🔥", name: "SAVAGE!",                  desc: "Combo 5x dalam satu langkah.",             reward: 100, cond: s => s.stats.maxCombo >= 5, title: "Si Paling Combo" },
  { id: "bomb10",   emoji: "💥", name: "Ahli Ledakan Dapur",       desc: "Buat 10 Bom Kompor.",                      reward: 80,  cond: s => s.stats.bombs >= 10 },
  { id: "line20",   emoji: "🌶️", name: "Lidah Baja",               desc: "Buat 20 Garis Pedas.",                     reward: 80,  cond: s => s.stats.lines >= 20 },
  { id: "color1",   emoji: "🍲", name: "Rice Cooker Ajaib",        desc: "Buat Rice Cooker Ajaib (jejer 5).",        reward: 50,  cond: s => s.stats.colors >= 1 },
  { id: "mie200",   emoji: "🍜", name: "Lambung Mie",              desc: "Hancurkan 200 Mie Instan.",                reward: 100, cond: s => s.stats.tile0 >= 200, title: "Duta Mie Instan" },
  { id: "cilok200", emoji: "🍡", name: "Pecinta Cilok",            desc: "Hancurkan 200 Cilok.",                     reward: 100, cond: s => s.stats.tile5 >= 200 },
  { id: "boss3",    emoji: "🐀", name: "Pembasmi Hama",            desc: "Kalahkan Tikus Got Raksasa.",              reward: 60,  cond: s => !!s.levels[3] },
  { id: "boss6",    emoji: "👵", name: "Bebas Tagihan (Sementara)",desc: "Kalahkan Bu Sri, Ibu Kost.",               reward: 80,  cond: s => !!s.levels[6] },
  { id: "boss9",    emoji: "👨‍🏫", name: "ACC!!!",                   desc: "Kalahkan Pak Dosen Killer.",               reward: 100, cond: s => !!s.levels[9], title: "Mahasiswa ACC" },
  { id: "boss12",   emoji: "🎓", name: "S.Kom (Sarjana Komedi)",   desc: "Taklukkan Sidang Skripsi.",                reward: 200, cond: s => !!s.levels[12], title: "Sarjana Tanggal Tua" },
  { id: "star3",    emoji: "⭐", name: "Perfeksionis",             desc: "Dapat 3 bintang di satu level.",           reward: 50,  cond: s => Object.values(s.levels).some(l => l.stars >= 3) },
  { id: "allstar",  emoji: "🌟", name: "Cumlaude Beneran",         desc: "3 bintang di semua level 1-12.",           reward: 500, cond: s => LEVELS.every(l => (s.levels[l.id]?.stars || 0) >= 3), title: "Cumlaude Sejati" },
  { id: "rich",     emoji: "💰", name: "Anak Sultan",              desc: "Punya 1000 koin sekaligus.",               reward: 0,   cond: s => s.coins >= 1000, title: "Anak Sultan" },
  { id: "shop5",    emoji: "🛒", name: "Pelanggan Setia Bu Tejo",  desc: "Beli 5 barang di warung.",                 reward: 60,  cond: s => s.stats.bought >= 5 },
  { id: "cheat",    emoji: "🕹️", name: "Mahasiswa Kreatif",        desc: "Pakai kode rahasia.",                      reward: 0,   cond: s => s.stats.cheats >= 1, title: "Hacker Kost" },
  { id: "secret",   emoji: "📦", name: "Penjelajah Gudang",        desc: "Temukan gudang rahasia kost.",             reward: 100, cond: s => s.secretFound },
  { id: "streak3",  emoji: "📅", name: "Rajin Absen",              desc: "Login 3 hari berturut-turut.",             reward: 60,  cond: s => s.streak.count >= 3 },
  { id: "streak7",  emoji: "🗓️", name: "Absen Full Seminggu",      desc: "Login 7 hari berturut-turut.",             reward: 200, cond: s => s.streak.count >= 7, title: "Mahasiswa Teladan(?)" },
  { id: "lose5",    emoji: "😭", name: "Pejuang Remedial",         desc: "Kalah 5 kali. Pantang menyerah!",          reward: 50,  cond: s => s.stats.losses >= 5, title: "Pejuang Remedial" },
  { id: "ending1",  emoji: "🎬", name: "Tamat!",                   desc: "Lihat satu ending.",                       reward: 100, cond: s => s.endings.length >= 1 },
  { id: "ending4",  emoji: "🏆", name: "Multiverse Mahasiswa",     desc: "Lihat semua 4 ending.",                    reward: 500, cond: s => s.endings.length >= 4, title: "Penjelajah Multiverse" },
  { id: "chat10",   emoji: "💬", name: "Anak Grup",                desc: "Kirim 10 pesan di Grup WA.",               reward: 40,  cond: s => s.stats.chats >= 10 },
  { id: "endless",  emoji: "♾️", name: "Nggak Ada Habisnya",       desc: "Skor 6000 di Mode Bebas.",                 reward: 100, cond: s => s.best.endless >= 6000 },
  { id: "deadline", emoji: "⏰", name: "Deadliner Sejati",         desc: "Skor 4000 di Mode Deadline.",              reward: 100, cond: s => s.best.deadline >= 4000 },
];

// ---------- Hadiah level pemain (affinity) ----------
const PLVL_REWARDS = {
  2:  { coins: 100, text: "+100 koin" },
  3:  { skin: "horor", text: "Skin Kost Horor 👻" },
  4:  { item: "ricecooker", n: 1, text: "1 Rice Cooker Ajaib 🍲" },
  5:  { title: "Senior Kost", text: "Gelar 'Senior Kost'" },
  6:  { skin: "wibu", text: "Skin Kost Wibu 🌸" },
  8:  { skin: "elit", text: "Skin Kost Elit 🏙️" },
  10: { skin: "sultan", title: "Sesepuh Kost", text: "Skin Kost Sultan 👑 + gelar 'Sesepuh Kost'" },
};

// ---------- Misi harian ----------
const QUEST_POOL = [
  { id: "tiles",   text: "Hancurkan 150 makanan",           key: "tiles",    target: 150 },
  { id: "mie",     text: "Hancurkan 40 Mie 🍜",             key: "tile0",    target: 40 },
  { id: "cilok",   text: "Hancurkan 40 Cilok 🍡",           key: "tile5",    target: 40 },
  { id: "kopi",    text: "Hancurkan 40 Kopi ☕",            key: "tile2",    target: 40 },
  { id: "special", text: "Buat 6 makanan spesial",          key: "specials", target: 6 },
  { id: "win",     text: "Menangkan 2 level / mode",        key: "wins",     target: 2 },
  { id: "combo",   text: "Dapat combo 4x sebanyak 2 kali",  key: "combo4",   target: 2 },
  { id: "item",    text: "Pakai 1 item dari warung",        key: "items",    target: 1 },
  { id: "score",   text: "Kumpulkan 10.000 skor total",     key: "score",    target: 10000 },
  { id: "chat",    text: "Kirim 2 pesan di Grup WA",        key: "chats",    target: 2 },
  { id: "blk",     text: "Hancurkan 10 penghalang",         key: "blockers", target: 10 },
];

// ---------- Leaderboard NPC ----------
const NPC_BOARD = [
  { name: "Siti Ambis",          emoji: "👩‍💻", title: "IPK 4.00",           score: 72000, roast: "Aku main sambil nyusun jurnal internasional." },
  { name: "Rizky Anak Sultan",   emoji: "🤑", title: "Pay to Win",          score: 51000, roast: "Gue beli semua item. Skill? Nggak perlu." },
  { name: "Pak Satpam",          emoji: "💂", title: "Penjaga Malam",       score: 26000, roast: "Saya main tiap jaga malam. Prosedur." },
  { name: "Joko",                emoji: "🧔", title: "Raja Nunggak",        score: 14500, roast: "Skor gue rendah karena hp gue pinjem." },
  { name: "Kucing Tetangga",     emoji: "🐈", title: "Pencuri Profesional", score: 9999,  roast: "Meong. (Skor ini hasil curian.)" },
  { name: "Tikus Got",           emoji: "🐀", title: "Mantan Boss",         score: 3200,  roast: "CIIT! Aku main pakai ekor!" },
];

// ---------- Grup WA ----------
const CHAT_REPLIES = {
  "wkwk 🤣":          [["joko", "ngapain ketawa sendiri bro"], ["siti", "Ada yang lucu? Skripsimu?"], ["kucing", "meong 🤣"]],
  "Pamer skor 😎":    [["joko", "anjay suhu 🙇"], ["siti", "Lumayan. Masih di bawahku sih."], ["satpam", "Mantap, Mas. Sesuai prosedur."]],
  "Minta mie dong 🍜":[["joko", "lah biasanya gue yang minta"], ["butejo", "Ngutang dulu di warteg, Mas"], ["ibukost", "Bayar kost dulu baru minta mie!"]],
  "Kapan wisuda? 🎓": [["siti", "Pertanyaan terlarang di grup ini ❌"], ["joko", "BRO JANGAN GITU 😭"], ["mama", "Iya Nak, kapan? 🙂"]],
  "Traktir yuk 🍗":   [["joko", "GAS! lu yang bayar kan?"], ["siti", "Aku diet. Tapi gratis? Ikut."], ["kucing", "meong (aku juga)"]],
};
