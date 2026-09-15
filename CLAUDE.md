# IIP JAYA MEAT — Company Profile

## Stack
- React 18 + Vite, JavaScript (bukan TypeScript), file .jsx
- Tailwind CSS v4 via @tailwindcss/vite. Tidak ada tailwind.config.js.
- react-router-dom v6+ untuk routing
- Supabase: Auth (email+password), Database (tabel products), Storage (bucket product-images)
- Supabase client ada di src/lib/supabaseClient.js, baca env VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY

## Struktur
- src/components: komponen reusable (Navbar, Footer, ProductCard, dll)
- src/pages: halaman publik (Home, Tentang, Produk, Kontak)
- src/pages/admin: halaman admin (Login, Dashboard)
- src/lib: supabaseClient.js, helper (format rupiah, dll)
- src/hooks: custom hooks (useAuth, useProducts)
- konten/: aset mentah (foto, teks) dari pemilik. Foto yang dipakai dicopy ke public/

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
