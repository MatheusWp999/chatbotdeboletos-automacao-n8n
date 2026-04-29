function BotToggle({ ativo, onChange, loading }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!ativo)}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
        ativo
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
      } ${loading ? 'opacity-60' : ''}`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${ativo ? 'bg-emerald-500' : 'bg-amber-500'}`}
      />
      {ativo ? 'Bot ligado' : 'Bot desligado'}
    </button>
  )
}

export default BotToggle
