import { defineStore } from 'pinia'

export const useFavoritesStore = defineStore('favorites', () => {
  // Guardamos siempre como string[] para evitar problemas de tipos
  const favorites = useCookie<string[]>('favorites', {
    default: () => [],
    maxAge: 60 * 60 * 24 * 365, // 1 año
    sameSite: 'lax'
  })

  // Normaliza cualquier id a string
  const normalizeId = (id: number | string): string => String(id)

  const isFavorite = (id: number | string): boolean => {
    return favorites.value.includes(normalizeId(id))
  }

  const toggleFavorite = (id: number | string) => {
    const key = normalizeId(id)
    if (favorites.value.includes(key)) {
      favorites.value = favorites.value.filter((fav: string) => fav !== key)
    } else {
      favorites.value = [...favorites.value, key]
    }
  }

  const clearFavorites = () => {
    favorites.value = []
  }

  return { favorites, isFavorite, toggleFavorite, clearFavorites }
})