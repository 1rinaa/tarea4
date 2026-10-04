<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <p class="footer-title">World University Rankings</p>
      <p class="footer-meta">Tarea 4 · Nuxt + Pinia + Nuxt Content · {{ new Date().getFullYear() }}</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 48px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 32px;
  text-align: center;
}

.footer-title {
  font-family: var(--font-serif);
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 4px 0;
  font-size: 0.95rem;
}

.footer-meta {
  font-size: 0.78rem;
  color: var(--color-muted);
  margin: 0;
}
</style>