export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  modules: ['@nuxt/content', '@pinia/nuxt'],
  imports: {
    dirs: ['stores']
  },
  css: ['~/assets/css/main.css'],
  content: {
    build: {
      csv: { delimiter: ',' }
    }
  },
  experimental: {
    appManifest: false
  }
})