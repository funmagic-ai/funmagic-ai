'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Slide {
  id: string
  title: string
  description: string
  image: string
  badge: string
}

interface HeroCarouselProps {
  slides: Slide[]
  featuredLabel: string
}

export function HeroCarousel({ slides, featuredLabel }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  // Auto-scroll (respects reduced motion preference)
  useEffect(() => {
    if (!emblaApi) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, 5000)
    return () => clearInterval(interval)
  }, [emblaApi])

  if (!slides.length) {
    return (
      <div className="relative aspect-[21/9] overflow-hidden rounded-2xl bg-muted animate-pulse" />
    )
  }

  return (
    <div className="relative aspect-[21/9] overflow-hidden rounded-2xl group cursor-pointer">
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {slides.map((slide) => (
            <div key={slide.id} className="relative h-full min-w-0 flex-[0_0_100%]">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-90" />
              {/* Feature Label */}
              <span className="absolute top-6 left-6 md:top-8 md:left-8 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground border border-primary/50 primary-glow">
                {featuredLabel}
              </span>
              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col gap-3">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  {slide.title}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-2xl line-clamp-2">
                  {slide.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        type="button"
        onClick={scrollPrev}
        className={cn(
          'absolute top-1/2 left-4 -translate-y-1/2 h-10 w-10 rounded-full',
          'bg-black/30 backdrop-blur-sm border border-white/10',
          'flex items-center justify-center text-white',
          'opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary'
        )}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        className={cn(
          'absolute top-1/2 right-4 -translate-y-1/2 h-10 w-10 rounded-full',
          'bg-black/30 backdrop-blur-sm border border-white/10',
          'flex items-center justify-center text-white',
          'opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary'
        )}
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots Indicator - Large touch targets with small visual dots */}
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex gap-0" role="tablist" aria-label="Carousel slides">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            className="flex items-center justify-center h-11 w-11 -mx-1"
            role="tab"
            aria-selected={selectedIndex === index}
            aria-label={`Go to slide ${index + 1}`}
          >
            <span
              className={cn(
                'h-1.5 rounded-full transition-all',
                selectedIndex === index ? 'w-8 bg-primary' : 'w-2 bg-white/20'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
