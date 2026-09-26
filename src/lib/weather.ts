import { useEffect, useState } from 'react'

export type Weather = {
  temp: number
  code: number
  wind: number
  daily: { date: string; max: number; min: number; rain: number; code: number }[]
  /** Cuándo se descargó (ms desde época) */
  fetchedAt?: number
  /** true si viene de localStorage porque no se pudo descargar (sin red / timeout) */
  stale?: boolean
}

const cache = new Map<string, Weather>()
const STORAGE = (key: string) => `mx-weather-${key}`

function readStored(key: string): Weather | null {
  try {
    const raw = localStorage.getItem(STORAGE(key))
    if (!raw) return null
    const w = JSON.parse(raw) as Weather
    return Array.isArray(w?.daily) ? { ...w, stale: true } : null
  } catch {
    return null
  }
}

function store(key: string, w: Weather) {
  try {
    localStorage.setItem(STORAGE(key), JSON.stringify(w))
  } catch {
    /* sin espacio o modo privado: da igual */
  }
}

/** Clima de Open-Meteo (gratis, sin clave). Sin red devuelve el último pronóstico guardado con `stale: true`. */
export function useWeather(lat: number, lon: number, tz: string) {
  const key = `${lat},${lon}`
  const [w, setW] = useState<Weather | null>(() => cache.get(key) ?? readStored(key))
  useEffect(() => {
    let alive = true
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
      `&timezone=${encodeURIComponent(tz)}&forecast_days=7`
    fetch(url, { signal: AbortSignal.timeout(10000) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => {
        const data: Weather = {
          temp: j.current.temperature_2m,
          code: j.current.weather_code,
          wind: j.current.wind_speed_10m,
          daily: j.daily.time.map((d: string, i: number) => ({
            date: d,
            max: j.daily.temperature_2m_max[i],
            min: j.daily.temperature_2m_min[i],
            rain: j.daily.precipitation_probability_max[i],
            code: j.daily.weather_code[i],
          })),
          fetchedAt: Date.now(),
        }
        cache.set(key, data)
        store(key, data)
        if (alive) setW(data)
      })
      .catch(() => {
        // Falló la descarga: si hay algo guardado (de esta u otra sesión), mostrarlo marcado como viejo
        if (!alive) return
        setW((prev) => prev ?? readStored(key))
      })
    return () => {
      alive = false
    }
  }, [key, lat, lon, tz])
  return w
}

export function weatherIcon(code: number) {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}
