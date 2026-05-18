# Globe.travel

Globe.travel is a group-trip planning app for turning messy travel ideas into mapped itineraries friends can review together.

The current product focus:

- Natural-language trip planning in `/chat`
- Editable Trip Studio workspaces at `/trips/[tripId]`
- Itinerary-linked maps and route states
- Saved trips and private trip notes
- Public share pages with friend feedback at `/t/[shareSlug]`
- Explorer and Adventurer subscription paths

## App Structure

- `client/`: Next.js app, API routes, UI, planner runtime, Mapbox and Supabase integrations
- `mobile/`: sibling Expo app scaffold
- `RELEASE_READINESS_MEMO.md`: current release evidence log
- `PLATFORM_READINESS_ROADMAP.md`: several-month QA and platform readiness operating plan

## Run Locally

```bash
cd client
npm install
npm run dev -- --port 3000
```

Open `http://localhost:3000`.

## Quality Checks

```bash
cd client
npm run lint
npm run build
npm run qa:smoke
```

Run smoke checks against production or a Vercel preview:

```bash
cd client
QA_BASE_URL=https://globe-travel-two.vercel.app npm run qa:smoke
```

Optional live trip/share checks:

```bash
cd client
QA_BASE_URL=http://localhost:3000 \
QA_TRIP_ID=<trip-id> \
QA_SHARE_SLUG=<share-slug> \
npm run qa:smoke
```

## Environment

`client/.env.local`

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Release Workflow

Before a production deploy:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Run `npm run qa:smoke` against local or preview.
4. Use Browser to complete the current release checklist in `PLATFORM_READINESS_ROADMAP.md`.
5. Record material evidence in `RELEASE_READINESS_MEMO.md`.
6. Deploy through Vercel and production-smoke the aliased URL.
