import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INPUT = resolve(__dirname, '../data/timesData.csv')
const OUTPUT = resolve(__dirname, '../content/universities.csv')

// 1. Leer el CSV original
const raw = readFileSync(INPUT, 'utf-8')
const lines = raw.split(/\r?\n/).filter(line => line.trim() !== '')

// 2. Parsear el encabezado y normalizarlo
//    (minúscula, sin espacios, sin acentos, sin comillas)
function normalizeHeader(h) {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')                     // separa acentos
    .replace(/[\u0300-\u036f]/g, '')      // elimina acentos
    .replace(/\s+/g, '_')                 // espacios → guion bajo
    .replace(/[^a-z0-9_]/g, '')           // quita caracteres raros
}

const originalHeaders = lines[0].split(',').map(h => h.trim())
const headers = originalHeaders.map(normalizeHeader)

// 3. Parsear cada fila (parser CSV simple, maneja comillas dobles)
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result
}

const rows = lines.slice(1).map(parseCSVLine)

// 4. Detectar la posición de world_rank para excluirla como id
const rankIndex = headers.indexOf('world_rank')
const nameIndex = headers.indexOf('university_name')

// 5. Normalizar valores de cada fila
function cleanValue(header, value) {
  const v = (value ?? '').trim()

  // Campos que deben ser números decimales
  const numericFields = [
    'teaching', 'international', 'research',
    'citations', 'income', 'total_score',
    'num_students', 'student_staff_ratio'
  ]

  if (numericFields.includes(header)) {
    if (v === '' || v === '-' || v === 'NA') return ''
    const n = Number(v)
    return Number.isFinite(n) ? String(n) : ''
  }

  // Campos con % los dejamos como string limpio
  if (header === 'international_students' || header === 'female_male_ratio') {
    return v.replace(/%/g, '').trim()
  }

  // world_rank puede ser "=94", "201-250", "1" → lo dejamos como string
  if (header === 'world_rank') {
    return v.replace(/^=/, '').trim()
  }

  // year siempre entero
  if (header === 'year') {
    const n = Number(v)
    return Number.isFinite(n) ? String(n) : ''
  }

  return v
}

// 6. Construir el nuevo CSV con la columna id al inicio
const newHeaders = ['id', ...headers]

const newRows = rows.map((cols, i) => {
  const cleaned = headers.map((h, idx) => cleanValue(h, cols[idx]))
  // id secuencial 1, 2, 3...
  return [String(i + 1), ...cleaned]
})

// 7. Serializar CSV con comillas donde sea necesario
function escapeCSV(value) {
  if (value == null) return ''
  const v = String(value)
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

const outputLines = [
  newHeaders.join(','),
  ...newRows.map(row => row.map(escapeCSV).join(','))
]

// 8. Escribir el archivo final
mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, outputLines.join('\n'), 'utf-8')

console.log(`✅ Listo: ${newRows.length} registros escritos en ${OUTPUT}`)
console.log('Encabezados finales:', newHeaders.join(', '))