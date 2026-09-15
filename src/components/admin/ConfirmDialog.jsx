export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirming }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink/60">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {confirming ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}
