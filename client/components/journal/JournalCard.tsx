'use client'

import { motion } from 'motion/react'
import { Calendar, MapPin } from 'lucide-react'

type JournalCardProps = {
  id: string
  title: string
  placeName: string
  date: string
  mood?: string
  content: string
  photoUrl?: string
  onClick?: () => void
}

export function JournalCard({
  title,
  placeName,
  date,
  mood,
  content,
  photoUrl,
  onClick,
}: JournalCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 transition-colors"
    >
      <div className="flex">
        {/* Photo thumbnail */}
        {photoUrl && (
          <div className="w-24 md:w-32 flex-shrink-0">
            <img
              src={photoUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 md:p-5 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-serif font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                {mood && <span className="mr-2">{mood}</span>}
                {title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-white/40">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs">{placeName}</span>
                </div>
                <div className="flex items-center gap-1 text-white/40">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs">
                    {new Date(date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
