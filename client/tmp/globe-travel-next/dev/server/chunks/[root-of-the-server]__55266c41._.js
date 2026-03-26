module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/supabase-server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://vnxfgidixhnwdlalxyln.supabase.co"), ("TURBOPACK compile-time value", "sb_publishable_5_JWFbT0JedIgQ85uCnfYw_rv2SeFDe"), {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing sessions.
                }
            }
        }
    });
}
}),
"[project]/app/api/trips/_mapbox.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "directionsGeojson",
    ()=>directionsGeojson,
    "geocodePlace",
    ()=>geocodePlace
]);
async function geocodePlace(query, token) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=place,locality,neighborhood,address,poi&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature) return null;
    const countryCtx = (feature.context || []).find((c)=>typeof c?.id === 'string' && c.id.startsWith('country'));
    const country = countryCtx?.text || '';
    const country_code = countryCtx?.short_code ? String(countryCtx.short_code).toUpperCase() : undefined;
    return {
        mapbox_place_id: feature.id,
        name: feature.text,
        full_name: feature.place_name,
        latitude: feature.center?.[1],
        longitude: feature.center?.[0],
        country,
        country_code
    };
}
async function directionsGeojson(coords, token, mode = 'walk') {
    if (coords.length < 2) return null;
    const profile = mode === 'drive' ? 'driving' : mode === 'transit' ? 'driving' : 'walking';
    const coordStr = coords.map((c)=>`${c.longitude},${c.latitude}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordStr}?access_token=${token}&geometries=geojson&overview=full`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry) return null;
    return {
        geojson: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: route.geometry
                }
            ]
        },
        distance_m: typeof route.distance === 'number' ? Math.round(route.distance) : null,
        duration_s: typeof route.duration === 'number' ? Math.round(route.duration) : null
    };
}
}),
"[project]/app/api/trips/_utils.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TripBudgetSchema",
    ()=>TripBudgetSchema,
    "TripPaceSchema",
    ()=>TripPaceSchema,
    "randomSlug",
    ()=>randomSlug,
    "requireUser",
    ()=>requireUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase-server.ts [app-route] (ecmascript)");
