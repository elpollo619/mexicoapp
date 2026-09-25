// México Lindo → NAS: copia las fotos del álbum y los tickets de gastos a una carpeta local.
// Sin dependencias (Node 18+). Solo lee (clave publicable) y nunca borra nada en el NAS.
//
//   SUPABASE_URL, SUPABASE_KEY  — los mismos de la app
//   DEST                         — carpeta destino (en Docker: /data)
//   INTERVAL_MIN                 — cada cuántos minutos revisar (0 = una sola vez)

import { mkdir, readFile, writeFile, stat, rename } from 'node:fs/promises'
import { join } from 'node:path'

const URL = process.env.SUPABASE_URL ?? 'https://fopblphtagryrdjotohf.supabase.co'
const KEY = process.env.SUPABASE_KEY ?? 'sb_publishable_RFE13qtuN7m-QNp2VD6JQg_IAvCE-sp'
const DEST = process.env.DEST ?? './mexico-2026'
const INTERVAL = Number(process.env.INTERVAL_MIN ?? 10)
const TRIP = 'mexico-2026'

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
const clean = (s) => String(s ?? '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 60)
const log = (...a) => console.log(new Date().toISOString(), ...a)

async function items() {
  const res = await fetch(`${URL}/rest/v1/mx_items?trip=eq.${TRIP}&kind=in.(photo,expense)&select=id,kind,data,created_at&order=created_at`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  return res.json()
}

/** Lista de archivos a tener en el NAS: [url, ruta relativa] */
function plan(rows) {
  const out = []
  for (const r of rows) {
    const d = r.data ?? {}
    if (r.kind === 'photo' && d.url) {
      const date = d.date ?? r.created_at.slice(0, 10)
      const time = r.created_at.slice(11, 19).replace(/:/g, '')
      out.push([d.url, join('Fotos', `${date} ${cityOf(date)}`, `${date}_${time}_${clean(NAMES[d.by] ?? d.by)}_${r.id.slice(-6)}.jpg`)])
    }
    if (r.kind === 'expense' && d.receipt) {
      const date = d.date ?? r.created_at.slice(0, 10)
      const amount = `${d.amount} ${d.currency}`
      out.push([d.receipt, join('Tickets', `${date}_${clean(d.title)}_${clean(amount)}_${clean(NAMES[d.payer] ?? d.payer)}_${r.id.slice(-6)}.jpg`)])
    }
  }
  return out
}

const exists = (p) => stat(p).then(() => true, () => false)

async function once() {
  const rows = await items()
  let added = 0
  for (const [url, rel] of plan(rows)) {
    const target = join(DEST, rel)
    if (await exists(target)) continue
    const res = await fetch(url)
    if (!res.ok) {
      log('⚠️', res.status, url)
      continue
    }
    // La app sube JPEG; si algún archivo es de otro tipo, se respeta su extensión
    const type = res.headers.get('content-type') ?? ''
    const ext = type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : type.includes('heic') ? '.heic' : '.jpg'
    if (ext !== '.jpg') {
      const alt = target.replace(/\.jpg$/, ext)
      if (await exists(alt)) continue
    }
    await mkdir(join(target, '..'), { recursive: true })
    // Escribir a un temporal y renombrar: nunca queda un archivo a medias
    const final = target.replace(/\.jpg$/, ext)
    await writeFile(`${final}.part`, Buffer.from(await res.arrayBuffer()))
    await rename(`${final}.part`, final)
    added++
    log('✓', rel)
  }
  // Resumen legible de los gastos (se reescribe cada vez)
  const expenses = rows.filter((r) => r.kind === 'expense').map((r) => r.data)
  const csv = [
    'fecha;concepto;monto;moneda;chf;pagó;entre;categoría',
    ...expenses.map((e) =>
      [e.date, clean(e.title), e.amount, e.currency, e.chf, NAMES[e.payer] ?? e.payer, Object.keys(e.shares ?? {}).map((p) => NAMES[p] ?? p).join(' + '), e.category].join(';'),
    ),
  ].join('\n')
  await mkdir(DEST, { recursive: true })
  const csvPath = join(DEST, 'Gastos.csv')
  const prev = await readFile(csvPath, 'utf8').catch(() => '')
  if (prev !== '﻿' + csv) await writeFile(csvPath, '﻿' + csv)
  log(`Listo: ${added} archivo(s) nuevo(s).`)
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
