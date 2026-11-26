import { Link } from 'react-router-dom'
import DashboardPreview from '../components/DashboardPreview'
import { IconWhatsApp } from '../components/SupportButton'
import { supportEmail, supportUrl } from '../lib/support'

const features = [
  { title: 'Veículos', desc: 'Quilometragem, status e histórico de cada carro da frota.' },
  { title: 'Motoristas', desc: 'CNH, categoria, vencimento e dados de contato sempre à mão.' },
  { title: 'Contratos', desc: 'Valores semanais, vencimentos e vínculo veículo-motorista.' },
  { title: 'Financeiro', desc: 'Cobranças, atrasos e recebimentos organizados.' },
  { title: 'Manutenções', desc: 'Revisões agendadas e custos previstos.' },
  { title: 'Alertas', desc: 'Avisos automáticos do que precisa da sua atenção.' },
]

export default function Landing() {
  const landingSupport = supportUrl('dúvida pelo site')

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-black/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <a href="#inicio" className="flex items-center gap-2 min-w-0">
            <img src="/athena-icon.svg" alt="Athena Frotas" className="h-8 w-8 shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="font-extrabold tracking-tight text-sm sm:text-base">
                ATHENA <span className="text-brand">FROTAS</span>
              </div>
              <div className="hidden xs:block text-[10px] uppercase tracking-widest text-black/50">
                Controle que roda com você
              </div>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-black/70">
            <a href="#funcionalidades" className="hover:text-black">Funcionalidades</a>
            <a href="#demonstracao" className="hover:text-black">Conheça o sistema</a>
            <a href="#beneficios" className="hover:text-black">Benefícios</a>
          </nav>
          <Link
            to="/login"
            className="shrink-0 rounded-full bg-ink text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 hover:bg-black transition"
          >
            Acessar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/10 via-white to-white" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 sm:pt-16 sm:pb-20 md:pt-24 md:pb-28 text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-brand uppercase mb-4">
            Gestão de frota, sem complicação
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Mais controle para sua frota.
            <br />
            <span className="italic font-serif text-black/60">Menos dor de cabeça.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-black/60 text-base sm:text-lg px-1">
            Gerencie veículos, motoristas, contratos, cobranças e manutenções em um só lugar.
            Simples, organizado e acessível de qualquer dispositivo.
          </p>
          <div className="mt-8">
            <Link
              to="/cadastro"
              className="inline-block rounded-full bg-brand text-white font-semibold px-8 py-3.5 hover:bg-brand-dark transition shadow-lg shadow-brand/30"
            >
              Começar agora
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-black/60">
            {['Controle centralizado', 'Fácil de usar', 'Acesso pelo celular', 'Acesso pelo computador'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-brand">✓</span> {t}
              </span>
            ))}
          </div>

          <div className="mt-10">
            <DashboardPreview variant="overview" />
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-14 sm:py-20 bg-black/[0.02]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <span className="text-xs font-bold tracking-widest text-brand uppercase">Operação organizada</span>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight max-w-xl">
            Tudo o que você precisa para gerenciar sua frota.
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-black/10 bg-white p-6">
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="mt-2 text-black/60 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demonstração */}
      <section id="demonstracao" className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <span className="text-xs font-bold tracking-widest text-brand uppercase">Visão completa</span>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight max-w-xl">
            Veja na prática como funciona.
          </h2>
          <p className="mt-3 text-black/60 max-w-xl">
            Uma visão objetiva para acompanhar a rotina de toda a operação, em qualquer lugar.
          </p>
          <div className="mt-10">
            <DashboardPreview variant="vehicles" />
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-14 sm:py-20 bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <span className="text-xs font-bold tracking-widest text-white/70 uppercase">Uma operação mais leve</span>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Gestão simples. Mais controle da sua operação.
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-white/80">
            Economize tempo, evite esquecimentos, organize cobranças, acompanhe manutenções e
            mantenha as informações da sua frota em um só lugar.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section id="acesso" className="py-14 sm:py-20 text-center px-4">
        <span className="text-xs font-bold tracking-widest text-brand uppercase">Comece agora</span>
        <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
          Sua frota merece mais controle.
        </h2>
        <div className="mt-8">
          <Link
            to="/cadastro"
            className="inline-block rounded-full bg-ink text-white font-semibold px-8 py-3.5 hover:bg-black transition"
          >
            Criar minha conta
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-black/50 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <img src="/athena-icon.svg" alt="Athena Frotas" className="h-6 w-6" />
            <span className="font-bold text-black/70">ATHENA FROTAS</span>
            <span>— Controle que roda com você.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {landingSupport && (
              <a
                href={landingSupport}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium hover:text-black transition"
              >
                <IconWhatsApp className="h-4 w-4 text-[#25D366]" />
                Fale conosco
              </a>
            )}
            {supportEmail && (
              <a href={`mailto:${supportEmail}`} className="font-medium hover:text-black transition">
                {supportEmail}
              </a>
            )}
            <span>© {new Date().getFullYear()} Athena Frotas.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
