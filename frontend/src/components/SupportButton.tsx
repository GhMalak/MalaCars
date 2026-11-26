import { supportUrl } from '../lib/support'

export function IconWhatsApp({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.07c-.25.7-1.44 1.33-1.98 1.38-.54.06-1.04.08-1.79-.11a14.6 14.6 0 0 1-4.6-2.62 11.3 11.3 0 0 1-2.3-3.06c-.24-.48-.4-1.06-.4-1.63 0-.85.44-1.47.72-1.76.26-.29.55-.33.75-.33h.32c.2 0 .44.01.66.5.25.55.77 1.9.84 2.04.07.14.11.3.02.48-.09.19-.4.56-.57.75-.13.15-.26.28-.11.55.14.26.64 1.06 1.37 1.71.94.84 1.62 1.07 1.88 1.2.25.14.42.12.58-.05.18-.19.72-.82.91-1.1.19-.29.38-.24.63-.15.25.09 1.6.77 1.88.9.27.14.45.2.52.32.06.11.06.66-.19 1.36Z" />
    </svg>
  )
}

/** Botão discreto de suporte, flutuando acima da navegação do celular. */
export function SupportButton() {
  const url = supportUrl()
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o suporte no WhatsApp"
      title="Falar com o suporte"
      className="fixed right-4 bottom-20 lg:right-6 lg:bottom-6 z-30 h-11 w-11 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/15 flex items-center justify-center hover:bg-[#1ebe5d] transition"
    >
      <IconWhatsApp />
    </a>
  )
}
