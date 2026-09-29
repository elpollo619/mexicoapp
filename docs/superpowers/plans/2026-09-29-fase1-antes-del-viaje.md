# Fase 1 antes del viaje — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la app se mantenga actualizada sola, que Cristian pueda borrar cualquier cosa, que apuntar un gasto sea dos campos, y que la primera vez la app explique tres cosas.

**Architecture:** Cuatro bloques independientes sobre el código existente, sin tocar el modelo `mx_items` ni RLS. Cada bloque es un commit fusionable por separado. El control de admin es de interfaz (igual que hoy el control de autor), con `isAdmin()` centralizado en `lib/me.ts`.

**Tech Stack:** React 19 + TypeScript + Vite, vite-plugin-pwa (`registerType: 'prompt'`), Supabase (store propio en `lib/store.ts`), lucide-react, sin framework de tests (verificación = `npm run build` + `oxlint` + recorrido manual en `vite preview`).

**Spec:** `docs/superpowers/specs/2026-09-28-rediseno-fase1-design.md` (§3.2, §3.5, §3.6 + auto-actualización acordada en chat). El rediseño visual (§3.1, §3.4) queda fuera de este plan.

## Global Constraints

- Idioma de la interfaz: español rioplatense-neutro como el resto ("Tocá", "chelas"); nada en inglés salvo lo ya existente.
- No se añade ninguna dependencia nueva.
- `CORE`, `presentOn`, `put`/`remove` del store se usan tal cual; no se cambian firmas existentes.
- Todo lo tocable ≥ 44 px de alto (`.btn.small` existente mide 34; donde se cree un botón nuevo usar `.btn` normal).
- Cada bloque termina con `npm run build` verde y `npx oxlint src` sin errores nuevos.

## Review Focus

1. **Gasto rápido con reparto plegado y fecha cambiada:** si la persona cambia la fecha dentro de "Cambiar", el resumen debe decir "Los 7" cuando toca (`presentOn(date)`), no quedarse en "Los 6". Test manual en Task 3.
2. **Borrado admin de una encuesta con votos:** deben borrarse también sus votos (como hace hoy el autor) — no dejar votos huérfanos. Task 2 reutiliza el mismo `onClick`.
3. **Aviso de actualización mientras se escribe:** el chequeo periódico no debe recargar a nadie a mitad de un formulario; solo dispara `onNeedRefresh`, que ya respeta `isTyping()`. Task 1 no toca esa lógica.
4. **Bienvenida en una sesión ya existente:** quien ya tiene PIN (Cristian) no debe ver la bienvenida al entrar; solo tras crear PIN por primera vez. Task 4 la dispara en `WhoAmI` solo en la rama de creación.
5. **Admin sin sesión de admin:** `isAdmin('bia')` es `false`; el botón de papelera no aparece para no-admins en ítems ajenos. Task 2 verifica con sesión `bia` en la vista previa.

---

### Task 1: Comprobar actualizaciones cada 15 minutos

**Files:**
- Modify: `src/main.tsx:19-33`

**Interfaces:**
- Consumes: `registerSW` de `virtual:pwa-register` (devuelve `updateSW`; acepta `onRegisteredSW(url, registration)`).
- Produces: nada nuevo.

- [ ] **Step 1: Añadir `onRegisteredSW` con un intervalo**

En `registerSW({ ... })`, junto a `onNeedRefresh`, añadir:

```ts
  // Con la app abierta días seguidos, comprobar cada 15 min si hay versión nueva (solo si hay red y la pestaña está visible)
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) void registration.update()
    }, 15 * 60 * 1000)
  },
```

- [ ] **Step 2: Build**

