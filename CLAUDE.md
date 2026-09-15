# IIP JAYA MEAT — Company Profile

## Stack
- React 18 + Vite, JavaScript (bukan TypeScript), file .jsx
- Tailwind CSS v4 via @tailwindcss/vite. Tidak ada tailwind.config.js.
- react-router-dom v6+ untuk routing
- Supabase: Auth (email+password), Database (tabel products, settings, orders, order_items), Storage (bucket product-images)
- Supabase client ada di src/lib/supabaseClient.js, baca env VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY

## Struktur
- src/components: komponen reusable (Navbar, Footer, ProductCard, dll)
- src/pages: halaman publik (Home, Tentang, Produk, Kontak, Cart, Checkout)
- src/pages/admin: halaman admin (Login, Dashboard, Orders, Kasir)
- src/lib: supabaseClient.js, productsApi.js, ordersApi.js, settingsApi.js, helper (format rupiah, dll)
- src/hooks: custom hooks (useAuth, useProducts, useSettings, useCart)
- konten/: aset mentah (foto, teks) dari pemilik. Foto yang dipakai dicopy ke public/

## Fitur Pesan Online (toggle)
- Tabel `settings` (satu baris, id=1, kolom `online_ordering_enabled`) menyimpan status nyala/mati fitur.
- Diakses lewat src/hooks/useSettings.jsx (SettingsProvider, dibungkus di App.jsx). Hook `useSettings()` return `{ onlineOrderingEnabled, loading, refetch }`.
- Kalau tabel settings belum ada / gagal fetch, fallback ke `false` (mati) — aman, situs tetap jalan seperti sebelum fitur ini ada.
- Admin toggle di /admin/dashboard (header, switch "Mode Pesan Online") lewat settingsApi.updateSettings().
- Saat NYALA: ProductCard tampilkan tombol "Tambah ke Keranjang" (selain tombol WhatsApp yang tetap ada), Navbar tampilkan ikon keranjang + badge jumlah item.
- Saat MATI: tampilan sama persis seperti sebelum fitur ini dibuat (hanya tombol WhatsApp).
- Keranjang (src/hooks/useCart.jsx, CartProvider) disimpan di localStorage per browser, key `iip-jaya-meat-cart`. Bukan disinkron ke server.
- Alur customer: /produk → tambah ke keranjang → /keranjang (ubah qty, hapus) → /checkout (isi nama/WA/alamat/catatan) → submit bikin baris di tabel `orders` + `order_items` lewat ordersApi.createOrder() → tampil halaman sukses dengan tombol "Konfirmasi via WhatsApp" (pesan otomatis terisi ringkasan order).
- TIDAK ADA pembayaran online. Pesanan cuma tercatat, admin konfirmasi & koordinasi bayar manual (transfer/COD) sama seperti alur WA biasa.
- RLS orders/order_items: publik (anon) boleh INSERT saja (bikin pesanan), tidak bisa SELECT/UPDATE/DELETE punya orang lain. Admin (authenticated) full akses lewat /admin/orders (src/pages/admin/Orders.jsx) — lihat detail item, ubah status (baru/diproses/selesai/dibatalkan) lewat ordersApi.updateOrderStatus().
- Migrasi SQL fitur ini ada di migrasi-online-order.sql (root project, sebelah folder iip-jaya-meat), harus dijalankan manual di Supabase SQL Editor.

## Fitur Kasir (toggle, transaksi offline)
- Untuk transaksi yang terjadi langsung di toko (bukan lewat web), dicatat manual oleh admin/kasir yang login.
- Toggle terpisah dari Mode Pesan Online: kolom `settings.cashier_enabled`, default mati. Toggle "Mode Kasir" di /admin/dashboard.
- Kalau mati: link "Kasir" hilang dari nav admin, dan /admin/kasir kalau diakses langsung nampilin pesan "fitur dimatikan" (bukan blokir akses — cuma UX, bukan batas keamanan, karena tetap di belakang ProtectedRoute/login admin).
- Halaman src/pages/admin/Kasir.jsx: pilih produk dari list (klik buat nambah ke keranjang lokal komponen, bukan cart customer), isi nama pembeli, pilih Cash (lunas) atau DP (sebagian, input jumlah dibayar), upload foto bukti transaksi lewat dropzone custom (bukan input file polos, biar jelas buat orang awam), submit lewat ordersApi.createCashierOrder().
- Beda dari checkout publik: kasir sudah login (authenticated), jadi boleh pakai `.select()` abis insert, ga kena masalah RLS kayak alur checkout publik.
- Order dari kasir: `source = 'kasir'`. Status OTOMATIS `selesai` HANYA kalau bukti transaksi ada; tanpa bukti, masuk sebagai `baru`. Tombol status "Selesai" di Kelola Pesanan dikunci (disabled + tooltip) untuk order kasir yang belum punya `proof_path` -- lihat `needsProofBeforeComplete()` di Orders.jsx. Bukti bisa diupload belakangan langsung dari situ (ordersApi.attachProof()) kalau kelewat pas transaksi awal.
- Kolom baru di `orders`: `source` ('web' | 'kasir', default 'web' biar data lama tetap konsisten), `payment_type` ('cash' | 'dp'), `amount_paid`, `proof_path`.
- Bukti transaksi disimpan di bucket Storage `order-proofs`, PRIVATE (beda dari `product-images` yang public) karena bisa berisi info sensitif (screenshot transfer dll). Cuma bisa dibaca lewat signed URL (ordersApi.getProofUrl(), berlaku 10 menit), cuma authenticated yang bisa generate.
- Kelola Pesanan (/admin/orders) sekarang bisa filter by sumber (Web/Kasir), badge sumber ditampilin di tiap baris, dan expand detail order dari kasir nampilin info pembayaran + tombol lihat/upload bukti.
- Migrasi SQL: migrasi-kasir.sql (root project), harus dijalankan manual di Supabase SQL Editor.

## Aturan
- Semua teks UI Bahasa Indonesia.
- Format harga pakai new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }). Helper di src/lib/format.js.
- Jangan pernah hardcode URL/key Supabase. Selalu dari import.meta.env.
- Semua halaman harus responsive, mobile-first. Cek breakpoint sm/md/lg.
- Route admin (/admin/*) tidak muncul di navbar publik.
- Setiap fetch data harus punya state loading, error, dan kosong (empty).
- Warna brand: merah tua #8B1E1E (primary), krem #F7F1E8 (background), hitam #1A1A1A (teks). Didefinisikan sebagai @theme di index.css (--color-brand, --color-cream, --color-ink).
- Font: Inter untuk body, Playfair Display untuk heading (Google Fonts).
- Gaya visual: bersih, foto besar, banyak whitespace, tombol solid warna brand.
- Jangan install library UI tambahan (MUI, shadcn, dll) tanpa diminta.
