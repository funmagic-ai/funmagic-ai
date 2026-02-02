import Link from 'next/link'
import { Star, ExternalLink, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ToolCardProps {
  slug: string
  name: string
  description: string
  category: string
  categoryLabel: string
  image: string
  rating: number
  pricing: 'free' | 'freemium' | 'paid'
  pricingLabel: string
  userCount?: string
  visitLabel: string
  locale: string
}

export function ToolCard({
  slug,
  name,
  description,
  categoryLabel,
  image,
  rating,
  pricingLabel,
  userCount,
  visitLabel,
  locale,
}: ToolCardProps) {
  return (
    <article className="glass-panel rounded-xl overflow-hidden transition-all duration-300 neon-hover group flex flex-col h-full">
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${image})` }}
        />
        {/* Pricing Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-white/10 uppercase text-[10px] font-bold tracking-wide">
            {pricingLabel}
          </Badge>
        </div>
        {/* Bookmark Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
          aria-label="Bookmark tool"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-xs text-primary font-medium mt-1 px-2 py-0.5 rounded bg-primary/10 w-fit border border-primary/20">
              {categoryLabel}
            </p>
          </div>
          {/* Rating */}
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-xs font-bold text-foreground">{rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Footer */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
          {/* User avatars */}
          {userCount && (
            <div className="flex -space-x-2">
              <div className="h-6 w-6 rounded-full bg-muted border border-card flex items-center justify-center text-[8px] font-bold">
                {userCount}
              </div>
            </div>
          )}

          <Link
            href={`/${locale}/tools/${slug}`}
            className="text-foreground hover:text-primary text-sm font-medium transition-colors flex items-center gap-1 ml-auto"
          >
            {visitLabel}
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}
