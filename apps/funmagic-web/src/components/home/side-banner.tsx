import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SideBannerProps {
  title: string
  description: string
  label: string
  labelColor?: 'primary' | 'teal'
  image: string
  href: string
}

export function SideBanner({
  title,
  description,
  label,
  labelColor = 'primary',
  image,
  href,
}: SideBannerProps) {
  return (
    <Link
      href={href}
      className="relative aspect-[21/9] lg:aspect-auto lg:flex-1 rounded-2xl overflow-hidden group cursor-pointer block"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${image})` }}
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-90" />
      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6">
        <p
          className={cn(
            'text-sm font-semibold mb-1 uppercase tracking-wider',
            labelColor === 'primary' ? 'text-primary' : 'text-teal-400'
          )}
        >
          {label}
        </p>
        <h3 className="text-xl font-bold leading-tight">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      </div>
    </Link>
  )
}
