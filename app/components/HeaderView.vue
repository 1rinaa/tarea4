<script setup lang="ts">
import { useFavoritesStore } from '~/stores/favorites'

const route = useRoute()
const favoritesStore = useFavoritesStore()
const isActive = (path: string) => route.path === path
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <NuxtLink to="/universities" class="brand">
        <span class="brand-mark">◆</span>
        <span class="brand-text">
          <span class="brand-name">World University Rankings</span>
          <span class="brand-sub">Dataset Kaggle · 2011–2016</span>
        </span>
      </NuxtLink>

      <nav class="nav">
        <NuxtLink
          to="/universities"
          class="nav-link"
          :class="{ active: isActive('/universities') }"
        >
          Universidades
        </NuxtLink>
        <NuxtLink
          to="/favorites"
          class="nav-link"
          :class="{ active: isActive('/favorites') }"
        >
          Favoritos
          <span v-if="favoritesStore.favorites.length > 0" class="nav-badge">
            {{ favoritesStore.favorites.length }}
          </span>
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.site-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 3px;
  background: linear-gradient(
    90deg,
    #16304f 0%,
    #1e3a5f 20%,
    #2c5282 40%,
    #b8860b 60%,
    #d4a017 75%,
    #b8860b 85%,
    #9b7a10 100%
  );
  border-radius: 2px;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-primary);
  font-weight: 700;
}

.brand-mark {
  font-size: 1.4rem;
  color: var(--color-accent);
  line-height: 1;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-name {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  letter-spacing: -0.01em;
}

.brand-sub {
  font-size: 0.7rem;
  color: var(--color-muted);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-sans);
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  color: var(--color-muted);
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.15s ease;
}

.nav-link:hover {
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.nav-link.active {
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.nav-badge {
  background: var(--color-accent);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .header-inner {
    padding: 12px 20px;
  }
  .brand-sub {
    display: none;
  }
}
</style>