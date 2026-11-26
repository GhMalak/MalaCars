import { useEffect, useState } from 'react'
import { imageUrl } from '../lib/photos'

function initials(name?: string | null) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
}

export function Avatar({
  name,
  path,
  size = 'md',
}: {
  name?: string | null
  path?: string | null
  size?: keyof typeof sizes
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setUrl(null)
    if (path) {
      imageUrl(path)
        .then((signed) => {
          if (active) setUrl(signed)
        })
        .catch(() => undefined)
    }
    return () => {
      active = false
    }
  }, [path])

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full bg-brand/10 text-brand font-bold overflow-hidden ${sizes[size]}`}
    >
      {url ? <img src={url} alt={name || 'Avatar'} className="h-full w-full object-cover" /> : initials(name)}
    </span>
  )
}
