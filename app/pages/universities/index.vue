<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUniversitiesStore, type University } from '~/stores/universities'
import { useFavoritesStore } from '~/stores/favorites'

const universitiesStore = useUniversitiesStore()
const favoritesStore = useFavoritesStore()

await useAsyncData('universities-list', () => universitiesStore.fetchUniversities())

const { universities, averageTotalScore, averageTotalScoreValid, loading, error } =
  storeToRefs(universitiesStore)

// ---- Filtros ----
const busqueda = ref('')
const soloFavoritos = ref(false)
const soloConScore = ref(false)
const filtroAnio = ref<'todos' | number>('todos')
const filtroPais = ref('todos')
const ordenarPor = ref<
  'anio-desc' | 'rank-asc' | 'nombre-asc' | 'score-desc' | 'pais-asc'
>('anio-desc')

// ---- Helpers ----
const parseRank = (rank: string): number => {
  const match = String(rank).match(/\d+/)
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

const aniosDisponibles = computed<number[]>(() => {
  const set = new Set(universities.value.map((u: University) => u.year))
  return Array.from(set).sort((a, b) => b - a)
})

const paisesDisponibles = computed<string[]>(() => {
  const set = new Set(universities.value.map((u: University) => u.country))
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
})

const listadoFiltrado = computed<University[]>(() => {
  let list: University[] = universities.value

  if (soloFavoritos.value) {
    list = list.filter((u: University) => favoritesStore.isFavorite(u.id))
  }
  if (soloConScore.value) {
    list = list.filter((u: University) => (u.total_score ?? 0) > 0)
  }
  if (filtroAnio.value !== 'todos') {
    list = list.filter((u: University) => u.year === filtroAnio.value)
  }
  if (filtroPais.value !== 'todos') {
    list = list.filter((u: University) => u.country === filtroPais.value)
  }
  if (busqueda.value.trim() !== '') {
    const q = busqueda.value.toLowerCase()
    list = list.filter(
      (u: University) =>
        u.university_name.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q)
    )
  }

  const sorted = [...list]
  switch (ordenarPor.value) {
    case 'anio-desc':
      sorted.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year
        return parseRank(a.world_rank) - parseRank(b.world_rank)
      })
      break
    case 'rank-asc':
      sorted.sort((a, b) => parseRank(a.world_rank) - parseRank(b.world_rank))
      break
    case 'nombre-asc':
      sorted.sort((a, b) => a.university_name.localeCompare(b.university_name, 'es'))
      break
    case 'score-desc':
      sorted.sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
      break
    case 'pais-asc':
      sorted.sort((a, b) => a.country.localeCompare(b.country, 'es'))
      break
  }
  return sorted
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

// Reset a página 1 cuando cambia cualquier filtro
watch(
  [busqueda, soloFavoritos, soloConScore, filtroAnio, filtroPais, ordenarPor],
  () => {
    paginaActual.value = 1
  }
)

// Si la página actual queda fuera de rango (ej. tras filtrar), retrocede
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

// Genera los números visibles: 1 ... 4 5 [6] 7 8 ... 20
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

const promedioFiltrado = computed<number>(() => {
  const valid = listadoFiltrado.value.filter(
    (u: University) => typeof u.total_score === 'number' && u.total_score > 0
  )
  if (valid.length === 0) return 0
  const total = valid.reduce((sum, u) => sum + (u.total_score ?? 0), 0)
  return total / valid.length
})

const limpiarFiltros = () => {
  busqueda.value = ''
  soloFavoritos.value = false
  soloConScore.value = false
  filtroAnio.value = 'todos'
  filtroPais.value = 'todos'
  ordenarPor.value = 'anio-desc'
}

const hayFiltrosActivos = computed(
  () =>
    busqueda.value.trim() !== '' ||
    soloFavoritos.value ||
    soloConScore.value ||
    filtroAnio.value !== 'todos' ||
    filtroPais.value !== 'todos' ||
    ordenarPor.value !== 'anio-desc'
)

