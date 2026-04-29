import { useCallback, useEffect, useMemo, useState } from 'react'
import ChatSidebar from '../components/ChatSidebar.jsx'
import ChatWindow from '../components/ChatWindow.jsx'
import { api } from '../api/client.js'

function Chat() {
  const [conversas, setConversas] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [erro, setErro] = useState('')

  const selectedContato = useMemo(
    () => conversas.find((conversa) => conversa.id === selectedId) || null,
    [conversas, selectedId]
  )

  const loadConversas = useCallback(async () => {
    try {
      const data = await api.listarConversas()
      setConversas(data)

      if (!selectedId && data.length) {
        setSelectedId(data[0].id)
      }
    } catch (error) {
      setErro(error.message)
    }
  }, [selectedId])

  const loadMensagens = useCallback(async () => {
    if (!selectedId) return
    try {
      const data = await api.listarMensagens(selectedId)
      setMensagens(data)
    } catch (error) {
      setErro(error.message)
    }
  }, [selectedId])

  useEffect(() => {
    loadConversas()
  }, [loadConversas])

  useEffect(() => {
    const interval = setInterval(loadConversas, 8000)
    return () => clearInterval(interval)
  }, [loadConversas])

  useEffect(() => {
    loadMensagens()
    const interval = setInterval(loadMensagens, 3000)
    return () => clearInterval(interval)
  }, [loadMensagens])

  const handleSend = async (event) => {
    event.preventDefault()
    if (!selectedId || !texto.trim()) return

    try {
      setSending(true)
      await api.enviarMensagemManual(selectedId, texto.trim())
      setTexto('')
      await Promise.all([loadMensagens(), loadConversas()])
    } catch (error) {
      setErro(error.message)
    } finally {
      setSending(false)
    }
  }

  const handleToggleBot = async (botAtivo) => {
    if (!selectedContato) return

    try {
      setToggleLoading(true)
      await api.botControl({
        contato_id: selectedContato.id,
        bot_ativo: botAtivo
      })
      await loadConversas()
    } catch (error) {
      setErro(error.message)
    } finally {
      setToggleLoading(false)
    }
  }

  return (
    <div className="flex min-h-[560px] flex-col md:flex-row">
      <ChatSidebar
        conversas={conversas}
        selectedId={selectedId}
        onSelect={(contato) => setSelectedId(contato.id)}
      />

      <div className="flex min-h-[560px] flex-1 flex-col">
        {erro ? <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p> : null}
        <ChatWindow
          contato={selectedContato}
          mensagens={mensagens}
          texto={texto}
          onTextoChange={setTexto}
          onSend={handleSend}
          onToggle={handleToggleBot}
          sending={sending}
          toggleLoading={toggleLoading}
        />
      </div>
    </div>
  )
}

export default Chat
