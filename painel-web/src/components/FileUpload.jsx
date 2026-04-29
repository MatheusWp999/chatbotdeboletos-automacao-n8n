function FileUpload({ onChange, file }) {
  return (
    <label className="block cursor-pointer rounded-xl border border-dashed border-base-200 bg-base-50 px-4 py-4 text-center transition hover:border-base-700 hover:bg-white">
      <span className="block text-sm font-medium text-base-900">Clique para selecionar PDF</span>
      <span className="mt-1 block text-xs text-base-700">Apenas arquivo .pdf</span>
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      {file ? <span className="mt-2 block text-xs text-emerald-700">{file.name}</span> : null}
    </label>
  )
}

export default FileUpload
