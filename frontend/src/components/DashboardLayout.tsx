import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { loadMyProfile, type Profile } from '../lib/account'
import { useAuth } from '../lib/AuthContext'
import { supportUrl } from '../lib/support'
import { Avatar } from './Avatar'
import { IconWhatsApp, SupportButton } from './SupportButton'

const desktopLinks = [
  { to: '/app', label: 'Visão geral', end: true },
  { to: '/app/veiculos', label: 'Veículos' },
  { to: '/app/motoristas', label: 'Motoristas' },
  { to: '/app/contratos', label: 'Contratos' },
  { to: '/app/financeiro', label: 'Financeiro' },
  { to: '/app/gastos', label: 'Gastos' },
  { to: '/app/manutencoes', label: 'Manutenções' },
  { to: '/app/lembretes', label: 'Lembretes' },
]

function IconHome() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  )
}

function IconCar() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 13.5 5 8.5A2 2 0 0 1 6.9 7h10.2A2 2 0 0 1 19 8.5l1.5 5V18a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4.5Z" />
      <circle cx="7.5" cy="13.5" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

function IconPeople() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
      <circle cx="9.5" cy="7.5" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 19v-1a3.5 3.5 0 0 0-2.5-3.35M16.5 5.7a2.4 2.4 0 0 1 0 4.6" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5A1.5 1.5 0 0 1 5 7h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5A1.5 1.5 0 0 1 3.5 17.5v-9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 13.5h4V11h-4a1.5 1.5 0 0 0 0 3Z" />
    </svg>
  )
}

function IconMore() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  )
}

const bottomLinks = [
  { to: '/app', label: 'Início', end: true, icon: IconHome },
  { to: '/app/veiculos', label: 'Veículos', icon: IconCar },
  { to: '/app/motoristas', label: 'Motoristas', icon: IconPeople },
  { to: '/app/financeiro', label: 'Financeiro', icon: IconWallet },
]

const moreLinks = [
  { to: '/app/contratos', label: 'Contratos' },
  { to: '/app/gastos', label: 'Gastos' },
  { to: '/app/manutencoes', label: 'Manutenções' },
  { to: '/app/lembretes', label: 'Lembretes' },
  { to: '/app/conta', label: 'Minha conta' },
  { to: '/app/seguranca', label: 'Segurança' },
]

function linkClass(isActive: boolean) {
  return `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
  }`
}

export default function DashboardLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    loadMyProfile().then(setProfile)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const moreActive = moreLinks.some((l) => location.pathname.startsWith(l.to))
  const support = supportUrl()

  return (
    <div className="min-h-dvh flex bg-[#F7F7F8]">
      <aside className="hidden lg:flex w-60 shrink-0 bg-ink text-white flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-white/10">
          <img src="/athena-icon.svg" alt="Athena Frotas" className="h-7 w-7" />
          <span className="font-extrabold tracking-tight">
            ATHENA <span className="text-brand-light">FROTAS</span>
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {desktopLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => linkClass(isActive)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link
            to="/app/conta"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <Avatar name={profile?.full_name} path={profile?.avatar_path} size="sm" />
            <span className="min-w-0 truncate">{profile?.full_name || 'Minha conta'}</span>
          </Link>
          {support && (
            <a
              href={support}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <IconWhatsApp className="h-4 w-4" />
              Suporte
            </a>
          )}
          <button
            onClick={handleSignOut}
            className="w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-black/5 px-4 py-3 flex items-center gap-2">
          <img src="/athena-icon.svg" alt="" className="h-7 w-7" />
          <span className="font-extrabold tracking-tight text-sm">
            ATHENA <span className="text-brand">FROTAS</span>
          </span>
          <Link to="/app/conta" className="ml-auto" aria-label="Minha conta">
            <Avatar name={profile?.full_name} path={profile?.avatar_path} size="sm" />
          </Link>
        </header>

        <main className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-4 py-4 pb-28 lg:px-6 lg:py-8 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/40" aria-label="Fechar menu" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/15" />
            <p className="text-xs font-semibold uppercase tracking-widest text-black/40 mb-3">Mais</p>
            <div className="space-y-1">
              {moreLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? 'bg-brand/10 text-brand' : 'text-ink'}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {support && (
                <a
                  href={support}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-ink"
                >
                  <IconWhatsApp className="h-4 w-4 text-[#25D366]" />
                  Suporte
                </a>
              )}
              <button onClick={handleSignOut} className="w-full text-left rounded-xl px-4 py-3 text-sm font-semibold text-red-600">
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-black/10 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {bottomLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-h-14 px-1 py-1.5 text-[10px] leading-tight font-semibold ${
                  isActive ? 'text-brand' : 'text-black/45'
                }`
              }
            >
              <l.icon />
              {l.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-14 px-1 py-1.5 text-[10px] leading-tight font-semibold ${
              moreActive ? 'text-brand' : 'text-black/45'
            }`}
          >
            <IconMore />
            Mais
          </button>
        </div>
      </nav>

      <SupportButton />
    </div>
  )
}
