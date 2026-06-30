export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#3D5AFE]" aria-hidden="true" />
            <span className="font-display text-sm font-bold text-[#0B0F1A]">NEXORA</span>
          </div>
          <p className="font-mono text-xs text-slate-400">
            AI · Technology · Software Development — dispatched daily
          </p>
        </div>
      </div>
    </footer>
  );
}
