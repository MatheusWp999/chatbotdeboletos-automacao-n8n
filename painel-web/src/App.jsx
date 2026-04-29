import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Chat from './pages/Chat.jsx'
import Clientes from './pages/Clientes.jsx'
import Boletos from './pages/Boletos.jsx'
import ConfigBot from './pages/ConfigBot.jsx'
import Alertas from './pages/Alertas.jsx'

const MENU = [
  { to: '/chat', label: 'Chat' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/boletos', label: 'Boletos' },
  { to: '/config', label: 'Config do Bot' },
  { to: '/alertas', label: 'Alertas' }
]

function TopMenu() {
  const location = useLocation()

  return (
    <header className="border-b border-base-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-base-700">Operacao financeira</p>
          <h1 className="text-lg font-semibold text-base-900 sm:text-xl">Chatbot de Boletos</h1>
        </div>

        <nav className="flex flex-wrap justify-end gap-2">
          {MENU.map((item) => {
            const active = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-base-900 text-white shadow-sm'
                    : 'bg-base-100 text-base-700 hover:bg-base-200 hover:text-base-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <TopMenu />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="rounded-3xl border border-base-200 bg-white shadow-panel">
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/boletos" element={<Boletos />} />
            <Route path="/config" element={<ConfigBot />} />
            <Route path="/alertas" element={<Alertas />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
