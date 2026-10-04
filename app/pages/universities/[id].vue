<script setup lang="ts">
import { useUniversitiesStore, type University } from '~/stores/universities'
import { useFavoritesStore } from '~/stores/favorites'

const route = useRoute()
const universitiesStore = useUniversitiesStore()
const favoritesStore = useFavoritesStore()

const id = Number(route.params.id)

const { data: university } = await useAsyncData(`university-${id}`, async () => {
  await universitiesStore.fetchUniversities()
  return universitiesStore.fetchUniversity(id)
})

if (!university.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Universidad no encontrada'
  })
}

// ¿Venimos navegando desde favoritos?
const fromFavorites = computed(() => route.query.from === 'favorites')

// Criterio de orden que tenía el usuario en /favorites
const sort = computed(() => (route.query.sort as string) || 'nombre-asc')

const parseRank = (rank: string): number => {
  const match = String(rank).match(/\d+/)
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

// Lista sobre la que navegamos (favoritos ordenados igual que en /favorites)
const navigationList = computed<University[]>(() => {
  if (!fromFavorites.value) {
    return universitiesStore.universities
  }

  const favs = universitiesStore.universities.filter((u: University) =>
    favoritesStore.isFavorite(u.id)
  )

  const sorted = [...favs]
  switch (sort.value) {
    case 'rank-asc':
      sorted.sort((a, b) => parseRank(a.world_rank) - parseRank(b.world_rank))
      break
    case 'score-desc':
      sorted.sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
      break
    case 'nombre-asc':
    default:
      sorted.sort((a, b) =>
        a.university_name.localeCompare(b.university_name, 'es')
      )
      break
  }

  return sorted
})

const index = computed(() =>
  navigationList.value.findIndex(
    (u: University) => Number(u.id) === Number(id)
  )
)

const prev = computed<University | null>(() =>
  index.value > 0 ? navigationList.value[index.value - 1] ?? null : null
)

const next = computed<University | null>(() =>
  index.value >= 0 && index.value < navigationList.value.length - 1
    ? navigationList.value[index.value + 1] ?? null
    : null
)

// Helper: trata 0, undefined, null, '' como "sin dato"
const isValidValue = (val: unknown): boolean => {
  if (val === null || val === undefined) return false
  if (typeof val === 'number') return val > 0
  if (typeof val === 'string') return val.trim() !== '' && val.trim() !== '0'
  return true
}

const fmt = (val: unknown, fallback = 'N/D'): string => {
  if (!isValidValue(val)) return fallback
  return String(val)
}

// Stats con Total score destacado y traducciones al español
const stats = computed(() => {
  const u = university.value
  if (!u) return []
  return [
    { label: 'Docencia', value: u.teaching, featured: false },
    { label: 'Internacional', value: u.international, featured: false },
    { label: 'Investigación', value: u.research, featured: false },
    { label: 'Citas', value: u.citations, featured: false },
    { label: 'Ingresos', value: u.income, featured: false },
    { label: 'Puntuación total', value: u.total_score, featured: true }
  ]
})

const detalles = computed(() => {
  const u = university.value
  if (!u) return []
  return [
    { label: 'ID', value: u.id, raw: true },
    { label: 'País', value: u.country, raw: true },
    { label: 'Año', value: u.year, raw: true },
    { label: 'Número de estudiantes', value: u.num_students },
    { label: 'Ratio estudiante/staff', value: u.student_staff_ratio },
    { label: 'Estudiantes internacionales', value: u.international_students },
    { label: 'Ratio femenino/masculino', value: u.female_male_ratio }
  ]
})

// Helper para preservar ?from=favorites y ?sort en los enlaces prev/next
const buildLink = (universityId: number) => {
  if (!fromFavorites.value) {
    return `/universities/${universityId}`
  }
  return `/universities/${universityId}?from=favorites&sort=${sort.value}`
}
</script>

<template>
  <div>
    <HeaderView />

    <main class="page">
      <template v-if="university">
        <div class="top-bar">
          <NuxtLink :to="fromFavorites ? '/favorites' : '/universities'" class="back-link">
            <span class="arrow">←</span>
            {{ fromFavorites ? 'Volver a favoritos' : 'Volver al listado' }}
          </NuxtLink>

          <span v-if="fromFavorites" class="context-badge">
            Navegando en tus favoritos
          </span>
        </div>

        <!-- HEADER DEL DETALLE -->
        <header class="detail-header">
          <div class="detail-rank">
            <span class="rank-label">Rank mundial</span>
            <span class="rank-value">{{ university.world_rank }}</span>
          </div>

          <div class="detail-title">
            <p class="eyebrow">
              <span>{{ university.country }}</span>
              <span class="eyebrow-sep">·</span>
              <span>{{ university.year }}</span>
            </p>
            <h1>{{ university.university_name }}</h1>

            <button
              class="btn-fav-large"
              :class="{ 'is-fav': favoritesStore.isFavorite(university.id) }"
              @click="favoritesStore.toggleFavorite(university.id)"
            >
              <span class="star">
                {{ favoritesStore.isFavorite(university.id) ? '★' : '☆' }}
              </span>
              {{
                favoritesStore.isFavorite(university.id)
                  ? 'En favoritos'
                  : 'Agregar a favoritos'
              }}
            </button>
          </div>
        </header>

        <!-- STATS -->
        <section class="stats-section">
          <h2 class="section-title">Métricas principales</h2>
          <div class="stats-grid">
            <!-- Total score destacado primero -->
            <div
              v-for="stat in stats.filter((s) => s.featured)"
              :key="stat.label"
              class="stat stat-featured"
            >
              <div>
                <p class="stat-label">{{ stat.label }}</p>
                <p class="stat-caption">Puntaje global del ranking</p>
              </div>
              <p class="stat-value stat-value-featured" :class="{ 'is-empty': !isValidValue(stat.value) }">
                {{ fmt(stat.value) }}
              </p>
            </div>

            <!-- Resto de métricas -->
            <div
              v-for="stat in stats.filter((s) => !s.featured)"
              :key="stat.label"
              class="stat"
            >
              <p class="stat-label">{{ stat.label }}</p>
              <p class="stat-value" :class="{ 'is-empty': !isValidValue(stat.value) }">
                {{ fmt(stat.value) }}
              </p>
            </div>
          </div>
        </section>

        <!-- DETALLES -->
        <section class="details-section">
          <h2 class="section-title">Información detallada</h2>

          <dl class="details-list">
            <div v-for="item in detalles" :key="item.label" class="detail-row">
              <dt class="detail-label">{{ item.label }}</dt>
              <dd
                class="detail-value"
                :class="{ 'is-empty': !isValidValue(item.value) && !item.raw }"
              >
                {{ item.raw ? item.value : fmt(item.value) }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- NAVEGACIÓN ANTERIOR / SIGUIENTE -->
        <nav class="pager">
          <NuxtLink
            v-if="prev"
            :to="buildLink(prev.id)"
            class="pager-link pager-prev"
          >
            <span class="pager-direction">← Anterior</span>
            <span class="pager-title">{{ prev.university_name }}</span>
            <span class="pager-meta">
              {{ prev.country }} · Rank {{ prev.world_rank }}
            </span>
          </NuxtLink>
          <span v-else class="pager-placeholder">
            <span class="pager-empty">
              {{ fromFavorites ? 'Es tu primer favorito' : 'No hay anterior' }}
            </span>
          </span>

          <NuxtLink
            v-if="next"
            :to="buildLink(next.id)"
            class="pager-link pager-next"
          >
            <span class="pager-direction">Siguiente →</span>
            <span class="pager-title">{{ next.university_name }}</span>
            <span class="pager-meta">
              {{ next.country }} · Rank {{ next.world_rank }}
            </span>
          </NuxtLink>
          <span v-else class="pager-placeholder">
            <span class="pager-empty">
              {{ fromFavorites ? 'Es tu último favorito' : 'No hay siguiente' }}
            </span>
          </span>
        </nav>
      </template>
    </main>

    <FooterView />
  </div>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px;
}

/* ---- Top bar (back link + badge) ---- */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-muted);
  font-weight: 500;
}