// ---- Helpers visuales ----
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
        <!-- SIDEBAR DE FILTROS -->
        <aside class="sidebar">
          <div class="sidebar-card">
            <header class="sidebar-header">
              <h3>Filtros</h3>
              <button
                v-if="hayFiltrosActivos"
                class="clear-btn"
                @click="limpiarFiltros"
              >
                Limpiar
              </button>
            </header>

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
              <label class="filter-label">Año</label>
              <select v-model="filtroAnio" class="select-input">
                <option value="todos">Todos</option>
                <option v-for="anio in aniosDisponibles" :key="anio" :value="anio">
                  {{ anio }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">País</label>
              <select v-model="filtroPais" class="select-input">
                <option value="todos">Todos</option>
                <option v-for="pais in paisesDisponibles" :key="pais" :value="pais">
                  {{ pais }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Ordenar por</label>
              <select v-model="ordenarPor" class="select-input">
                <option value="anio-desc">Año + Rank</option>
                <option value="rank-asc">Rank (mejor primero)</option>
                <option value="score-desc">Calificación (mayor)</option>
                <option value="nombre-asc">Nombre (A-Z)</option>
                <option value="pais-asc">País (A-Z)</option>
              </select>
            </div>

            <div class="filter-divider"></div>

            <label class="checkbox-row">
              <input v-model="soloFavoritos" type="checkbox" />
              <span>Solo favoritos</span>
            </label>
            <label class="checkbox-row">
              <input v-model="soloConScore" type="checkbox" />
              <span>Ocultar sin score</span>
            </label>
          </div>

          <!-- Promedios -->
          <div class="sidebar-card stats">
            <h3>Promedios</h3>

            <div class="stat-row">
              <div>
                <p class="stat-name">Promedio global</p>
                <p class="stat-hint">Todos los valores</p>
              </div>
              <p class="stat-number">{{ averageTotalScore.toFixed(2) }}</p>
            </div>

            <div class="stat-row">
              <div>
                <p class="stat-name">Solo con score válido</p>
                <p class="stat-hint">Excluye datos faltantes</p>
              </div>
              <p class="stat-number">{{ averageTotalScoreValid.toFixed(2) }}</p>
            </div>

            <div class="stat-divider"></div>

            <div class="stat-row">
              <div>
                <p class="stat-name">Del listado actual</p>
                <p class="stat-hint">{{ listadoFiltrado.length }} resultados</p>
              </div>
              <p class="stat-number accent">{{ promedioFiltrado.toFixed(2) }}</p>
            </div>
          </div>
        </aside>

        <!-- LISTADO -->
        <main class="content">

        <!-- Wrapper sticky con fondo del body -->
        <div class="hero-wrapper">
            <section class="hero">
            <p class="eyebrow">Dataset · Kaggle</p>
            <h1>World University Rankings</h1>
            <p class="subtitle">
                {{ universities.length }} universidades de todo el mundo, con datos de 2011 a 2016.
            </p>
            </section>

            <p class="result-count">
                Mostrando
                <strong>{{ (paginaActual - 1) * porPagina + 1 }}</strong>–<strong>{{ Math.min(paginaActual * porPagina, listadoFiltrado.length) }}</strong>
                de <strong>{{ listadoFiltrado.length }}</strong>
                <span v-if="listadoFiltrado.length !== universities.length">
                (de {{ universities.length }} totales)
                </span>
            </p>
            <span v-if="loading" class="status">Cargando...</span>
            <span v-else-if="error" class="status error">{{ error }}</span>
        </div>

          <p v-if="!loading && listadoFiltrado.length === 0" class="empty">
            No se encontraron universidades con esos filtros.
          </p>

          <ul v-if="!loading && listadoFiltrado.length > 0" class="list">
            <li v-for="uni in listadoPaginado" :key="uni.id" class="item">
              <div class="item-rank">
                <span class="rank-label">Rank</span>
                <span class="rank-value">{{ uni.world_rank }}</span>
              </div>

              <div class="item-body">
                <NuxtLink :to="`/universities/${uni.id}`" class="item-title">
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
                  class="fav-btn"
                  :class="{ 'is-fav': favoritesStore.isFavorite(uni.id) }"
                  @click="favoritesStore.toggleFavorite(uni.id)"
                  :title="favoritesStore.isFavorite(uni.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
                >
                  {{ favoritesStore.isFavorite(uni.id) ? '★' : '☆' }}
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

h1 {
  margin: 0 0 4px 0;
}

.subtitle {
  color: var(--color-muted);
  margin: 0;
  font-size: 0.95rem;
}

/* ---- Layout con sidebar ---- */
.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

.sidebar {
  position: sticky;
  top: 80px;   /* antes 190px */
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

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sidebar-card h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-primary);
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--color-muted);
  font-size: 0.8rem;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

.clear-btn:hover {
  color: var(--color-danger);
}

.filter-group {
  margin-bottom: 14px;
}

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
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.08);
}

.select-input {
  cursor: pointer;
}

.filter-divider {
  height: 1px;
  background: var(--color-border);
  margin: 16px 0;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--color-text-soft);
  cursor: pointer;
  padding: 6px 0;
}

.checkbox-row input {
  cursor: pointer;
  accent-color: var(--color-primary);
}

/* ---- Bloque de stats en sidebar ---- */
.stats .stat-row {
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

.stat-number.accent {
  color: var(--color-accent);
}

.stat-divider {
  height: 1px;
  background: var(--color-border);
  margin: 14px 0;
}

/* ---- Contenido ---- */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding: 0 4px;
}

.result-count {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.result-count strong {
  color: var(--color-text);
}

.status {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.status.error {
  color: var(--color-danger);
}

.empty {
  text-align: center;
  padding: 48px 24px;
  color: var(--color-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

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

.item-body {
  flex: 1;
  min-width: 0;
}

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

.item-title:hover {
  color: var(--color-primary);
}

.item-meta {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.sep {
  margin: 0 4px;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ---- Badges de score ---- */
.score-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.75rem;
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.score-high {
  background: #dcfce7;
  color: #166534;
}

.score-mid {
  background: #fef3c7;
  color: #92400e;
}

.score-low {
  background: #fee2e2;
  color: #991b1b;
}

.score-none {
  background: #f1f5f9;
  color: #64748b;
}

/* ---- Botón favorito ---- */
.fav-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: var(--color-border-strong);
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;
}

.fav-btn:hover {
  color: var(--color-accent);
  background: var(--color-accent-tint);
  transform: scale(1.1);
}

.fav-btn.is-fav {
  color: var(--color-accent);
}

.fav-btn.is-fav:hover {
  transform: scale(1.2);
}

/* ---- Responsive ---- */
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 20px 16px;
  }
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

.hero-wrapper {
  position: sticky;
  top: 68px;
  z-index: 8;
  padding: 12px 0 16px 0;

  /* Mismo fondo que el body, con background-attachment: fixed */
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

  /* Sombra sutil abajo para separar del listado */
  box-shadow: 0 8px 12px -8px rgba(15, 23, 42, 0.04);
}

/* ---- Paginación ---- */
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
</style>