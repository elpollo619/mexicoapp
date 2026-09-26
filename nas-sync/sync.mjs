// México Lindo → NAS: copia las fotos del álbum y los tickets de gastos a una carpeta local.
// Sin dependencias (Node 18+). Solo lee (clave publicable) y nunca borra nada en el NAS.
//
//   SUPABASE_URL, SUPABASE_KEY  — los mismos de la app
//   DEST                         — carpeta destino (en Docker: /data)
//   INTERVAL_MIN                 — cada cuántos minutos revisar (0 = una sola vez)

import { mkdir, readFile, writeFile, stat, rename, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'

const URL = process.env.SUPABASE_URL ?? 'https://fopblphtagryrdjotohf.supabase.co'
const KEY = process.env.SUPABASE_KEY ?? 'sb_publishable_RFE13qtuN7m-QNp2VD6JQg_IAvCE-sp'
const DEST = process.env.DEST ?? './mexico-2026'
const INTERVAL = Number(process.env.INTERVAL_MIN ?? 10)
const TRIP = 'mexico-2026'
/** PostgREST devuelve como mucho 1000 filas por pedido: se pagina hasta recibir una página corta */
const PAGE = 1000
/** Tiempo máximo por descarga (ms) */
const TIMEOUT = 60_000

const NAMES = { cristian: 'Cristian', bia: 'Bia', pipo: 'Pipo', tania: 'Tania', jhoni: 'Jhoni', nicolas: 'Nicolas', pablo: 'Pablo', invitado: 'Invitado' }
const STOPS = [
  ['2026-10-03', '00 Antes del viaje'],
  ['2026-10-06', 'CDMX'],
  ['2026-10-08', 'Puerto Vallarta'],
  ['2026-10-12', 'Guadalajara'],
  ['2026-10-17', 'La Paz y Los Cabos'],
  ['9999-12-31', 'CDMX'],
]
const cityOf = (date) => STOPS.find(([until]) => date < until)[1]
// Quita lo que rompe nombres de archivo y el CSV (";" es el separador; saltos de línea)
const clean = (s) => String(s ?? '').replace(/[\\/:*?"<>|;]+/g, '-').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
const log = (...a) => console.log(new Date().toISOString(), ...a)
/** Clave estable de un ítem dentro del nombre de archivo (no cambia aunque se edite el gasto) */
const idKey = (id) => id.slice(-6)

async function items() {
  const rows = []
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(
      `${URL}/rest/v1/mx_items?trip=eq.${TRIP}&kind=in.(photo,expense)&select=id,kind,data,created_at&order=created_at,id&limit=${PAGE}&offset=${offset}`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(TIMEOUT) },
    )
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
    const page = await res.json()
    rows.push(...page)
    if (page.length < PAGE) break
  }
  return rows
}

/** Lista de archivos a tener en el NAS: [url, ruta relativa] */
function plan(rows) {
  const out = []
  for (const r of rows) {
    const d = r.data ?? {}
    // Las fotos pueden traer también `thumb` (miniatura): solo se copia la imagen completa `url`
    if (r.kind === 'photo' && d.url) {
      const date = d.date ?? r.created_at.slice(0, 10)
      const time = r.created_at.slice(11, 19).replace(/:/g, '')
      out.push([d.url, join('Fotos', `${date} ${cityOf(date)}`, `${date}_${time}_${clean(NAMES[d.by] ?? d.by)}_${idKey(r.id)}.jpg`)])
    }
    // Tickets: el nombre lleva la fecha (legible) y el id (clave estable). Antes llevaba concepto y monto,
    // y al editar el gasto aparecía una segunda copia; los archivos viejos con el mismo id se dejan tal cual.
    if (r.kind === 'expense' && d.receipt) {
      const date = d.date ?? r.created_at.slice(0, 10)
      out.push([d.receipt, join('Tickets', `${date}_${clean(NAMES[d.payer] ?? d.payer)}_${idKey(r.id)}.jpg`)])
    }
  }
  return out
}

const exists = (p) => stat(p).then(() => true, () => false)

/** ¿Ya hay en la carpeta un archivo con ese id (con cualquier prefijo o extensión)? */
const dirCache = new Map()
async function haveId(dir, key) {
  if (!dirCache.has(dir)) dirCache.set(dir, await readdir(dir).catch(() => []))
  const re = new RegExp(`_${key}\\.[a-z0-9]+$`, 'i')
  return dirCache.get(dir).some((name) => re.test(name))
}

async function download(url, target) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) {
    log('⚠️', res.status, url)
    return false
  }
  // La app sube JPEG; si algún archivo es de otro tipo, se respeta su extensión
  const type = res.headers.get('content-type') ?? ''
  const ext = type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : type.includes('heic') ? '.heic' : '.jpg'
  const final = target.replace(/\.jpg$/, ext)
  if (ext !== '.jpg' && (await exists(final))) return false
  await mkdir(dirname(final), { recursive: true })
  // Escribir a un temporal y renombrar: nunca queda un archivo a medias
  await writeFile(`${final}.part`, Buffer.from(await res.arrayBuffer()))
  await rename(`${final}.part`, final)
  return true
}

async function once() {
  const rows = await items()
  dirCache.clear()
  let added = 0
  let failed = 0
  for (const [url, rel] of plan(rows)) {
    const target = join(DEST, rel)
    if (await exists(target)) continue
    const key = rel.match(/_([^_.]+)\.jpg$/)?.[1]
    if (key && (await haveId(dirname(target), key))) continue
    // Un error de red en un archivo no frena el resto: se anota y se reintenta en la próxima pasada
    try {
      if (await download(url, target)) {
        added++
        log('✓', rel)
      }
    } catch (e) {
      failed++
      log('⚠️', rel, e.message)
    }
  }
  // Resumen legible de los gastos (se reescribe cada vez)
  const expenses = rows.filter((r) => r.kind === 'expense').map((r) => r.data)
  const csv = [
    'fecha;concepto;monto;moneda;chf;pagó;entre;categoría',
    ...expenses.map((e) =>
      [e.date, clean(e.title), e.amount, e.currency, e.chf, NAMES[e.payer] ?? e.payer, Object.keys(e.shares ?? {}).map((p) => NAMES[p] ?? p).join(' + '), clean(e.category)].join(';'),
    ),
  ].join('\n')
  await mkdir(DEST, { recursive: true })
  const csvPath = join(DEST, 'Gastos.csv')
  const prev = await readFile(csvPath, 'utf8').catch(() => '')
  if (prev !== '﻿' + csv) await writeFile(csvPath, '﻿' + csv)
  log(`Listo: ${added} archivo(s) nuevo(s)${failed ? `, ${failed} con error (se reintentan)` : ''}.`)
}

async function loop() {
  for (;;) {
    try {
      await once()
    } catch (e) {
      log('❌', e.message)
    }
    if (!INTERVAL) break
    await new Promise((r) => setTimeout(r, INTERVAL * 60_000))
  }
}

loop()
