import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useAuth } from '@/lib/auth'
import { getTransactions } from '@/lib/db-service'
import { formatCLP, formatMonthLabel, monthOptions, summaryForMonth } from '@/lib/calculations'
import type { Transaction } from '@/types/finance'

export function Historico() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await getTransactions(user!.id)
      setTransactions(data)
      setLoading(false)
    }

    load()
  }, [user])

  const data = useMemo(() => {
    const months = monthOptions(12).reverse()
    return months.map((m) => {
      const summary = summaryForMonth(transactions, m)
      return {
        month: m,
        label: formatMonthLabel(m),
        ...summary,
      }
    })
  }, [transactions])

  return (
    <div className="mx-auto max-w-[840px] px-5 pb-20 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border-muted pb-5">
        <div className="flex items-center gap-2.5 text-[15px]">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-green to-green-dark font-mono text-sm font-bold text-bg">
            G
          </div>
          <span className="text-txt-secondary">{user!.name}</span>
          <span className="text-txt-tertiary">/</span>
          <span className="font-semibold text-txt-primary">finanzas</span>
          <span className="text-txt-tertiary">/</span>
          <span className="font-semibold text-txt-primary">historico</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="rounded-md border border-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-txt-secondary transition-colors hover:text-txt-primary"
          >
            ← dashboard
          </button>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="rounded-md border border-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-txt-tertiary transition-colors hover:text-red"
          >
            salir
          </button>
        </div>
      </div>

      <h1 className="mb-6 font-mono text-lg font-semibold text-txt-primary">
        comparación mes a mes
      </h1>

      {loading ? (
        <div className="py-10 text-center font-mono text-sm text-txt-tertiary">
          cargando histórico…
        </div>
      ) : (
        <>
          <div className="card mb-5 p-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid stroke="#30363D" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#8B949E', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: '#8B949E', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      borderColor: '#30363D',
                      borderRadius: 8,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#E6EDF3' }}
                    formatter={(value: number) => formatCLP(value)}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#8B949E' }}
                  />
                  <Line type="monotone" dataKey="income" name="ingresos" stroke="#3FB950" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fixed" name="gastos fijos" stroke="#F85149" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="variable" name="gastos variables" stroke="#F85149" strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="savings" name="ahorro" stroke="#D29922" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="balance" name="balance" stroke="#58A6FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <section className="card">
            <div className="card-head">
              <span className="text-txt-primary">resumen por mes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-border-muted text-txt-secondary">
                    <th className="px-4 py-2 text-left">mes</th>
                    <th className="px-4 py-2 text-right">ingresos</th>
                    <th className="px-4 py-2 text-right">fijos</th>
                    <th className="px-4 py-2 text-right">variables</th>
                    <th className="px-4 py-2 text-right">ahorro</th>
                    <th className="px-4 py-2 text-right">balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr
                      key={row.month}
                      className="border-b border-border-muted text-txt-primary last:border-b-0"
                    >
                      <td className="px-4 py-2">{row.label}</td>
                      <td className="px-4 py-2 text-right text-green">
                        {formatCLP(row.income)}
                      </td>
                      <td className="px-4 py-2 text-right text-red">
                        {formatCLP(row.fixed)}
                      </td>
                      <td className="px-4 py-2 text-right text-red opacity-70">
                        {formatCLP(row.variable)}
                      </td>
                      <td className="px-4 py-2 text-right text-amber">
                        {formatCLP(row.savings)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-semibold ${
                          row.balance >= 0 ? 'text-green' : 'text-red'
                        }`}
                      >
                        {formatCLP(row.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
