// GANTI semua nilai di bawah ini dengan data asli IIP JAYA MEAT.
export const siteConfig = {
  name: 'IIP JAYA MEAT',
  tagline: 'Daging Segar, Kualitas Terjaga',
  description:
    'IIP JAYA MEAT menyediakan daging sapi, ayam, dan kambing segar pilihan dengan harga bersaing untuk kebutuhan rumah tangga maupun usaha kuliner.',
  address: 'Vila Echa, Jl. Cihideung Ilir No.1, RT.02/RW.03, Cihideung Ilir, Kec. Ciampea, Kabupaten Bogor, Jawa Barat 16620',
  operatingHours: 'Setiap hari, 08.00 - 18.00 WIB',
  whatsappNumber: '6285319893705',
  whatsappDefaultMessage: 'Halo IIP JAYA MEAT, saya mau tanya produk.',
  email: 'info@iipjayameat.com',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=-6.570109,106.7248267&z=17&output=embed',
  mapsLinkUrl: 'https://maps.app.goo.gl/G1vNrhgv5Qk1pyJK7',
}

export function buildWhatsappUrl(message) {
  const text = encodeURIComponent(message || siteConfig.whatsappDefaultMessage)
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`
}
