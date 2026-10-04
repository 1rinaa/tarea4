<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUniversitiesStore, type University } from '~/stores/universities'
import { useFavoritesStore } from '~/stores/favorites'

const universitiesStore = useUniversitiesStore()
const favoritesStore = useFavoritesStore()

await useAsyncData('favorites-list', async () => {
  await universitiesStore.fetchUniversities()
  return true
})

const { universities } = storeToRefs(universitiesStore)

const favoriteUniversities = computed<University[]>(() =>
  universities.value.filter((u: University) => favoritesStore.isFavorite(u.id))
)

// ---- Filtros locales ----
const busqueda = ref('')
const ordenarPor = ref<'nombre-asc' | 'rank-asc' | 'score-desc'>('nombre-asc')

const parseRank = (rank: string): number => {
  const match = String(rank).match(/\d+/)
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

const listadoFiltrado = computed<University[]>(() => {
  let list = [...favoriteUniversities.value]

  if (busqueda.value.trim() !== '') {
    const q = busqueda.value.toLowerCase()
    list = list.filter(
      (u: University) =>
        u.university_name.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q)
    )
  }

  switch (ordenarPor.value) {
    case 'nombre-asc':
      list.sort((a, b) => a.university_name.localeCompare(b.university_name, 'es'))
      break
    case 'rank-asc':
      list.sort((a, b) => parseRank(a.world_rank) - parseRank(b.world_rank))
      break
    case 'score-desc':
      list.sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
      break
  }
  return list
})

// ---- Paginación ----
const paginaActual = ref(1)
const porPagina = 24

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(listadoFiltrado.value.length / porPagina))
)

const listadoPaginado = computed<University[]>(() => {
  const inicio = (paginaActual.value - 1) * porPagina
  return listadoFiltrado.value.slice(inicio, inicio + porPagina)
})

watch([busqueda, ordenarPor], () => {
  paginaActual.value = 1
})

watch(totalPaginas, (nuevoTotal) => {
  if (paginaActual.value > nuevoTotal) {
    paginaActual.value = nuevoTotal
  }
})

const irAPagina = (n: number) => {
  if (n < 1 || n > totalPaginas.value) return
  paginaActual.value = n
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const paginasVisibles = computed<(number | '...')[]>(() => {
  const total = totalPaginas.value
  const actual = paginaActual.value
  const delta = 2
  const rango: (number | '...')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) rango.push(i)
    return rango
  }

  rango.push(1)
  if (actual - delta > 2) rango.push('...')

  const inicio = Math.max(2, actual - delta)
  const fin = Math.min(total - 1, actual + delta)
  for (let i = inicio; i <= fin; i++) rango.push(i)

  if (actual + delta < total - 1) rango.push('...')
  rango.push(total)

  return rango
})

// ---- Promedios de los favoritos ----
const promedioFavoritos = computed<number>(() => {
  const valid = favoriteUniversities.value.filter(
    (u: University) => typeof u.total_score === 'number' && u.total_score > 0
  )
  if (valid.length === 0) return 0
  return valid.reduce((s, u) => s + (u.total_score ?? 0), 0) / valid.length
})

const paisesFavoritos = computed<number>(() => {
  const set = new Set(favoriteUniversities.value.map((u: University) => u.country))
  return set.size
})

const aniosFavoritos = computed<number>(() => {
  const set = new Set(favoriteUniversities.value.map((u: University) => u.year))
  return set.size
})

const scoreClass = (score: number | undefined) => {
  if (!score || score === 0) return 'score-none'
  if (score >= 80) return 'score-high'
  if (score >= 50) return 'score-mid'
  return 'score-low'
}
</script>

