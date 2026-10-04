import { defineStore } from 'pinia'
import { queryCollection } from '#imports'

export interface University {
  id: number
  world_rank: string
  university_name: string
  country: string
  teaching?: number
  international?: number
  research?: number
  citations?: number
  income?: number
  total_score?: number
  num_students?: number
  student_staff_ratio?: number
  international_students?: string
  female_male_ratio?: string
  year: number
}

export const useUniversitiesStore = defineStore('universities', {
  state: () => ({
    universities: [] as University[],
    loading: false,
    error: null as string | null
  }),

  getters: {
    averageTotalScore: (state): number => {
      const valid = state.universities.filter(
        (u: University) => typeof u.total_score === 'number'
      )
      if (valid.length === 0) return 0
      const total = valid.reduce(
        (sum: number, u: University) => sum + (u.total_score ?? 0),
        0
      )
      return total / valid.length
    },

    averageTotalScoreValid: (state): number => {
        const valid = state.universities.filter(
            (u: University) =>
            typeof u.total_score === 'number' && u.total_score > 0
        )
        if (valid.length === 0) return 0
        const total = valid.reduce(
            (sum: number, u: University) => sum + (u.total_score ?? 0),
            0
        )
        return total / valid.length
    }
  },

  actions: {
    async fetchUniversities(force = false) {
      if (this.universities.length > 0 && !force) return this.universities

      this.loading = true
      this.error = null

      try {
        this.universities = (await queryCollection('universities')
          .order('id', 'ASC')
          .all()) as University[]

        return this.universities
      } catch (e: any) {
        this.error = e.message ?? 'Error al cargar universidades'
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchUniversity(id: number) {
      if (this.universities.length === 0) {
        await this.fetchUniversities()
      }

      const cached = this.universities.find((u: University) => u.id === id)
      if (cached) return cached

      const uni = (await queryCollection('universities')
        .where('id', '=', id)
        .first()) as University | null

      return uni
    },

    // Útil si en algún momento quieres cargar los datos desde la página
    setUniversities(data: University[]) {
      this.universities = data
    }
  }
})