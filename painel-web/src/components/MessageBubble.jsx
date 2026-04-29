import dayjs from 'dayjs'

function MessageBubble({ mensagem }) {
  const outgoing = mensagem.direcao === 'saida'

  return (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          outgoing
            ? 'rounded-br-md bg-whatsapp-bubble text-base-900'
            : 'rounded-bl-md bg-whatsapp-incoming text-base-900'
        }`}
      >
        {mensagem.tipo === 'documento' && mensagem.arquivo_path ? (
          <a
            className="mb-1 block text-xs font-semibold text-emerald-700 hover:underline"
            href={mensagem.arquivo_path}
            target="_blank"
            rel="noreferrer"
          >
            PDF enviado
          </a>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{mensagem.conteudo || '-'}</p>
        <p className="mt-1 text-right text-[11px] text-base-700/70">
          {dayjs(mensagem.enviado_em).format('HH:mm')}
        </p>
      </div>
    </div>
  )
}

export default MessageBubble
