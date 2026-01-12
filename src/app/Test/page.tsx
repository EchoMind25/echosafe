export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
        <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">✓</span>
        </div>
        <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text mb-4 text-center">
          Tailwind Works!
        </h1>
        <p className="text-slate-600 text-center mb-6">
          If you see colors and styling, Tailwind is configured correctly.
        </p>
        <button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
          Test Button
        </button>
      </div>
    </div>
  )
}