<template>
  <div>
    <HeaderView />

    <div class="page">
      <div class="layout">
        <!-- SIDEBAR -->
        <aside class="sidebar">
          <div class="sidebar-card">
            <h3>Resumen</h3>

            <div class="stat-row">
              <div>
                <p class="stat-name">Favoritas</p>
                <p class="stat-hint">Total guardadas</p>
              </div>
              <p class="stat-number">{{ favoriteUniversities.length }}</p>
            </div>

            <div class="stat-row">
              <div>
                <p class="stat-name">Países</p>
                <p class="stat-hint">Distintos</p>
              </div>
              <p class="stat-number">{{ paisesFavoritos }}</p>
            </div>

            <div class="stat-row">
              <div>
                <p class="stat-name">Años</p>
                <p class="stat-hint">Cubiertos</p>
              </div>
              <p class="stat-number">{{ aniosFavoritos }}</p>
            </div>

            <div class="stat-divider"></div>

            <div class="stat-row">
              <div>
                <p class="stat-name">Promedio</p>
                <p class="stat-hint">Solo con score válido</p>
              </div>
              <p class="stat-number accent">{{ promedioFavoritos.toFixed(2) }}</p>
            </div>
          </div>

          <div v-if="favoriteUniversities.length > 0" class="sidebar-card">
            <h3>Filtros</h3>

            <div class="filter-group">
              <label class="filter-label">Buscar</label>
              <input
                v-model="busqueda"
                type="text"
                placeholder="Universidad o país..."
                class="text-input"
              />
            </div>

            <div class="filter-group">
              <label class="filter-label">Ordenar por</label>
              <select v-model="ordenarPor" class="select-input">
                <option value="nombre-asc">Nombre (A-Z)</option>
                <option value="rank-asc">Rank (mejor primero)</option>
                <option value="score-desc">Calificación (mayor)</option>
              </select>
            </div>

            <button class="clear-btn-full" @click="favoritesStore.clearFavorites()">
              Vaciar favoritos
            </button>
          </div>
        </aside>

        <!-- CONTENIDO -->
        <main class="content">
          <!-- Wrapper sticky con el hero + contador -->
          <div class="hero-wrapper">
            <section class="hero">
              <p class="eyebrow">Tu selección</p>
              <h1>Universidades favoritas</h1>
              <p class="subtitle">
                {{ favoriteUniversities.length }} de {{ universities.length }} universidades guardadas.
              </p>
            </section>

            <template v-if="favoriteUniversities.length > 0">
              <p class="result-count">
                Mostrando
                <strong>{{ (paginaActual - 1) * porPagina + 1 }}</strong>–<strong>{{ Math.min(paginaActual * porPagina, listadoFiltrado.length) }}</strong>
                de <strong>{{ listadoFiltrado.length }}</strong>
                <span v-if="listadoFiltrado.length !== favoriteUniversities.length">
                  (de {{ favoriteUniversities.length }} favoritas)
                </span>
              </p>
            </template>
          </div>

          <div v-if="favoriteUniversities.length === 0" class="empty">
            <span class="empty-icon">☆</span>
            <h2>Aún no tienes favoritos</h2>
            <p>Explora el listado y marca universidades con la estrella.</p>
            <NuxtLink to="/universities" class="btn-primary">Ver universidades</NuxtLink>
          </div>

          <template v-else>
            <p v-if="listadoFiltrado.length === 0" class="empty">
              No hay favoritos que coincidan con la búsqueda.
            </p>

            <ul v-else class="list">
              <li v-for="uni in listadoPaginado" :key="uni.id" class="item">
                <div class="item-rank">
                  <span class="rank-label">Rank</span>
                  <span class="rank-value">{{ uni.world_rank }}</span>
                </div>

                <div class="item-body">
                <NuxtLink
                :to="`/universities/${uni.id}?from=favorites&sort=${ordenarPor}`"
                class="item-title"
                >
                    {{ uni.university_name }}
                </NuxtLink>
                  <p class="item-meta">
                    <span>{{ uni.country }}</span>
                    <span class="sep">·</span>
                    <span>{{ uni.year }}</span>
                  </p>
                </div>

                <div class="item-right">
                  <span class="score-badge" :class="scoreClass(uni.total_score)">
                    {{ uni.total_score && uni.total_score > 0 ? uni.total_score : 'N/D' }}
                  </span>

                  <button
                    class="fav-btn is-fav"
                    @click="favoritesStore.toggleFavorite(uni.id)"
                    title="Quitar de favoritos"
                  >
                    ★
                  </button>
                </div>
              </li>
            </ul>

            <!-- PAGINADOR -->
            <nav v-if="totalPaginas > 1" class="pagination" aria-label="Paginación">
              <button
                class="page-btn"
                :disabled="paginaActual === 1"
                @click="irAPagina(paginaActual - 1)"
              >
                ← Anterior
              </button>

              <div class="page-numbers">
                <template v-for="(p, i) in paginasVisibles" :key="`${p}-${i}`">
                  <span v-if="p === '...'" class="page-ellipsis">…</span>
                  <button
                    v-else
                    class="page-num"
                    :class="{ active: p === paginaActual }"
                    @click="irAPagina(p as number)"
                  >
                    {{ p }}
                  </button>
                </template>
              </div>

              <button
                class="page-btn"
                :disabled="paginaActual === totalPaginas"
                @click="irAPagina(paginaActual + 1)"
              >
                Siguiente →
              </button>
            </nav>
          </template>
        </main>
      </div>
    </div>

    <FooterView />
  </div>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  color: var(--color-muted);
  margin: 0 0 6px 0;
  font-weight: 600;
}

