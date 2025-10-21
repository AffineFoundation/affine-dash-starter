export default function RedIndicator({ text, live = false }: { text: string; live?: boolean }) {
  return (
    <div className="flex items-center gap-1 border border-red-500 text-red-500 py-[2px] px-1 rounded-[4px] font-mono uppercase tracking-wide text-xs">
      {live && <div className="rounded-full bg-red-500 size-1" />}

      <span className="leading-none">{text}</span>
    </div>
  )
}
