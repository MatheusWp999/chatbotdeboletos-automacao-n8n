import { useMemo } from 'react'
import BotToggle from './BotToggle.jsx'
import MessageBubble from './MessageBubble.jsx'

function ChatWindow({
  contato,
  mensagens,
  texto,
  onTextoChange,
  onSend,
  onToggle,
  sending,
  toggleLoading
}) {
  const headerBadge = useMemo(() => {
    if (!contato) return null
    return contato.tipo === 'gerente' ? 'Gerente' : 'Cliente'
  }, [contato])

  if (!contato) {
    return (
      <section className="flex min-h-[560px] flex-1 items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-base-900">Selecione uma conversa</h3>
          <p className="mt-2 text-sm text-base-700">Escolha um contato na coluna esquerda para iniciar o atendimento.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-h-[560px] flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 bg-white px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-base-900">{contato.nome}</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-base-700">{headerBadge}</p>
        </div>
        <BotToggle ativo={contato.bot_ativo} onChange={onToggle} loading={toggleLoading} />
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_top,_#f8fbff,_#e2ecf8)] px-4 py-4">
        {mensagens.map((mensagem) => (
          <MessageBubble key={mensagem.id} mensagem={mensagem} />
        ))}
        {!mensagens.length && <p className="text-sm text-base-700">Sem mensagens neste contato ainda.</p>}
      </div>

      <form
        onSubmit={onSend}
        className="flex gap-2 border-t border-base-200 bg-white px-4 py-3"
      >
        <input
          value={texto}
          onChange={(event) => onTextoChange(event.target.value)}
          placeholder="Digite uma mensagem manual"
          className="flex-1 rounded-xl border border-base-200 px-3 py-2 text-sm text-base-900 outline-none transition focus:border-base-700"
        />
        <button
          type="submit"
          disabled={sending || !texto.trim()}
          className="rounded-xl bg-base-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-base-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </section>
  )
}

export default ChatWindow
