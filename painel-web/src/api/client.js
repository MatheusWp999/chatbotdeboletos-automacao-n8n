const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    },
    ...options
  })

  if (!response.ok) {
    let message = 'Erro na requisicao'
    try {
      const body = await response.json()
      message = body.message || message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

export const api = {
  health: () => request('/api/health'),
  listarConversas: () => request('/api/conversas'),
  listarMensagens: (contatoId) => request(`/api/conversas/${contatoId}/mensagens`),
  enviarMensagemManual: (contatoId, mensagem) =>
    request(`/api/conversas/${contatoId}/mensagem`, {
      method: 'POST',
      body: JSON.stringify({ mensagem })
    }),

  listarClientes: (tipo) => request(`/api/clientes${tipo ? `?tipo=${tipo}` : ''}`),
  criarCliente: (payload) =>
    request('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  atualizarCliente: (id, payload) =>
    request(`/api/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  removerCliente: (id) =>
    request(`/api/clientes/${id}`, {
      method: 'DELETE'
    }),

  listarBoletos: ({ mes, status }) => {
    const params = new URLSearchParams()
    if (mes) params.append('mes', mes)
    if (status) params.append('status', status)
    const query = params.toString()
    return request(`/api/boletos${query ? `?${query}` : ''}`)
  },
  criarBoleto: (formData) =>
    request('/api/boletos', {
      method: 'POST',
      body: formData
    }),
  enviarBoletoAgora: (id) =>
    request(`/api/boletos/${id}/enviar`, {
      method: 'POST'
    }),
  removerBoleto: (id) =>
    request(`/api/boletos/${id}`, {
      method: 'DELETE'
    }),

  buscarConfiguracao: () => request('/api/configuracao'),
  salvarConfiguracao: (payload) =>
    request('/api/configuracao', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  listarGerentes: () => request('/api/gerentes'),
  botControl: (payload) =>
    request('/api/bot-control', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  listarAlertas: () => request('/api/alertas')
}
