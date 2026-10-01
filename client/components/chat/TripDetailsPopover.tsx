'use client'

import { Minus, Plus, SlidersHorizontal, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type TripPace = 'relaxed' | 'balanced' | 'packed'
export type TripBudget = 'budget' | 'mid' | 'luxury'
export type TripDetails = { travelers: number; pace: TripPace; budget: TripBudget }

export const DEFAULT_TRIP_DETAILS: TripDetails = { travelers: 2, pace: 'balanced', budget: 'mid' }

const PACE_LABEL: Record<TripPace, string> = { relaxed: 'Relaxed', balanced: 'Balanced', packed: 'Packed' }
const BUDGET_LABEL: Record<TripBudget, string> = { budget: 'Budget', mid: 'Mid-range', luxury: 'Luxury' }

export function summarizeTripDetails(details: TripDetails) {
  const who = details.travelers === 1 ? 'Solo' : `${details.travelers} travelers`
  return `${who} · ${PACE_LABEL[details.pace]} · ${BUDGET_LABEL[details.budget]}`
}

export function TripDetailsPopover({
  value,
  onChange,
  disabled,
}: {
  value: TripDetails
  onChange: (next: TripDetails) => void
  disabled?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled} className="rounded-full">
          <SlidersHorizontal />
          {summarizeTripDetails(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-5">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" /> Who is going?
          </Label>
          <div className="flex items-center justify-between rounded-lg border p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fewer travelers"
              disabled={value.travelers <= 1}
              onClick={() => onChange({ ...value, travelers: Math.max(1, value.travelers - 1) })}
            >
              <Minus />
            </Button>
            <span className="text-sm font-medium tabular-nums" aria-live="polite">
              {value.travelers === 1 ? '1 traveler' : `${value.travelers} travelers`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="More travelers"
              disabled={value.travelers >= 20}
              onClick={() => onChange({ ...value, travelers: Math.min(20, value.travelers + 1) })}
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Pace</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={value.pace}
            onValueChange={(pace) => pace && onChange({ ...value, pace: pace as TripPace })}
            className="w-full"
          >
            {(Object.keys(PACE_LABEL) as TripPace[]).map((pace) => (
              <ToggleGroupItem key={pace} value={pace} className="flex-1">
                {PACE_LABEL[pace]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label>Budget</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={value.budget}
            onValueChange={(budget) => budget && onChange({ ...value, budget: budget as TripBudget })}
            className="w-full"
          >
            {(Object.keys(BUDGET_LABEL) as TripBudget[]).map((budget) => (
              <ToggleGroupItem key={budget} value={budget} className="flex-1">
                {BUDGET_LABEL[budget]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </PopoverContent>
    </Popover>
  )
}
