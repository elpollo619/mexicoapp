# México Lindo — Rediseño fase 1 (antes del 3 de octubre)

**Fecha:** 28 sep 2026 · **Autor:** Claude con Cristian · **Estado:** borrador para revisión

## 1. Para qué

Ocho personas que verán la app por primera vez esta semana la abrirán en la calle, con prisa y a veces
sin red, para tres cosas: *¿qué toca ahora?*, *apuntar lo que pagué* y *subir fotos*. Cristian pidió
"mucho más fácil de usar": encontrar las cosas, apuntar gastos, y una revisión de letras, colores y de que
se entienda dónde se suben las imágenes. Además: Cristian como súper admin (borrar cualquier cosa, añadir
personas).

Lo que **no** cambia: la identidad (paleta rosa/cempasúchil/turquesa, luchadores, humor), el stack
(React + Vite + Supabase, PWA en GitHub Pages), el modelo `mx_items`, los enlaces `#hoy`, `#viaje/...`
que ya circulan en WhatsApp.

## 2. Diagnóstico (lo visto en las 20 pantallas)

| Problema | Evidencia |
|---|---|
| Profundidad | 5 pestañas y 21 sub-vistas. *Fotos* está en Grupo › 3.ª de 4. *Info* tiene 7 chips que se salen de pantalla. |
| Acciones frecuentes escondidas | "＋ Gasto" solo en Plata, "Subir foto" solo en Grupo › Fotos. En *Hoy* hay accesos a Gasto/Quién paga/Taxis/SOS pero no a Foto. |
| Formulario de gasto | 8 bloques a la vez (qué, monto, moneda, pagó, categoría, fecha, entre quiénes, ticket). Los valores por defecto ya son buenos: MXN, pagué yo, Comida, hoy, "Los 6". |
| Densidad | Cuerpo 14–15 px, muchos `btn small`, tarjetas con 3–4 líneas de texto gris. Bien en escritorio, cansa al sol en el móvil. |
| Primer uso | Tras el PIN se cae en *Hoy* sin ninguna orientación. |
| Permisos | Solo el autor borra sus fotos/encuestas; nadie puede limpiar un gasto ajeno mal metido. |

## 3. Diseño

### 3.1 Navegación: mismas pestañas, menos profundidad
- Se mantienen las 5 pestañas (memoria muscular + enlaces viejos). Cambian los contenidos:
  - **Grupo** abre en *Fotos* durante el viaje (`phase === 'during'`) y en *Votar* antes (hay votaciones pendientes). Las 4 sub-vistas pasan a un selector segmentado con icono + texto.
  - **Info** deja de ser chips horizontales: es un **menú vertical de tarjetas** (Taxis y Uber · Propinas · Checklist · Emergencias · Dinero y clima · Jerga · Instalar), cada una abre su vista con botón "← Info". Se lee entera sin desplazar de lado.
  - **Viaje** y **Plata** conservan su selector de 5, pero el selector pasa a ser igual en toda la app (mismo componente `Segmented`, 44 px de alto).
- **Botón "＋" global** (esquina inferior derecha, encima de la barra) en todas las pestañas, con dos opciones grandes: **Gasto** y **Foto**. Sustituye a los dos FAB actuales (Plata "＋ Gasto", Votar "＋ Encuesta"; "Encuesta" pasa a un botón normal en la cabecera de Votar).
- En *Hoy*, los 4 accesos rápidos pasan a **Gasto · Foto · Taxis · SOS** ("Quién paga" vive en Juegos).

### 3.2 Gasto rápido
- La hoja "Nuevo gasto" muestra solo: **¿Qué fue?**, **Monto** con moneda, y el botón **Añadir gasto**. Debajo, una línea resumen: `Pagué yo · 🌮 Comida · hoy · entre los 6 — Cambiar`.
- "Cambiar" despliega los bloques actuales (pagó, categoría, fecha, entre quiénes, ticket) sin cambiar su lógica. El estado abierto/cerrado se recuerda por sesión.
- **Ticket**: botón de cámara junto al monto (`capture="environment"`), además del bloque desplegable. Sube igual que hoy (`uploadImage`).
- Autoenfoque en Monto al abrir desde "＋" (lo típico es "480 pesos de tacos"), teclado numérico.

### 3.3 Fotos
- Cabecera del álbum con un solo mensaje grande: **"Súbelas aquí · todos las ven · se guardan en el NAS de Cris"** y el botón **Subir** a 48 px. Estado vacío con la misma frase. Aviso HEIC/JPEG solo cuando falla, como hoy.
- Sin cambios en subida ni en el contenedor `nas-sync`.

