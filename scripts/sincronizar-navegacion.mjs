import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const origen = new URL('../../../Backend/FarmaciaBelenBackend/src/shared/seguridad/navegacion.ts', import.meta.url)
const destino = new URL('../src/shared/seguridad/navegacion.ts', import.meta.url)
const contenido = await readFile(origen, 'utf8')
await mkdir(dirname(fileURLToPath(destino)), { recursive: true })
await writeFile(destino, contenido)
