export function GenrePill({ genre }: { genre: string }) {
  return (
    <span className="rounded-full border border-stardust-pink/35 bg-stardust-pink/10 px-2.5 py-[3px] font-mono text-[11px] uppercase tracking-wide text-[#F0B9E4]">
      {genre}
    </span>
  )
}
