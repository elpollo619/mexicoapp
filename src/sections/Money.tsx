import { useState } from 'react'
import { Plus } from 'lucide-react'
import { balances, fmt, fromCHF, useRates, type Expense, type Settlement } from '../lib/money'
import { useItems, type Item } from '../lib/store'
import { useMe } from '../lib/me'
import { Sheet } from '../components/ui'
import ExpenseForm from './money/ExpenseForm'
import BudgetView from './money/Budget'
import { Balances, Converter, ExpenseDetail, ExpenseList, Stats } from './money/Views'
import './money/money.css'

type View = 'vamos' | 'gastos' | 'saldos' | 'stats'

export default function Money() {
  const me = useMe() ?? 'cristian'
  const { date } = useRates()
  const expenses = useItems<Expense>('expense')
  const settlements = useItems<Settlement>('settlement')
  const [view, setView] = useState<View>('vamos')
  const [form, setForm] = useState<{ edit?: Item<Expense> } | null>(null)
  const [open, setOpen] = useState<Item<Expense> | null>(null)

  const bal = balances(
    expenses.map((e) => e.data),
    settlements.map((s) => s.data),
  )
  const mine = bal[me] ?? 0
  const total = expenses.reduce((a, e) => a + e.data.chf, 0)
  const myShare = expenses.reduce((a, { data: e }) => {
    const parts = Object.values(e.shares).reduce((x, y) => x + y, 0)
    return a + (parts ? (e.chf * (e.shares[me] ?? 0)) / parts : 0)
  }, 0)
  // Mantener el detalle sincronizado si otro lo edita/borra
  const openLive = open ? (expenses.find((e) => e.id === open.id) ?? null) : null

  return (
    <>
      <div className="card hero col" style={{ gap: 4 }}>
        <span className="small muted">{mine > 0.005 ? 'Te deben' : mine < -0.005 ? 'Debes' : 'Estás a mano'}</span>
        <span className="big">{fmt(Math.abs(mine))}</span>
        <span className="small muted">≈ {fmt(fromCHF(Math.abs(mine), 'MXN'), 'MXN')}</span>
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

      <div className="seg">
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
      </div>

      {view === 'vamos' && <BudgetView me={me} />}
      {view === 'gastos' && <ExpenseList items={expenses} onOpen={setOpen} />}
      {view === 'saldos' && <Balances bal={bal} settlements={settlements} me={me} />}
      {view === 'stats' && <Stats expenses={expenses.map((e) => e.data)} />}

      <Converter />

      <button className="btn primary fab" onClick={() => setForm({})}>
        <Plus size={18} /> Gasto
      </button>

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
