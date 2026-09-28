export default function Loading() {
  return (
    <div className="space-y-6" aria-label="Cargando contenido" aria-busy="true">
      <div className="h-44 animate-pulse rounded-[2rem] bg-white/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-32 animate-pulse rounded-2xl bg-white/70" key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-3xl bg-white/70" />
        <div className="h-72 animate-pulse rounded-3xl bg-white/70" />
      </div>
    </div>
  );
}
