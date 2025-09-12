import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <div className="font-sans text-gray-900 min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-[#2E6F40] text-white">
        <h1 className="text-2xl font-bold">Cash Flow</h1>
        <div className="space-x-4">
          <Link
            to="/login"
            className="px-4 py-2 border border-white rounded hover:bg-white hover:text-[#2E6F40] transition"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-[#A0D861] text-[#2E6F40] rounded hover:bg-[#6CB979] transition"
          >
            Registrarse
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col lg:flex-row items-center justify-between p-12 bg-[#F4F5F6]">
          <div className="lg:w-1/2">
            <h2 className="text-4xl font-bold mb-4 text-[#2D2D2D]">Controla tus finanzas con facilidad</h2>
            <p className="mb-6 text-gray-700">
              Registra tus ingresos y gastos, visualiza tus hábitos financieros y toma decisiones inteligentes cada día.
            </p>
            <Link
              to="/register"
              className="px-6 py-3 bg-[#2E6F40] text-white rounded hover:bg-[#1f4e2a] transition"
            >
              Empieza ahora
            </Link>
          </div>
          <div className="lg:w-1/3 mt-8 lg:mt-0">
            <img src="./LogoCashFlow.webp" alt="App ilustration" className="w-full rounded drop-shadow-2xl" />
          </div>
        </section>

        {/* Funciones */}
        <section className="p-12 bg-white">
          <h3 className="text-3xl font-bold mb-8 text-center text-[#2D2D2D]">Funciones principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#F4F5F6] rounded-2xl shadow text-center">
              <h4 className="font-semibold mb-2">Seguimiento de gastos</h4>
              <p>Visualiza tus gastos en tiempo real y detecta dónde puedes ahorrar.</p>
            </div>
            <div className="p-6 bg-[#F4F5F6] rounded-2xl shadow text-center">
              <h4 className="font-semibold mb-2">Gráficos y reportes</h4>
              <p>Analiza tus ingresos y egresos con gráficos interactivos y fáciles de entender.</p>
            </div>
            <div className="p-6 bg-[#F4F5F6] rounded-2xl shadow text-center">
              <h4 className="font-semibold mb-2">Recordatorios y alertas</h4>
              <p>No olvides tus pagos y controla tus finanzas con alertas personalizadas.</p>
            </div>
          </div>
        </section>

        {/* Por qué es bueno registrar tus finanzas */}
        <section className="p-12 bg-[#A0D861] text-[#2E6F40]">
          <h3 className="text-3xl font-bold mb-6 text-center">Por qué es importante registrar tus finanzas</h3>
          <ul className="max-w-4xl mx-auto space-y-4 list-disc list-inside">
            <li>Evitar gastos innecesarios y ahorrar de manera consciente.</li>
            <li>Tener un panorama claro de tus ingresos y egresos.</li>
            <li>Tomar decisiones financieras informadas.</li>
            <li>Planificar metas a corto y largo plazo.</li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#2E6F40] text-white text-center p-6">
        <p>&copy; 2025 Cash Flow. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