### 3.4 Legibilidad (styles.css)
- Cuerpo 15 → **17 px**; `small` 13 → 14; `tiny` 11 → 12.5. Títulos h1 26 → 28, h2 20 → 22.
- Objetivo táctil mínimo **44 px** (`.btn.small` 34 → 44 alto, chips 32 → 40). Separación entre tarjetas 12 → 14.
- Contraste: `--muted` en oscuro `#aa9ea6` → `#bdb2b9` (pasa 4.5:1 sobre `--card`). Se mantiene la paleta.
- Barra inferior: iconos 21 → 24 px, etiqueta 11 → 12 px, pestaña activa con fondo (ya existe) y texto en `--rosa`.
- Cabecera unificada: icono "MX" (el de `Install`) + título de la pestaña, en todas las vistas. Sirve de logo provisional; el logo definitivo va en fase 2.

### 3.5 Primer uso
- Tras crear el PIN (no al entrar con PIN existente), una hoja de **3 viñetas** con "Siguiente": *Hoy te dice qué toca* · *＋ para gasto o foto* · *Instálala en tu celular*. Se guarda `mx-onboarded-v1` en `localStorage`; reaparece desde Perfil › "Ver de nuevo".

### 3.6 Súper admin
- `ADMINS = ['cristian']` en `people.ts`; `isAdmin(me)` en `lib/me.ts`.
- El admin puede **borrar cualquier ítem** donde hoy solo puede el autor: fotos, encuestas y sus votos, gastos, liquidaciones, aportes a la vaquita, "me apunto". Mismo botón de papelera que hoy, visible también para el admin, con confirmación ("¿Borrar el gasto de Pipo?"). Resetear PIN de otros ya existe para todos y se deja igual.
- Insignia "admin" discreta en Perfil. Ningún cambio de RLS: la clave publicable ya permite borrar; el control es de interfaz, igual que hoy.
- **Añadir personas se pospone a fase 2** (ver §5): la lista vive en `people.ts` con avatar dibujado, apodo, color y `gdlOnly`, y la usan 38 sitios (repartos, vuelos, bingo, mapa). Moverla a la base de datos en 5 días sin tests es riesgo real de romper Plata. Mientras, el admin puede **renombrar** los dos huecos "Pablo" e "Invitad@ de Pablo" (nombre y apodo, guardados en `mx_items` kind `note`, id `person:<id>`), que cubre el caso real de esta semana (invitados de Guadalajara).

## 4. Implementación

- Rama `feat/rediseno-fase1` desde `main`; PR en borrador; Cristian fusiona. Nada detrás de banderas.
- Archivos: `App.tsx` (FAB global, cabecera), `styles.css` (tokens), `components/ui.tsx` (`Segmented`, `Fab`), `sections/Info.tsx` (menú), `sections/Group.tsx` (vista por defecto), `sections/Home.tsx` (accesos), `sections/money/ExpenseForm.tsx` (modo rápido), `sections/Photos.tsx` (cabecera), `components/Onboarding.tsx` (nuevo), `lib/me.ts` + `data/people.ts` (admin), `sections/Polls.tsx`, `Photos.tsx`, `money/Views.tsx`, `money/Kitty.tsx`, `Itinerary.tsx` (borrado admin), `components/ProfileSheet.tsx` (insignia, renombrar huecos).
- Orden: 3.4 tokens → 3.1 navegación → 3.2 gasto → 3.3 fotos → 3.6 admin → 3.5 primer uso. Cada bloque un commit; se puede fusionar por bloques si el tiempo aprieta.
- **Verificación**: `npm run build` (tsc) + `oxlint` en cada commit; recorrido manual con capturas de las 20 pantallas en móvil (430 px) y escritorio, modo claro y oscuro; prueba real de "＋ Foto" hasta el NAS; borrado como admin y como no-admin. No se añade framework de tests (no existe; no da tiempo a hacerlo bien).
- Riesgos: (a) el FAB tapa el último elemento de listas → `padding-bottom` en `.page`; (b) enlaces `#grupo/fotos` etc. siguen funcionando porque las sub-vistas no cambian de id; (c) subir el cuerpo a 17 px puede desbordar tarjetas de vuelos → revisar `Flights.tsx`.

## 5. Fase 2 (durante/después del viaje)
Personas en base de datos (`kind: 'person'`, `usePeople()` con la lista estática como fallback, avatares subidos), logo definitivo, pulido de tarjetas de vuelos/itinerario, tests de `money.ts`.
