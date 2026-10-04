# Tarea 4 — World University Rankings

Aplicación web desarrollada con **Nuxt 4**, **@nuxt/content** y **Pinia** que muestra el dataset [World University Rankings](https://www.kaggle.com/datasets/mylesoneill/world-university-rankings) de Kaggle. Incluye listado con filtros, paginación, detalle por universidad, navegación anterior/siguiente y un sistema de favoritos persistentes.

## Sitio publicado

**URL:** https://world-university-rankings.vercel.app/universities

## Funcionalidades

### Listado de universidades (`/universities`)
- Carga del dataset completo (2603 registros) desde un archivo CSV mediante `@nuxt/content`.
- **Filtros interactivos**: búsqueda por nombre o país, filtro por año, filtro por país.
- **Ordenamiento configurable**: por año + rank, rank, calificación, nombre o país.
- **Paginación clásica**: 24 registros por página, con navegación a cualquier página.
- **Badge de score** con color según el valor (verde alto, amarillo medio, rojo bajo, gris sin dato).
- **Promedios** en el sidebar:
  - Promedio global de `total_score` (getter del store).
  - Promedio solo con score válido (excluye ceros del dataset original).
  - Promedio del listado filtrado actual.
- Contador de resultados visibles.

### Detalle de cada universidad (`/universities/:id`)
- Todos los campos del registro: rank mundial, país, año, docencia, internacional, investigación, citas, ingresos, puntuación total, número de estudiantes, ratios, etc.
- Los valores `0` o vacíos se muestran como **"N/D"** para mayor claridad.
- Navegación **anterior / siguiente** con el nombre, país y rank de cada una.
- Si se entra desde favoritos, la navegación respeta el orden y la lista de favoritos.
- Botón de agregar/quitar favoritos.

### Favoritos (`/favorites`)
- Persistencia con `useCookie` → los favoritos se conservan al recargar la página.
- Vista con resumen: total de favoritos, países distintos, años cubiertos y promedio de score.
- Filtros locales de búsqueda y ordenamiento.
- Botón para vaciar todos los favoritos.
- Paginación si hay más de 24 favoritos.

### Diseño
- Paleta institucional: azul marino, dorado y grises neutros.
- Tipografía Inter.
- Header sticky con línea decorativa azul→dorada.
- Hero sticky que se mantiene visible al hacer scroll.
- Sidebar de filtros y estadísticas con `position: sticky`.
- Auras radiales en el fondo (azul arriba-izquierda, dorada arriba-derecha) para dar profundidad.
- Responsive: se adapta a móvil reorganizando el layout a una sola columna.

## 🛠️ Stack técnico

| Tecnología | Uso |
|---|---|
| [Nuxt 4](https://nuxt.com/) | Framework principal |
| [@nuxt/content](https://content.nuxt.com/) | Carga de datos desde CSV |
| [Pinia](https://pinia.vuejs.org/) | Manejo de estado global |
| [TypeScript](https://www.typescriptlang.org/) | Tipado estático |
| CSS puro | Estilos, sin frameworks externos |


## 🚀 Instalación y uso

### Requisitos
- Node.js 20 o superior
- npm 10 o superior

### Pasos

```bash
# 1. Clonar o descomprimir el proyecto
cd tarea4

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run dev

# 3. Compilar para producción
npm run build

```

## Sobre el dataset
El dataset original de Kaggle contiene 2603 registros de universidades de todo el mundo entre 2011 y 2016, con métricas como docencia, investigación, citas, ingresos y puntuación total.

### Preparación del CSV
El archivo content/universities.csv fue generado a partir del timesData.csv original de Kaggle mediante el script scripts/prepare-dataset.mjs. Este script:

1. Normaliza los encabezados a minúscula, sin espacios ni acentos.
2. Agrega una columna id secuencial al inicio (1, 2, 3...) para servir como identificador único.
3. Limpia los valores de world_rank (quita el = inicial en valores como =94).
4. Convierte los campos numéricos a número y deja vacíos los que no son válidos.
5. Quita el símbolo % de campos como international_students.

### Nota sobre los valores 0
En el dataset original, algunas universidades tienen total_score = 0 porque el ranking no publica el score exacto para posiciones con rango (por ejemplo 351-400). En la interfaz estos valores se muestran como "N/D", y el sidebar ofrece dos promedios:

- Promedio global: incluye todos los valores (incluidos los ceros).
- Promedio solo con score válido: excluye los ceros.
- Esto permite ver la diferencia entre ambos y refleja el criterio analítico del autor.