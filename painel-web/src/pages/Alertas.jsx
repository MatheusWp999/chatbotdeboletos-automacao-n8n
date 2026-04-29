import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { api } from '../api/client.js'

function Alertas() {
  const [alertas, setAlertas] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await api.listarAlertas()
        setAlertas(data)
      } catch (error) {
        setErro(error.message)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl border border-base-200 bg-base-50 p-4">
        <h2 className="text-lg font-semibold text-base-900">Historico de alertas</h2>
        <p className="text-sm text-base-700">Ultimos alertas enviados para os gerentes.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-base-200">
        <table className="min-w-full divide-y divide-base-200 text-sm">
          <thead className="bg-base-50 text-left text-xs uppercase tracking-[0.16em] text-base-700">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Gerente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Conteudo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-100">
            {alertas.map((alerta) => (
              <tr key={alerta.id} className="bg-white">
                <td className="px-4 py-3 text-base-700">
                  {dayjs(alerta.enviado_em).format('DD/MM/YYYY HH:mm')}
                </td>
                <td className="px-4 py-3 font-medium text-base-900">{alerta.gerente_nome || '-'}</td>
                <td className="px-4 py-3 text-base-700">{alerta.tipo_alerta || '-'}</td>
                <td className="px-4 py-3 text-base-700">{alerta.conteudo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {erro ? <p className="text-sm text-red-700">{erro}</p> : null}
    </div>
  )
}

export default Alertas