.back-link:hover {
  color: var(--color-primary);
}

.back-link .arrow {
  transition: transform 0.15s ease;
}

.back-link:hover .arrow {
  transform: translateX(-3px);
}

.context-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: var(--color-accent-tint);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 999px;
  border: 1px solid #f0e0b8;
}

/* ---- Header del detalle ---- */
.detail-header {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 28px;
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.detail-header::before {
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

.detail-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
  background: var(--color-primary-tint);
  border-radius: var(--radius-sm);
  min-width: 110px;
}

.rank-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  font-weight: 700;
  opacity: 0.75;
}

.rank-value {
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
}

.detail-title {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.72rem;
  color: var(--color-muted);
  font-weight: 600;
  margin: 0 0 6px 0;
}

.eyebrow-sep {
  color: var(--color-border-strong);
}

.detail-title h1 {
  margin: 0 0 14px 0;
  font-size: 1.7rem;
  color: var(--color-text);
}

.btn-fav-large {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-weight: 500;
  font-size: 0.9rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-fav-large .star {
  font-size: 1.15rem;
  line-height: 1;
  color: var(--color-border-strong);
}

.btn-fav-large:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-fav-large:hover .star {
  color: var(--color-accent);
}

.btn-fav-large.is-fav {
  background: var(--color-accent-tint);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-fav-large.is-fav .star {
  color: var(--color-accent);
}

/* ---- Títulos de sección ---- */
.section-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  font-weight: 700;
  margin: 0 0 14px 0;
}

/* ---- Stats grid ---- */
.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.stat {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.15s ease;
}

.stat:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

/* Total score destacado: ocupa toda la fila y layout horizontal */
.stat-featured {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 26px;
  background: linear-gradient(135deg, #fdf6e3 0%, #ffffff 60%, #fdf6e3 100%);
  border-color: #f0e0b8;
}

.stat-featured:hover {
  border-color: var(--color-accent);
}

.stat-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  font-weight: 700;
  margin: 0;
}

.stat-caption {
  font-size: 0.75rem;
  color: var(--color-muted);
  margin: 2px 0 0 0;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-value-featured {
  font-size: 2.4rem;
  color: var(--color-accent);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.stat-value.is-empty {
  color: var(--color-muted);
  font-weight: 500;
  font-size: 1.1rem;
}

.stat-value-featured.is-empty {
  font-size: 1.5rem;
}

/* ---- Detalles ---- */
.details-section {
  margin-bottom: 32px;
}

.details-list {
  margin: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.1s ease;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row:hover {
  background: var(--color-surface-alt);
}

.detail-label {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
}

.detail-value {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.detail-value.is-empty {
  color: var(--color-muted);
  font-weight: 400;
  font-style: italic;
}

/* ---- Pager ---- */
.pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.pager-link {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 22px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
}

.pager-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--color-primary);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.pager-link:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.pager-link:hover::before {
  opacity: 1;
}

.pager-direction {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  font-weight: 700;
}

.pager-title {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.98rem;
  line-height: 1.3;
}

.pager-meta {
  font-size: 0.78rem;
  color: var(--color-muted);
  margin-top: 2px;
}

.pager-prev { text-align: left; }
.pager-next { text-align: right; }

.pager-next::before {
  left: auto;
  right: 0;
}

.pager-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 22px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  min-height: 80px;
}

.pager-empty {
  font-size: 0.8rem;
  color: var(--color-muted);
  font-style: italic;
}

/* ---- Responsive ---- */
@media (max-width: 640px) {
  .page { padding: 20px 16px; }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-rank { width: 100%; }

  .pager { grid-template-columns: 1fr; }
  .pager-next { text-align: left; }
  .pager-next::before { left: 0; right: auto; }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .detail-value { text-align: left; }

  .stat-featured {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>