'use client'

import Image from 'next/image'
import { X, Star, Calendar, MapPin, BookOpen, Edit3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

type PlaceDetail = {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
  status: 'visited' | 'bucket_list' | 'planning'
  visit_date?: string
  rating?: number
  notes?: string
  photo_url?: string
}

type PlaceDetailSheetProps = {
  place: PlaceDetail | null
  isOpen: boolean
  onClose: () => void
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-[var(--brass)] fill-amber-400' : 'text-foreground/20'}`}
        />
      ))}
    </div>
  )
}

export function PlaceDetailSheet({ place, isOpen, onClose }: PlaceDetailSheetProps) {
  return (
    <Sheet open={isOpen && Boolean(place)} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[82vh] overflow-y-auto rounded-t-3xl border-rule bg-paper-raised/95 p-0 shadow-[var(--shadow-lg)] backdrop-blur-xl"
      >
        {place && (
          <>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-paper-recessed" />
              </div>

              {/* Photo banner */}
              {place.photo_url ? (
                <div className="relative h-48 mx-4 mt-2 rounded-2xl overflow-hidden">
                  <Image
                    src={place.photo_url}
                    alt={place.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : (
                <div className="relative h-32 mx-4 mt-2 rounded-2xl overflow-hidden bg-paper-recessed flex items-center justify-center">
                  <span className="text-5xl">{place.country ? getFlagEmoji(place.country) : '🌍'}</span>
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-4">
                <SheetHeader className="flex-row items-start justify-between gap-4 p-0 text-left">
                  <div className="min-w-0">
                    <SheetTitle className="font-serif text-2xl font-semibold text-foreground">
                      {place.name}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-foreground/40" />
                      <SheetDescription className="text-sm text-foreground/50">{place.country}</SheetDescription>
                    </div>
                  </div>
                  <SheetClose asChild>
                    <IconButton label={`Close ${place.name} details`} variant="secondary" className="shrink-0">
                      <X className="w-5 h-5" />
                    </IconButton>
                  </SheetClose>
                </SheetHeader>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={place.status === 'bucket_list' ? 'coastal' : 'brass'}
                  >
                    {place.status === 'visited'
                      ? 'Visited'
                      : place.status === 'bucket_list'
                      ? 'Saved idea'
                      : 'Planning'}
                  </Badge>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {place.visit_date && (
                    <div className="bg-paper-recessed rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-foreground/40 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">Visited</span>
                      </div>
                      <p className="text-sm text-foreground">
                        {new Date(place.visit_date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {place.rating && (
                    <div className="bg-paper-recessed rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-foreground/40 mb-1">
                        <Star className="w-3.5 h-3.5" />
                        <span className="text-xs">Rating</span>
                      </div>
                      <StarRating rating={place.rating} />
                    </div>
                  )}
                </div>

                {/* Notes */}
                {place.notes && (
                  <div className="bg-paper-recessed rounded-xl p-4">
                    <p className="text-sm text-foreground/70 leading-relaxed">{place.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1 rounded-xl">
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button variant="secondary" className="flex-1 rounded-xl">
                    <BookOpen className="w-4 h-4" />
                    View trip notes
                  </Button>
                </div>
              </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function getFlagEmoji(country: string): string {
  const flags: Record<string, string> = {
    'Japan': '🇯🇵', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
    'Germany': '🇩🇪', 'United Kingdom': '🇬🇧', 'United States': '🇺🇸',
    'Brazil': '🇧🇷', 'Australia': '🇦🇺', 'Thailand': '🇹🇭',
    'Mexico': '🇲🇽', 'India': '🇮🇳', 'China': '🇨🇳', 'Canada': '🇨🇦',
    'South Korea': '🇰🇷', 'Turkey': '🇹🇷', 'Greece': '🇬🇷',
    'Portugal': '🇵🇹', 'Morocco': '🇲🇦', 'Egypt': '🇪🇬',
  }
  return flags[country] || '🌍'
}
