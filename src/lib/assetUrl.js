// Situs ini di-deploy ke GitHub Pages project site (carageenan.github.io/iip-jaya-meat/),
// jadi base URL-nya bukan "/" tapi "/iip-jaya-meat/" (diatur lewat `base` di
// vite.config.js). Referensi asset statis (logo, foto public/) yang ditulis
// manual di JSX (bukan lewat import, jadi gak otomatis di-rewrite Vite) harus
// lewat helper ini, bukan hardcode "/nama-file.jpg".
export function assetUrl(path) {
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}
