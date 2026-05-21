import { openai } from '@ai-sdk/openai'
import {
  type UIMessage,
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
} from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import { createGuestUser, devUser, getGuestIdFromCookieHeader, isDevAuthBypassEnabled } from '@/lib/dev-auth'
import { ensureDevAccount, ensureGuestAccount } from '@/lib/guest-server'
import { geocodePlace, directionsGeojson } from '@/app/api/trips/_mapbox'
import { randomSlug } from '@/app/api/trips/_utils'
import { buildPlannerSystemPrompt, runPlannerPolicyHooks } from '@/lib/planner/policies'
import { REGIONAL_PLACE_OVERRIDES } from '@/lib/planner/regional-place-overrides'
import { getPlanToolChoice, getPlanToolSelection, inferPlanIntent } from '@/lib/planner/tools'
import { extractDestinationFromPrompt, extractDestinationFromTitle } from '@/lib/planner/runtime'
import { loadPlannerSession } from '@/lib/planner/session'
import { compareDestinations, listScoredDestinations } from '@/lib/planner/scoring'

type PlannerPlaceOverride = {
  pattern: RegExp
  name: string
  country: string
  country_code: string
  latitude: number
  longitude: number
  manualId: string
}

type PlannerDestinationOverride = {
  pattern: RegExp
  latitude: number
  longitude: number
  country_code: string
}

const PLANNER_DESTINATION_OVERRIDES: PlannerDestinationOverride[] = [
  { pattern: /^athens(?:,\s*greece)?$/i, latitude: 37.98381, longitude: 23.72754, country_code: 'GR' },
  { pattern: /^lisbon(?:,\s*portugal)?$/i, latitude: 38.72225, longitude: -9.13934, country_code: 'PT' },
  { pattern: /^(mexico city|cdmx|ciudad de m[eé]xico)(?:,\s*mexico)?$/i, latitude: 19.43261, longitude: -99.13321, country_code: 'MX' },
  { pattern: /^tokyo(?:,\s*japan)?$/i, latitude: 35.67642, longitude: 139.65003, country_code: 'JP' },
  { pattern: /^rome(?:,\s*italy)?$/i, latitude: 41.90278, longitude: 12.49636, country_code: 'IT' },
  { pattern: /^barcelona(?:,\s*spain)?$/i, latitude: 41.3874, longitude: 2.1686, country_code: 'ES' },
  { pattern: /^london(?:,\s*(?:united kingdom|uk|england))?$/i, latitude: 51.50722, longitude: -0.1275, country_code: 'GB' },
  { pattern: /^paris(?:,\s*france)?$/i, latitude: 48.85661, longitude: 2.35222, country_code: 'FR' },
  { pattern: /^copenhagen(?:,\s*denmark)?$/i, latitude: 55.6761, longitude: 12.5683, country_code: 'DK' },
  { pattern: /^berlin(?:,\s*germany)?$/i, latitude: 52.52, longitude: 13.405, country_code: 'DE' },
  { pattern: /^istanbul(?:,\s*(?:turkey|t[üu]rkiye))?$/i, latitude: 41.00824, longitude: 28.97836, country_code: 'TR' },
  { pattern: /^seoul(?:,\s*south korea)?$/i, latitude: 37.56654, longitude: 126.978, country_code: 'KR' },
  { pattern: /^bangkok(?:,\s*thailand)?$/i, latitude: 13.75633, longitude: 100.50177, country_code: 'TH' },
  { pattern: /^marrakech(?:,\s*morocco)?$/i, latitude: 31.62947, longitude: -7.98108, country_code: 'MA' },
  { pattern: /^cape town(?:,\s*south africa)?$/i, latitude: -33.92487, longitude: 18.42406, country_code: 'ZA' },
  { pattern: /^sydney(?:,\s*australia)?$/i, latitude: -33.86882, longitude: 151.2093, country_code: 'AU' },
]

