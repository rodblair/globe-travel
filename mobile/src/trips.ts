export type TripStop = {
  time: string;
  title: string;
  area: string;
  note: string;
  mood: 'food' | 'culture' | 'rest' | 'night';
};

export type TripDraft = {
  id: string;
  title: string;
  city: string;
  dates: string;
  crew: string;
  budget: string;
  status: string;
  consensus: number;
  stops: TripStop[];
};

export const featuredTrip: TripDraft = {
  id: 'kyoto-weekend',
  title: 'Kyoto Long Weekend',
  city: 'Kyoto',
  dates: 'May 22-25',
  crew: '4 friends',
  budget: 'Mid-range',
  status: 'Ready for feedback',
  consensus: 82,
  stops: [
    {
      time: '09:00',
      title: 'Nishiki Market breakfast',
      area: 'Kawaramachi',
      note: 'Start with food, keep the first morning low friction.',
      mood: 'food',
    },
    {
      time: '11:30',
      title: 'Kennin-ji and Gion walk',
      area: 'Higashiyama',
      note: 'Culture without turning the day into a checklist.',
      mood: 'culture',
    },
    {
      time: '15:00',
      title: 'Riverside reset',
      area: 'Kamo River',
      note: 'A real pause before dinner so the group keeps its legs.',
      mood: 'rest',
    },
    {
      time: '19:30',
      title: 'Pontocho dinner lane',
      area: 'Pontocho',
      note: 'Book one anchor dinner, then let the night stay loose.',
      mood: 'night',
    },
  ],
};

export const savedTrips: TripDraft[] = [
  featuredTrip,
  {
    id: 'lisbon-food',
    title: 'Lisbon Food Loop',
    city: 'Lisbon',
    dates: 'June 7-10',
    crew: '5 friends',
    budget: 'Value-minded',
    status: 'Needs dinner vote',
    consensus: 68,
    stops: featuredTrip.stops.slice(0, 3),
  },
  {
    id: 'copenhagen-summer',
    title: 'Copenhagen Summer Pace',
    city: 'Copenhagen',
    dates: 'July 3-6',
    crew: '3 friends',
    budget: 'Comfortable',
    status: 'Shareable',
    consensus: 91,
    stops: featuredTrip.stops.slice(1),
  },
];

export const starterPrompts = [
  'Plan a realistic 3-day city trip for 4 friends who want food, culture, and one memorable night out.',
  'Compare Lisbon, Copenhagen, and Barcelona for a budget-friendly friends trip.',
  'Ask me the right questions before recommending where my group should go.',
];