Run: `npm run build` → `✓ built`.

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "PWA: comprobar actualizaciones cada 15 min con la app abierta"
```

---

### Task 2: Súper admin — borrar cualquier ítem

**Files:**
- Modify: `src/data/people.ts` (añadir `ADMINS`)
- Modify: `src/lib/me.ts` (añadir `isAdmin`)
- Modify: `src/sections/Photos.tsx:162` (gate `open.data.by === me`)
- Modify: `src/sections/Polls.tsx:76` (`canManage`)
- Modify: `src/sections/money/Views.tsx` (botón borrar gasto — hoy sin gate; añadir nombre del autor al texto de confirmación)
- Modify: `src/components/ProfileSheet.tsx` (insignia "admin")

**Interfaces:**
- Produces: `export const ADMINS = ['cristian']` en `people.ts`; `export const isAdmin = (id: string | null) => !!id && ADMINS.includes(id)` en `me.ts`.

- [ ] **Step 1: `people.ts`** — tras `export const ALL = ...`:

```ts
/** Pueden borrar cualquier gasto, foto o encuesta (control de interfaz, como el de autor) */
export const ADMINS = ['cristian']
```

- [ ] **Step 2: `me.ts`** — al final:

```ts
import { ADMINS } from '../data/people'
/** Cristian puede borrar cualquier cosa; los demás solo lo suyo */
export const isAdmin = (id: string | null) => !!id && ADMINS.includes(id)
```
(el `import` va arriba del archivo, con los demás).

- [ ] **Step 3: `Photos.tsx`** — `{open.data.by === me &&` → `{(open.data.by === me || isAdmin(me)) &&`; importar `isAdmin` desde `../lib/me`.

- [ ] **Step 4: `Polls.tsx`** — `const canManage = !p.by || p.by === me` → `const canManage = !p.by || p.by === me || isAdmin(me)`; importar `isAdmin`.

- [ ] **Step 5: `money/Views.tsx`** — en la fila de confirmación, `¿Borrar este gasto?` → `` {`¿Borrar el gasto de ${name(e.payer)}?`} `` (el gasto ya expone `e.payer` y `name` ya está importado en ese archivo).

- [ ] **Step 6: `ProfileSheet.tsx`** — junto al nombre/apodo de la persona en la vista `main`, si `isAdmin(me)`: `<span className="tag ok">admin · puedes borrar cualquier cosa</span>`.

- [ ] **Step 7: Build + verificación manual** — `npm run build`; en `vite preview` con sesión `cristian`: abrir una foto ajena → aparece papelera; con sesión `bia` (cambiar `localStorage mx-session-v2`) → no aparece en fotos ajenas.

- [ ] **Step 8: Commit**

```bash
git add src/data/people.ts src/lib/me.ts src/sections/Photos.tsx src/sections/Polls.tsx src/sections/money/Views.tsx src/components/ProfileSheet.tsx
git commit -m "Súper admin: Cristian puede borrar cualquier gasto, foto o encuesta"
```

---

### Task 3: Gasto rápido

**Files:**
- Modify: `src/sections/money/ExpenseForm.tsx:140-290`

**Interfaces:**
- Consumes: estados existentes `title, amountStr, currency, payer, category, date, mode, custom, parts, receipt`; `presentOn` de `data/people`; `CATEGORIES` de `lib/money`; `name` de `components/ui`.
- Produces: nada nuevo fuera del archivo.

- [ ] **Step 1: Estado de plegado** — junto a los demás `useState`:

```ts
  /** Modo rápido: solo qué + monto; el resto plegado. Al editar un gasto existente se abre todo. */
  const [more, setMore] = useState<boolean>(() => !!e || sessionStorage.getItem('mx-expense-more') === '1')
  const toggleMore = () => { setMore((v) => { sessionStorage.setItem('mx-expense-more', v ? '0' : '1'); return !v }) }
```

- [ ] **Step 2: Resumen de una línea** — después del bloque de Monto/moneda y antes de "Pagó", insertar:

```tsx
      {!more && (
        <button type="button" className="row" onClick={toggleMore} style={{ gap: 6, background: 'var(--chip)', border: 0, borderRadius: 12, padding: '10px 12px', color: 'var(--ink)', textAlign: 'left', minHeight: 44 }}>
          <span className="grow small">
            {payer === me ? 'Pagué yo' : `Pagó ${name(payer)}`} · {CATEGORIES.find((c) => c.id === category)?.emoji} {CATEGORIES.find((c) => c.id === category)?.label} · {date === today() ? 'hoy' : date.slice(8) + '.' + date.slice(5, 7)} · entre {mode === 'core' ? `los ${present.length}` : mode === 'all' ? 'todos' : mode === 'custom' ? `${custom.length} personas` : 'partes'}
          </span>
          <b className="small" style={{ color: 'var(--rosa)' }}>Cambiar</b>
        </button>
      )}
```

- [ ] **Step 3: Envolver los bloques Pagó, Categoría, Fecha, Entre quiénes y Foto del ticket** en `{more && ( <> ... </> )}`. El botón de cámara rápido: junto al campo Monto añadir un `<label className="btn ghost file-btn" style={{ minHeight: 44 }}>` con `<Camera size={16} /> Ticket` y un `<input type="file" accept="image/*" capture="environment" hidden onChange={(ev) => void onFile(ev.target.files?.[0] ?? null)} />` (reutiliza `onFile` existente).

- [ ] **Step 4: Autoenfoque** — en el `<input>` de Monto añadir `autoFocus={!e}`; en el de título quitar `autoFocus` si lo tuviera.

- [ ] **Step 5: Build + verificación manual** — `npm run build`; en `vite preview`: abrir "+ Gasto": solo se ven Qué, Monto, moneda, Ticket, resumen y botones; tocar "Cambiar" despliega todo; cambiar fecha a 07.10 y volver a plegar → el resumen dice "entre los 7".

- [ ] **Step 6: Commit**

```bash
git add src/sections/money/ExpenseForm.tsx
git commit -m "Gasto rápido: qué + monto; pagó/categoría/fecha/reparto/ticket plegados tras Cambiar"
```

---

### Task 4: Bienvenida de 3 viñetas

**Files:**
- Create: `src/components/Onboarding.tsx`
- Modify: `src/sections/WhoAmI.tsx:190-193` (rama de creación de PIN)
- Modify: `src/App.tsx` (render del componente)
- Modify: `src/components/ProfileSheet.tsx` (botón "Ver la bienvenida de nuevo")

**Interfaces:**
- Produces: `Onboarding({ open, onClose }: { open: boolean; onClose: () => void })`; clave `localStorage` `mx-onboarded-v1`; `export const ONBOARD_KEY = 'mx-onboarded-v1'`; `sessionStorage` `mx-show-onboarding` = `'1'` puesto por `WhoAmI` al crear PIN y leído por `App`.

- [ ] **Step 1: `Onboarding.tsx`**

```tsx
import { useState } from 'react'
import { Camera, Home, Plus, Smartphone } from 'lucide-react'
import { Sheet } from './ui'

export const ONBOARD_KEY = 'mx-onboarded-v1'

const STEPS = [
  { icon: Home, title: 'Hoy te dice qué toca', text: 'Plan del día, próximo vuelo, clima y dónde está cada uno. Abre siempre ahí.' },
  { icon: Plus, title: 'Gasto y Foto, a un toque', text: 'En Plata apuntas lo que pagaste (qué + cuánto y listo). En 📷 Fotos subes las del día: todos las ven al instante.' },
  { icon: Smartphone, title: 'Instálala en tu celular', text: 'Icono en tu pantalla, pantalla completa y funciona sin internet. Está en Info › Instalar.' },
] as const

export default function Onboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0)
  const s = STEPS[i]
  const Icon = s.icon
  const done = () => {
    try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* ignore */ }
    setI(0)
    onClose()
  }
  return (
    <Sheet open={open} onClose={done}>
      <div className="col" style={{ gap: 14, alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
        <span style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--chip)', display: 'grid', placeItems: 'center' }}>
          <Icon size={30} />
        </span>
        <h2>{s.title}</h2>
        <p className="muted" style={{ margin: 0 }}>{s.text}</p>
        <div className="row" style={{ gap: 6 }}>
          {STEPS.map((_, k) => <span key={k} style={{ width: 8, height: 8, borderRadius: 4, background: k === i ? 'var(--rosa)' : 'var(--line)' }} />)}
        </div>
        <button className="btn primary" style={{ minHeight: 48, minWidth: 180 }} onClick={() => (i < STEPS.length - 1 ? setI(i + 1) : done())}>
          {i < STEPS.length - 1 ? 'Siguiente' : '¡Vamos!'}
        </button>
        {i < STEPS.length - 1 && <button className="btn ghost small" onClick={done}>Saltar</button>}
      </div>
    </Sheet>
  )
}
```
Nota: `Camera` se importa por si se usa en el segundo paso como segundo icono; si `oxlint` lo marca como no usado, quitarlo.

- [ ] **Step 2: `WhoAmI.tsx`** — en la rama de creación (línea ~190, justo antes de `setMe(step.id)`): `sessionStorage.setItem('mx-show-onboarding', '1')`.

- [ ] **Step 3: `App.tsx`** — estado `const [onboard, setOnboard] = useState(() => sessionStorage.getItem('mx-show-onboarding') === '1' && !localStorage.getItem(ONBOARD_KEY))`; al cerrar: `sessionStorage.removeItem('mx-show-onboarding')`. Render `<Onboarding open={onboard} onClose={() => { sessionStorage.removeItem('mx-show-onboarding'); setOnboard(false) }} />` junto a `<ProfileSheet …/>`. Como `App` se monta antes de que `WhoAmI` cree el PIN, leer el flag también tras `onDone`: en `<WhoAmI onDone={() => { go('hoy'); if (sessionStorage.getItem('mx-show-onboarding') === '1') setOnboard(true) }} />`.

- [ ] **Step 4: `ProfileSheet.tsx`** — botón `btn ghost` "Ver la bienvenida de nuevo" que hace `localStorage.removeItem(ONBOARD_KEY); sessionStorage.setItem('mx-show-onboarding','1'); location.reload()`.

- [ ] **Step 5: Build + verificación manual** — `npm run build`; en `vite preview`: borrar `mx-session-v2` y `profile:invitado` no existe → crear PIN como "Invitad@ de Pablo" **no** (escribe en la base real). En su lugar: con sesión `cristian`, Perfil › "Ver la bienvenida de nuevo" → aparecen las 3 viñetas; al terminar no vuelve a salir al recargar.

- [ ] **Step 6: Commit**

```bash
git add src/components/Onboarding.tsx src/sections/WhoAmI.tsx src/App.tsx src/components/ProfileSheet.tsx
git commit -m "Bienvenida de 3 viñetas tras crear el PIN"
```

---

### Cierre

- [ ] `git push -u origin feat/fase1`; PR (no borrador) con la lista de los 4 bloques y las verificaciones hechas.
- [ ] Recorrido final en `vite preview` con sesión `cristian`: Hoy, Plata › + Gasto (rápido y desplegado), Fotos › abrir foto ajena (papelera visible), Grupo › Votar (papelera en encuesta ajena), Perfil (insignia admin, bienvenida).
