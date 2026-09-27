import { useState } from 'react'
import { Plus } from 'lucide-react'
import { balances, fmt, fromCHF, kittyAsExpenses, settleUp, useRates, type Expense, type KittyData, type Settlement } from '../lib/money'
import { useItems, type Item } from '../lib/store'
import { useMe } from '../lib/me'
import { name, Sheet } from '../components/ui'
import ExpenseForm from './money/ExpenseForm'
import BudgetView from './money/Budget'
import KittyView from './money/Kitty'
import { Balances, Converter, ExpenseDetail, ExpenseList, PayButton, Stats, UndoPaid, type Paid } from './money/Views'
import './money/money.css'

type View = 'vamos' | 'gastos' | 'saldos' | 'stats' | 'vaquita'

export default function Money() {
  const me = useMe() ?? 'cristian'
  const { date } = useRates()
  const expenses = useItems<Expense>('expense')
  const settlements = useItems<Settlement>('settlement')
  const kitty = useItems<KittyData>('kitty')
  const [view, setView] = useState<View>('vamos')
  const [form, setForm] = useState<{ edit?: Item<Expense> } | null>(null)
  const [open, setOpen] = useState<Item<Expense> | null>(null)
  const [paid, setPaid] = useState<Paid | null>(null)

  // Gastos reales + aportes a la vaquita (sintéticos, categoría 'vaquita', entre los 6): así los saldos,
  // el total del grupo y las stats cuentan el efectivo que cada uno puso. Ver kittyAsExpenses en lib/money.
  const allExpenses = [...expenses.map((e) => e.data), ...kittyAsExpenses(kitty.map((k) => k.data))]
  const bal = balances(
    allExpenses,
    settlements.map((s) => s.data),
  )
  const mine = bal[me] ?? 0
  // Si una sola transferencia me toca, se dice con quién ("Debes CHF 40 a Bia") y se puede marcar pagada desde aquí
  const mineT = settleUp(bal).filter((t) => t.from === me || t.to === me)
  const single = mineT.length === 1 ? mineT[0] : null
  const other = single ? name(single.from === me ? single.to : single.from) : null
  const headline = mine > 0.005 ? (other ? `Te debe ${other}` : 'Te deben') : mine < -0.005 ? (other ? `Debes a ${other}` : 'Debes') : 'Estás a mano'
  const total = allExpenses.reduce((a, e) => a + e.chf, 0)
  const myShare = allExpenses.reduce((a, e) => {
    const parts = Object.values(e.shares).reduce((x, y) => x + y, 0)
    return a + (parts ? (e.chf * (e.shares[me] ?? 0)) / parts : 0)
  }, 0)
  // Mantener el detalle sincronizado si otro lo edita/borra
  const openLive = open ? (expenses.find((e) => e.id === open.id) ?? null) : null

  return (
    <>
      <div className="card hero col" style={{ gap: 4 }}>
        <span className="small muted">{headline}</span>
        <span className="big">{fmt(Math.abs(mine))}</span>
        <span className="small muted">≈ {fmt(fromCHF(Math.abs(mine), 'MXN'), 'MXN')}</span>
        {single && (
          <div className="row" style={{ marginTop: 6 }}>
            <PayButton t={single} me={me} primary onPaid={setPaid} />
          </div>
        )}
        <UndoPaid paid={paid} settlements={settlements} onDone={() => setPaid(null)} />
        <div className="row between small" style={{ marginTop: 8 }}>
          <span>
            Grupo: <b>{fmt(total)}</b>
          </span>
          <span>
            Tu parte: <b>{fmt(myShare)}</b>
          </span>
        </div>
        <span className="tiny muted">Cambio BCE: {date}</span>
      </div>

      <div className="seg five">
        <button className={view === 'vamos' ? 'on' : ''} onClick={() => setView('vamos')}>
          Cómo vamos
        </button>
        <button className={view === 'gastos' ? 'on' : ''} onClick={() => setView('gastos')}>
          Gastos ({expenses.length})
        </button>
        <button className={view === 'saldos' ? 'on' : ''} onClick={() => setView('saldos')}>
          Saldos
        </button>
        <button className={view === 'stats' ? 'on' : ''} onClick={() => setView('stats')}>
          Stats
        </button>
        <button className={view === 'vaquita' ? 'on' : ''} onClick={() => setView('vaquita')}>
          Vaquita
        </button>
      </div>

      {view === 'vamos' && <BudgetView me={me} />}
      {view === 'gastos' && <ExpenseList items={expenses} onOpen={setOpen} />}
      {view === 'saldos' && <Balances bal={bal} settlements={settlements} me={me} />}
      {view === 'stats' && <Stats expenses={allExpenses} />}
      {view === 'vaquita' && <KittyView me={me} items={kitty} />}

      <Converter />

      {/* En la Vaquita el botón es el suyo ("Anotar gasto"), para no confundir con un gasto normal */}
      {view !== 'vaquita' && (
        <button className="btn primary fab" onClick={() => setForm({})}>
          <Plus size={18} /> Gasto
        </button>
      )}

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.edit ? 'Editar gasto' : 'Nuevo gasto'}>
        {form && <ExpenseForm me={me} edit={form.edit} onDone={() => setForm(null)} />}
      </Sheet>

      <Sheet open={!!openLive && !form} onClose={() => setOpen(null)}>
        {openLive && (
          <ExpenseDetail
            item={openLive}
            onClose={() => setOpen(null)}
            onEdit={() => {
              setForm({ edit: openLive })
              setOpen(null)
            }}
          />
        )}
      </Sheet>
    </>
  )
}
