import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export const FAQ_ITEMS = [
  {
    q: 'What is Globe.travel?',
    a: 'Globe.travel turns a plain-language trip idea into a day-by-day itinerary on a map. You can edit it, share one link with your group, and collect feedback in one place instead of a long group chat.',
  },
  {
    q: 'Do I need an account to try it?',
    a: 'No. Choose "Try as guest" to start planning right away. Create a free account when you want to keep your trips across devices.',
  },
  {
    q: 'Can my friends see the plan without signing up?',
    a: 'Yes. Share links open a read-only trip page that anyone can view. Friends can leave a reaction and a comment without creating an account, and only you can edit the trip.',
  },
  {
    q: 'Does Globe.travel book flights or hotels?',
    a: 'Not directly. Globe.travel plans and maps the trip, and gives you links to check stays and activities with the providers you already trust.',
  },
  {
    q: 'What does it cost?',
    a: 'Explorer is free: 2 saved trips, 10 AI messages a day and shareable review links. Adventurer is $4.99 a month or $49 a year with unlimited trips and AI messages, and includes a 7-day free trial. You can cancel any time.',
  },
  {
    q: 'Which destinations work best?',
    a: 'City trips and city breaks of 2 to 7 days work best, since the maps and walking routes are built for neighbourhood-level planning. You can describe any destination and refine the plan from there.',
  },
]

export function LandingFaq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQ_ITEMS.map((item) => (
        <AccordionItem key={item.q} value={item.q}>
          <AccordionTrigger className="text-left text-base font-medium">{item.q}</AccordionTrigger>
          <AccordionContent className="text-base text-muted-foreground">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
