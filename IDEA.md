# 🇲🇽 México Lindo — la app del viaje (3–19 oct 2026)

App web instalable (PWA) para el grupo. Se abre con un link, se "descarga" desde el navegador
(**Compartir → Añadir a pantalla de inicio** en iPhone, **Instalar app** en Android) y funciona
sin conexión para el itinerario, vuelos e info. Lo que se comparte (gastos, votos, apuntados,
checklist, bingo) se sincroniza en tiempo real entre todos.

## Quiénes
Cristian · Bia (Mi Negra) · Pipo · Tania · Jhoni · Nicolas — y en Guadalajara Pablo + 1.
Cada uno tiene su **avatar de luchador** (máscara original dibujada en SVG, con su color y apodo:
"El Planeador", "La Negra Letal", "El Contador del Narco"…).

**Inicio de sesión:** eliges tu nombre y la primera vez creas un **PIN de 4 números**; después entras
con él desde cualquier teléfono. Si alguien lo olvida, otro del grupo se lo resetea desde su perfil.

**Descargar la app:** banner "Instala la app" en Hoy, guía paso a paso iPhone/Android y **código QR**
en Perfil e Info → Instalar.

## Secciones

### 1. Hoy 🌞
- Cuenta regresiva hasta el despegue (y durante el viaje: "día X de 17").
- Dónde estamos hoy, qué hay en el plan, próximo vuelo con cuenta regresiva.
- Clima en vivo de la ciudad del día (Open-Meteo, gratis, sin clave).
- Tipo de cambio en vivo CHF ↔ MXN (Frankfurter / BCE) + calculadora rápida.

### 2. Itinerario 🗓️
- Día a día del 2 al 19 de octubre: CDMX → Puerto Vallarta → Guadalajara (cumple de Pablo) → La Paz / Los Cabos → CDMX → casa.
- Cada día: plan con horas, precio por persona, links de reserva (Viator, Civitatis, OpenTable…) y botón de Google Maps.
- **"Me apunto"** en cada actividad: se ve quién va a qué (y cuánto cuesta).
- Dónde comer por ciudad (baratos, medios, cena especial) y dónde dormir (opciones de la guía).
- Mapa con la ruta completa (Leaflet + OpenStreetMap).

### 3. Vuelos ✈️
- Todos los vuelos comprados con hora, aeropuerto, aerolínea, equipaje y quién va.
- Estado: comprado ✅ / pendiente ⏳. Se pueden añadir vuelos (p. ej. el de Cris y Bia, o Baja → CDMX).
- Recordatorio de "estar 2 h antes" y aeropuerto correcto (AICM vs AIFA).
- (Sin PIN, PNR ni fechas de nacimiento: el código es público.)

### 4. Plata 💸 (gastos y cómo vamos)
- **Cómo vamos:** presupuesto por persona (1.550 CHF sin vuelos, editable), anillo de gastado vs presupuesto,
  ritmo diario, proyección al final del viaje ("Vamos bien 👌 / Ojo 🔥 / Nos pasamos 😬"), gasto por ciudad y categoría.
- Subir lo pagado: monto, moneda (CHF, MXN, USD, EUR → se convierte a CHF), quién pagó, entre quiénes,
  categoría y **foto del ticket**.
- Reparto igual o por partes (p. ej. "los 2 de Guadalajara solo el hotel").
- Saldos por persona y **"quién le paga a quién"** con el mínimo de transferencias.
- Marcar pagos de vuelta como hechos.

### 5. Votar 🗳️
- Encuestas del grupo en vivo: alojamiento por ciudad, cómo ir a Guadalajara, cena del cumple,
  Teotihuacán tour vs globo, Clásico Atlas–Chivas sí/no, plan del miércoles en Vallarta…
- Cualquiera puede crear una encuesta nueva.

### 6. Grupo 👯 — Votar · Juegos · Fotos · Cuates
- **Fotos:** álbum compartido del viaje, agrupado por día.
- **Cuates:** la galería de luchadores del grupo.

### Juegos 🎲
- **¿Quién paga?** — ruleta con los nombres (modo eliminación: el último que queda paga).
- **Dedo del destino** — todos ponen un dedo en la pantalla, la app elige a uno.
- **Lotería mexicana** — "cantor" digital con las 54 cartas.
- **Yo nunca nunca** y **Verdad o reto** — edición México.
- **Trivia de México** con puntuación.
- **Bingo del viaje** compartido (ver mariachi, comer chapulines, ver a Pablo bailar…).
- **Moneda y dados** para decidir rápido.
- **🍻 Para beber (+18, con cabeza):** Círculo de la muerte (Kings Cup), ¿Quién es más probable…?,
  Ruleta de shots y Fiesta (estilo Picolo con virus). Todos con **modo sin alcohol**.

### 7. Info 🧭
- Costos de taxi / Uber por trayecto (aeropuertos, Teotihuacán, Tlaquepaque, Balandra…).
- Emergencias: 911, Embajada de Suiza, consulados de España, DFAE.
- Dinero y propinas, seguridad, clima y qué llevar.
- Checklist compartido "antes de salir" y "qué falta reservar".
- Diccionario chilango/tapatío (güey, chido, neta, chela, ahorita…).

## Diseño
Papel cálido + tinta, un color por ciudad (CDMX rosa, Vallarta turquesa, GDL terracota, Baja azul) y
**fotos reales** de cada lugar (Wikimedia Commons, guardadas en la app para verlas sin internet).
Vuelos como **pases de abordar**. Navegación de 5 pestañas: Hoy · Viaje · Plata · Grupo · Info.

## Tecnología
- **React + TypeScript + Vite**, PWA con `vite-plugin-pwa` (instalable, offline).
- **Supabase** (Postgres + Realtime + Storage) para lo compartido; si no hay internet, se guarda
  en el teléfono y se ve lo último cargado.
- **GitHub Pages** para publicar (deploy automático con GitHub Actions en cada push a `main`).
- APIs gratis sin clave: Open-Meteo (clima), Frankfurter (tipo de cambio), OpenStreetMap (mapa).
