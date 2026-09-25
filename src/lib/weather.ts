import { useEffect, useState } from 'react'

export type Weather = {
  temp: number
  code: number
  wind: number
  daily: { date: string; max: number; min: number; rain: number; code: number }[]
}

const cache = new Map<string, Weather>()

/** Clima de Open-Meteo (gratis, sin clave) */
export function useWeather(lat: number, lon: number, tz: string) {
  const key = `${lat},${lon}`
  const [w, setW] = useState<Weather | null>(cache.get(key) ?? null)
  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
      `&timezone=${encodeURIComponent(tz)}&forecast_days=7`
    fetch(url)
      .then((r) => r.json())
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
        }
        cache.set(key, data)
        setW(data)
      })
      .catch(() => {})
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