h1 { margin: 0 0 4px 0; }

.subtitle {
  color: var(--color-muted);
  margin: 0;
  font-size: 0.95rem;
}

/* ---- Layout ---- */
.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

.sidebar {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.sidebar-card h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: var(--color-primary);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-name {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text);
  font-weight: 500;
}

.stat-hint {
  margin: 0;
  font-size: 0.7rem;
  color: var(--color-muted);
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
  line-height: 1;
}

.stat-number.accent { color: var(--color-accent); }

.stat-divider {
  height: 1px;
  background: var(--color-border);
  margin: 14px 0;
}

.filter-group { margin-bottom: 14px; }

.filter-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-muted);
  font-weight: 600;
  margin-bottom: 6px;
}

.text-input,
.select-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 0.9rem;
  color: var(--color-text);
}

.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.08);
}

.select-input { cursor: pointer; }

.clear-btn-full {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #fecaca;
  background: #fff;
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.clear-btn-full:hover {
  background: #fef2f2;
  border-color: var(--color-danger);
}

/* ---- Hero wrapper + hero (mismo patrón que index.vue) ---- */
.hero-wrapper {
  position: sticky;
  top: 68px;
  z-index: 8;
  padding: 12px 0 16px 0;

  background-color: var(--color-bg);
  background-image:
    radial-gradient(
      circle at 12% 0%,
      rgba(30, 58, 95, 0.18) 0%,
      rgba(30, 58, 95, 0.08) 25%,
      transparent 55%
    ),
    radial-gradient(
      circle at 88% 5%,
      rgba(184, 134, 11, 0.15) 0%,
      rgba(184, 134, 11, 0.06) 25%,
      transparent 50%
    ),
    radial-gradient(
      circle at 50% 100%,
      rgba(30, 58, 95, 0.06) 0%,
      transparent 60%
    );
  background-attachment: fixed;

  box-shadow: 0 8px 12px -8px rgba(15, 23, 42, 0.04);
}

.hero {
  position: sticky;
  top: 80px;                    /* antes 68px → 12px de aire bajo el header */
  z-index: 8;
  margin: 0 0 16px 0;
  padding: 20px 24px;
  border-radius: var(--radius);
  background: #ffffff;
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(
    180deg,
    var(--color-primary) 0%,
    var(--color-accent) 100%
  );
}

/* ---- Contenido ---- */
.result-count {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-muted);
  padding: 0 4px;
}

.result-count strong { color: var(--color-text); }

.empty {
  text-align: center;
  padding: 48px 24px;
  color: var(--color-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.empty-icon {
  font-size: 3rem;
  color: var(--color-accent);
  display: block;
  margin-bottom: 8px;
}

.empty h2 { margin: 0 0 8px 0; }
.empty p { margin: 0 0 20px 0; }

.btn-primary {
  display: inline-block;
  padding: 10px 20px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: 0.9rem;
}

.btn-primary:hover { background: var(--color-primary-hover); }

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 14px 18px;
  transition: all 0.15s ease;
}

.item:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.item-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 68px;
  padding-right: 16px;
  border-right: 1px solid var(--color-border);
}

.rank-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  font-weight: 600;
}

.rank-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
}

.item-body { flex: 1; min-width: 0; }

.item-title {
  display: block;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.98rem;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title:hover { color: var(--color-primary); }

.item-meta {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-muted);
}

.sep { margin: 0 4px; }

.item-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.75rem;
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.score-high { background: #dcfce7; color: #166534; }
.score-mid  { background: #fef3c7; color: #92400e; }
.score-low  { background: #fee2e2; color: #991b1b; }
.score-none { background: #f1f5f9; color: #64748b; }

.fav-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: var(--color-border-strong);
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.fav-btn:hover { transform: scale(1.1); }

.fav-btn.is-fav { color: var(--color-accent); }

/* ---- Paginación (misma que index.vue) ---- */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.page-btn {
  padding: 8px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-num {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s ease;
  font-variant-numeric: tabular-nums;
}

.page-num:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-num.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.page-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  color: var(--color-muted);
  font-size: 0.85rem;
}

/* ---- Responsive ---- */
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { position: static; }
}

@media (max-width: 640px) {
  .page { padding: 20px 16px; }
}
</style>