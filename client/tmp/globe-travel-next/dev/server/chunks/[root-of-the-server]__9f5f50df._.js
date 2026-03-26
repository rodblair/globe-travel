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
"[project]/app/api/trips/[id]/hydrate-map/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/trips/_mapbox.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/trips/_utils.ts [app-route] (ecmascript)");
;
;
;
const CANONICAL_PLACE_OVERRIDES = [
    {
        pattern: /nonna betta/i,
        name: 'Nonna Betta',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.89244,
        longitude: 12.47562,
        manualId: 'manual:rome:nonna-betta'
    },
    {
        pattern: /da enzo al 29/i,
        name: 'Da Enzo al 29',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.88798,
        longitude: 12.46947,
        manualId: 'manual:rome:da-enzo-al-29'
    },
    {
        pattern: /armando al pantheon/i,
        name: 'Armando al Pantheon',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.89861,
        longitude: 12.47679,
        manualId: 'manual:rome:armando-al-pantheon'
    },
    {
        pattern: /bonci pizzarium|pizzarium/i,
        name: 'Pizzarium Bonci',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.90708,
        longitude: 12.44645,
        manualId: 'manual:rome:pizzarium-bonci'
    },
    {
        pattern: /roscioli salumeria|roscioli/i,
        name: 'Roscioli Salumeria con Cucina',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.89553,
        longitude: 12.47225,
        manualId: 'manual:rome:roscioli'
    },
    {
        pattern: /casina valadier/i,
        name: 'Casina Valadier',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.91398,
        longitude: 12.48617,
        manualId: 'manual:rome:casina-valadier'
    },
    {
        pattern: /casa manco/i,
        name: 'Casa Manco Testaccio',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.87441,
        longitude: 12.47587,
        manualId: 'manual:rome:casa-manco'
    },
    {
        pattern: /la taverna dei fori imperiali/i,
        name: 'La Taverna dei Fori Imperiali',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.89303,
        longitude: 12.48923,
        manualId: 'manual:rome:taverna-fori-imperiali'
    },
    {
        pattern: /panino divino/i,
        name: 'Panino Divino',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.90623,
        longitude: 12.45742,
        manualId: 'manual:rome:panino-divino'
    },
    {
        pattern: /piatto romano/i,
        name: 'Piatto Romano',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.87779,
        longitude: 12.47872,
        manualId: 'manual:rome:piatto-romano'
    },
    {
        pattern: /jewish ghetto/i,
        name: 'Jewish Ghetto',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.8924,
        longitude: 12.4751,
        manualId: 'manual:rome:jewish-ghetto'
    },
    {
        pattern: /trastevere/i,
        name: 'Trastevere',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.88802,
        longitude: 12.46984,
        manualId: 'manual:rome:trastevere'
    },
    {
        pattern: /colosseum|roman forum/i,
        name: 'Colosseum',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.89021,
        longitude: 12.49223,
        manualId: 'manual:rome:colosseum'
    },
    {
        pattern: /palatine hill/i,
        name: 'Palatine Hill',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.88933,
        longitude: 12.48899,
        manualId: 'manual:rome:palatine-hill'
    },
    {
        pattern: /vatican museums|sistine chapel/i,
        name: 'Vatican Museums',
        country: 'Vatican City',
        country_code: 'VA',
        latitude: 41.90649,
        longitude: 12.45362,
        manualId: 'manual:vatican:museums'
    },
    {
        pattern: /st\.?\s*peter'?s basilica/i,
        name: "St. Peter's Basilica",
        country: 'Vatican City',
        country_code: 'VA',
        latitude: 41.90217,
        longitude: 12.45394,
        manualId: 'manual:vatican:st-peters'
    },
    {
        pattern: /villa borghese/i,
        name: 'Villa Borghese Gardens',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.9142,
        longitude: 12.49232,
        manualId: 'manual:rome:villa-borghese'
    },
    {
        pattern: /piazza navona/i,
        name: 'Piazza Navona',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.89893,
        longitude: 12.47307,
        manualId: 'manual:rome:piazza-navona'
    },
    {
        pattern: /pantheon/i,
        name: 'Pantheon',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.89861,
        longitude: 12.47687,
        manualId: 'manual:rome:pantheon'
    },
    {
        pattern: /trevi fountain/i,
        name: 'Trevi Fountain',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.90093,
        longitude: 12.48331,
        manualId: 'manual:rome:trevi-fountain'
    },
    {
        pattern: /spanish steps/i,
        name: 'Spanish Steps',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.90599,
        longitude: 12.48278,
        manualId: 'manual:rome:spanish-steps'
    },
    {
        pattern: /campo de[’']? fiori/i,
        name: "Campo de' Fiori",
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.89574,
        longitude: 12.4722,
        manualId: 'manual:rome:campo-de-fiori'
    },
    {
        pattern: /testaccio/i,
        name: 'Testaccio Market',
        country: 'Italy',
        country_code: 'IT',
        latitude: 41.87416,
        longitude: 12.47543,
        manualId: 'manual:rome:testaccio'
    }
];
function extractTripContext(title) {
    if (!title) return '';
    const cleaned = title.trim();
    const monthPattern = '(January|February|March|April|May|June|July|August|September|October|November|December)';
    const patterns = [
        new RegExp(`^\\d+\\s+Days?\\s+in\\s+(.+)$`, 'i'),
        new RegExp(`^(.+?)\\s+in\\s+${monthPattern}\\b`, 'i'),
        /^(.+?)\s+Day\s+Trip$/i,
        /^Trip to\s+(.+)$/i,
        /^(.+?)\s+Trip$/i
    ];
    for (const pattern of patterns){
        const match = cleaned.match(pattern);
        if (match?.[1]) {
            return match[1].trim();
        }
    }
    return cleaned;
}
function haversineKm(latitude1, longitude1, latitude2, longitude2) {
    const toRad = (value)=>value * Math.PI / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(latitude2 - latitude1);
    const dLng = toRad(longitude2 - longitude1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latitude1)) * Math.cos(toRad(latitude2)) * Math.sin(dLng / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function buildQueries(itemTitle, dayTitle, destinationContext) {
    const normalized = itemTitle.replace(/\s+/g, ' ').trim();
    const stripped = normalized.replace(/^(Breakfast|Brunch|Lunch|Dinner)\s+at\s+/i, '').replace(/^(Lunch|Dinner|Breakfast|Brunch)\s+near\s+/i, '').replace(/^(Morning|Afternoon|Evening)\s+(at|in)\s+/i, '').replace(/^(Explore|Visit|Tour|Walk through|Stroll through)\s+/i, '').replace(/\s+(Tour|Visit|Experience)$/i, '').trim();
    const dayContext = dayTitle?.trim() || '';
    const canonicalOverride = CANONICAL_PLACE_OVERRIDES.find((entry)=>entry.pattern.test(normalized))?.query;
    return Array.from(new Set([
        canonicalOverride || '',
        normalized && destinationContext ? `${normalized}, ${destinationContext}` : normalized,
        stripped && destinationContext ? `${stripped}, ${destinationContext}` : stripped,
        stripped && dayContext && destinationContext ? `${stripped}, ${dayContext}, ${destinationContext}` : '',
        normalized.includes(destinationContext) ? normalized : '',
        stripped.includes(destinationContext) ? stripped : ''
    ].filter(Boolean)));
}
async function upsertCanonicalPlace(supabase, override) {
    if (!override.name || !override.country || !override.country_code || typeof override.latitude !== 'number' || typeof override.longitude !== 'number' || !override.manualId) {
        return null;
    }
    const { data: place, error } = await supabase.from('places').upsert({
        name: override.name,
        country: override.country,
        country_code: override.country_code,
        latitude: override.latitude,
        longitude: override.longitude,
        mapbox_place_id: override.manualId
    }, {
        onConflict: 'mapbox_place_id'
    }).select('id').single();
    if (error) throw new Error(error.message);
    return place;
}
async function computeAndStoreDayRoute(supabase, tripDayId, token, mode = 'walk') {
    const { data: items, error } = await supabase.from('trip_items').select('place:places(latitude,longitude)').eq('trip_day_id', tripDayId).order('order_index', {
        ascending: true
    });
    if (error) throw new Error(error.message);
    const coords = (items || []).map((item)=>({
            latitude: item.place?.latitude,
            longitude: item.place?.longitude
        })).filter((coord)=>typeof coord.latitude === 'number' && typeof coord.longitude === 'number');
    if (coords.length < 2) {
        await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId).eq('mode', mode);
        return false;
    }
    const route = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["directionsGeojson"])(coords, token, mode);
    if (!route) return false;
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
    return true;
}
async function POST(_req, ctx) {
    const { id } = await ctx.params;
    const { supabase, user } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireUser"])();
    if (!user) return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]('Unauthorized', {
        status: 401
    });
    const token = ("TURBOPACK compile-time value", "pk.eyJ1Ijoid2lsbDA3MDgiLCJhIjoiY21tcno5dXAxMWZmNjJxcTY3NDNvNGZhbSJ9.k-9ORP8DXlW-ljJVHAn08g");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const { data: trip, error: tripErr } = await supabase.from('trips').select('id,title,user_id').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (tripErr) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: tripErr.message
    }, {
        status: 500
    });
    if (!trip) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'Not found'
    }, {
        status: 404
    });
    const { data: tripDays, error: daysErr } = await supabase.from('trip_days').select('id,day_index,title').eq('trip_id', id).order('day_index', {
        ascending: true
    });
    if (daysErr) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: daysErr.message
    }, {
        status: 500
    });
    const destinationContext = extractTripContext(trip.title);
    const destinationPlace = destinationContext ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geocodePlace"])(destinationContext, token) : null;
    let geocodedItems = 0;
    let routeDays = 0;
    for (const day of tripDays || []){
        const dayFallbackPlace = destinationContext && day.title ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geocodePlace"])(`${day.title}, ${destinationContext}`, token) : null;
        const { data: items, error: itemsErr } = await supabase.from('trip_items').select('id,title,type,place_id,place:places(id,name,country,latitude,longitude)').eq('trip_day_id', day.id).order('order_index', {
            ascending: true
        });
        if (itemsErr) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: itemsErr.message
        }, {
            status: 500
        });
        for (const item of items || []){
            if (![
                'activity',
                'meal',
                'lodging'
            ].includes(item.type)) continue;
            const canonicalOverride = CANONICAL_PLACE_OVERRIDES.find((entry)=>entry.pattern.test(item.title));
            const currentPlace = Array.isArray(item.place) ? item.place[0] : item.place;
            const currentDistanceKm = destinationPlace && typeof currentPlace?.latitude === 'number' && typeof currentPlace?.longitude === 'number' ? haversineKm(currentPlace.latitude, currentPlace.longitude, destinationPlace.latitude, destinationPlace.longitude) : null;
            const shouldRepair = canonicalOverride != null || !item.place_id || destinationPlace != null && currentDistanceKm != null && currentDistanceKm > 120;
            if (!shouldRepair) continue;
            let resolvedPlace = null;
            if (canonicalOverride?.manualId) {
                resolvedPlace = await upsertCanonicalPlace(supabase, canonicalOverride);
            }
            for (const query of buildQueries(item.title, day.title, destinationContext)){
                if (resolvedPlace) break;
                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$trips$2f$_mapbox$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geocodePlace"])(query, token);
                if (!result) continue;
                if (destinationPlace && haversineKm(result.latitude, result.longitude, destinationPlace.latitude, destinationPlace.longitude) > 120) {
                    continue;
                }
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
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: placeErr.message
                    }, {
                        status: 500
                    });
                }
                resolvedPlace = place;
                break;
            }
            if (!resolvedPlace && dayFallbackPlace) {
                const { data: place, error: placeErr } = await supabase.from('places').upsert({
                    name: dayFallbackPlace.name,
                    country: dayFallbackPlace.country,
                    country_code: dayFallbackPlace.country_code || null,
                    latitude: dayFallbackPlace.latitude,
                    longitude: dayFallbackPlace.longitude,
                    mapbox_place_id: dayFallbackPlace.mapbox_place_id
                }, {
                    onConflict: 'mapbox_place_id'
                }).select('id').single();
                if (placeErr) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: placeErr.message
                }, {
                    status: 500
                });
                resolvedPlace = place;
            }
            if (!resolvedPlace && destinationPlace) {
                const { data: place, error: placeErr } = await supabase.from('places').upsert({
                    name: destinationPlace.name,
                    country: destinationPlace.country,
                    country_code: destinationPlace.country_code || null,
                    latitude: destinationPlace.latitude,
                    longitude: destinationPlace.longitude,
                    mapbox_place_id: destinationPlace.mapbox_place_id
                }, {
                    onConflict: 'mapbox_place_id'
                }).select('id').single();
                if (placeErr) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: placeErr.message
                }, {
                    status: 500
                });
                resolvedPlace = place;
            }
            if (!resolvedPlace?.id) continue;
            const { error: updateErr } = await supabase.from('trip_items').update({
                place_id: resolvedPlace.id,
                updated_at: new Date().toISOString()
            }).eq('id', item.id);
            if (updateErr) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: updateErr.message
            }, {
                status: 500
            });
            geocodedItems += 1;
        }
        const routeCreated = await computeAndStoreDayRoute(supabase, day.id, token, 'walk');
        if (routeCreated) routeDays += 1;
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true,
        geocodedItems,
        routeDays
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9f5f50df._.js.map