import dayjs from 'dayjs'

function initials(name) {
  return String(name || '')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function ChatSidebar({ conversas, selectedId, onSelect }) {
  return (
    <aside className="w-full border-b border-base-200 bg-base-50 md:w-[340px] md:border-b-0 md:border-r">
      <div className="border-b border-base-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-base-700">Conversas</h2>
      </div>

      <div className="max-h-[70vh] overflow-y-auto md:max-h-[calc(100vh-220px)]">
        {conversas.map((conversa) => {
          const isActive = conversa.id === selectedId
          return (
            <button
              key={conversa.id}
              type="button"
              onClick={() => onSelect(conversa)}
              className={`flex w-full items-start gap-3 border-b border-base-100 px-4 py-3 text-left transition ${
                isActive ? 'bg-emerald-50' : 'hover:bg-white'
              }`}
            >
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-base-200 text-xs font-bold text-base-900">
                {initials(conversa.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-base-900">{conversa.nome}</p>
                  <span className="text-[11px] text-base-700">
                    {conversa.ultima_data ? dayjs(conversa.ultima_data).format('HH:mm') : '--:--'}
                  </span>
                </div>
                <p className="truncate text-xs text-base-700">{conversa.ultima_mensagem || 'Sem mensagens'}</p>
              </div>
            </button>
          )
        })}

        {!conversas.length && <p className="p-4 text-sm text-base-700">Nenhuma conversa cadastrada.</p>}
      </div>
    </aside>
  )
}

export default ChatSidebar
