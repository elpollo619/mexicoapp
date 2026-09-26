# 🇲🇽 México Lindo 2026 — la app del viaje

**Abrir:** https://elpollo619.github.io/mexicoapp/

## Cómo instalarla en el celular
- **iPhone (Safari):** abrir el link → botón Compartir → **Añadir a pantalla de inicio**.
- **Android (Chrome):** abrir el link → menú ⋮ → **Instalar app**.

Luego elige **"¿Quién eres?"** y listo. Funciona sin internet para el itinerario, vuelos e info;
lo compartido (gastos, votos, "me apunto", checklist, bingo) se sincroniza al volver la conexión.

## Qué tiene
- **Hoy:** cuenta regresiva, plan del día, próximo vuelo, clima en vivo, conversor CHF ⇄ MXN.
- **Plan:** itinerario día a día (3–19 oct) con links de reserva, "me apunto", dónde comer, dónde dormir y mapa.
- **Vuelos:** todos los vuelos con quién va, equipaje y cuenta regresiva; se pueden editar/añadir.
- **Plata:** subir gastos con foto del ticket, dividir entre todos o por partes, saldos y "quién le paga a quién".
- **Votar:** encuestas en vivo (alojamiento, cena de cumple, cómo ir a GDL…).
- **Juegos:** ¿Quién paga? (ruleta), Dedo del destino, Lotería, Yo nunca nunca, Verdad o reto, Trivia, Bingo del viaje, moneda y dados.
- **Info:** precios de taxi/Uber por trayecto, emergencias, checklist, jerga mexicana.

La idea completa está en [IDEA.md](IDEA.md).

## Desarrollo
```bash
npm install
npm run dev      # http://localhost:5173/mexicoapp/
npm run build
```
Stack: React + TypeScript + Vite, PWA (vite-plugin-pwa), Supabase (tabla `mx_items` + storage `mx-receipts`),
Open-Meteo (clima), Frankfurter/BCE (tipo de cambio), Leaflet + OpenStreetMap (mapa).
Cada push a `main` se publica solo en GitHub Pages.
