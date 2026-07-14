export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
      <img
        src="/LogoCashFlow.webp"
        alt="Cash Flow"
        className="w-24 h-24 animate-pulse"
      />

      <div className="mt-8 w-56 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full w-1/2 bg-[#2E6F40] animate-loading rounded-full" />
      </div>

      <p className="mt-5 text-slate-500 text-sm tracking-wide">
        Cargando...
      </p>
    </div>
  );
}