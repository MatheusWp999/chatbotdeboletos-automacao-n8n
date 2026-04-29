import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import FileUpload from '../components/FileUpload.jsx'

const initialForm = {
  contato_id: '',
  mes_referencia: '',
  arquivo: null
}

function statusClass(status) {
  if (status === 'enviado') return 'bg-emerald-100 text-emerald-700'
  if (status === 'erro') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-700'
}

function Boletos() {
  const [boletos, setBoletos] = useState([])
  const [clientes, setClientes] = useState([])
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [form, setForm] = useState(initialForm)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  const loadBoletos = useCallback(async () => {
    try {
      const data = await api.listarBoletos({ mes: filtroMes, status: filtroStatus })
      setBoletos(data)
    } catch (error) {
      setErro(error.message)
    }
  }, [filtroMes, filtroStatus])

  const loadClientes = useCallback(async () => {
    try {
      const data = await api.listarClientes('cliente')
      setClientes(data)
      if (!form.contato_id && data.length) {
        setForm((prev) => ({ ...prev, contato_id: data[0].id }))
      }
    } catch (error) {
      setErro(error.message)
    }
  }, [form.contato_id])

  useEffect(() => {
    loadClientes()
  }, [loadClientes])

  useEffect(() => {
    loadBoletos()
  }, [loadBoletos])

  const submit = async (event) => {
    event.preventDefault()
    if (!form.arquivo) {
      setErro('Selecione o PDF do boleto')
      return
    }

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('contato_id', form.contato_id)
      formData.append('mes_referencia', form.mes_referencia)
      formData.append('arquivo', form.arquivo)
      await api.criarBoleto(formData)
      setForm({ ...initialForm, contato_id: form.contato_id })
      await loadBoletos()
    } catch (error) {
      setErro(error.message)
    } finally {
      setSaving(false)
    }
  }

  const enviarAgora = async (id) => {
    try {
      await api.enviarBoletoAgora(id)
      await loadBoletos()
    } catch (error) {
      setErro(error.message)
    }
  }

  const remover = async (id) => {
    if (!window.confirm('Remover boleto?')) return
    try {
      await api.removerBoleto(id)
      await loadBoletos()
    } catch (error) {
      setErro(error.message)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="grid gap-3 rounded-2xl border border-base-200 bg-base-50 p-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-base-700">Mes</span>
          <input
            type="month"
            value={filtroMes}
            onChange={(event) => setFiltroMes(event.target.value)}
            className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-base-700">Status</span>
          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value)}
            className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
          >
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="enviado">Enviado</option>
            <option value="erro">Erro</option>
          </select>
        </label>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_350px]">
        <div className="overflow-hidden rounded-2xl border border-base-200">
          <table className="min-w-full divide-y divide-base-200 text-sm">
            <thead className="bg-base-50 text-left text-xs uppercase tracking-[0.16em] text-base-700">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Mes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {boletos.map((boleto) => (
                <tr key={boleto.id} className="bg-white">
                  <td className="px-4 py-3 font-medium text-base-900">{boleto.cliente_nome}</td>
                  <td className="px-4 py-3 text-base-700">{boleto.mes_referencia}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(boleto.status)}`}>
                      {boleto.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-base-700">{boleto.arquivo_nome}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => enviarAgora(boleto.id)}
                        className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                      >
                        Enviar agora
                      </button>
                      <button
                        type="button"
                        onClick={() => remover(boleto.id)}
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-base-200 bg-base-50 p-4">
          <h2 className="text-lg font-semibold text-base-900">Adicionar boleto</h2>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-base-700">Cliente</span>
            <select
              required
              value={form.contato_id}
              onChange={(event) => setForm({ ...form, contato_id: event.target.value })}
              className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
            >
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-base-700">Mes referencia</span>
            <input
              required
              type="month"
              value={form.mes_referencia}
              onChange={(event) => setForm({ ...form, mes_referencia: event.target.value })}
              className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
            />
          </label>

          <FileUpload file={form.arquivo} onChange={(arquivo) => setForm({ ...form, arquivo })} />

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-base-900 px-4 py-2 text-sm font-semibold text-white hover:bg-base-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar boleto'}
          </button>

          {erro ? <p className="text-sm text-red-700">{erro}</p> : null}
        </form>
      </section>
    </div>
  )
}

export default Boletos