const PLANNER_PLACE_OVERRIDES: PlannerPlaceOverride[] = [
  ...REGIONAL_PLACE_OVERRIDES,
  { pattern: /acropolis archaeological site|acropolis.*parthenon|parthenon.*acropolis|^acropolis of athens$/i, name: 'Acropolis of Athens', country: 'Greece', country_code: 'GR', latitude: 37.97153, longitude: 23.72575, manualId: 'manual:athens:acropolis' },
  { pattern: /acropolis museum/i, name: 'Acropolis Museum', country: 'Greece', country_code: 'GR', latitude: 37.96845, longitude: 23.72853, manualId: 'manual:athens:acropolis-museum' },
  { pattern: /\bstrofi\b/i, name: 'Strofi', country: 'Greece', country_code: 'GR', latitude: 37.96801, longitude: 23.72453, manualId: 'manual:athens:strofi' },
  { pattern: /monastiraki square|flea market.*monastiraki|monastiraki.*flea market/i, name: 'Monastiraki Square', country: 'Greece', country_code: 'GR', latitude: 37.97608, longitude: 23.72557, manualId: 'manual:athens:monastiraki-square' },
  { pattern: /ancient agora/i, name: 'Ancient Agora of Athens', country: 'Greece', country_code: 'GR', latitude: 37.97569, longitude: 23.72247, manualId: 'manual:athens:ancient-agora' },
  { pattern: /lisbon cathedral|sé de lisboa|se de lisboa/i, name: 'Lisbon Cathedral', country: 'Portugal', country_code: 'PT', latitude: 38.70975, longitude: -9.13349, manualId: 'manual:lisbon:cathedral' },
  { pattern: /praça do comércio|praca do comercio|commerce square/i, name: 'Praça do Comércio', country: 'Portugal', country_code: 'PT', latitude: 38.70775, longitude: -9.13642, manualId: 'manual:lisbon:praca-do-comercio' },
  { pattern: /santa justa lift|elevador de santa justa/i, name: 'Santa Justa Lift', country: 'Portugal', country_code: 'PT', latitude: 38.71214, longitude: -9.13939, manualId: 'manual:lisbon:santa-justa-lift' },
  { pattern: /rooftop santa justa|santa justa rooftop/i, name: 'Rooftop Santa Justa', country: 'Portugal', country_code: 'PT', latitude: 38.71234, longitude: -9.13968, manualId: 'manual:lisbon:rooftop-santa-justa' },
  { pattern: /castelo de s(?:[aã]o|\.?)\s*jorge|s[aã]o jorge castle|st\.?\s*george castle/i, name: 'Castelo de São Jorge', country: 'Portugal', country_code: 'PT', latitude: 38.71391, longitude: -9.13348, manualId: 'manual:lisbon:castelo-sao-jorge' },
  { pattern: /miradouro de santa luzia|santa luzia viewpoint/i, name: 'Miradouro de Santa Luzia', country: 'Portugal', country_code: 'PT', latitude: 38.71183, longitude: -9.13075, manualId: 'manual:lisbon:santa-luzia' },
  { pattern: /miradouro da senhora do monte|senhora do monte/i, name: 'Miradouro da Senhora do Monte', country: 'Portugal', country_code: 'PT', latitude: 38.71912, longitude: -9.13265, manualId: 'manual:lisbon:senhora-do-monte' },
  { pattern: /miradouro da graça|miradouro da graca/i, name: 'Miradouro da Graça', country: 'Portugal', country_code: 'PT', latitude: 38.71696, longitude: -9.13059, manualId: 'manual:lisbon:miradouro-graca' },
  { pattern: /miradouro de s[aã]o pedro de alc[aâ]ntara|s[aã]o pedro de alc[aâ]ntara/i, name: 'Miradouro de São Pedro de Alcântara', country: 'Portugal', country_code: 'PT', latitude: 38.7151, longitude: -9.14442, manualId: 'manual:lisbon:sao-pedro-alcantara' },
  { pattern: /miradouro de santa catarina|santa catarina viewpoint/i, name: 'Miradouro de Santa Catarina', country: 'Portugal', country_code: 'PT', latitude: 38.7102, longitude: -9.14791, manualId: 'manual:lisbon:santa-catarina' },
  { pattern: /pastéis de belém|pasteis de belem/i, name: 'Pastéis de Belém', country: 'Portugal', country_code: 'PT', latitude: 38.69748, longitude: -9.20322, manualId: 'manual:lisbon:pasteis-de-belem' },
  { pattern: /jer[óo]nimos monastery|mosteiro dos jer[óo]nimos/i, name: 'Jerónimos Monastery', country: 'Portugal', country_code: 'PT', latitude: 38.6979, longitude: -9.20673, manualId: 'manual:lisbon:jeronimos-monastery' },
  { pattern: /bel[eé]m tower|torre de bel[eé]m/i, name: 'Belém Tower', country: 'Portugal', country_code: 'PT', latitude: 38.69158, longitude: -9.21604, manualId: 'manual:lisbon:belem-tower' },
  { pattern: /padr[aã]o dos descobrimentos|monument to the discoveries/i, name: 'Padrão dos Descobrimentos', country: 'Portugal', country_code: 'PT', latitude: 38.69367, longitude: -9.20572, manualId: 'manual:lisbon:padrao-descobrimentos' },
  { pattern: /\bmaat\b/i, name: 'MAAT', country: 'Portugal', country_code: 'PT', latitude: 38.69578, longitude: -9.19468, manualId: 'manual:lisbon:maat' },
  { pattern: /[aà] margem/i, name: 'À Margem', country: 'Portugal', country_code: 'PT', latitude: 38.69562, longitude: -9.19632, manualId: 'manual:lisbon:a-margem' },
  { pattern: /lx factory/i, name: 'LX Factory', country: 'Portugal', country_code: 'PT', latitude: 38.70333, longitude: -9.17844, manualId: 'manual:lisbon:lx-factory' },
  { pattern: /time out market lisboa|time out market lisbon|mercado da ribeira/i, name: 'Time Out Market Lisboa', country: 'Portugal', country_code: 'PT', latitude: 38.70697, longitude: -9.14562, manualId: 'manual:lisbon:time-out-market' },
  { pattern: /carmo convent|convento do carmo/i, name: 'Carmo Convent', country: 'Portugal', country_code: 'PT', latitude: 38.71207, longitude: -9.14071, manualId: 'manual:lisbon:carmo-convent' },
  { pattern: /manteigaria/i, name: 'Manteigaria', country: 'Portugal', country_code: 'PT', latitude: 38.71084, longitude: -9.14307, manualId: 'manual:lisbon:manteigaria' },
  { pattern: /dear breakfast/i, name: 'Dear Breakfast Chiado', country: 'Portugal', country_code: 'PT', latitude: 38.71082, longitude: -9.14363, manualId: 'manual:lisbon:dear-breakfast-chiado' },
  { pattern: /audrey'?s/i, name: "Audrey's", country: 'Portugal', country_code: 'PT', latitude: 38.71103, longitude: -9.13196, manualId: 'manual:lisbon:audreys' },
  { pattern: /arco da rua augusta|rua augusta arch/i, name: 'Arco da Rua Augusta', country: 'Portugal', country_code: 'PT', latitude: 38.70831, longitude: -9.13665, manualId: 'manual:lisbon:arco-rua-augusta' },
  { pattern: /copenhagen coffee lab/i, name: 'Copenhagen Coffee Lab Alfama', country: 'Portugal', country_code: 'PT', latitude: 38.71177, longitude: -9.13058, manualId: 'manual:lisbon:copenhagen-coffee-lab-alfama' },
  { pattern: /pois caf[eé]/i, name: 'Pois Café', country: 'Portugal', country_code: 'PT', latitude: 38.71015, longitude: -9.13174, manualId: 'manual:lisbon:pois-cafe' },
  { pattern: /miss can/i, name: 'Miss Can', country: 'Portugal', country_code: 'PT', latitude: 38.7103, longitude: -9.13193, manualId: 'manual:lisbon:miss-can' },
  { pattern: /nicolau lisboa/i, name: 'Nicolau Lisboa', country: 'Portugal', country_code: 'PT', latitude: 38.7112, longitude: -9.1374, manualId: 'manual:lisbon:nicolau-lisboa' },
  { pattern: /chapit[oô]\s*(?:[aà]\s*)?mesa/i, name: 'Chapitô à Mesa', country: 'Portugal', country_code: 'PT', latitude: 38.71133, longitude: -9.13378, manualId: 'manual:lisbon:chapito-a-mesa' },
  { pattern: /canto da vila/i, name: 'Canto da Vila', country: 'Portugal', country_code: 'PT', latitude: 38.71061, longitude: -9.13148, manualId: 'manual:lisbon:canto-da-vila' },
  { pattern: /taberna sal grosso/i, name: 'Taberna Sal Grosso', country: 'Portugal', country_code: 'PT', latitude: 38.71431, longitude: -9.12695, manualId: 'manual:lisbon:taberna-sal-grosso' },
  { pattern: /taberna da rua das flores/i, name: 'Taberna da Rua das Flores', country: 'Portugal', country_code: 'PT', latitude: 38.71026, longitude: -9.14352, manualId: 'manual:lisbon:taberna-rua-das-flores' },
  { pattern: /oficina do duque/i, name: 'Oficina do Duque', country: 'Portugal', country_code: 'PT', latitude: 38.7133, longitude: -9.1418, manualId: 'manual:lisbon:oficina-do-duque' },
  { pattern: /cervejaria ramiro/i, name: 'Cervejaria Ramiro', country: 'Portugal', country_code: 'PT', latitude: 38.72175, longitude: -9.1354, manualId: 'manual:lisbon:cervejaria-ramiro' },
  { pattern: /pavilh[aã]o chin[eê]s/i, name: 'Pavilhão Chinês', country: 'Portugal', country_code: 'PT', latitude: 38.71528, longitude: -9.14829, manualId: 'manual:lisbon:pavilhao-chines' },
  { pattern: /rio maravilha/i, name: 'Rio Maravilha', country: 'Portugal', country_code: 'PT', latitude: 38.70345, longitude: -9.17839, manualId: 'manual:lisbon:rio-maravilha' },
  { pattern: /ponto final/i, name: 'Ponto Final', country: 'Portugal', country_code: 'PT', latitude: 38.68697, longitude: -9.15172, manualId: 'manual:lisbon:ponto-final' },
  { pattern: /atalho real/i, name: 'Atalho Real', country: 'Portugal', country_code: 'PT', latitude: 38.71639, longitude: -9.14922, manualId: 'manual:lisbon:atalho-real' },
  { pattern: /^park rooftop$|^park bar$|^park,?\s*lisbon$/i, name: 'Park Rooftop', country: 'Portugal', country_code: 'PT', latitude: 38.71014, longitude: -9.14784, manualId: 'manual:lisbon:park-rooftop' },
  { pattern: /hello,?\s*kristof/i, name: 'Hello, Kristof', country: 'Portugal', country_code: 'PT', latitude: 38.71361, longitude: -9.15038, manualId: 'manual:lisbon:hello-kristof' },
  { pattern: /pharmacia/i, name: 'Pharmacia', country: 'Portugal', country_code: 'PT', latitude: 38.71004, longitude: -9.14797, manualId: 'manual:lisbon:pharmacia' },
  { pattern: /livraria bertrand/i, name: 'Livraria Bertrand Chiado', country: 'Portugal', country_code: 'PT', latitude: 38.71049, longitude: -9.14369, manualId: 'manual:lisbon:livraria-bertrand' },
  { pattern: /a brasileira/i, name: 'A Brasileira', country: 'Portugal', country_code: 'PT', latitude: 38.71055, longitude: -9.14246, manualId: 'manual:lisbon:a-brasileira' },
  { pattern: /topo chiado/i, name: 'Topo Chiado', country: 'Portugal', country_code: 'PT', latitude: 38.71224, longitude: -9.14075, manualId: 'manual:lisbon:topo-chiado' },
  { pattern: /jardim do pr[ií]ncipe real|praça do pr[ií]ncipe real|pr[ií]ncipe real garden/i, name: 'Jardim do Príncipe Real', country: 'Portugal', country_code: 'PT', latitude: 38.71664, longitude: -9.14867, manualId: 'manual:lisbon:jardim-principe-real' },
  { pattern: /jardim bot[aâ]nico de lisboa|lisbon botanical garden/i, name: 'Jardim Botânico de Lisboa', country: 'Portugal', country_code: 'PT', latitude: 38.71722, longitude: -9.14833, manualId: 'manual:lisbon:botanical-garden' },
  { pattern: /mercado de campo de ourique/i, name: 'Mercado de Campo de Ourique', country: 'Portugal', country_code: 'PT', latitude: 38.71704, longitude: -9.16613, manualId: 'manual:lisbon:mercado-campo-ourique' },
  { pattern: /national tile museum|museu nacional do azulejo/i, name: 'National Tile Museum', country: 'Portugal', country_code: 'PT', latitude: 38.72465, longitude: -9.11385, manualId: 'manual:lisbon:national-tile-museum' },
  { pattern: /bairro do avillez/i, name: 'Bairro do Avillez', country: 'Portugal', country_code: 'PT', latitude: 38.71097, longitude: -9.14223, manualId: 'manual:lisbon:bairro-do-avillez' },
  { pattern: /pensão amor|pensao amor/i, name: 'Pensão Amor', country: 'Portugal', country_code: 'PT', latitude: 38.70747, longitude: -9.14354, manualId: 'manual:lisbon:pensao-amor' },
  { pattern: /clube de fado/i, name: 'Clube de Fado', country: 'Portugal', country_code: 'PT', latitude: 38.71036, longitude: -9.13111, manualId: 'manual:lisbon:clube-de-fado' },
  { pattern: /\bfoxtrot\b/i, name: 'Foxtrot', country: 'Portugal', country_code: 'PT', latitude: 38.71951, longitude: -9.15343, manualId: 'manual:lisbon:foxtrot' },
  { pattern: /red frog/i, name: 'Red Frog', country: 'Portugal', country_code: 'PT', latitude: 38.71998, longitude: -9.14596, manualId: 'manual:lisbon:red-frog' },
  { pattern: /pink street|rua cor-de-rosa/i, name: 'Pink Street', country: 'Portugal', country_code: 'PT', latitude: 38.70755, longitude: -9.14376, manualId: 'manual:lisbon:pink-street' },
  { pattern: /bairro alto/i, name: 'Bairro Alto', country: 'Portugal', country_code: 'PT', latitude: 38.7131, longitude: -9.14456, manualId: 'manual:lisbon:bairro-alto' },
  { pattern: /\balfama\b/i, name: 'Alfama', country: 'Portugal', country_code: 'PT', latitude: 38.71391, longitude: -9.12963, manualId: 'manual:lisbon:alfama' },
  { pattern: /\bchiado\b/i, name: 'Chiado', country: 'Portugal', country_code: 'PT', latitude: 38.71073, longitude: -9.14224, manualId: 'manual:lisbon:chiado' },
  { pattern: /caf[eé] da garagem/i, name: 'Café da Garagem', country: 'Portugal', country_code: 'PT', latitude: 38.71384, longitude: -9.13248, manualId: 'manual:lisbon:cafe-da-garagem' },
  { pattern: /cervejaria trindade/i, name: 'Cervejaria Trindade', country: 'Portugal', country_code: 'PT', latitude: 38.71196, longitude: -9.142, manualId: 'manual:lisbon:cervejaria-trindade' },
  { pattern: /by the wine/i, name: 'By The Wine', country: 'Portugal', country_code: 'PT', latitude: 38.71021, longitude: -9.14397, manualId: 'manual:lisbon:by-the-wine' },
  { pattern: /museu nacional de arte antiga|national museum of ancient art/i, name: 'Museu Nacional de Arte Antiga', country: 'Portugal', country_code: 'PT', latitude: 38.70408, longitude: -9.16063, manualId: 'manual:lisbon:mnarte-antiga' },
  { pattern: /cinco lounge/i, name: 'Cinco Lounge', country: 'Portugal', country_code: 'PT', latitude: 38.71669, longitude: -9.15004, manualId: 'manual:lisbon:cinco-lounge' },
  { pattern: /da prata 52/i, name: 'da Prata 52', country: 'Portugal', country_code: 'PT', latitude: 38.71028, longitude: -9.1363, manualId: 'manual:lisbon:da-prata-52' },
  { pattern: /darwin'?s caf[eé]/i, name: "Darwin's Café", country: 'Portugal', country_code: 'PT', latitude: 38.6945, longitude: -9.2219, manualId: 'manual:lisbon:darwins-cafe' },
  { pattern: /sol e pesca/i, name: 'Sol e Pesca', country: 'Portugal', country_code: 'PT', latitude: 38.70745, longitude: -9.14365, manualId: 'manual:lisbon:sol-e-pesca' },
  { pattern: /o frade/i, name: 'O Frade', country: 'Portugal', country_code: 'PT', latitude: 38.69902, longitude: -9.2052, manualId: 'manual:lisbon:o-frade' },
  { pattern: /enoteca de bel[eé]m/i, name: 'Enoteca de Belém', country: 'Portugal', country_code: 'PT', latitude: 38.69909, longitude: -9.20505, manualId: 'manual:lisbon:enoteca-de-belem' },
  { pattern: /of[ií]cio/i, name: 'Ofício', country: 'Portugal', country_code: 'PT', latitude: 38.71217, longitude: -9.14362, manualId: 'manual:lisbon:oficio' },
  { pattern: /miradouro da vit[oó]ria|vit[oó]ria viewpoint/i, name: 'Miradouro da Vitória', country: 'Portugal', country_code: 'PT', latitude: 41.14278, longitude: -8.61563, manualId: 'manual:porto:miradouro-vitoria' },
  { pattern: /mercado do bolh[aã]o|bolh[aã]o market/i, name: 'Mercado do Bolhão', country: 'Portugal', country_code: 'PT', latitude: 41.14925, longitude: -8.6068, manualId: 'manual:porto:mercado-bolhao' },
  { pattern: /livraria lello|lello bookstore/i, name: 'Livraria Lello', country: 'Portugal', country_code: 'PT', latitude: 41.14696, longitude: -8.61472, manualId: 'manual:porto:livraria-lello' },
  { pattern: /taberna dos mercadores/i, name: 'Taberna dos Mercadores', country: 'Portugal', country_code: 'PT', latitude: 41.14131, longitude: -8.61267, manualId: 'manual:porto:taberna-dos-mercadores' },
  { pattern: /jardim do morro/i, name: 'Jardim do Morro', country: 'Portugal', country_code: 'PT', latitude: 41.13874, longitude: -8.60967, manualId: 'manual:porto:jardim-do-morro' },
  { pattern: /porto cathedral|s[eé] do porto/i, name: 'Porto Cathedral', country: 'Portugal', country_code: 'PT', latitude: 41.14289, longitude: -8.61118, manualId: 'manual:porto:cathedral' },
  { pattern: /tapabento|s\.?\s*bento/i, name: 'Tapabento S.Bento', country: 'Portugal', country_code: 'PT', latitude: 41.14552, longitude: -8.61062, manualId: 'manual:porto:tapabento-s-bento' },
  { pattern: /s[aã]o bento station|s[aã]o bento railway|esta[cç][aã]o de s[aã]o bento/i, name: 'São Bento Station', country: 'Portugal', country_code: 'PT', latitude: 41.14566, longitude: -8.6109, manualId: 'manual:porto:sao-bento-station' },
  { pattern: /dom lu[ií]s i bridge|dom luis i bridge/i, name: 'Dom Luís I Bridge', country: 'Portugal', country_code: 'PT', latitude: 41.14005, longitude: -8.60945, manualId: 'manual:porto:dom-luis-i-bridge' },
  { pattern: /majestic caf[eé]/i, name: 'Majestic Café', country: 'Portugal', country_code: 'PT', latitude: 41.14713, longitude: -8.6067, manualId: 'manual:porto:majestic-cafe' },
  { pattern: /adega s[aã]o nicolau/i, name: 'Adega São Nicolau', country: 'Portugal', country_code: 'PT', latitude: 41.14058, longitude: -8.61653, manualId: 'manual:porto:adega-sao-nicolau' },
  { pattern: /pal[aá]cio de bellas artes|palace of fine arts/i, name: 'Palacio de Bellas Artes', country: 'Mexico', country_code: 'MX', latitude: 19.4352, longitude: -99.1412, manualId: 'manual:mexico-city:palacio-bellas-artes' },
  { pattern: /museo del templo mayor|templo mayor/i, name: 'Museo del Templo Mayor', country: 'Mexico', country_code: 'MX', latitude: 19.4347, longitude: -99.1312, manualId: 'manual:mexico-city:templo-mayor' },
  { pattern: /azul hist[oó]rico/i, name: 'Azul Histórico', country: 'Mexico', country_code: 'MX', latitude: 19.4338, longitude: -99.1377, manualId: 'manual:mexico-city:azul-historico' },
  { pattern: /el cardenal/i, name: 'El Cardenal', country: 'Mexico', country_code: 'MX', latitude: 19.4337, longitude: -99.1391, manualId: 'manual:mexico-city:el-cardenal' },
  { pattern: /caf[eé] de tacuba/i, name: 'Café de Tacuba', country: 'Mexico', country_code: 'MX', latitude: 19.4357, longitude: -99.1398, manualId: 'manual:mexico-city:cafe-de-tacuba' },
  { pattern: /caf[eé] el popular/i, name: 'Café El Popular', country: 'Mexico', country_code: 'MX', latitude: 19.4333, longitude: -99.1365, manualId: 'manual:mexico-city:cafe-el-popular' },
  { pattern: /terraza catedral/i, name: 'Terraza Catedral', country: 'Mexico', country_code: 'MX', latitude: 19.4341, longitude: -99.1335, manualId: 'manual:mexico-city:terraza-catedral' },
  { pattern: /museo nacional de antropolog[ií]a|national museum of anthropology/i, name: 'Museo Nacional de Antropología', country: 'Mexico', country_code: 'MX', latitude: 19.426, longitude: -99.1863, manualId: 'manual:mexico-city:anthropology-museum' },
  { pattern: /\bel lago\b/i, name: 'El Lago', country: 'Mexico', country_code: 'MX', latitude: 19.4214, longitude: -99.1954, manualId: 'manual:mexico-city:el-lago' },
  { pattern: /castillo de chapultepec|chapultepec castle/i, name: 'Castillo de Chapultepec', country: 'Mexico', country_code: 'MX', latitude: 19.4204, longitude: -99.1819, manualId: 'manual:mexico-city:chapultepec-castle' },
  { pattern: /ticuchi/i, name: 'Ticuchi', country: 'Mexico', country_code: 'MX', latitude: 19.4318, longitude: -99.1939, manualId: 'manual:mexico-city:ticuchi' },
  { pattern: /museo frida kahlo|frida kahlo museum|casa azul/i, name: 'Museo Frida Kahlo', country: 'Mexico', country_code: 'MX', latitude: 19.3552, longitude: -99.1626, manualId: 'manual:mexico-city:frida-kahlo' },
  { pattern: /caf[eé] avellaneda/i, name: 'Café Avellaneda', country: 'Mexico', country_code: 'MX', latitude: 19.3496, longitude: -99.1626, manualId: 'manual:mexico-city:cafe-avellaneda' },
  { pattern: /tostadas coyoac[aá]n/i, name: 'Tostadas Coyoacán', country: 'Mexico', country_code: 'MX', latitude: 19.34921, longitude: -99.16111, manualId: 'manual:mexico-city:tostadas-coyoacan' },
  { pattern: /los danzantes/i, name: 'Los Danzantes', country: 'Mexico', country_code: 'MX', latitude: 19.3495, longitude: -99.1625, manualId: 'manual:mexico-city:los-danzantes' },
  { pattern: /mercado de coyoac[aá]n/i, name: 'Mercado de Coyoacán', country: 'Mexico', country_code: 'MX', latitude: 19.3491, longitude: -99.1603, manualId: 'manual:mexico-city:mercado-coyoacan' },
  { pattern: /museo anahuacalli|anahuacalli/i, name: 'Museo Anahuacalli', country: 'Mexico', country_code: 'MX', latitude: 19.3231, longitude: -99.1436, manualId: 'manual:mexico-city:anahuacalli' },
  { pattern: /museo casa estudio diego rivera|casa estudio diego rivera/i, name: 'Museo Casa Estudio Diego Rivera y Frida Kahlo', country: 'Mexico', country_code: 'MX', latitude: 19.3495, longitude: -99.1903, manualId: 'manual:mexico-city:casa-estudio-diego-frida' },
  { pattern: /contramar/i, name: 'Contramar', country: 'Mexico', country_code: 'MX', latitude: 19.4191, longitude: -99.1694, manualId: 'manual:mexico-city:contramar' },
  { pattern: /\brosetta\b/i, name: 'Rosetta', country: 'Mexico', country_code: 'MX', latitude: 19.4199, longitude: -99.1605, manualId: 'manual:mexico-city:rosetta' },
  { pattern: /licorer[ií]a limantour/i, name: 'Licorería Limantour', country: 'Mexico', country_code: 'MX', latitude: 19.414, longitude: -99.1713, manualId: 'manual:mexico-city:limantour' },
  { pattern: /museo tamayo/i, name: 'Museo Tamayo Arte Contemporáneo', country: 'Mexico', country_code: 'MX', latitude: 19.4257, longitude: -99.1817, manualId: 'manual:mexico-city:museo-tamayo' },
  { pattern: /museo del objeto del objeto|\bmodo\b/i, name: 'Museo del Objeto del Objeto', country: 'Mexico', country_code: 'MX', latitude: 19.4195, longitude: -99.1628, manualId: 'manual:mexico-city:modo' },
  { pattern: /\blardo\b/i, name: 'Lardo', country: 'Mexico', country_code: 'MX', latitude: 19.4128, longitude: -99.1727, manualId: 'manual:mexico-city:lardo' },
  { pattern: /^lalo!?|\blalo!?\b/i, name: 'Lalo!', country: 'Mexico', country_code: 'MX', latitude: 19.4148, longitude: -99.1644, manualId: 'manual:mexico-city:lalo' },
  { pattern: /museo de arte moderno/i, name: 'Museo de Arte Moderno', country: 'Mexico', country_code: 'MX', latitude: 19.4231, longitude: -99.1815, manualId: 'manual:mexico-city:museo-arte-moderno' },
  { pattern: /m[aá]ximo/i, name: 'Máximo', country: 'Mexico', country_code: 'MX', latitude: 19.4164, longitude: -99.1669, manualId: 'manual:mexico-city:maximo' },
  { pattern: /parque m[eé]xico/i, name: 'Parque México', country: 'Mexico', country_code: 'MX', latitude: 19.4113, longitude: -99.1695, manualId: 'manual:mexico-city:parque-mexico' },
  { pattern: /museo casa de le[oó]n trotsky|le[oó]n trotsky/i, name: 'Museo Casa de León Trotsky', country: 'Mexico', country_code: 'MX', latitude: 19.3561, longitude: -99.1585, manualId: 'manual:mexico-city:leon-trotsky-museum' },
  { pattern: /museo nacional de culturas populares|culturas populares/i, name: 'Museo Nacional de Culturas Populares', country: 'Mexico', country_code: 'MX', latitude: 19.3481, longitude: -99.1623, manualId: 'manual:mexico-city:culturas-populares' },
  { pattern: /\bdepartamento\b/i, name: 'Departamento', country: 'Mexico', country_code: 'MX', latitude: 19.417, longitude: -99.1612, manualId: 'manual:mexico-city:departamento' },
  { pattern: /merotoro/i, name: 'Merotoro', country: 'Mexico', country_code: 'MX', latitude: 19.4124, longitude: -99.1742, manualId: 'manual:mexico-city:merotoro' },
  { pattern: /taquer[ií]a orinoco|taqueria orinoco/i, name: 'Taquería Orinoco', country: 'Mexico', country_code: 'MX', latitude: 19.4168, longitude: -99.1661, manualId: 'manual:mexico-city:taqueria-orinoco' },
  { pattern: /senso-?ji|sensō-ji|sensoji/i, name: 'Senso-ji Temple', country: 'Japan', country_code: 'JP', latitude: 35.7148, longitude: 139.7967, manualId: 'manual:tokyo:sensoji' },
  { pattern: /kamiya bar/i, name: 'Kamiya Bar', country: 'Japan', country_code: 'JP', latitude: 35.71161, longitude: 139.79591, manualId: 'manual:tokyo:kamiya-bar' },
  { pattern: /ise sueyoshi.*ueno|ueno hirokoji/i, name: 'Ise Sueyoshi Ueno Hirokoji', country: 'Japan', country_code: 'JP', latitude: 35.70795, longitude: 139.77274, manualId: 'manual:tokyo:ise-sueyoshi-ueno' },
  { pattern: /daikokuya tempura|daikokuya/i, name: 'Daikokuya Tempura', country: 'Japan', country_code: 'JP', latitude: 35.71195, longitude: 139.79469, manualId: 'manual:tokyo:daikokuya-tempura' },
  { pattern: /izuei honten|izuei/i, name: 'Izuei Honten', country: 'Japan', country_code: 'JP', latitude: 35.70795, longitude: 139.77272, manualId: 'manual:tokyo:izuei-honten' },
  { pattern: /asakusa imahan/i, name: 'Asakusa Imahan Honten', country: 'Japan', country_code: 'JP', latitude: 35.7112, longitude: 139.7945, manualId: 'manual:tokyo:asakusa-imahan' },
  { pattern: /suzukien/i, name: 'Suzukien Asakusa', country: 'Japan', country_code: 'JP', latitude: 35.7158, longitude: 139.8002, manualId: 'manual:tokyo:suzukien' },
  { pattern: /tokyo national museum/i, name: 'Tokyo National Museum', country: 'Japan', country_code: 'JP', latitude: 35.7188, longitude: 139.7765, manualId: 'manual:tokyo:national-museum' },
  { pattern: /ueno park/i, name: 'Ueno Park', country: 'Japan', country_code: 'JP', latitude: 35.7156, longitude: 139.7745, manualId: 'manual:tokyo:ueno-park' },
  { pattern: /inshotei|innsyoutei|innsyotei/i, name: 'Inshotei', country: 'Japan', country_code: 'JP', latitude: 35.7169, longitude: 139.7721, manualId: 'manual:tokyo:inshotei' },
  { pattern: /ameya-?yokocho|ameyoko/i, name: 'Ameya-Yokocho', country: 'Japan', country_code: 'JP', latitude: 35.71, longitude: 139.7746, manualId: 'manual:tokyo:ameya-yokocho' },
  { pattern: /meiji jingu|meiji shrine/i, name: 'Meiji Jingu', country: 'Japan', country_code: 'JP', latitude: 35.6764, longitude: 139.6993, manualId: 'manual:tokyo:meiji-jingu' },
  { pattern: /afuri harajuku/i, name: 'Afuri Harajuku', country: 'Japan', country_code: 'JP', latitude: 35.669, longitude: 139.7055, manualId: 'manual:tokyo:afuri-harajuku' },
  { pattern: /a happy pancake/i, name: 'A Happy Pancake Omotesando', country: 'Japan', country_code: 'JP', latitude: 35.6673, longitude: 139.7089, manualId: 'manual:tokyo:happy-pancake-omotesando' },
  { pattern: /fuglen tokyo/i, name: 'Fuglen Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.665, longitude: 139.6958, manualId: 'manual:tokyo:fuglen-tokyo' },
  { pattern: /bills omotesando/i, name: 'Bills Omotesando', country: 'Japan', country_code: 'JP', latitude: 35.6665, longitude: 139.7104, manualId: 'manual:tokyo:bills-omotesando' },
  { pattern: /omotesando hills/i, name: 'Omotesando Hills', country: 'Japan', country_code: 'JP', latitude: 35.6673, longitude: 139.7086, manualId: 'manual:tokyo:omotesando-hills' },
  { pattern: /shibuya scramble crossing|shibuya crossing/i, name: 'Shibuya Scramble Crossing', country: 'Japan', country_code: 'JP', latitude: 35.6595, longitude: 139.7005, manualId: 'manual:tokyo:shibuya-crossing' },
  { pattern: /hachiko memorial statue|hachik[oō]/i, name: 'Hachiko Memorial Statue', country: 'Japan', country_code: 'JP', latitude: 35.65906, longitude: 139.70062, manualId: 'manual:tokyo:hachiko-statue' },
  { pattern: /shibuya sky/i, name: 'Shibuya Sky', country: 'Japan', country_code: 'JP', latitude: 35.6584, longitude: 139.702, manualId: 'manual:tokyo:shibuya-sky' },
  { pattern: /uobei/i, name: 'Uobei Shibuya Dogenzaka', country: 'Japan', country_code: 'JP', latitude: 35.6581, longitude: 139.6973, manualId: 'manual:tokyo:uobei-shibuya' },
  { pattern: /t\.?y\.?\s*harbor|ty harbor/i, name: 'T.Y. HARBOR', country: 'Japan', country_code: 'JP', latitude: 35.6229, longitude: 139.7496, manualId: 'manual:tokyo:ty-harbor' },
  { pattern: /happo-?en garden|happo-?en/i, name: 'Happo-en Garden', country: 'Japan', country_code: 'JP', latitude: 35.63776, longitude: 139.72834, manualId: 'manual:tokyo:happo-en-garden' },
  { pattern: /tsukiji outer market/i, name: 'Tsukiji Outer Market', country: 'Japan', country_code: 'JP', latitude: 35.6655, longitude: 139.7707, manualId: 'manual:tokyo:tsukiji-outer-market' },
  { pattern: /tsukiji sushi daiwa|sushi daiwa/i, name: 'Tsukiji Sushi Daiwa', country: 'Japan', country_code: 'JP', latitude: 35.6652, longitude: 139.7702, manualId: 'manual:tokyo:tsukiji-sushi-daiwa' },
  { pattern: /sushi\s*zanmai|sushizanmai/i, name: 'Tsukiji Sushizanmai Honten', country: 'Japan', country_code: 'JP', latitude: 35.6657, longitude: 139.7707, manualId: 'manual:tokyo:sushizanmai-honten' },
  { pattern: /tonkatsu aoki.*ginza|aoki ginza/i, name: 'Tonkatsu Aoki Ginza', country: 'Japan', country_code: 'JP', latitude: 35.67173, longitude: 139.76626, manualId: 'manual:tokyo:tonkatsu-aoki-ginza' },
  { pattern: /teamlab planets/i, name: 'teamLab Planets TOKYO DMM', country: 'Japan', country_code: 'JP', latitude: 35.6491, longitude: 139.7904, manualId: 'manual:tokyo:teamlab-planets' },
  { pattern: /kyubey ginza|ginza kyubey/i, name: 'Kyubey Ginza Main Shop', country: 'Japan', country_code: 'JP', latitude: 35.66962, longitude: 139.76365, manualId: 'manual:tokyo:kyubey-ginza' },
  { pattern: /caf[eé] de l'?ambre|cafe de lambre/i, name: "Cafe de L'Ambre", country: 'Japan', country_code: 'JP', latitude: 35.67082, longitude: 139.76554, manualId: 'manual:tokyo:cafe-de-lambre' },
  { pattern: /tsukiji itadori/i, name: 'Tsukiji Itadori Bekkan', country: 'Japan', country_code: 'JP', latitude: 35.66534, longitude: 139.77008, manualId: 'manual:tokyo:tsukiji-itadori-bekkan' },
  { pattern: /mikasa kaikan.*la viola|la viola/i, name: 'Mikasa Kaikan Honten Italian Bar LA VIOLA', country: 'Japan', country_code: 'JP', latitude: 35.67153, longitude: 139.76452, manualId: 'manual:tokyo:mikasa-kaikan-la-viola' },
  { pattern: /\bsmt tokyo\b/i, name: 'Omotesando Hills', country: 'Japan', country_code: 'JP', latitude: 35.6673, longitude: 139.7086, manualId: 'manual:tokyo:smt-omotesando-fallback' },
  { pattern: /hamarikyu gardens|hama-rikyu/i, name: 'Hamarikyu Gardens', country: 'Japan', country_code: 'JP', latitude: 35.6595, longitude: 139.7634, manualId: 'manual:tokyo:hamarikyu-gardens' },
  { pattern: /tokyo station|marunouchi building/i, name: 'Tokyo Station Marunouchi Building', country: 'Japan', country_code: 'JP', latitude: 35.68124, longitude: 139.76713, manualId: 'manual:tokyo:tokyo-station' },
  { pattern: /imperial palace east gardens/i, name: 'Imperial Palace East Gardens', country: 'Japan', country_code: 'JP', latitude: 35.68518, longitude: 139.75963, manualId: 'manual:tokyo:imperial-palace-east-gardens' },
  { pattern: /tsujihan|zeitaku don/i, name: 'Tsujihan ZEITAKU DON Marunouchi', country: 'Japan', country_code: 'JP', latitude: 35.68074, longitude: 139.76749, manualId: 'manual:tokyo:tsujihan-marunouchi' },
  { pattern: /art aquarium/i, name: 'Art Aquarium Museum Ginza', country: 'Japan', country_code: 'JP', latitude: 35.67125, longitude: 139.765, manualId: 'manual:tokyo:art-aquarium-ginza' },
  { pattern: /ginza six/i, name: 'Ginza Six', country: 'Japan', country_code: 'JP', latitude: 35.6696, longitude: 139.7649, manualId: 'manual:tokyo:ginza-six' },
  { pattern: /ginza kagari/i, name: 'Ginza Kagari Main Branch', country: 'Japan', country_code: 'JP', latitude: 35.6712, longitude: 139.7638, manualId: 'manual:tokyo:ginza-kagari' },
  { pattern: /colosseum|roman forum/i, name: 'Colosseum', country: 'Italy', country_code: 'IT', latitude: 41.89021, longitude: 12.49223, manualId: 'manual:rome:colosseum' },
  { pattern: /taverna dei fori imperiali/i, name: 'Taverna dei Fori Imperiali', country: 'Italy', country_code: 'IT', latitude: 41.89303, longitude: 12.48923, manualId: 'manual:rome:taverna-fori-imperiali' },
  { pattern: /pantheon/i, name: 'Pantheon', country: 'Italy', country_code: 'IT', latitude: 41.89861, longitude: 12.47687, manualId: 'manual:rome:pantheon' },
  { pattern: /da enzo al 29/i, name: 'Da Enzo al 29', country: 'Italy', country_code: 'IT', latitude: 41.88798, longitude: 12.46947, manualId: 'manual:rome:da-enzo-al-29' },
  { pattern: /freni e frizioni/i, name: 'Freni e Frizioni', country: 'Italy', country_code: 'IT', latitude: 41.88908, longitude: 12.47014, manualId: 'manual:rome:freni-e-frizioni' },
  { pattern: /vatican museums|sistine chapel/i, name: 'Vatican Museums', country: 'Italy', country_code: 'IT', latitude: 41.90649, longitude: 12.45362, manualId: 'manual:rome:vatican-museums' },
  { pattern: /st\.?\s*peter'?s (?:basilica|square)|piazza san pietro/i, name: "St. Peter's Square", country: 'Italy', country_code: 'IT', latitude: 41.90217, longitude: 12.45394, manualId: 'manual:rome:st-peters-square' },
  { pattern: /pizzarium bonci|bonci pizzarium|pizzarium/i, name: 'Pizzarium Bonci', country: 'Italy', country_code: 'IT', latitude: 41.90708, longitude: 12.44645, manualId: 'manual:rome:pizzarium-bonci' },
  { pattern: /castel sant'?angelo|castle sant'?angelo/i, name: "Castel Sant'Angelo", country: 'Italy', country_code: 'IT', latitude: 41.90317, longitude: 12.46631, manualId: 'manual:rome:castel-santangelo' },
  { pattern: /piazza navona/i, name: 'Piazza Navona', country: 'Italy', country_code: 'IT', latitude: 41.89893, longitude: 12.47307, manualId: 'manual:rome:piazza-navona' },
  { pattern: /armando al pantheon/i, name: 'Armando al Pantheon', country: 'Italy', country_code: 'IT', latitude: 41.89861, longitude: 12.47679, manualId: 'manual:rome:armando-al-pantheon' },
  { pattern: /\bil sorpasso\b/i, name: 'Il Sorpasso', country: 'Italy', country_code: 'IT', latitude: 41.9053, longitude: 12.4641, manualId: 'manual:rome:il-sorpasso' },
  { pattern: /^the court$|the court.*rome/i, name: 'The Court', country: 'Italy', country_code: 'IT', latitude: 41.88966, longitude: 12.49339, manualId: 'manual:rome:the-court' },
  { pattern: /barcelona cathedral/i, name: 'Barcelona Cathedral', country: 'Spain', country_code: 'ES', latitude: 41.38396, longitude: 2.1762, manualId: 'manual:barcelona:cathedral' },
  { pattern: /mercat de santa caterina|santa caterina market/i, name: 'Mercat de Santa Caterina', country: 'Spain', country_code: 'ES', latitude: 41.3865, longitude: 2.1784, manualId: 'manual:barcelona:santa-caterina-market' },
  { pattern: /picasso museum|museu picasso/i, name: 'Picasso Museum', country: 'Spain', country_code: 'ES', latitude: 41.3853, longitude: 2.1809, manualId: 'manual:barcelona:picasso-museum' },
  { pattern: /el xampanyet/i, name: 'El Xampanyet', country: 'Spain', country_code: 'ES', latitude: 41.3849, longitude: 2.181, manualId: 'manual:barcelona:el-xampanyet' },
  { pattern: /sagrada fam[ií]lia|sagrada familia/i, name: 'Sagrada Família', country: 'Spain', country_code: 'ES', latitude: 41.40363, longitude: 2.17436, manualId: 'manual:barcelona:sagrada-familia' },
  { pattern: /baluard barceloneta/i, name: 'Baluard Barceloneta', country: 'Spain', country_code: 'ES', latitude: 41.3791, longitude: 2.1888, manualId: 'manual:barcelona:baluard-barceloneta' },
  { pattern: /park g[üu]ell|parc g[üu]ell/i, name: 'Park Güell', country: 'Spain', country_code: 'ES', latitude: 41.41449, longitude: 2.15269, manualId: 'manual:barcelona:park-guell' },
  { pattern: /bunkers del carmel/i, name: 'Bunkers del Carmel', country: 'Spain', country_code: 'ES', latitude: 41.41952, longitude: 2.16187, manualId: 'manual:barcelona:bunkers-del-carmel' },
  { pattern: /barceloneta beach/i, name: 'Barceloneta Beach', country: 'Spain', country_code: 'ES', latitude: 41.37839, longitude: 2.1925, manualId: 'manual:barcelona:barceloneta-beach' },
  { pattern: /can ma[nñ]o/i, name: 'Can Maño', country: 'Spain', country_code: 'ES', latitude: 41.379, longitude: 2.1882, manualId: 'manual:barcelona:can-mano' },
  { pattern: /montju[iï]c castle|montjuic castle/i, name: 'Montjuïc Castle', country: 'Spain', country_code: 'ES', latitude: 41.36343, longitude: 2.16649, manualId: 'manual:barcelona:montjuic-castle' },
  { pattern: /quimet\s*&\s*quimet|quimet and quimet/i, name: 'Quimet & Quimet', country: 'Spain', country_code: 'ES', latitude: 41.3749, longitude: 2.1644, manualId: 'manual:barcelona:quimet-quimet' },
  { pattern: /westminster abbey/i, name: 'Westminster Abbey', country: 'United Kingdom', country_code: 'GB', latitude: 51.49929, longitude: -0.12731, manualId: 'manual:london:westminster-abbey' },
  { pattern: /the wolseley/i, name: 'The Wolseley', country: 'United Kingdom', country_code: 'GB', latitude: 51.50745, longitude: -0.14192, manualId: 'manual:london:the-wolseley' },
  { pattern: /tate modern/i, name: 'Tate Modern', country: 'United Kingdom', country_code: 'GB', latitude: 51.5076, longitude: -0.0994, manualId: 'manual:london:tate-modern' },
  { pattern: /anchor bankside|the anchor/i, name: 'Anchor Bankside', country: 'United Kingdom', country_code: 'GB', latitude: 51.50751, longitude: -0.09379, manualId: 'manual:london:anchor-bankside' },
  { pattern: /british museum/i, name: 'The British Museum', country: 'United Kingdom', country_code: 'GB', latitude: 51.51941, longitude: -0.12696, manualId: 'manual:london:british-museum' },
  { pattern: /dishoom covent garden/i, name: 'Dishoom Covent Garden', country: 'United Kingdom', country_code: 'GB', latitude: 51.51238, longitude: -0.12688, manualId: 'manual:london:dishoom-covent-garden' },
  { pattern: /london transport museum/i, name: 'London Transport Museum', country: 'United Kingdom', country_code: 'GB', latitude: 51.51191, longitude: -0.12155, manualId: 'manual:london:transport-museum' },
  { pattern: /frenchie covent garden/i, name: 'Frenchie Covent Garden', country: 'United Kingdom', country_code: 'GB', latitude: 51.5121, longitude: -0.12542, manualId: 'manual:london:frenchie-covent-garden' },
  { pattern: /tower of london/i, name: 'Tower of London', country: 'United Kingdom', country_code: 'GB', latitude: 51.50811, longitude: -0.07595, manualId: 'manual:london:tower-of-london' },
  { pattern: /sky garden/i, name: 'Sky Garden', country: 'United Kingdom', country_code: 'GB', latitude: 51.5113, longitude: -0.0836, manualId: 'manual:london:sky-garden' },
  { pattern: /eataly london/i, name: 'Eataly London', country: 'United Kingdom', country_code: 'GB', latitude: 51.5191, longitude: -0.08005, manualId: 'manual:london:eataly' },
  { pattern: /brat,?\s*london|\bbrat\b/i, name: 'BRAT', country: 'United Kingdom', country_code: 'GB', latitude: 51.52466, longitude: -0.07641, manualId: 'manual:london:brat' },
  { pattern: /mus[eé]e carnavalet/i, name: 'Musée Carnavalet', country: 'France', country_code: 'FR', latitude: 48.8575, longitude: 2.3628, manualId: 'manual:paris:musee-carnavalet' },
  { pattern: /march[eé] des enfants rouges/i, name: 'Marché des Enfants Rouges', country: 'France', country_code: 'FR', latitude: 48.8628, longitude: 2.361, manualId: 'manual:paris:marche-enfants-rouges' },
  { pattern: /mus[eé]e picasso/i, name: 'Musée Picasso', country: 'France', country_code: 'FR', latitude: 48.8599, longitude: 2.3624, manualId: 'manual:paris:musee-picasso' },
  { pattern: /du pain et des id[eé]es/i, name: 'Du Pain et des Idées', country: 'France', country_code: 'FR', latitude: 48.8713, longitude: 2.3625, manualId: 'manual:paris:du-pain-et-des-idees' },
  { pattern: /le mary celeste/i, name: 'Le Mary Celeste', country: 'France', country_code: 'FR', latitude: 48.8617, longitude: 2.363, manualId: 'manual:paris:le-mary-celeste' },
  { pattern: /caf[eé] de flore/i, name: 'Café de Flore', country: 'France', country_code: 'FR', latitude: 48.85413, longitude: 2.3322, manualId: 'manual:paris:cafe-de-flore' },
  { pattern: /jardin du luxembourg|luxembourg gardens/i, name: 'Jardin du Luxembourg', country: 'France', country_code: 'FR', latitude: 48.84622, longitude: 2.33716, manualId: 'manual:paris:jardin-du-luxembourg' },
  { pattern: /le jules verne/i, name: 'Le Jules Verne', country: 'France', country_code: 'FR', latitude: 48.8583, longitude: 2.2945, manualId: 'manual:paris:le-jules-verne' },
  { pattern: /mus[eé]e de la vie romantique/i, name: 'Musée de la Vie Romantique', country: 'France', country_code: 'FR', latitude: 48.8817, longitude: 2.333, manualId: 'manual:paris:musee-vie-romantique' },
  { pattern: /\bsemilla\b/i, name: 'Semilla', country: 'France', country_code: 'FR', latitude: 48.8537, longitude: 2.3373, manualId: 'manual:paris:semilla' },
  { pattern: /hardware soci[eé]t[eé]/i, name: 'Hardware Société', country: 'France', country_code: 'FR', latitude: 48.8865, longitude: 2.3424, manualId: 'manual:paris:hardware-societe' },
  { pattern: /sacr[eé]-c[œo]ur|sacre-coeur/i, name: 'Sacré-Cœur Basilica', country: 'France', country_code: 'FR', latitude: 48.8867, longitude: 2.3431, manualId: 'manual:paris:sacre-coeur' },
  { pattern: /mus[eé]e de montmartre/i, name: 'Musée de Montmartre', country: 'France', country_code: 'FR', latitude: 48.8874, longitude: 2.3407, manualId: 'manual:paris:musee-montmartre' },
  { pattern: /bouillon pigalle/i, name: 'Bouillon Pigalle', country: 'France', country_code: 'FR', latitude: 48.8825, longitude: 2.3379, manualId: 'manual:paris:bouillon-pigalle' },
  { pattern: /le relais gascon/i, name: 'Le Relais Gascon', country: 'France', country_code: 'FR', latitude: 48.8849, longitude: 2.3373, manualId: 'manual:paris:le-relais-gascon' },
  { pattern: /atelier des lumi[eè]res/i, name: 'Atelier des Lumières', country: 'France', country_code: 'FR', latitude: 48.8612, longitude: 2.38, manualId: 'manual:paris:atelier-des-lumieres' },
  { pattern: /p[eè]re lachaise/i, name: 'Père Lachaise Cemetery', country: 'France', country_code: 'FR', latitude: 48.8614, longitude: 2.3933, manualId: 'manual:paris:pere-lachaise' },
  { pattern: /caf[eé] m[eé]ricourt/i, name: 'Café Méricourt', country: 'France', country_code: 'FR', latitude: 48.864, longitude: 2.3768, manualId: 'manual:paris:cafe-mericourt' },
  { pattern: /septime la cave/i, name: 'Septime La Cave', country: 'France', country_code: 'FR', latitude: 48.8541, longitude: 2.3806, manualId: 'manual:paris:septime-la-cave' },
  { pattern: /clamato/i, name: 'Clamato', country: 'France', country_code: 'FR', latitude: 48.8542, longitude: 2.3803, manualId: 'manual:paris:clamato' },
  { pattern: /andersen\s*&\s*maillard|andersen and maillard/i, name: 'Andersen & Maillard', country: 'Denmark', country_code: 'DK', latitude: 55.6897, longitude: 12.5533, manualId: 'manual:copenhagen:andersen-maillard' },
  { pattern: /designmuseum danmark/i, name: 'Designmuseum Danmark', country: 'Denmark', country_code: 'DK', latitude: 55.6846, longitude: 12.5932, manualId: 'manual:copenhagen:designmuseum-danmark' },
  { pattern: /broens street food/i, name: 'Broens Street Food', country: 'Denmark', country_code: 'DK', latitude: 55.6776, longitude: 12.5934, manualId: 'manual:copenhagen:broens-street-food' },
  { pattern: /dac|danish architecture center/i, name: 'DAC - Danish Architecture Center', country: 'Denmark', country_code: 'DK', latitude: 55.6726, longitude: 12.5797, manualId: 'manual:copenhagen:dac' },
  { pattern: /apollo bar/i, name: 'Apollo Bar', country: 'Denmark', country_code: 'DK', latitude: 55.681, longitude: 12.5898, manualId: 'manual:copenhagen:apollo-bar' },
  { pattern: /juno the bakery/i, name: 'Juno the Bakery', country: 'Denmark', country_code: 'DK', latitude: 55.7001, longitude: 12.5778, manualId: 'manual:copenhagen:juno-bakery' },
  { pattern: /hay house/i, name: 'HAY House', country: 'Denmark', country_code: 'DK', latitude: 55.6794, longitude: 12.5799, manualId: 'manual:copenhagen:hay-house' },
  { pattern: /atelier september/i, name: 'Atelier September', country: 'Denmark', country_code: 'DK', latitude: 55.6816, longitude: 12.5821, manualId: 'manual:copenhagen:atelier-september' },
  { pattern: /frama studio store|frama/i, name: 'FRAMA Studio Store', country: 'Denmark', country_code: 'DK', latitude: 55.6859, longitude: 12.5567, manualId: 'manual:copenhagen:frama-studio-store' },
  { pattern: /baka d'?busk/i, name: "Baka d'Busk", country: 'Denmark', country_code: 'DK', latitude: 55.687, longitude: 12.5432, manualId: 'manual:copenhagen:baka-dbusk' },
  { pattern: /pergamonmuseum|pergamon.*panorama/i, name: 'Pergamonmuseum - Das Panorama', country: 'Germany', country_code: 'DE', latitude: 52.5209, longitude: 13.3974, manualId: 'manual:berlin:pergamon-panorama' },
  { pattern: /r[üu]yam gem[üu]se kebab/i, name: 'Rüyam Gemüse Kebab', country: 'Germany', country_code: 'DE', latitude: 52.485, longitude: 13.3951, manualId: 'manual:berlin:ruyam-kebab' },
  { pattern: /jewish museum berlin/i, name: 'Jewish Museum Berlin', country: 'Germany', country_code: 'DE', latitude: 52.502, longitude: 13.395, manualId: 'manual:berlin:jewish-museum' },
  { pattern: /markthalle neun/i, name: 'Markthalle Neun', country: 'Germany', country_code: 'DE', latitude: 52.5024, longitude: 13.4317, manualId: 'manual:berlin:markthalle-neun' },
  { pattern: /^so36$|\bso36\b/i, name: 'SO36', country: 'Germany', country_code: 'DE', latitude: 52.4994, longitude: 13.4228, manualId: 'manual:berlin:so36' },
  { pattern: /east side gallery/i, name: 'East Side Gallery', country: 'Germany', country_code: 'DE', latitude: 52.505, longitude: 13.4397, manualId: 'manual:berlin:east-side-gallery' },
  { pattern: /michelberger restaurant/i, name: 'Michelberger Restaurant', country: 'Germany', country_code: 'DE', latitude: 52.5053, longitude: 13.4496, manualId: 'manual:berlin:michelberger-restaurant' },
  { pattern: /berlinische galerie/i, name: 'Berlinische Galerie', country: 'Germany', country_code: 'DE', latitude: 52.5049, longitude: 13.3989, manualId: 'manual:berlin:berlinische-galerie' },
  { pattern: /burgeramt/i, name: 'Burgeramt', country: 'Germany', country_code: 'DE', latitude: 52.5114, longitude: 13.4582, manualId: 'manual:berlin:burgeramt' },
  { pattern: /sisyphos/i, name: 'Sisyphos', country: 'Germany', country_code: 'DE', latitude: 52.4937, longitude: 13.4778, manualId: 'manual:berlin:sisyphos' },
  { pattern: /c\/o berlin|c o berlin/i, name: 'C/O Berlin', country: 'Germany', country_code: 'DE', latitude: 52.5054, longitude: 13.3335, manualId: 'manual:berlin:co-berlin' },
  { pattern: /schloss charlottenburg|charlottenburg palace/i, name: 'Schloss Charlottenburg', country: 'Germany', country_code: 'DE', latitude: 52.5206, longitude: 13.2957, manualId: 'manual:berlin:schloss-charlottenburg' },
  { pattern: /dicke wirtin/i, name: 'Dicke Wirtin', country: 'Germany', country_code: 'DE', latitude: 52.506, longitude: 13.3262, manualId: 'manual:berlin:dicke-wirtin' },
  { pattern: /^barra(?:,?\s*berlin)?$/i, name: 'Barra', country: 'Germany', country_code: 'DE', latitude: 52.4936, longitude: 13.4211, manualId: 'manual:berlin:barra' },
  { pattern: /green door bar/i, name: 'Green Door Bar', country: 'Germany', country_code: 'DE', latitude: 52.4964, longitude: 13.3546, manualId: 'manual:berlin:green-door-bar' },
]

async function ensureTripDay(supabase: any, tripId: string, dayIndex: number) {
  const { data: existing, error } = await supabase
    .from('trip_days')
    .select('id')
    .eq('trip_id', tripId)
    .eq('day_index', dayIndex)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (existing?.id) return existing.id as string

  const { data: created, error: createErr } = await supabase
    .from('trip_days')
    .insert({ trip_id: tripId, day_index: dayIndex })
    .select('id')
    .single()
  if (createErr) throw new Error(createErr.message)
  return created.id as string
}

function tripPatch(tripId: string) {
  return JSON.stringify({ kind: 'trip_patch', tripId })
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function resolveDestinationAnchor(destinationLabel: string | null | undefined, token: string | undefined) {
  if (!destinationLabel || !token) return null

  const canonicalDestination = PLANNER_DESTINATION_OVERRIDES.find((entry) => entry.pattern.test(destinationLabel.trim()))
  if (canonicalDestination) return canonicalDestination

  return geocodePlace(destinationLabel, token)
}

async function resolvePlannerPlace({
  db,
  token,
  placeQuery,
  destinationLabel,
  destinationAnchor,
}: {
  db: any
  token: string
  placeQuery?: string
  destinationLabel?: string | null
  destinationAnchor?: { latitude: number; longitude: number; country_code?: string | null } | null
}) {
  if (!placeQuery) return null

  const canonicalOverride = PLANNER_PLACE_OVERRIDES.find((entry) => entry.pattern.test(placeQuery))
  if (canonicalOverride) {
    const { data: place, error } = await db
      .from('places')
      .upsert(
        {
          name: canonicalOverride.name,
          country: canonicalOverride.country,
          country_code: canonicalOverride.country_code,
          latitude: canonicalOverride.latitude,
          longitude: canonicalOverride.longitude,
          mapbox_id: canonicalOverride.manualId,
        },
        { onConflict: 'mapbox_id' }
      )
      .select('id,name')
      .single()

    if (!error && place?.id) return place as { id: string; name: string }
    if (error) console.error('[resolvePlannerPlace] canonical places upsert error (falling back to geocode)', error.message)
  }

  const queryCandidates = Array.from(
    new Set(
      [
        destinationLabel &&
        !placeQuery.toLowerCase().includes(destinationLabel.toLowerCase())
          ? `${placeQuery}, ${destinationLabel}`
          : '',
        placeQuery,
      ].filter(Boolean)
    )
  )

  for (const query of queryCandidates) {
    const result = await geocodePlace(query, token, {
      proximity: destinationAnchor,
      countryCode: destinationAnchor?.country_code,
      strictName: true,
    })
    if (!result) continue

    const tooFar = destinationAnchor != null &&
      haversineKm(result.latitude, result.longitude, destinationAnchor.latitude, destinationAnchor.longitude) > 35

    if (tooFar) continue

    const { data: place, error } = await db
      .from('places')
      .upsert(
        {
          name: result.name,
          country: result.country,
          country_code: result.country_code || null,
          latitude: result.latitude,
          longitude: result.longitude,
          mapbox_id: result.mapbox_place_id,
        },
        { onConflict: 'mapbox_id' }
      )
      .select('id,name')
      .single()

    if (!error && place?.id) return place as { id: string; name: string }
    if (error) console.error('[resolvePlannerPlace] places upsert error (continuing without place)', error.message)
  }

  return null
}

function shouldUseResolvedPlaceTitle(type: string, title: string, placeName?: string | null) {
  if (type !== 'meal' || !placeName) return false
  if (title.toLowerCase().includes(placeName.toLowerCase())) return false

  return /\b(breakfast|brunch|lunch|dinner|drinks?|coffee|cafe|café|meal|food|seafood|rooftop|taverna|restaurant|bar)\b/i.test(title)
}

function normalizeTripItemType(type?: string | null) {
  if (type === 'transit') return 'transport'
  if (type === 'note') return 'activity'
  return type || 'activity'
}


async function computeAndStoreDayRoute(
  supabase: any,
  tripDayId: string,
  token: string,
  mode: 'walk' | 'drive' | 'transit' = 'walk'
) {
  try {
    const { data: items, error } = await supabase
      .from('trip_items')
      .select('place:places(latitude,longitude)')
      .eq('trip_day_id', tripDayId)
      .order('order_index', { ascending: true })

    if (error) return

    const coords = (items || [])
      .map((it: any) => ({ latitude: it.place?.latitude, longitude: it.place?.longitude }))
      .filter((coord: any) => typeof coord.latitude === 'number' && typeof coord.longitude === 'number')

    if (coords.length < 2) {
      await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId).eq('mode', mode)
      return
    }

    const mappedRoute = await directionsGeojson(coords, token, mode)
    const route = isUsableStoredRoute(mappedRoute) ? mappedRoute : buildStraightLineRoute(coords)
    if (!route) return

    await supabase
      .from('trip_routes')
      .upsert(
        {
          trip_day_id: tripDayId,
          geojson: route.geojson,
          distance_m: route.distance_m,
          duration_s: route.duration_s,
          mode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'trip_day_id,mode' }
      )
  } catch {
    // Route computation is non-critical — items are already saved, silently skip
  }
}

function isUsableStoredRoute(route: Awaited<ReturnType<typeof directionsGeojson>> | null) {
  return (
    route != null &&
    typeof route.distance_m === 'number' &&
    route.distance_m > 0 &&
    route.distance_m <= 25000
  )
}

function buildStraightLineRoute(coords: Array<{ latitude: number; longitude: number }>) {
  if (coords.length < 2) return null

  let distance_m = 0
  for (let index = 1; index < coords.length; index++) {
    distance_m += haversineKm(
      coords[index - 1].latitude,
      coords[index - 1].longitude,
      coords[index].latitude,
      coords[index].longitude,
    ) * 1000
  }

  const roundedDistance = Math.round(distance_m)
  if (roundedDistance <= 0 || roundedDistance > 25000) return null

  return {
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { fallback: true, source: 'straight-line' },
          geometry: {
            type: 'LineString',
            coordinates: coords.map((coord) => [coord.longitude, coord.latitude]),
          },
        },
      ],
    },
    distance_m: roundedDistance,
    duration_s: Math.round(roundedDistance / 1.25),
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const guestId = getGuestIdFromCookieHeader(req.headers.get('cookie'))
    // Service client bypasses RLS — used for all DB operations so inserts aren't blocked by policy subqueries
    const db = await createServiceClient()
    if (guestId) {
      await ensureGuestAccount(guestId, db)
    } else if (!authUser && isDevAuthBypassEnabled) {
      await ensureDevAccount(db)
    }
    const user = (guestId ? createGuestUser(guestId) : null) || authUser || (isDevAuthBypassEnabled ? devUser : null)

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, type, tripId, conversationId } = await req.json() as {
      messages: UIMessage[]
      type: 'onboarding' | 'explore' | 'plan'
      tripId?: string
      conversationId?: string
    }
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const plannerSession = await loadPlannerSession({
      db,
      userId: user.id,
      messages,
      mode: type,
      tripId,
      conversationId,
    })
    const latestUserText = plannerSession.latestUserText
    const hasExistingDays = Boolean(plannerSession.runtime.trip?.hasExistingDays)
    const hasExistingItems = Boolean(plannerSession.runtime.trip?.hasExistingItems)
    const systemPrompt = buildPlannerSystemPrompt(plannerSession.runtime)

    // Create tools with user context for DB operations
    const userTools = {
      addVisitedPlace: tool({
        description: 'Add a place the user has visited to their travel map',
        inputSchema: z.object({
          name: z.string().describe('Name of the place or city'),
          country: z.string().describe('Country name'),
          country_code: z.string().describe('ISO 2-letter country code'),
          latitude: z.number().describe('Latitude coordinate'),
          longitude: z.number().describe('Longitude coordinate'),
          rating: z.number().min(1).max(5).optional().describe('User rating 1-5'),
        }),
        execute: async ({ name, country, country_code, latitude, longitude, rating }) => {
          let placeId: string
          const { data: existing } = await db.from('places').select('id').eq('name', name).eq('country', country).maybeSingle()
          if (existing) {
            placeId = existing.id
          } else {
            const { data: newPlace, error } = await db.from('places').insert({ name, country, country_code, latitude, longitude }).select('id').single()
            if (error) return `Failed to add place: ${error.message}`
            placeId = newPlace.id
          }
          await db.from('user_places').upsert({ user_id: user.id, place_id: placeId, status: 'visited', rating: rating || null }, { onConflict: 'user_id,place_id' })
          return JSON.stringify({ success: true, name, country, latitude, longitude, status: 'visited' })
        },
      }),
      addBucketListPlace: tool({
        description: 'Save a destination idea for a future group trip',
        inputSchema: z.object({
          name: z.string().describe('Name of the place or city'),
          country: z.string().describe('Country name'),
          country_code: z.string().describe('ISO 2-letter country code'),
          latitude: z.number().describe('Latitude coordinate'),
          longitude: z.number().describe('Longitude coordinate'),
          reason: z.string().optional().describe('Why the user wants to visit'),
        }),
        execute: async ({ name, country, country_code, latitude, longitude, reason }) => {
          let placeId: string
          const { data: existing } = await db.from('places').select('id').eq('name', name).eq('country', country).maybeSingle()
          if (existing) {
            placeId = existing.id
          } else {
            const { data: newPlace, error } = await db.from('places').insert({ name, country, country_code, latitude, longitude }).select('id').single()
            if (error) return `Failed to add place: ${error.message}`
            placeId = newPlace.id
          }
          await db.from('user_places').upsert({ user_id: user.id, place_id: placeId, status: 'bucket_list', notes: reason || null }, { onConflict: 'user_id,place_id' })
          return JSON.stringify({ success: true, name, country, latitude, longitude, status: 'bucket_list' })
        },
      }),
      navigateToPlace: tool({
        description: 'Navigate/fly the map to show a specific place. Use this when the user asks to see, show, or go to a place, or when you are describing a specific location.',
        inputSchema: z.object({
          name: z.string().describe('Name of the place or city'),
          country: z.string().describe('Country name'),
          latitude: z.number().describe('Latitude coordinate'),
          longitude: z.number().describe('Longitude coordinate'),
          description: z.string().describe('A 2-3 sentence vivid description of this place - what makes it special, what a traveler should know'),
          highlights: z.array(z.string()).describe('3-4 top highlights or things to do, each 3-6 words'),
          best_time: z.string().optional().describe('Best time to visit, e.g. "March to May"'),
        }),
        execute: async ({ name, country, latitude, longitude, description, highlights, best_time }) => {
          return JSON.stringify({ kind: 'navigate', success: true, action: 'navigate', name, country, latitude, longitude, description, highlights, best_time })
        },
      }),
      setTravelPreferences: tool({
        description: 'Set the user travel style and preferences',
        inputSchema: z.object({
          style: z.string().describe('Travel style: adventure, luxury, budget, family, backpacker, etc.'),
          interests: z.array(z.string()).describe('List of travel interests'),
          budget_preference: z.string().describe('Budget preference: budget, moderate, luxury'),
        }),
        execute: async ({ style, interests, budget_preference }) => {
          await db.from('profiles').update({ travel_style: `${style} | ${interests.join(', ')} | ${budget_preference}` }).eq('id', user.id)
          return `Successfully set travel preferences: ${style}`
        },
      }),

      // ----------------------------
      // Trip planning tools (type: "plan")
      // ----------------------------
      resolvePlace: tool({
        description: 'Resolve a place query into a canonical place record. Always use this if you need a specific location.',
        inputSchema: z.object({
          query: z.string().describe('Place query like "Shinjuku, Tokyo" or "Senso-ji Temple"'),
        }),
        execute: async ({ query }) => {
          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })
          const result = await geocodePlace(query, token)
          if (!result) return JSON.stringify({ kind: 'resolve_place', ok: false, query })

          const { data: place, error } = await db
            .from('places')
            .upsert(
              {
                name: result.name,
                country: result.country,
                country_code: result.country_code || null,
                latitude: result.latitude,
                longitude: result.longitude,
                mapbox_id: result.mapbox_place_id,
              },
              { onConflict: 'mapbox_id' }
            )
            .select('id,name,country,latitude,longitude')
            .single()
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          return JSON.stringify({ kind: 'resolve_place', ok: true, place })
        },
      }),
      scoreDestinations: tool({
        description: 'Rank city-break destinations for a friend group using vibe, budget, and group-size heuristics.',
        inputSchema: z.object({
          group_size: z.number().int().min(1).max(20).optional(),
          budget: z.string().optional(),
          vibe: z.string().optional(),
          limit: z.number().int().min(1).max(8).default(5),
        }),
        execute: async ({ group_size, budget, vibe, limit }) => {
          const ranked = listScoredDestinations({
            groupSize: group_size,
            budget: budget || plannerSession.runtime.trip?.brief?.budget || null,
            vibe: vibe || plannerSession.runtime.trip?.brief?.vibe || null,
            limit,
          })
          return JSON.stringify({ kind: 'destination_scores', ranked })
        },
      }),
      compareDestinationOptions: tool({
        description: 'Compare a shortlist of cities for a group city break and return ranked strengths/cautions.',
        inputSchema: z.object({
          cities: z.array(z.string()).min(2).max(5),
          group_size: z.number().int().min(1).max(20).optional(),
          budget: z.string().optional(),
          vibe: z.string().optional(),
        }),
        execute: async ({ cities, group_size, budget, vibe }) => {
          const comparison = compareDestinations({
            cities,
            groupSize: group_size,
            budget: budget || plannerSession.runtime.trip?.brief?.budget || null,
            vibe: vibe || plannerSession.runtime.trip?.brief?.vibe || null,
          })
          return JSON.stringify({ kind: 'destination_comparison', comparison })
        },
      }),

      createTrip: tool({
        description: 'Create a new trip (only if the user explicitly asks).',
        inputSchema: z.object({
          title: z.string(),
          days: z.number().int().min(1).max(30).optional(),
        }),
        execute: async ({ title, days }) => {
          const slug = randomSlug()
          const { data: created, error } = await db
            .from('trips')
            .insert({ user_id: user.id, title, share_slug: slug, constraints: {} })
            .select('id')
            .single()
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          const count = days || 4
          const dayRows = Array.from({ length: count }, (_, i) => ({ trip_id: created.id, day_index: i + 1 }))
          await db.from('trip_days').insert(dayRows)

          return JSON.stringify({ kind: 'trip_created', tripId: created.id })
        },
      }),

      setTripDays: tool({
        description: 'Set trip day metadata (titles/dates).',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          days: z.array(z.object({
            day_index: z.number().int().min(1),
            title: z.string().optional(),
            date: z.string().optional(),
            notes: z.string().optional(),
          })),
        }),
        execute: async ({ trip_id, days }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          for (const d of days) {
            const dayId = await ensureTripDay(db, tid, d.day_index)
            await db
              .from('trip_days')
              .update({
                title: d.title ?? null,
                date: d.date ?? null,
                notes: d.notes ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', dayId)
          }
          return tripPatch(tid)
        },
      }),

      addTripItem: tool({
        description: 'Add an itinerary item to a specific day.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          day_index: z.number().int().min(1),
          type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']),
          title: z.string(),
          place_query: z.string().optional().describe('Optional place query to geocode and attach'),
          start_time: z.string().optional().describe('HH:MM'),
          end_time: z.string().optional().describe('HH:MM'),
          duration_minutes: z.number().int().min(0).max(1440).optional(),
          notes: z.string().optional(),
        }),
        execute: async ({ trip_id, day_index, type, title, place_query, start_time, end_time, duration_minutes, notes }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const dayId = await ensureTripDay(db, tid, day_index)
          const token = mapboxToken

          const { data: trip } = await db.from('trips').select('title').eq('id', tid).maybeSingle()
          const destinationLabel = extractDestinationFromTitle(trip?.title)
          const destinationAnchor = await resolveDestinationAnchor(destinationLabel, token)
          const place = token
            ? await resolvePlannerPlace({ db, token, placeQuery: place_query, destinationLabel, destinationAnchor })
            : null
          const normalizedType = normalizeTripItemType(type)
          const itemTitle = shouldUseResolvedPlaceTitle(normalizedType, title, place?.name) ? place!.name : title

          const { data: existing, error: maxErr } = await db
            .from('trip_items')
            .select('order_index')
            .eq('trip_day_id', dayId)
            .order('order_index', { ascending: false })
            .limit(1)
          if (maxErr) return JSON.stringify({ kind: 'error', message: maxErr.message })

          const nextOrder = existing && existing[0]?.order_index != null ? (existing[0].order_index as number) + 1 : 0

          const { error } = await db
            .from('trip_items')
            .insert({
              trip_day_id: dayId,
              type: normalizedType,
              title: itemTitle,
              place_id: place?.id || null,
              start_time: start_time ?? null,
              end_time: end_time ?? null,
              duration_minutes: duration_minutes ?? null,
              notes: notes ?? null,
              order_index: nextOrder,
            })
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          if (token) {
            await computeAndStoreDayRoute(db, dayId, token, 'walk')
          }

          return tripPatch(tid)
        },
      }),

      setFullTripPlan: tool({
        description: 'Create or replace a full multi-day itinerary in one call. Use this for the initial trip plan or full-day rewrites. Include place_query for any activity or meal that should appear on the day map.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          title: z.string().optional(),
          start_date: z.string().optional(),
          end_date: z.string().optional(),
          pace: z.enum(['relaxed', 'balanced', 'packed']).optional(),
          budget_level: z.enum(['budget', 'mid', 'luxury']).optional(),
          clear_existing: z.boolean().default(true),
          days: z.array(z.object({
            day_index: z.number().int().min(1),
            title: z.string().optional(),
            date: z.string().optional(),
            notes: z.string().optional(),
            items: z.array(z.object({
              type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']),
              title: z.string(),
              place_query: z.string().optional(),
              start_time: z.string().optional(),
              end_time: z.string().optional(),
              duration_minutes: z.number().int().min(0).max(1440).optional(),
              notes: z.string().optional(),
            })).default([]),
          })).min(1),
        }),
        execute: async ({ trip_id, title, start_date, end_date, pace, budget_level, clear_existing, days }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })

          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })

          // Fetch current trip title for destination sanity-checking
          const { data: existingTrip } = await db.from('trips').select('title,constraints').eq('id', tid).maybeSingle()
          const destinationLabel =
            (typeof existingTrip?.constraints?.destination_query === 'string' && existingTrip.constraints.destination_query.trim()) ||
            extractDestinationFromTitle(title || existingTrip?.title) ||
            extractDestinationFromPrompt(latestUserText)
          const destinationAnchor = await resolveDestinationAnchor(destinationLabel, token)

          if (title || start_date || end_date || pace || budget_level) {
            const nextConstraints = destinationLabel
              ? { ...(existingTrip?.constraints || {}), destination_query: destinationLabel }
              : existingTrip?.constraints
            const { error: tripErr } = await db
              .from('trips')
              .update({
                ...(title ? { title } : {}),
                ...(start_date ? { start_date } : {}),
                ...(end_date ? { end_date } : {}),
                ...(pace ? { pace } : {}),
                ...(budget_level ? { budget_level } : {}),
                ...(nextConstraints ? { constraints: nextConstraints } : {}),
                updated_at: new Date().toISOString(),
              })
              .eq('id', tid)
            if (tripErr) return JSON.stringify({ kind: 'error', message: tripErr.message })
          }

          for (const day of days) {
            const tripDayId = await ensureTripDay(db, tid, day.day_index)
            const { count: existingItemCount } = await db
              .from('trip_items')
              .select('id', { count: 'exact', head: true })
              .eq('trip_day_id', tripDayId)

            const { error: dayErr } = await db
              .from('trip_days')
              .update({
                title: day.title ?? null,
                date: day.date ?? null,
                notes: day.notes ?? null,
              })
              .eq('id', tripDayId)
            if (dayErr) return JSON.stringify({ kind: 'error', message: dayErr.message })

            if (day.items.length === 0 && (existingItemCount || 0) > 0) {
              console.warn('[setFullTripPlan] skipped clearing populated day with empty items payload', JSON.stringify({ tripId: tid, day_index: day.day_index }))
              continue
            }

            if (clear_existing) {
              await db.from('trip_items').delete().eq('trip_day_id', tripDayId)
              await db.from('trip_routes').delete().eq('trip_day_id', tripDayId)
            }

            for (let index = 0; index < day.items.length; index++) {
              const item = day.items[index]
              const place = await resolvePlannerPlace({
                db,
                token,
                placeQuery: item.place_query,
                destinationLabel,
                destinationAnchor,
              })
              const normalizedType = normalizeTripItemType(item.type)
              const itemTitle = shouldUseResolvedPlaceTitle(normalizedType, item.title, place?.name) ? place!.name : item.title

              const { error: itemErr } = await db
                .from('trip_items')
                .insert({
                  trip_day_id: tripDayId,
                  type: normalizedType,
                  title: itemTitle,
                  place_id: place?.id || null,
                  start_time: item.start_time ?? null,
                  end_time: item.end_time ?? null,
                  duration_minutes: item.duration_minutes ?? null,
                  notes: item.notes ?? null,
                  order_index: index,
                })
              if (itemErr) {
                console.error('[setFullTripPlan] item insert error:', itemErr.message, JSON.stringify({ trip_day_id: tripDayId, type: item.type, title: item.title }))
                return JSON.stringify({ kind: 'error', message: itemErr.message })
              }
            }

            // Route computation is non-critical — wrapped in computeAndStoreDayRoute try-catch
            await computeAndStoreDayRoute(db, tripDayId, token, 'walk')
          }

          return tripPatch(tid)
        },
      }),

      replaceTripDayPlan: tool({
        description: 'Replace the itinerary for one existing day only. Use this when the user asks to change, rewrite, regenerate, rebuild, or improve a named day such as "change Day 1". This clears only that day, inserts the revised items, recomputes that day route, and leaves all other days untouched.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          day_index: z.number().int().min(1),
          title: z.string().optional(),
          date: z.string().optional(),
          notes: z.string().optional(),
          items: z.array(z.object({
            type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']),
            title: z.string(),
            place_query: z.string().optional(),
            start_time: z.string().optional(),
            end_time: z.string().optional(),
            duration_minutes: z.number().int().min(0).max(1440).optional(),
            notes: z.string().optional(),
          })).min(1),
        }),
        execute: async ({ trip_id, day_index, title, date, notes, items }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })

          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })

          const [{ data: existingTrip }, { data: existingDay, error: dayLookupErr }] = await Promise.all([
            db.from('trips').select('title').eq('id', tid).maybeSingle(),
            db
              .from('trip_days')
              .select('id,day_index')
              .eq('trip_id', tid)
              .eq('day_index', day_index)
              .maybeSingle(),
          ])

          if (dayLookupErr) return JSON.stringify({ kind: 'error', message: dayLookupErr.message })
          if (!existingDay?.id) {
            return JSON.stringify({
              kind: 'error',
              message: `Day ${day_index} does not exist on this trip. Do not create extra days unless the user explicitly changes the trip length.`,
            })
          }

          const destinationLabel = extractDestinationFromTitle(existingTrip?.title)
          const destinationAnchor = await resolveDestinationAnchor(destinationLabel, token)

          const { error: dayErr } = await db
            .from('trip_days')
            .update({
              title: title ?? null,
              date: date ?? null,
              notes: notes ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingDay.id)
          if (dayErr) return JSON.stringify({ kind: 'error', message: dayErr.message })

          await db.from('trip_items').delete().eq('trip_day_id', existingDay.id)
          await db.from('trip_routes').delete().eq('trip_day_id', existingDay.id)

          for (let index = 0; index < items.length; index++) {
            const item = items[index]
            const place = await resolvePlannerPlace({
              db,
              token,
              placeQuery: item.place_query,
              destinationLabel,
              destinationAnchor,
            })
            const normalizedType = normalizeTripItemType(item.type)
            const itemTitle = shouldUseResolvedPlaceTitle(normalizedType, item.title, place?.name) ? place!.name : item.title

            const { error: itemErr } = await db
              .from('trip_items')
              .insert({
                trip_day_id: existingDay.id,
                type: normalizedType,
                title: itemTitle,
                place_id: place?.id || null,
                start_time: item.start_time ?? null,
                end_time: item.end_time ?? null,
                duration_minutes: item.duration_minutes ?? null,
                notes: item.notes ?? null,
                order_index: index,
              })
            if (itemErr) {
              console.error('[replaceTripDayPlan] item insert error:', itemErr.message, JSON.stringify({ trip_day_id: existingDay.id, type: item.type, title: item.title }))
              return JSON.stringify({ kind: 'error', message: itemErr.message })
            }
          }

          await computeAndStoreDayRoute(db, existingDay.id, token, 'walk')
          return tripPatch(tid)
        },
      }),

      swapTripItem: tool({
        description: 'Swap one existing itinerary item for one better replacement. This updates exactly one item by id, requires a specific real place_query, recomputes that day route, and must not add duplicate items.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          item_id: z.string().uuid(),
          title: z.string().describe('Exact visible title for the replacement. For meals, this must be the real restaurant/cafe/bar/bakery/market hall name.'),
          place_query: z.string().describe('Specific real place query to geocode and attach, e.g. "Karamanlidika, Athens"'),
          notes: z.string().optional(),
          start_time: z.string().optional(),
          end_time: z.string().optional(),
          duration_minutes: z.number().int().min(0).max(1440).optional(),
          type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']).optional(),
        }),
        execute: async ({ trip_id, item_id, title, place_query, notes, start_time, end_time, duration_minutes, type }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })

          const { data: currentItem, error: currentErr } = await db
            .from('trip_items')
            .select('trip_day_id,type,title,trip_day:trip_days(trip_id,trip:trips(title))')
            .eq('id', item_id)
            .maybeSingle()
          if (currentErr) return JSON.stringify({ kind: 'error', message: currentErr.message })
          if (!currentItem?.trip_day_id) return JSON.stringify({ kind: 'error', message: 'Item not found' })

          const currentItemRecord = currentItem as any
          const destinationTitle = Array.isArray(currentItemRecord?.trip_day)
            ? currentItemRecord.trip_day[0]?.trip?.title
            : currentItemRecord?.trip_day?.trip?.title
          const destinationLabel = extractDestinationFromTitle(destinationTitle)
          const destinationAnchor = await resolveDestinationAnchor(destinationLabel, token)
          const resolvedPlace = await resolvePlannerPlace({
            db,
            token,
            placeQuery: place_query,
            destinationLabel,
            destinationAnchor,
          })
          if (!resolvedPlace?.id) {
            return JSON.stringify({ kind: 'error', message: `Could not resolve replacement place: ${place_query}` })
          }

          const resolvedType = normalizeTripItemType(type || currentItem.type)
          const resolvedTitle = shouldUseResolvedPlaceTitle(resolvedType, title, resolvedPlace.name)
            ? resolvedPlace.name
            : title
          const updateFields = {
            title: resolvedTitle,
            place_id: resolvedPlace.id,
            ...(notes != null ? { notes } : {}),
            ...(start_time != null ? { start_time } : {}),
            ...(end_time != null ? { end_time } : {}),
            ...(duration_minutes != null ? { duration_minutes } : {}),
            type: resolvedType,
            updated_at: new Date().toISOString(),
          }
          const { error } = await db
            .from('trip_items')
            .update(updateFields)
            .eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          await computeAndStoreDayRoute(db, currentItem.trip_day_id, token, 'walk')
          return tripPatch(tid)
        },
      }),

      moveTripItem: tool({
        description: 'Move an item to another day (or reorder within a day).',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          item_id: z.string().uuid(),
          to_day_index: z.number().int().min(1),
          to_order_index: z.number().int().min(0).optional(),
        }),
        execute: async ({ trip_id, item_id, to_day_index, to_order_index }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          const { data: currentItem, error: currentErr } = await db
            .from('trip_items')
            .select('trip_day_id')
            .eq('id', item_id)
            .maybeSingle()
          if (currentErr) return JSON.stringify({ kind: 'error', message: currentErr.message })
          const fromDayId = currentItem?.trip_day_id as string | undefined
          const toDayId = await ensureTripDay(db, tid, to_day_index)
          const orderIndex = to_order_index ?? 0
          const { error } = await db
            .from('trip_items')
            .update({ trip_day_id: toDayId, order_index: orderIndex, updated_at: new Date().toISOString() })
            .eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })
          if (token) {
            if (fromDayId) await computeAndStoreDayRoute(db, fromDayId, token, 'walk')
            await computeAndStoreDayRoute(db, toDayId, token, 'walk')
          }
          return tripPatch(tid)
        },
      }),

      updateTripItem: tool({
        description: 'Update fields on an existing itinerary item. Include place_query when swapping to a different real venue or attraction so the item can be geocoded and pinned.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          item_id: z.string().uuid(),
          title: z.string().optional(),
          place_query: z.string().optional().describe('Specific real place query to geocode and attach, e.g. "Karamanlidika, Athens"'),
          notes: z.string().optional(),
          start_time: z.string().optional(),
          end_time: z.string().optional(),
          duration_minutes: z.number().int().min(0).max(1440).optional(),
          type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']).optional(),
        }),
        execute: async ({ trip_id, item_id, place_query, ...fields }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          const { data: currentItem, error: currentErr } = await db
            .from('trip_items')
            .select('trip_day_id,type,title,trip_day:trip_days(trip_id,trip:trips(title))')
            .eq('id', item_id)
            .maybeSingle()
          if (currentErr) return JSON.stringify({ kind: 'error', message: currentErr.message })
          const currentItemRecord = currentItem as any
          const destinationTitle = Array.isArray(currentItemRecord?.trip_day)
            ? currentItemRecord.trip_day[0]?.trip?.title
            : currentItemRecord?.trip_day?.trip?.title
          const destinationLabel = extractDestinationFromTitle(destinationTitle)
          const destinationAnchor = await resolveDestinationAnchor(destinationLabel, token)
          const resolvedPlace = token && place_query
            ? await resolvePlannerPlace({
                db,
                token,
                placeQuery: place_query,
                destinationLabel,
                destinationAnchor,
              })
            : null
          const resolvedType = normalizeTripItemType(fields.type || currentItem?.type)
          const resolvedTitle =
            shouldUseResolvedPlaceTitle(resolvedType, fields.title || currentItem?.title || '', resolvedPlace?.name)
              ? resolvedPlace!.name
              : fields.title
          const safeFields = { ...fields }
          delete safeFields.type
          const updateFields = {
            ...safeFields,
            type: resolvedType,
            ...(resolvedTitle ? { title: resolvedTitle } : {}),
            ...(resolvedPlace?.id ? { place_id: resolvedPlace.id } : {}),
            updated_at: new Date().toISOString(),
          }
          const { error } = await db
            .from('trip_items')
            .update(updateFields)
            .eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })
          if (token && currentItem?.trip_day_id) {
            await computeAndStoreDayRoute(db, currentItem.trip_day_id, token, 'walk')
          }
          return tripPatch(tid)
        },
      }),

      deleteTripItem: tool({
        description: 'Delete an itinerary item.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          item_id: z.string().uuid(),
        }),
        execute: async ({ trip_id, item_id }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          const { data: currentItem, error: currentErr } = await db
            .from('trip_items')
            .select('trip_day_id')
            .eq('id', item_id)
            .maybeSingle()
          if (currentErr) return JSON.stringify({ kind: 'error', message: currentErr.message })
          const { error } = await db.from('trip_items').delete().eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })
          if (token && currentItem?.trip_day_id) {
            await computeAndStoreDayRoute(db, currentItem.trip_day_id, token, 'walk')
          }
          return tripPatch(tid)
        },
      }),

      computeDayRoute: tool({
        description: 'Compute and cache a route line for a day based on current item order.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          day_index: z.number().int().min(1),
          mode: z.enum(['walk', 'drive', 'transit']).default('walk'),
        }),
        execute: async ({ trip_id, day_index, mode }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })
          const dayId = await ensureTripDay(db, tid, day_index)

          const { data: items, error } = await db
            .from('trip_items')
            .select('place:places(latitude,longitude)')
            .eq('trip_day_id', dayId)
            .order('order_index', { ascending: true })
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          const coords = (items || [])
            .map((it: any) => ({ latitude: it.place?.latitude, longitude: it.place?.longitude }))
            .filter((c: any) => typeof c.latitude === 'number' && typeof c.longitude === 'number')

          const route = await directionsGeojson(coords, token, mode)
          if (!route) return tripPatch(tid)

          const { error: routeErr } = await db
            .from('trip_routes')
            .upsert(
              {
                trip_day_id: dayId,
                geojson: route.geojson,
                distance_m: route.distance_m,
                duration_s: route.duration_s,
                mode,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'trip_day_id,mode' }
            )
          if (routeErr) return JSON.stringify({ kind: 'error', message: routeErr.message })
          return tripPatch(tid)
        },
      }),
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OPENAI_API_KEY is not configured', { status: 500 })
    }

    const modelName = process.env.OPENAI_MODEL || 'gpt-5.4'
    const planMode = type === 'plan'
    const latestPlanIntent = planMode
      ? inferPlanIntent({
          latestUserText,
          hasExistingTrip: Boolean(tripId),
          hasExistingDays,
          hasExistingItems,
        })
      : 'clarify'
    const activePlanTools = getPlanToolSelection(latestPlanIntent, Boolean(tripId)) as Array<keyof typeof userTools>

    const result = streamText({
      model: openai.chat(modelName),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(planMode ? 4 : 12),
      tools: userTools,
      prepareStep: planMode
        ? ({ stepNumber, steps, messages: stepMessages }) => {
            const previousStep = steps[steps.length - 1]
            const previousToolNames = new Set(previousStep?.toolCalls.map((call) => call.toolName) || [])
            const policyHook = runPlannerPolicyHooks({
              runtime: plannerSession.runtime,
              intent: latestPlanIntent,
              stepNumber,
            })
            const needsRouteRefresh =
              stepNumber > 0 &&
              ['addTripItem', 'moveTripItem', 'updateTripItem', 'deleteTripItem'].some((toolName) =>
                previousToolNames.has(toolName)
              ) &&
              !previousToolNames.has('computeDayRoute')

            const fallbackToolChoice = getPlanToolChoice(stepNumber, latestPlanIntent)
            const toolChoice = needsRouteRefresh
              ? 'required'
              : policyHook.preferredToolChoice ?? fallbackToolChoice

            return {
              messages: stepNumber === 0 ? stepMessages : stepMessages.slice(-8),
              activeTools:
                policyHook.requiresClarification
                  ? []
                  : needsRouteRefresh
                    ? ['computeDayRoute']
                    : activePlanTools,
              toolChoice,
              system:
                stepNumber === 0
                  ? `${systemPrompt}${policyHook.systemAppendix}\n\nUse tools first. Keep chat minimal and artifact-first.`
                  : `${systemPrompt}${policyHook.systemAppendix}\n\nIf the itinerary has already been updated this turn, reply with at most one short sentence and do not restate the itinerary in chat.`,
            }
          }
        : undefined,
      onStepFinish: planMode
        ? ({ stepNumber, text, toolCalls, toolResults, finishReason }) => {
            console.info(
              '[chat-step]',
              JSON.stringify({
                type,
                tripId: tripId || null,
                planIntent: latestPlanIntent,
                stepNumber,
                finishReason,
                usedTools: toolCalls.length > 0,
                textLength: text.trim().length,
                toolCalls: toolCalls.map((call) => call.toolName),
                toolResults: toolResults.map((result) => result.toolName),
              })
            )
          }
        : undefined,
    })

    return result.toUIMessageStreamResponse({
      sendReasoning: false,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
