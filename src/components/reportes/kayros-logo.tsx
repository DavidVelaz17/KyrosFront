/** Logo de Kayrós Preuniversitario recreado en HTML/CSS (no tenemos el archivo original de la
 *  imagen que se compartió como referencia). Si existe el logo real como imagen, reemplazar este
 *  componente por un <img> apuntando a /public es lo más simple. */
export function KayrosLogo({ className }: { className?: string }) {
  return (
    <div className={`inline-flex w-44 flex-col items-center bg-zinc-900 px-3 py-2 ${className ?? ""}`}>
      <span className="text-2xl font-extrabold tracking-wide text-red-600">KAYRÓS</span>
      <span className="text-[10px] font-semibold tracking-[0.2em] text-white">PREUNIVERSITARIO</span>
    </div>
  );
}
