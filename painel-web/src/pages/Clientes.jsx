import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const initialForm = {
  nome: '',
  numero_whatsapp: '',
  tipo: 'cliente',
  bot_ativo: true
}

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length !== 13) return digits
  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
}

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editId, setEditId] = useState('')
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  const titulo = useMemo(() => (editId ? 'Editar contato' : 'Novo contato'), [editId])

  async function loadClientes() {
    try {
      const data = await api.listarClientes()
      setClientes(data)
    } catch (error) {
      setErro(error.message)
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      if (editId) {
        await api.atualizarCliente(editId, form)
      } else {
        await api.criarCliente(form)
      }
      setForm(initialForm)
      setEditId('')
      await loadClientes()
    } catch (error) {
      setErro(error.message)
    } finally {
      setSaving(false)
    }
  }

  const edit = (cliente) => {
    setEditId(cliente.id)
    setForm({
      nome: cliente.nome,
      numero_whatsapp: cliente.numero_whatsapp,
      tipo: cliente.tipo,
      bot_ativo: cliente.bot_ativo
    })
  }

  const remove = async (id) => {
    const confirmed = window.confirm('Remover contato?')
    if (!confirmed) return
    try {
      await api.removerCliente(id)
      if (editId === id) {
        setEditId('')
        setForm(initialForm)
      }
      await loadClientes()
    } catch (error) {
      setErro(error.message)
    }
  }

  return (
    <div className="grid gap-6 p-4 lg:grid-cols-[380px_1fr]">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-base-200 bg-base-50 p-4">
        <h2 className="text-lg font-semibold text-base-900">{titulo}</h2>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-base-700">Nome</span>
          <input
            required
            value={form.nome}
            onChange={(event) => setForm({ ...form, nome: event.target.value })}
            className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-base-700">WhatsApp</span>
          <input
            required
            placeholder="+55 (71) 99999-9999"
            value={form.numero_whatsapp}
            onChange={(event) => setForm({ ...form, numero_whatsapp: event.target.value })}
            className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-base-700">Tipo</span>
          <select
            value={form.tipo}
            onChange={(event) => setForm({ ...form, tipo: event.target.value })}
            className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
          >
            <option value="cliente">Cliente</option>
            <option value="gerente">Gerente</option>
          </select>
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-base-700">
          <input
            type="checkbox"
            checked={form.bot_ativo}
            onChange={(event) => setForm({ ...form, bot_ativo: event.target.checked })}
          />
          Bot ativo por padrao
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-base-900 px-4 py-2 text-sm font-semibold text-white hover:bg-base-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editId ? (
            <button
              type="button"
              onClick={() => {
                setEditId('')
                setForm(initialForm)
              }}
              className="rounded-xl border border-base-200 px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          ) : null}
        </div>

        {erro ? <p className="text-sm text-red-700">{erro}</p> : null}
      </form>

      <section className="overflow-hidden rounded-2xl border border-base-200">
        <table className="min-w-full divide-y divide-base-200 text-sm">
          <thead className="bg-base-50 text-left text-xs uppercase tracking-[0.16em] text-base-700">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Numero</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Bot</th>
              <th className="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-100">
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="bg-white">
                <td className="px-4 py-3 font-medium text-base-900">{cliente.nome}</td>
                <td className="px-4 py-3 text-base-700">{formatPhone(cliente.numero_whatsapp)}</td>
                <td className="px-4 py-3 capitalize text-base-700">{cliente.tipo}</td>
                <td className="px-4 py-3 text-base-700">{cliente.bot_ativo ? 'Ligado' : 'Desligado'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => edit(cliente)}
                      className="rounded-lg border border-base-200 px-2 py-1 text-xs hover:bg-base-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(cliente.id)}
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
      </section>
    </div>
  )
}

export default Clientes