;
;
function randomSlug(length = 10) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for(let i = 0; i < length; i++){
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
}
const TripPaceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'relaxed',
    'balanced',
    'packed'
]).optional();
const TripBudgetSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'budget',
    'mid',
    'luxury'
]).optional();
async function requireUser() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    return {
        supabase,
        user: user || null
    };
}
}),
"[project]/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$openai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@ai-sdk/openai/dist/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/ai/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@ai-sdk/provider-utils/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase-server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/trips/_mapbox.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/trips/_utils.ts [app-route] (ecmascript)");
;
;
;
;
;
;
const SYSTEM_PROMPTS = {
    onboarding: `You are a warm, enthusiastic travel companion helping someone set up their Globe Travel profile. Be concise and energetic — keep responses to 2-3 sentences max.

CRITICAL: When the user mentions ANY place they've been to, IMMEDIATELY call addVisitedPlace for EACH place. Do not wait or ask follow-up questions before calling the tool. Call the tool first, then respond.

Your flow:
1. When they mention places → call addVisitedPlace for each one right away
2. Ask what they loved about those places and where else they've been
3. After 3+ places, call setTravelPreferences based on what you've learned
4. Ask if they have any dream destinations (bucket list)
5. If they mention dream places → call addBucketListPlace

Keep it fast, fun, and interactive. Use emojis sparingly. Be genuinely excited.`,
    explore: `You are Globe Travel's AI travel companion. The user's visited places and bucket list are provided below. You KNOW where they've been — reference their trips when chatting.

Keep responses concise (2-4 sentences unless they ask for detail). Be warm and knowledgeable.

You can:
- Answer questions about their travel history (you have the data below)
- Suggest new destinations based on their taste
- Add places to their map using addVisitedPlace or addBucketListPlace tools
- Help plan trips with tips, itineraries, and local recommendations
- Navigate the map to show places using navigateToPlace tool

IMPORTANT: When discussing a specific city or place, ALWAYS call navigateToPlace to fly the map there. When they ask to add a place, use the appropriate tool immediately.`,
    plan: `You are a trip planning assistant inside Globe Travel.

CRITICAL OUTPUT RULE: The itinerary panel is the real output. Keep your text replies short (2-4 sentences) and ALWAYS update the trip itinerary using the provided trip tools.

Rules:
- Prefer tools over prose. Whenever you propose a day plan or change, reflect it by calling tools.
- For an initial itinerary or a major rewrite, prefer setFullTripPlan so the artifact fills in immediately.
- Do NOT invent coordinates. Use resolvePlace and place_query fields so the server can geocode.
- For location-based activities and meals, include a specific place_query whenever possible so each day can render on the map.
- If tripId is provided in the request, you MUST edit that trip. Do not create a new trip unless explicitly asked.
- If the user references "Day 2 morning" or a specific item, do a scoped edit (update/move/delete only what’s needed).
- Ask at most ONE clarifying question if destination or number of days is missing; otherwise proceed with reasonable assumptions.

When you add items:
- Use realistic time blocks (morning/afternoon/evening) and keep activities geographically coherent.
- Mix categories: activity + meal + transit/rest as needed.

After meaningful changes to a day, call computeDayRoute for that day (mode "walk" for cities).`
};
async function ensureTripDay(supabase, tripId, dayIndex) {
    const { data: existing, error } = await supabase.from('trip_days').select('id').eq('trip_id', tripId).eq('day_index', dayIndex).maybeSingle();
    if (error) throw new Error(error.message);
    if (existing?.id) return existing.id;
    const { data: created, error: createErr } = await supabase.from('trip_days').insert({
        trip_id: tripId,
        day_index: dayIndex
    }).select('id').single();
    if (createErr) throw new Error(createErr.message);
    return created.id;
}
function tripPatch(tripId) {
    return JSON.stringify({
        kind: 'trip_patch',
        tripId
    });
}
function extractLatestUserMessage(messages) {
    const latestUserMessage = [
        ...messages
    ].reverse().find((message)=>message.role === 'user');
    if (!latestUserMessage) return '';
    return latestUserMessage.parts.filter((part)=>part.type === 'text').map((part)=>part.text).join(' ').trim();
}
function inferPlanIntent({ latestUserText, hasExistingTrip, hasExistingDays, hasExistingItems }) {
    const normalized = latestUserText.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!normalized) {
        return hasExistingTrip || hasExistingDays || hasExistingItems ? 'item-edit' : 'clarify';
    }
    const itemEditPatterns = [
        /\b(regenerate|rewrite|rebuild|replace|swap|move|delete|remove|update|edit)\b.*\b(day|morning|afternoon|evening|activity|meal|item|stop)\b/,
        /\b(day\s*\d+)\b.*\b(regenerate|rewrite|rebuild|replace|swap|move|delete|remove|update|edit)\b/,
        /\b(this activity|this stop|that stop|this item|that item)\b/
    ];
    if (itemEditPatterns.some((pattern)=>pattern.test(normalized))) {
        return 'item-edit';
    }
    const addPatterns = [
        /\b(add|include|insert|append|also add|add another|more)\b.*\b(day trip|stop|activity|meal|place|museum|restaurant|attraction)\b/,
        /\bday trip\b/
    ];
    if (addPatterns.some((pattern)=>pattern.test(normalized))) {
        return 'add-items';
    }
    const fullPlanPatterns = [
        /\b(plan|build|create|make|generate)\b.*\b(itinerary|trip|days?|schedule)\b/,
        /\b(full itinerary|from scratch|start over|replace the whole trip|whole trip|full trip)\b/,
        /\b(make it more relaxed|better flow|less packed|more packed|optimize order)\b/
    ];
    if (fullPlanPatterns.some((pattern)=>pattern.test(normalized))) {
        return 'full-plan';
    }
    if (!hasExistingDays || !hasExistingItems) {
        return 'full-plan';
    }
    return hasExistingTrip ? 'item-edit' : 'clarify';
}
function getPlanToolSelection(intent, hasTripId) {
    const baseSelection = [
        'resolvePlace'
    ];
    if (intent === 'clarify') {
        return [];
    }
    if (intent === 'full-plan') {
        return hasTripId ? [
            ...baseSelection,
            'setFullTripPlan'
        ] : [
            ...baseSelection,
            'createTrip',
            'setFullTripPlan'
        ];
    }
    if (intent === 'add-items') {
        return hasTripId ? [
            ...baseSelection,
            'setTripDays',
            'addTripItem',
            'moveTripItem',
            'updateTripItem'
        ] : [
            ...baseSelection,
            'createTrip',
            'setTripDays',
            'addTripItem',
            'moveTripItem',
            'updateTripItem'
        ];
    }
    return hasTripId ? [
        ...baseSelection,
        'setTripDays',
        'addTripItem',
        'moveTripItem',
        'updateTripItem',
        'deleteTripItem'
    ] : [
        ...baseSelection,
        'createTrip',
        'setTripDays',
        'addTripItem',
        'moveTripItem',
        'updateTripItem',
        'deleteTripItem'
    ];
}
function getPlanToolChoice(stepNumber, intent) {
    if (intent === 'clarify') return 'none';
    if (stepNumber === 0 && intent === 'full-plan') {
        return {
            type: 'tool',
            toolName: 'setFullTripPlan'
        };
    }
    if (stepNumber === 0) return 'required';
    return 'none';
}
function buildPlanStepMessages(messages, stepNumber) {
    if (stepNumber === 0) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["pruneMessages"])({
            messages,
            reasoning: 'none',
            toolCalls: 'none',
            emptyMessages: 'remove'
        });
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["pruneMessages"])({
        messages: messages.slice(-8),
        reasoning: 'none',
        toolCalls: 'before-last-message',
        emptyMessages: 'remove'
    });
}
async function computeAndStoreDayRoute(supabase, tripDayId, token, mode = 'walk') {
    const { data: items, error } = await supabase.from('trip_items').select('place:places(latitude,longitude)').eq('trip_day_id', tripDayId).order('order_index', {
        ascending: true
    });
    if (error) throw new Error(error.message);
    const coords = (items || []).map((it)=>({
            latitude: it.place?.latitude,
            longitude: it.place?.longitude
        })).filter((coord)=>typeof coord.latitude === 'number' && typeof coord.longitude === 'number');
    const route = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["directionsGeojson"])(coords, token, mode);
    if (!route) return;
    const { error: routeErr } = await supabase.from('trip_routes').upsert({
        trip_day_id: tripDayId,
        geojson: route.geojson,
        distance_m: route.distance_m,
        duration_s: route.duration_s,
        mode,
        updated_at: new Date().toISOString()
    }, {
        onConflict: 'trip_day_id,mode'
    });
    if (routeErr) throw new Error(routeErr.message);
}
async function POST(req) {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new Response('Unauthorized', {
                status: 401
            });
        }
        const { messages, type, tripId } = await req.json();
        const mapboxToken = ("TURBOPACK compile-time value", "pk.eyJ1Ijoid2lsbDA3MDgiLCJhIjoiY21tcno5dXAxMWZmNjJxcTY3NDNvNGZhbSJ9.k-9ORP8DXlW-ljJVHAn08g");
        const latestUserText = extractLatestUserMessage(messages);
        // Fetch user's places for context in explore/plan modes
        let placesContext = '';
        let hasExistingDays = false;
        let hasExistingItems = false;
        if (type === 'explore' || type === 'plan') {
            const { data: userPlaces } = await supabase.from('user_places').select('status, place:places(name, country)').eq('user_id', user.id);
            if (userPlaces && userPlaces.length > 0) {
                const visited = userPlaces.filter((p)=>p.status === 'visited').map((p)=>`${p.place?.name}, ${p.place?.country}`);
                const bucketList = userPlaces.filter((p)=>p.status === 'bucket_list').map((p)=>`${p.place?.name}, ${p.place?.country}`);
                placesContext = `\n\nUSER'S TRAVEL DATA:\nVisited (${visited.length}): ${visited.join('; ')}\nBucket list (${bucketList.length}): ${bucketList.join('; ')}`;
            }
            // Also fetch profile
            const { data: profile } = await supabase.from('profiles').select('travel_style, display_name').eq('id', user.id).single();
            if (profile?.travel_style) {
                placesContext += `\nTravel style: ${profile.travel_style}`;
            }
            if (profile?.display_name) {
                placesContext += `\nName: ${profile.display_name}`;
            }
        }
        if (type === 'plan' && tripId) {
            const { data: trip } = await supabase.from('trips').select('title,start_date,end_date,pace,budget_level,constraints').eq('id', tripId).maybeSingle();
            const { data: tripDays } = await supabase.from('trip_days').select('id,day_index,title,date,notes').eq('trip_id', tripId).order('day_index', {
                ascending: true
            });
            let tripContext = '';
            if (trip) {
                tripContext += `\n\nCURRENT TRIP:\nTitle: ${trip.title}`;
                if (trip.start_date || trip.end_date) {
                    tripContext += `\nDates: ${trip.start_date || 'unspecified'} to ${trip.end_date || 'unspecified'}`;
                }
                if (trip.pace) tripContext += `\nPace: ${trip.pace}`;
                if (trip.budget_level) tripContext += `\nBudget: ${trip.budget_level}`;
            }
            if (tripDays && tripDays.length > 0) {
                hasExistingDays = true;
                const dayIds = tripDays.map((day)=>day.id);
                const { data: dayItems } = await supabase.from('trip_items').select('trip_day_id,title,type,start_time,place:places(name,country)').in('trip_day_id', dayIds).order('order_index', {
                    ascending: true
                });
                const itemsByDay = new Map();
                for (const item of dayItems || []){
                    if (!itemsByDay.has(item.trip_day_id)) itemsByDay.set(item.trip_day_id, []);
                    itemsByDay.get(item.trip_day_id).push(item);
                }
                tripContext += '\n\nCURRENT ITINERARY:';
                for (const day of tripDays){
                    const items = itemsByDay.get(day.id) || [];
                    if (items.length > 0) hasExistingItems = true;
                    const summary = items.length > 0 ? items.map((item)=>`${item.start_time || 'unscheduled'} ${item.title} (${item.type})`).join('; ') : 'empty';
                    tripContext += `\nDay ${day.day_index}: ${day.title || 'untitled'} -> ${summary}`;
                }
            }
            placesContext += tripContext;
        }
        const systemPrompt = (SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.explore) + placesContext;
        // Create tools with user context for DB operations
        const userTools = {
            addVisitedPlace: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Add a place the user has visited to their travel map',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('Name of the place or city'),
                    country: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('Country name'),
                    country_code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('ISO 2-letter country code'),
                    latitude: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().describe('Latitude coordinate'),
                    longitude: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().describe('Longitude coordinate'),
                    rating: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(1).max(5).optional().describe('User rating 1-5')
                }),
                execute: async ({ name, country, country_code, latitude, longitude, rating })=>{
                    let placeId;
                    const { data: existing } = await supabase.from('places').select('id').eq('name', name).eq('country', country).maybeSingle();
                    if (existing) {
                        placeId = existing.id;
                    } else {
                        const { data: newPlace, error } = await supabase.from('places').insert({
                            name,
                            country,
                            country_code,
                            latitude,
                            longitude
                        }).select('id').single();
                        if (error) return `Failed to add place: ${error.message}`;
                        placeId = newPlace.id;
                    }
                    await supabase.from('user_places').upsert({
                        user_id: user.id,
                        place_id: placeId,
                        status: 'visited',
                        rating: rating || null
                    }, {
                        onConflict: 'user_id,place_id'
                    });
                    return JSON.stringify({
                        success: true,
                        name,
                        country,
                        latitude,
                        longitude,
                        status: 'visited'
                    });
                }
            }),
            addBucketListPlace: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Add a place to the user bucket list',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('Name of the place or city'),
                    country: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('Country name'),
                    country_code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('ISO 2-letter country code'),
                    latitude: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().describe('Latitude coordinate'),
                    longitude: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().describe('Longitude coordinate'),
                    reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional().describe('Why the user wants to visit')
                }),
                execute: async ({ name, country, country_code, latitude, longitude, reason })=>{
                    let placeId;
                    const { data: existing } = await supabase.from('places').select('id').eq('name', name).eq('country', country).maybeSingle();
                    if (existing) {
                        placeId = existing.id;
                    } else {
                        const { data: newPlace, error } = await supabase.from('places').insert({
                            name,
                            country,
                            country_code,
                            latitude,
                            longitude
                        }).select('id').single();
                        if (error) return `Failed to add place: ${error.message}`;
                        placeId = newPlace.id;
                    }
                    await supabase.from('user_places').upsert({
                        user_id: user.id,
                        place_id: placeId,
                        status: 'bucket_list',
                        notes: reason || null
                    }, {
                        onConflict: 'user_id,place_id'
                    });
                    return JSON.stringify({
                        success: true,
                        name,
                        country,
                        latitude,
                        longitude,
                        status: 'bucket_list'
                    });
                }
            }),
            navigateToPlace: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Navigate/fly the map to show a specific place. Use this when the user asks to see, show, or go to a place, or when you are describing a specific location.',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('Name of the place or city'),
                    country: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('Country name'),
                    latitude: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().describe('Latitude coordinate'),
                    longitude: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().describe('Longitude coordinate'),
                    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('A 2-3 sentence vivid description of this place - what makes it special, what a traveler should know'),
                    highlights: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).describe('3-4 top highlights or things to do, each 3-6 words'),
                    best_time: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional().describe('Best time to visit, e.g. "March to May"')
                }),
                execute: async ({ name, country, latitude, longitude, description, highlights, best_time })=>{
                    return JSON.stringify({
                        kind: 'navigate',
                        success: true,
                        action: 'navigate',
                        name,
                        country,
                        latitude,
                        longitude,
                        description,
                        highlights,
                        best_time
                    });
                }
            }),
            setTravelPreferences: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Set the user travel style and preferences',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    style: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('Travel style: adventure, luxury, budget, family, backpacker, etc.'),
                    interests: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).describe('List of travel interests'),
                    budget_preference: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('Budget preference: budget, moderate, luxury')
                }),
                execute: async ({ style, interests, budget_preference })=>{
                    await supabase.from('profiles').update({
                        travel_style: `${style} | ${interests.join(', ')} | ${budget_preference}`
                    }).eq('id', user.id);
                    return `Successfully set travel preferences: ${style}`;
                }
            }),
            // ----------------------------
            // Trip planning tools (type: "plan")
            // ----------------------------
            resolvePlace: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Resolve a place query into a canonical place record. Always use this if you need a specific location.',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    query: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().describe('Place query like "Shinjuku, Tokyo" or "Senso-ji Temple"')
                }),
                execute: async ({ query })=>{
                    const token = mapboxToken;
                    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                    ;
                    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geocodePlace"])(query, token);
                    if (!result) return JSON.stringify({
                        kind: 'resolve_place',
                        ok: false,
                        query
                    });
                    const { data: place, error } = await supabase.from('places').upsert({
                        name: result.name,
                        country: result.country,
                        country_code: result.country_code || null,
                        latitude: result.latitude,
                        longitude: result.longitude,
                        mapbox_place_id: result.mapbox_place_id
                    }, {
                        onConflict: 'mapbox_place_id'
                    }).select('id,name,country,latitude,longitude').single();
                    if (error) return JSON.stringify({
                        kind: 'error',
                        message: error.message
                    });
                    return JSON.stringify({
                        kind: 'resolve_place',
                        ok: true,
                        place
                    });
                }
            }),
            createTrip: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Create a new trip (only if the user explicitly asks).',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
                    days: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(30).optional()
                }),
                execute: async ({ title, days })=>{
                    const slug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["randomSlug"])();
                    const { data: created, error } = await supabase.from('trips').insert({
                        user_id: user.id,
                        title,
                        share_slug: slug,
                        constraints: {}
                    }).select('id').single();
                    if (error) return JSON.stringify({
                        kind: 'error',
                        message: error.message
                    });
                    const count = days || 4;
                    const dayRows = Array.from({
                        length: count
                    }, (_, i)=>({
                            trip_id: created.id,
                            day_index: i + 1
                        }));
                    await supabase.from('trip_days').insert(dayRows);
                    return JSON.stringify({
                        kind: 'trip_created',
                        tripId: created.id
                    });
                }
            }),
            setTripDays: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Set trip day metadata (titles/dates).',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    trip_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid().optional(),
                    days: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                        day_index: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1),
                        title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                        date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                        notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
                    }))
                }),
                execute: async ({ trip_id, days })=>{
                    const tid = tripId || trip_id;
                    if (!tid) return JSON.stringify({
                        kind: 'error',
                        message: 'Missing trip id'
                    });
                    for (const d of days){
                        const dayId = await ensureTripDay(supabase, tid, d.day_index);
                        await supabase.from('trip_days').update({
                            title: d.title ?? null,
                            date: d.date ?? null,
                            notes: d.notes ?? null,
                            updated_at: new Date().toISOString()
                        }).eq('id', dayId);
                    }
                    return tripPatch(tid);
                }
            }),
            addTripItem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Add an itinerary item to a specific day.',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    trip_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid().optional(),
                    day_index: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1),
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
                        'activity',
                        'meal',
                        'lodging',
                        'transit',
                        'note'
                    ]),
                    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
                    place_query: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional().describe('Optional place query to geocode and attach'),
                    start_time: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional().describe('HH:MM'),
                    end_time: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional().describe('HH:MM'),
                    duration_minutes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(1440).optional(),
                    notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
                }),
                execute: async ({ trip_id, day_index, type, title, place_query, start_time, end_time, duration_minutes, notes })=>{
                    const tid = tripId || trip_id;
                    if (!tid) return JSON.stringify({
                        kind: 'error',
                        message: 'Missing trip id'
                    });
                    const dayId = await ensureTripDay(supabase, tid, day_index);
                    const token = mapboxToken;
                    let placeId = null;
                    if (place_query) {
                        if ("TURBOPACK compile-time truthy", 1) {
                            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geocodePlace"])(place_query, token);
                            if (result) {
                                const { data: place } = await supabase.from('places').upsert({
                                    name: result.name,
                                    country: result.country,
                                    country_code: result.country_code || null,
                                    latitude: result.latitude,
                                    longitude: result.longitude,
                                    mapbox_place_id: result.mapbox_place_id
                                }, {
                                    onConflict: 'mapbox_place_id'
                                }).select('id').single();
                                if (place?.id) placeId = place.id;
                            }
                        }
                    }
                    const { data: existing, error: maxErr } = await supabase.from('trip_items').select('order_index').eq('trip_day_id', dayId).order('order_index', {
                        ascending: false
                    }).limit(1);
                    if (maxErr) return JSON.stringify({
                        kind: 'error',
                        message: maxErr.message
                    });
                    const nextOrder = existing && existing[0]?.order_index != null ? existing[0].order_index + 1 : 0;
                    const { error } = await supabase.from('trip_items').insert({
                        trip_day_id: dayId,
                        type,
                        title,
                        place_id: placeId,
                        start_time: start_time ?? null,
                        end_time: end_time ?? null,
                        duration_minutes: duration_minutes ?? null,
                        notes: notes ?? null,
                        order_index: nextOrder
                    });
                    if (error) return JSON.stringify({
                        kind: 'error',
                        message: error.message
                    });
                    if ("TURBOPACK compile-time truthy", 1) {
                        await computeAndStoreDayRoute(supabase, dayId, token, 'walk');
                    }
                    return tripPatch(tid);
                }
            }),
            setFullTripPlan: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Create or replace a full multi-day itinerary in one call. Use this for the initial trip plan or full-day rewrites. Include place_query for any activity or meal that should appear on the day map.',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    trip_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid().optional(),
                    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                    start_date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                    end_date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                    pace: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
                        'relaxed',
                        'balanced',
                        'packed'
                    ]).optional(),
                    budget_level: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
                        'budget',
                        'mid',
                        'luxury'
                    ]).optional(),
                    clear_existing: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(true),
                    days: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                        day_index: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1),
                        title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                        date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                        notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                        items: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
                                'activity',
                                'meal',
                                'lodging',
                                'transit',
                                'note'
                            ]),
                            title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
                            place_query: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                            start_time: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                            end_time: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                            duration_minutes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(1440).optional(),
                            notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
                        })).default([])
                    })).min(1)
                }),
                execute: async ({ trip_id, title, start_date, end_date, pace, budget_level, clear_existing, days })=>{
                    const tid = tripId || trip_id;
                    if (!tid) return JSON.stringify({
                        kind: 'error',
                        message: 'Missing trip id'
                    });
                    const token = mapboxToken;
                    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                    ;
                    if (title || start_date || end_date || pace || budget_level) {
                        const { error: tripErr } = await supabase.from('trips').update({
                            ...title ? {
                                title
                            } : {},
                            ...start_date ? {
                                start_date
                            } : {},
                            ...end_date ? {
                                end_date
                            } : {},
                            ...pace ? {
                                pace
                            } : {},
                            ...budget_level ? {
                                budget_level
                            } : {},
                            updated_at: new Date().toISOString()
                        }).eq('id', tid);
                        if (tripErr) return JSON.stringify({
                            kind: 'error',
                            message: tripErr.message
                        });
                    }
                    for (const day of days){
                        const tripDayId = await ensureTripDay(supabase, tid, day.day_index);
                        const { error: dayErr } = await supabase.from('trip_days').update({
                            title: day.title ?? null,
                            date: day.date ?? null,
                            notes: day.notes ?? null,
                            updated_at: new Date().toISOString()
                        }).eq('id', tripDayId);
                        if (dayErr) return JSON.stringify({
                            kind: 'error',
                            message: dayErr.message
                        });
                        if (clear_existing) {
                            await supabase.from('trip_items').delete().eq('trip_day_id', tripDayId);
                            await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId);
                        }
                        for(let index = 0; index < day.items.length; index++){
                            const item = day.items[index];
                            let placeId = null;
                            if (item.place_query) {
                                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geocodePlace"])(item.place_query, token);
                                if (result) {
                                    const { data: place, error: placeErr } = await supabase.from('places').upsert({
                                        name: result.name,
                                        country: result.country,
                                        country_code: result.country_code || null,
                                        latitude: result.latitude,
                                        longitude: result.longitude,
                                        mapbox_place_id: result.mapbox_place_id
                                    }, {
                                        onConflict: 'mapbox_place_id'
                                    }).select('id').single();
                                    if (placeErr) {
                                        console.error('[setFullTripPlan] places upsert error (continuing without place)', placeErr.message);
                                    } else {
                                        placeId = place?.id || null;
                                    }
                                }
                            }
                            const { error: itemErr } = await supabase.from('trip_items').insert({
                                trip_day_id: tripDayId,
                                type: item.type,
                                title: item.title,
                                place_id: placeId,
                                start_time: item.start_time ?? null,
                                end_time: item.end_time ?? null,
                                duration_minutes: item.duration_minutes ?? null,
                                notes: item.notes ?? null,
                                order_index: index
                            });
                            if (itemErr) return JSON.stringify({
                                kind: 'error',
                                message: itemErr.message
                            });
                        }
                        await computeAndStoreDayRoute(supabase, tripDayId, token, 'walk');
                    }
                    return tripPatch(tid);
                }
            }),
            moveTripItem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Move an item to another day (or reorder within a day).',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    trip_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid().optional(),
                    item_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
                    to_day_index: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1),
                    to_order_index: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).optional()
                }),
                execute: async ({ trip_id, item_id, to_day_index, to_order_index })=>{
                    const tid = tripId || trip_id;
                    if (!tid) return JSON.stringify({
                        kind: 'error',
                        message: 'Missing trip id'
                    });
                    const token = mapboxToken;
                    const { data: currentItem, error: currentErr } = await supabase.from('trip_items').select('trip_day_id').eq('id', item_id).maybeSingle();
                    if (currentErr) return JSON.stringify({
                        kind: 'error',
                        message: currentErr.message
                    });
                    const fromDayId = currentItem?.trip_day_id;
                    const toDayId = await ensureTripDay(supabase, tid, to_day_index);
                    const orderIndex = to_order_index ?? 0;
                    const { error } = await supabase.from('trip_items').update({
                        trip_day_id: toDayId,
                        order_index: orderIndex,
                        updated_at: new Date().toISOString()
                    }).eq('id', item_id);
                    if (error) return JSON.stringify({
                        kind: 'error',
                        message: error.message
                    });
                    if ("TURBOPACK compile-time truthy", 1) {
                        if (fromDayId) await computeAndStoreDayRoute(supabase, fromDayId, token, 'walk');
                        await computeAndStoreDayRoute(supabase, toDayId, token, 'walk');
                    }
                    return tripPatch(tid);
                }
            }),
            updateTripItem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Update fields on an existing itinerary item.',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    trip_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid().optional(),
                    item_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
                    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                    notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                    start_time: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                    end_time: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
                    duration_minutes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(1440).optional(),
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
                        'activity',
                        'meal',
                        'lodging',
                        'transit',
                        'note'
                    ]).optional()
                }),
                execute: async ({ trip_id, item_id, ...fields })=>{
                    const tid = tripId || trip_id;
                    if (!tid) return JSON.stringify({
                        kind: 'error',
                        message: 'Missing trip id'
                    });
                    const token = mapboxToken;
                    const { data: currentItem, error: currentErr } = await supabase.from('trip_items').select('trip_day_id').eq('id', item_id).maybeSingle();
                    if (currentErr) return JSON.stringify({
                        kind: 'error',
                        message: currentErr.message
                    });
                    const { error } = await supabase.from('trip_items').update({
                        ...fields,
                        updated_at: new Date().toISOString()
                    }).eq('id', item_id);
                    if (error) return JSON.stringify({
                        kind: 'error',
                        message: error.message
                    });
                    if (token && currentItem?.trip_day_id) {
                        await computeAndStoreDayRoute(supabase, currentItem.trip_day_id, token, 'walk');
                    }
                    return tripPatch(tid);
                }
            }),
            deleteTripItem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Delete an itinerary item.',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    trip_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid().optional(),
                    item_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid()
                }),
                execute: async ({ trip_id, item_id })=>{
                    const tid = tripId || trip_id;
                    if (!tid) return JSON.stringify({
                        kind: 'error',
                        message: 'Missing trip id'
                    });
                    const token = mapboxToken;
                    const { data: currentItem, error: currentErr } = await supabase.from('trip_items').select('trip_day_id').eq('id', item_id).maybeSingle();
                    if (currentErr) return JSON.stringify({
                        kind: 'error',
                        message: currentErr.message
                    });
                    const { error } = await supabase.from('trip_items').delete().eq('id', item_id);
                    if (error) return JSON.stringify({
                        kind: 'error',
                        message: error.message
                    });
                    if (token && currentItem?.trip_day_id) {
                        await computeAndStoreDayRoute(supabase, currentItem.trip_day_id, token, 'walk');
                    }
                    return tripPatch(tid);
                }
            }),
            computeDayRoute: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$provider$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["tool"])({
                description: 'Compute and cache a route line for a day based on current item order.',
                inputSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
                    trip_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid().optional(),
                    day_index: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1),
                    mode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
                        'walk',
                        'drive',
                        'transit'
                    ]).default('walk')
                }),
                execute: async ({ trip_id, day_index, mode })=>{
                    const tid = tripId || trip_id;
                    if (!tid) return JSON.stringify({
                        kind: 'error',
                        message: 'Missing trip id'
                    });
                    const token = mapboxToken;
                    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                    ;
                    const dayId = await ensureTripDay(supabase, tid, day_index);
                    const { data: items, error } = await supabase.from('trip_items').select('place:places(latitude,longitude)').eq('trip_day_id', dayId).order('order_index', {
                        ascending: true
                    });
                    if (error) return JSON.stringify({
                        kind: 'error',
                        message: error.message
                    });
                    const coords = (items || []).map((it)=>({
                            latitude: it.place?.latitude,
                            longitude: it.place?.longitude
                        })).filter((c)=>typeof c.latitude === 'number' && typeof c.longitude === 'number');
                    const route = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["directionsGeojson"])(coords, token, mode);
                    if (!route) return tripPatch(tid);
                    const { error: routeErr } = await supabase.from('trip_routes').upsert({
                        trip_day_id: dayId,
                        geojson: route.geojson,
                        distance_m: route.distance_m,
                        duration_s: route.duration_s,
                        mode,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'trip_day_id,mode'
                    });
                    if (routeErr) return JSON.stringify({
                        kind: 'error',
                        message: routeErr.message
                    });
                    return tripPatch(tid);
                }
            })
        };
        if (!process.env.OPENAI_API_KEY) {
            return new Response('OPENAI_API_KEY is not configured', {
                status: 500
            });
        }
        const modelName = process.env.OPENAI_MODEL || 'gpt-5.4';
        const planMode = type === 'plan';
        const latestPlanIntent = planMode ? inferPlanIntent({
            latestUserText,
            hasExistingTrip: Boolean(tripId),
            hasExistingDays,
            hasExistingItems
        }) : 'clarify';
        const activePlanTools = getPlanToolSelection(latestPlanIntent, Boolean(tripId));
        const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["streamText"])({
            model: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$openai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["openai"])(modelName),
            system: systemPrompt,
            messages: await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["convertToModelMessages"])(messages),
            stopWhen: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["stepCountIs"])(planMode ? 4 : 12),
            tools: userTools,
            prepareStep: planMode ? ({ stepNumber, steps, messages: stepMessages })=>{
                const previousStep = steps[steps.length - 1];
                const previousToolNames = new Set(previousStep?.toolCalls.map((call)=>call.toolName) || []);
                const needsRouteRefresh = stepNumber > 0 && [
                    'addTripItem',
                    'moveTripItem',
                    'updateTripItem',
                    'deleteTripItem'
                ].some((toolName)=>previousToolNames.has(toolName)) && !previousToolNames.has('computeDayRoute');
                return {
                    messages: buildPlanStepMessages(stepMessages, stepNumber),
                    activeTools: needsRouteRefresh ? [
                        'computeDayRoute'
                    ] : activePlanTools,
                    toolChoice: needsRouteRefresh ? 'required' : getPlanToolChoice(stepNumber, latestPlanIntent),
                    system: stepNumber === 0 ? `${systemPrompt}\n\nUse tools first. Keep chat minimal and artifact-first.` : `${systemPrompt}\n\nIf the itinerary has already been updated this turn, reply with at most one short sentence and do not restate the itinerary in chat.`
                };
            } : undefined,
            onStepFinish: planMode ? ({ stepNumber, text, toolCalls, toolResults, finishReason })=>{
                console.info('[chat-step]', JSON.stringify({
                    type,
                    tripId: tripId || null,
                    planIntent: latestPlanIntent,
                    stepNumber,
                    finishReason,
                    usedTools: toolCalls.length > 0,
                    textLength: text.trim().length,
                    toolCalls: toolCalls.map((call)=>call.toolName),
                    toolResults: toolResults.map((result)=>result.toolName)
                }));
            } : undefined
        });
        return result.toUIMessageStreamResponse({
            sendReasoning: false
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response('Internal Server Error', {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__55266c41._.js.map