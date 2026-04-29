import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const initialForm = {
  nome_persona: '',
  system_prompt: '',
  instrucoes_restricao: '',
  mensagem_boleto_template: 'Ola, {{nome}}. Segue seu boleto referente a {{mes}}.',
  mensagem_lembrete_template: 'Ola, {{nome}}. Lembrete do boleto de {{mes}}.'
}

function ConfigBot() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.buscarConfiguracao()
        if (data) {
          setForm({
            nome_persona: data.nome_persona || '',
            system_prompt: data.system_prompt || '',
            instrucoes_restricao: data.instrucoes_restricao || '',
            mensagem_boleto_template:
              data.mensagem_boleto_template || initialForm.mensagem_boleto_template,
            mensagem_lembrete_template:
              data.mensagem_lembrete_template || initialForm.mensagem_lembrete_template
          })
        }
      } catch (error) {
        setStatus(error.message)
      }
    }

    load()
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      setStatus('')
      await api.salvarConfiguracao(form)
      setStatus('Configuracao salva com sucesso.')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      <div className="rounded-2xl border border-base-200 bg-base-50 p-4">
        <h2 className="text-lg font-semibold text-base-900">Persona e instrucoes</h2>
        <p className="mt-1 text-sm text-base-700">
          Estas instrucoes serao utilizadas no workflow de resposta com OpenAI.
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-base-700">Nome da persona</span>
        <input
          required
          value={form.nome_persona}
          onChange={(event) => setForm({ ...form, nome_persona: event.target.value })}
          className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-base-700">System prompt</span>
        <textarea
          required
          rows={9}
          value={form.system_prompt}
          onChange={(event) => setForm({ ...form, system_prompt: event.target.value })}
          className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-base-700">Restricoes</span>
        <textarea
          rows={6}
          value={form.instrucoes_restricao}
          onChange={(event) => setForm({ ...form, instrucoes_restricao: event.target.value })}
          className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-base-700">Template mensagem boleto</span>
          <textarea
            rows={4}
            value={form.mensagem_boleto_template}
            onChange={(event) => setForm({ ...form, mensagem_boleto_template: event.target.value })}
            className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-base-700">Template lembrete</span>
          <textarea
            rows={4}
            value={form.mensagem_lembrete_template}
            onChange={(event) => setForm({ ...form, mensagem_lembrete_template: event.target.value })}
            className="w-full rounded-xl border border-base-200 px-3 py-2 text-sm outline-none focus:border-base-700"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-base-900 px-4 py-2 text-sm font-semibold text-white hover:bg-base-700 disabled:opacity-60"
      >
        {saving ? 'Salvando...' : 'Salvar configuracao'}
      </button>

      {status ? <p className="text-sm text-base-700">{status}</p> : null}
    </form>
  )
}

export default ConfigBot
