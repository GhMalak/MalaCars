const nav = ['Visão geral', 'Veículos', 'Motoristas', 'Contratos', 'Financeiro', 'Manutenções']

const overviewStats = [
  { label: 'Veículos ativos', value: '18/21' },
  { label: 'Motoristas ativos', value: '16/19' },
  { label: 'Contratos ativos', value: '14' },
  { label: 'Em manutenção', value: '3' },
]

const vehicles = [
  { plate: 'RTA-4H21', model: 'Onix 2023', km: '42.180 km', status: 'Ativo', tone: 'bg-green-100 text-green-700' },
  { plate: 'QWE-9B07', model: 'Cronos 2022', km: '61.450 km', status: 'Alugado', tone: 'bg-blue-100 text-blue-700' },
  { plate: 'FGH-2C88', model: 'Argo 2024', km: '18.930 km', status: 'Manutenção', tone: 'bg-amber-100 text-amber-700' },
  { plate: 'JKL-5D14', model: 'HB20 2021', km: '89.220 km', status: 'Ativo', tone: 'bg-green-100 text-green-700' },
]

function Sidebar({ active }: { active: string }) {
  return (
    <aside className="hidden sm:flex w-[132px] shrink-0 bg-ink text-white flex-col">
      <div className="px-3 py-3.5 flex items-center gap-1.5 border-b border-white/10">
        <img src="/athena-icon.svg" alt="" className="h-5 w-5" />
        <span className="font-extrabold text-[9px] tracking-tight leading-tight">
          ATHENA <span className="text-brand-light">FROTAS</span>
        </span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map((item) => (
          <div
            key={item}
            className={`rounded-md px-2 py-1.5 text-[10px] font-medium ${
              item === active ? 'bg-brand text-white' : 'text-white/55'
            }`}
          >
            {item}
          </div>
        ))}
      </nav>
    </aside>
  )
}

function OverviewMock() {
  return (
    <div className="flex-1 min-w-0 bg-[#F7F7F8] p-4 md:p-5">
      <div className="text-[13px] font-extrabold tracking-tight">Visão geral</div>
      <p className="text-[10px] text-black/40 mt-0.5 mb-3">Resumo da sua operação em tempo real.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {overviewStats.map((s) => (
          <div key={s.label} className="bg-white border border-black/10 rounded-lg p-2.5">
            <div className="text-sm md:text-base font-extrabold">{s.value}</div>
            <div className="text-[9px] text-black/45 mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white border border-black/10 rounded-lg p-3">
          <div className="text-[10px] font-bold">Cobranças em atraso</div>
          <div className="text-lg font-extrabold text-red-600 mt-1">R$ 2.480,00</div>
          <div className="text-[9px] text-black/40 mt-0.5">3 cobrança(s) vencida(s)</div>
        </div>
        <div className="bg-white border border-black/10 rounded-lg p-3">
          <div className="text-[10px] font-bold">A vencer (30 dias)</div>
          <div className="text-lg font-extrabold text-amber-600 mt-1">R$ 8.150,00</div>
          <div className="text-[9px] text-black/40 mt-0.5">11 cobrança(s)</div>
        </div>
      </div>
      <div className="hidden sm:grid grid-cols-2 gap-2">
        <div className="bg-white border border-black/10 rounded-lg p-3">
          <div className="text-[10px] font-bold mb-2">Manutenções próximas</div>
          <div className="flex justify-between text-[10px] border-b border-black/5 pb-1.5">
            <span>Revisão — Onix</span>
            <span className="text-black/40">28/09</span>
          </div>
          <div className="flex justify-between text-[10px] pt-1.5">
            <span>Troca de óleo — Argo</span>
            <span className="text-black/40">02/10</span>
          </div>
        </div>
        <div className="bg-white border border-black/10 rounded-lg p-3">
          <div className="text-[10px] font-bold mb-2">CNH a vencer</div>
          <div className="flex justify-between text-[10px] border-b border-black/5 pb-1.5">
            <span>Carlos Mendes</span>
            <span className="text-black/40">12/10</span>
          </div>
          <div className="flex justify-between text-[10px] pt-1.5">
            <span>Ana Souza</span>
            <span className="text-black/40">19/10</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function VehiclesMock() {
  return (
    <div className="flex-1 min-w-0 bg-[#F7F7F8] p-4 md:p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[13px] font-extrabold tracking-tight">Veículos</div>
          <p className="text-[10px] text-black/40 mt-0.5">Quilometragem e situação de cada veículo da frota.</p>
        </div>
        <span className="rounded-md bg-brand text-white text-[10px] font-semibold px-2.5 py-1">+ Novo veículo</span>
      </div>
      <div className="bg-white border border-black/10 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[9px] text-black/40 border-b border-black/10">
              <th className="px-3 py-2 font-medium">Placa</th>
              <th className="px-3 py-2 font-medium">Modelo</th>
              <th className="hidden sm:table-cell px-3 py-2 font-medium">KM</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.plate} className="border-b border-black/5 last:border-0 text-[10px]">
                <td className="px-3 py-2 font-semibold">{v.plate}</td>
                <td className="px-3 py-2 text-black/70">{v.model}</td>
                <td className="hidden sm:table-cell px-3 py-2 text-black/50">{v.km}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${v.tone}`}>
                    {v.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DashboardPreview({ variant = 'overview' }: { variant?: 'overview' | 'vehicles' }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-2xl overflow-hidden text-left select-none pointer-events-none">
      <div className="flex items-center gap-1.5 px-4 py-2 bg-ink">
        <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        <span className="ml-3 text-[10px] text-white/35">painel.athenafrotas.com</span>
      </div>
      <div className="flex min-h-[240px] md:min-h-[320px]">
        <Sidebar active={variant === 'vehicles' ? 'Veículos' : 'Visão geral'} />
        {variant === 'vehicles' ? <VehiclesMock /> : <OverviewMock />}
      </div>
    </div>
  )
}
