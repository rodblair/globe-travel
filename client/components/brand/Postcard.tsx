import { Postmark } from '@/components/brand/Postmark'
import { Scene, type SceneName } from '@/components/brand/Scene'
import { cn } from '@/lib/utils'

/**
 * A trip as a paper postcard: illustrated scene, white border, tilt and an
 * optional postmark. The wrapper gets the tilt; give it a width.
 */
export function Postcard({
  scene,
  title,
  caption,
  tilt = 0,
  postmark = false,
  aspect = 'aspect-[4/3]',
  className,
  titleClassName,
}: {
  scene: SceneName
  title: string
  caption?: string
  tilt?: number
  postmark?: boolean
  aspect?: string
  className?: string
  titleClassName?: string
}) {
  return (
    <figure
      className={cn('relative m-0 rounded-md bg-[#fffbf3] p-2.5 pb-4 text-[#0f2431] shadow-lg', className)}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      <div className={cn('relative overflow-hidden rounded-[5px]', aspect)}>
        <Scene scene={scene} />
        {postmark ? <Postmark className="absolute top-2 right-2 size-14" /> : null}
      </div>
      <figcaption className="px-1.5 pt-3">
        <span className={cn('block font-serif text-2xl leading-tight font-medium', titleClassName)}>{title}</span>
        {caption ? <span className="mt-0.5 block text-sm text-[#55656f]">{caption}</span> : null}
      </figcaption>
    </figure>
  )
}
