// GANTI semua nilai di bawah ini dengan data asli IIP JAYA MEAT.
export const siteConfig = {
  name: 'IIP JAYA MEAT',
  tagline: 'Daging Segar, Kualitas Terjaga',
  description:
    'IIP JAYA MEAT menyediakan daging sapi, ayam, dan kambing segar pilihan dengan harga bersaing untuk kebutuhan rumah tangga maupun usaha kuliner.',
  address: 'Jl. Contoh Alamat No. 123, Kota Anda',
  operatingHours: 'Setiap hari, 06.00 - 17.00 WIB',
  whatsappNumber: '6281234567890',
  whatsappDefaultMessage: 'Halo IIP JAYA MEAT, saya mau tanya produk.',
  email: 'info@iipjayameat.com',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=Jakarta&output=embed',
  mapsLinkUrl: 'https://maps.google.com',
}

export function buildWhatsappUrl(message) {
  const text = encodeURIComponent(message || siteConfig.whatsappDefaultMessage)
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`
}
