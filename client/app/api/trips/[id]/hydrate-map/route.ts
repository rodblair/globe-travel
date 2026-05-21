import { NextResponse } from 'next/server'
import { directionsGeojson, geocodePlace } from '@/app/api/trips/_mapbox'
import { requireUser } from '@/app/api/trips/_utils'
import { REGIONAL_PLACE_OVERRIDES } from '@/lib/planner/regional-place-overrides'
import { extractDestinationFromTitle } from '@/lib/planner/runtime'

type CanonicalPlaceOverride = {
  pattern: RegExp
  query?: string
  name?: string
  country?: string
  country_code?: string
  latitude?: number
  longitude?: number
  manualId?: string
}

const ROUTE_MAX_METERS = 25000

const CANONICAL_PLACE_OVERRIDES: CanonicalPlaceOverride[] = [
  ...REGIONAL_PLACE_OVERRIDES,
  { pattern: /dear breakfast/i, name: 'Dear Breakfast Chiado', country: 'Portugal', country_code: 'PT', latitude: 38.71082, longitude: -9.14363, manualId: 'manual:lisbon:dear-breakfast-chiado' },
  { pattern: /praça do comércio|praca do comercio|commerce square/i, name: 'Praça do Comércio', country: 'Portugal', country_code: 'PT', latitude: 38.70775, longitude: -9.13659, manualId: 'manual:lisbon:praca-do-comercio' },
  { pattern: /lisbon cathedral|sé de lisboa|se de lisboa/i, name: 'Lisbon Cathedral', country: 'Portugal', country_code: 'PT', latitude: 38.70975, longitude: -9.13349, manualId: 'manual:lisbon:cathedral' },
  { pattern: /castelo de são jorge|castelo de sao jorge|castle of são jorge|castle of sao jorge/i, name: 'Castelo de São Jorge', country: 'Portugal', country_code: 'PT', latitude: 38.71391, longitude: -9.13348, manualId: 'manual:lisbon:castelo-sao-jorge' },
  { pattern: /taberna sal grosso/i, name: 'Taberna Sal Grosso', country: 'Portugal', country_code: 'PT', latitude: 38.71468, longitude: -9.1245, manualId: 'manual:lisbon:taberna-sal-grosso' },
  { pattern: /miradouro de santa luzia|sunset viewpoint/i, name: 'Miradouro de Santa Luzia', country: 'Portugal', country_code: 'PT', latitude: 38.71237, longitude: -9.13086, manualId: 'manual:lisbon:miradouro-santa-luzia' },
  { pattern: /tram 28e|tram 28/i, name: 'Praça Martim Moniz', country: 'Portugal', country_code: 'PT', latitude: 38.71691, longitude: -9.13664, manualId: 'manual:lisbon:tram-28-martim-moniz' },
  { pattern: /miradouro da senhora do monte|final scenic stop/i, name: 'Miradouro da Senhora do Monte', country: 'Portugal', country_code: 'PT', latitude: 38.71912, longitude: -9.13274, manualId: 'manual:lisbon:miradouro-senhora-do-monte' },
  { pattern: /\bramiro\b|cervejaria ramiro/i, name: 'Cervejaria Ramiro', country: 'Portugal', country_code: 'PT', latitude: 38.72178, longitude: -9.13543, manualId: 'manual:lisbon:cervejaria-ramiro' },
  { pattern: /pensão amor|pensao amor/i, name: 'Pensão Amor', country: 'Portugal', country_code: 'PT', latitude: 38.70708, longitude: -9.14321, manualId: 'manual:lisbon:pensao-amor' },
  { pattern: /pastéis de belém|pasteis de belem/i, name: 'Pastéis de Belém', country: 'Portugal', country_code: 'PT', latitude: 38.69748, longitude: -9.20322, manualId: 'manual:lisbon:pasteis-de-belem' },
  { pattern: /jerónimos monastery|jeronimos monastery/i, name: 'Jerónimos Monastery', country: 'Portugal', country_code: 'PT', latitude: 38.6979, longitude: -9.20673, manualId: 'manual:lisbon:jeronimos-monastery' },
  { pattern: /belém tower|belem tower/i, name: 'Belém Tower', country: 'Portugal', country_code: 'PT', latitude: 38.69158, longitude: -9.21604, manualId: 'manual:lisbon:belem-tower' },
  { pattern: /\bmaat\b/i, name: 'MAAT', country: 'Portugal', country_code: 'PT', latitude: 38.69578, longitude: -9.19468, manualId: 'manual:lisbon:maat' },
  { pattern: /ponto final/i, name: 'Ponto Final', country: 'Portugal', country_code: 'PT', latitude: 38.68495, longitude: -9.14718, manualId: 'manual:almada:ponto-final' },
  { pattern: /time out market lisboa|time out market lisbon|mercado da ribeira/i, name: 'Time Out Market Lisboa', country: 'Portugal', country_code: 'PT', latitude: 38.70697, longitude: -9.14562, manualId: 'manual:lisbon:time-out-market' },
  { pattern: /by the wine/i, name: 'By The Wine', country: 'Portugal', country_code: 'PT', latitude: 38.71047, longitude: -9.14355, manualId: 'manual:lisbon:by-the-wine' },
  { pattern: /pink street|rua nova do carvalho/i, name: 'Pink Street', country: 'Portugal', country_code: 'PT', latitude: 38.70728, longitude: -9.14323, manualId: 'manual:lisbon:pink-street' },
  { pattern: /hello,?\s*kristof/i, name: 'Hello, Kristof', country: 'Portugal', country_code: 'PT', latitude: 38.71007, longitude: -9.15159, manualId: 'manual:lisbon:hello-kristof' },
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
  { pattern: /cascais historic center|cascais historic centre/i, name: 'Cascais Historic Center', country: 'Portugal', country_code: 'PT', latitude: 38.69792, longitude: -9.42149, manualId: 'manual:cascais:historic-center' },
  { pattern: /mar do inferno/i, name: 'Mar do Inferno', country: 'Portugal', country_code: 'PT', latitude: 38.69322, longitude: -9.42918, manualId: 'manual:cascais:mar-do-inferno' },
  { pattern: /praia da rainha/i, name: 'Praia da Rainha', country: 'Portugal', country_code: 'PT', latitude: 38.69986, longitude: -9.41819, manualId: 'manual:cascais:praia-da-rainha' },
  { pattern: /boca do inferno/i, name: 'Boca do Inferno', country: 'Portugal', country_code: 'PT', latitude: 38.69161, longitude: -9.43134, manualId: 'manual:cascais:boca-do-inferno' },
  { pattern: /taberna da rua das flores|farewell dinner/i, name: 'Taberna da Rua das Flores', country: 'Portugal', country_code: 'PT', latitude: 38.70947, longitude: -9.1441, manualId: 'manual:lisbon:taberna-rua-das-flores' },
  { pattern: /piraeus ferry|piraeus port|port of piraeus|ferry from piraeus to aegina|return ferry to piraeus/i, name: 'Port of Piraeus', country: 'Greece', country_code: 'GR', latitude: 37.94486, longitude: 23.64082, manualId: 'manual:athens:piraeus-port' },
  { pattern: /aegina harbor|aegina port|aegina town|pistachio market/i, name: 'Aegina Town', country: 'Greece', country_code: 'GR', latitude: 37.74679, longitude: 23.42775, manualId: 'manual:aegina:town' },
  { pattern: /temple of aphaia/i, name: 'Temple of Aphaia', country: 'Greece', country_code: 'GR', latitude: 37.75448, longitude: 23.53313, manualId: 'manual:aegina:temple-of-aphaia' },
  { pattern: /agia marina|afternoon swim and beach time/i, name: 'Agia Marina, Aegina', country: 'Greece', country_code: 'GR', latitude: 37.74417, longitude: 23.53374, manualId: 'manual:aegina:agia-marina' },
  { pattern: /island breakfast by aegina/i, name: 'Aegina Harbor', country: 'Greece', country_code: 'GR', latitude: 37.74679, longitude: 23.42775, manualId: 'manual:aegina:harbor' },
  { pattern: /mikrolimano/i, name: 'Mikrolimano', country: 'Greece', country_code: 'GR', latitude: 37.94073, longitude: 23.66403, manualId: 'manual:athens:mikrolimano' },
  { pattern: /stavros niarchos/i, name: 'Stavros Niarchos Foundation Cultural Center', country: 'Greece', country_code: 'GR', latitude: 37.93952, longitude: 23.69165, manualId: 'manual:athens:stavros-niarchos' },
  { pattern: /flisvos marina/i, name: 'Flisvos Marina', country: 'Greece', country_code: 'GR', latitude: 37.93183, longitude: 23.68647, manualId: 'manual:athens:flisvos-marina' },
  { pattern: /acropolis archaeological site|acropolis.*parthenon|parthenon.*acropolis/i, name: 'Acropolis of Athens', country: 'Greece', country_code: 'GR', latitude: 37.97153, longitude: 23.72575, manualId: 'manual:athens:acropolis' },
  { pattern: /^acropolis of athens$/i, name: 'Acropolis of Athens', country: 'Greece', country_code: 'GR', latitude: 37.97153, longitude: 23.72575, manualId: 'manual:athens:acropolis' },
  { pattern: /acropolis museum/i, name: 'Acropolis Museum', country: 'Greece', country_code: 'GR', latitude: 37.96845, longitude: 23.72853, manualId: 'manual:athens:acropolis-museum' },
  { pattern: /long lunch in plaka|lunch.*plaka/i, name: 'Plaka', country: 'Greece', country_code: 'GR', latitude: 37.97308, longitude: 23.73051, manualId: 'manual:athens:plaka' },
  { pattern: /plaka.*anafiotika|anafiotika.*plaka/i, name: 'Anafiotika', country: 'Greece', country_code: 'GR', latitude: 37.97233, longitude: 23.72786, manualId: 'manual:athens:anafiotika' },
  { pattern: /^anafiotika$/i, name: 'Anafiotika', country: 'Greece', country_code: 'GR', latitude: 37.97233, longitude: 23.72786, manualId: 'manual:athens:anafiotika' },
  { pattern: /rooftop dinner.*acropolis|acropolis views/i, name: 'A for Athens Rooftop', country: 'Greece', country_code: 'GR', latitude: 37.97615, longitude: 23.72566, manualId: 'manual:athens:a-for-athens-rooftop' },
  { pattern: /a for athens rooftop/i, name: 'A for Athens Rooftop', country: 'Greece', country_code: 'GR', latitude: 37.97615, longitude: 23.72566, manualId: 'manual:athens:a-for-athens-rooftop' },
  { pattern: /\bstrofi\b/i, name: 'Strofi', country: 'Greece', country_code: 'GR', latitude: 37.96801, longitude: 23.72453, manualId: 'manual:athens:strofi' },
  { pattern: /\blotte\b/i, name: 'Lotte Cafe-Bistrot', country: 'Greece', country_code: 'GR', latitude: 37.97075, longitude: 23.72794, manualId: 'manual:athens:lotte-cafe-bistrot' },
  { pattern: /\bman[iy] mani\b/i, name: 'Mani Mani', country: 'Greece', country_code: 'GR', latitude: 37.96758, longitude: 23.72739, manualId: 'manual:athens:mani-mani' },
  { pattern: /\bbrettos\b/i, name: 'Brettos', country: 'Greece', country_code: 'GR', latitude: 37.97347, longitude: 23.73064, manualId: 'manual:athens:brettos' },
  { pattern: /akrogialia/i, name: 'Akrogialia', country: 'Greece', country_code: 'GR', latitude: 37.74293, longitude: 23.53753, manualId: 'manual:aegina:akrogialia' },
  { pattern: /skotadis/i, name: 'Skotadis', country: 'Greece', country_code: 'GR', latitude: 37.74668, longitude: 23.42758, manualId: 'manual:aegina:skotadis' },
  { pattern: /inn on the beach/i, name: 'Inn on the Beach', country: 'Greece', country_code: 'GR', latitude: 37.74512, longitude: 23.53383, manualId: 'manual:aegina:inn-on-the-beach' },
  { pattern: /varoulko seaside/i, name: 'Varoulko Seaside', country: 'Greece', country_code: 'GR', latitude: 37.93988, longitude: 23.66447, manualId: 'manual:athens:varoulko-seaside' },
  { pattern: /kalamaki bar/i, name: 'Kalamaki Bar', country: 'Greece', country_code: 'GR', latitude: 37.96411, longitude: 23.72164, manualId: 'manual:athens:kalamaki-bar' },
  { pattern: /queen bee/i, name: 'Queen Bee', country: 'Greece', country_code: 'GR', latitude: 37.97842, longitude: 23.74174, manualId: 'manual:athens:queen-bee' },
  { pattern: /\bdiporto\b/i, name: 'Diporto', country: 'Greece', country_code: 'GR', latitude: 37.97993, longitude: 23.72628, manualId: 'manual:athens:diporto' },
  { pattern: /\batlantikos\b/i, name: 'Atlantikos', country: 'Greece', country_code: 'GR', latitude: 37.97873, longitude: 23.72301, manualId: 'manual:athens:atlantikos' },
  { pattern: /coffee.*monastiraki|walk through monastiraki|monastiraki square|flea market.*monastiraki|monastiraki.*flea market/i, name: 'Monastiraki Square', country: 'Greece', country_code: 'GR', latitude: 37.97608, longitude: 23.72557, manualId: 'manual:athens:monastiraki-square' },
  { pattern: /ancient agora/i, name: 'Ancient Agora of Athens', country: 'Greece', country_code: 'GR', latitude: 37.97569, longitude: 23.72247, manualId: 'manual:athens:ancient-agora' },
  { pattern: /central market|food stroll/i, name: 'Athens Central Market', country: 'Greece', country_code: 'GR', latitude: 37.98005, longitude: 23.72672, manualId: 'manual:athens:central-market' },
  { pattern: /lunch in psiri|\bpsiri\b|\bpsyri\b/i, name: 'Psiri', country: 'Greece', country_code: 'GR', latitude: 37.97855, longitude: 23.72328, manualId: 'manual:athens:psiri' },
  { pattern: /ermou street/i, name: 'Ermou Street', country: 'Greece', country_code: 'GR', latitude: 37.97682, longitude: 23.7247, manualId: 'manual:athens:ermou-street' },
  { pattern: /national garden.*syntagma|syntagma.*national garden/i, name: 'National Garden', country: 'Greece', country_code: 'GR', latitude: 37.97393, longitude: 23.73624, manualId: 'manual:athens:national-garden' },
  { pattern: /koukaki/i, name: 'Koukaki', country: 'Greece', country_code: 'GR', latitude: 37.96393, longitude: 23.72141, manualId: 'manual:athens:koukaki' },
  { pattern: /brunch in kolonaki|\bkolonaki\b/i, name: 'Kolonaki', country: 'Greece', country_code: 'GR', latitude: 37.97798, longitude: 23.74132, manualId: 'manual:athens:kolonaki' },
  { pattern: /museum stop|boutique browsing/i, name: 'Benaki Museum', country: 'Greece', country_code: 'GR', latitude: 37.97595, longitude: 23.74029, manualId: 'manual:athens:benaki-museum' },
  { pattern: /pangrati/i, name: 'Pangrati', country: 'Greece', country_code: 'GR', latitude: 37.96991, longitude: 23.74531, manualId: 'manual:athens:pangrati' },
  { pattern: /lycabettus/i, name: 'Lycabettus Hill', country: 'Greece', country_code: 'GR', latitude: 37.98178, longitude: 23.74306, manualId: 'manual:athens:lycabettus-hill' },
  { pattern: /\bmile end\b/i, name: 'Mile End', country: 'Canada', country_code: 'CA', latitude: 45.52358, longitude: -73.60078, manualId: 'manual:montreal:mile-end' },
  { pattern: /\bplateau\b|\bplateau mont-royal\b/i, name: 'Plateau Mont-Royal', country: 'Canada', country_code: 'CA', latitude: 45.52654, longitude: -73.58195, manualId: 'manual:montreal:plateau' },
  { pattern: /jean-talon market/i, name: 'Jean-Talon Market', country: 'Canada', country_code: 'CA', latitude: 45.53617, longitude: -73.61434, manualId: 'manual:montreal:jean-talon-market' },
  { pattern: /old montreal|vieux-montreal|vieux-montr[eé]al/i, name: 'Vieux-Montréal', country: 'Canada', country_code: 'CA', latitude: 45.50233, longitude: -73.55859, manualId: 'manual:montreal:old-montreal' },
  { pattern: /chinatown/i, name: 'Montreal Chinatown', country: 'Canada', country_code: 'CA', latitude: 45.50735, longitude: -73.56027, manualId: 'manual:montreal:chinatown' },
  { pattern: /little italy/i, name: 'Little Italy', country: 'Canada', country_code: 'CA', latitude: 45.53543, longitude: -73.61457, manualId: 'manual:montreal:little-italy' },
  { pattern: /parc la fontaine|park la fontaine/i, name: 'Parc La Fontaine', country: 'Canada', country_code: 'CA', latitude: 45.52664, longitude: -73.56994, manualId: 'manual:montreal:parc-la-fontaine' },
  { pattern: /boulevard saint-laurent|boulevard st-laurent|saint-laurent/i, name: 'Boulevard Saint-Laurent', country: 'Canada', country_code: 'CA', latitude: 45.51776, longitude: -73.57787, manualId: 'manual:montreal:saint-laurent' },
  { pattern: /nonna betta/i, name: 'Nonna Betta', country: 'Italy', country_code: 'IT', latitude: 41.89244, longitude: 12.47562, manualId: 'manual:rome:nonna-betta' },
  { pattern: /da enzo al 29/i, name: 'Da Enzo al 29', country: 'Italy', country_code: 'IT', latitude: 41.88798, longitude: 12.46947, manualId: 'manual:rome:da-enzo-al-29' },
  { pattern: /armando al pantheon/i, name: 'Armando al Pantheon', country: 'Italy', country_code: 'IT', latitude: 41.89861, longitude: 12.47679, manualId: 'manual:rome:armando-al-pantheon' },
  { pattern: /bonci pizzarium|pizzarium/i, name: 'Pizzarium Bonci', country: 'Italy', country_code: 'IT', latitude: 41.90708, longitude: 12.44645, manualId: 'manual:rome:pizzarium-bonci' },
  { pattern: /roscioli salumeria|roscioli/i, name: 'Roscioli Salumeria con Cucina', country: 'Italy', country_code: 'IT', latitude: 41.89553, longitude: 12.47225, manualId: 'manual:rome:roscioli' },
  { pattern: /casina valadier/i, name: 'Casina Valadier', country: 'Italy', country_code: 'IT', latitude: 41.91398, longitude: 12.48617, manualId: 'manual:rome:casina-valadier' },
  { pattern: /casa manco/i, name: 'Casa Manco Testaccio', country: 'Italy', country_code: 'IT', latitude: 41.87441, longitude: 12.47587, manualId: 'manual:rome:casa-manco' },
  { pattern: /taverna dei fori imperiali/i, name: 'Taverna dei Fori Imperiali', country: 'Italy', country_code: 'IT', latitude: 41.89303, longitude: 12.48923, manualId: 'manual:rome:taverna-fori-imperiali' },
  { pattern: /\btaverna romana\b/i, name: 'Taverna Romana', country: 'Italy', country_code: 'IT', latitude: 41.8944, longitude: 12.4894, manualId: 'manual:rome:taverna-romana' },
  { pattern: /sant'eustachio il caff[eé]|sant'eustachio/i, name: "Sant'Eustachio il Caffè", country: 'Italy', country_code: 'IT', latitude: 41.8987, longitude: 12.4727, manualId: 'manual:rome:sant-eustachio' },
  { pattern: /\balla rampa\b/i, name: 'Alla Rampa', country: 'Italy', country_code: 'IT', latitude: 41.9059, longitude: 12.4832, manualId: 'manual:rome:alla-rampa' },
  { pattern: /\bpierluigi\b/i, name: 'Pierluigi', country: 'Italy', country_code: 'IT', latitude: 41.8961, longitude: 12.4699, manualId: 'manual:rome:pierluigi' },
  { pattern: /\bil sorpasso\b/i, name: 'Il Sorpasso', country: 'Italy', country_code: 'IT', latitude: 41.9053, longitude: 12.4641, manualId: 'manual:rome:il-sorpasso' },
  { pattern: /panino divino/i, name: 'Panino Divino', country: 'Italy', country_code: 'IT', latitude: 41.90623, longitude: 12.45742, manualId: 'manual:rome:panino-divino' },
  { pattern: /piatto romano/i, name: 'Piatto Romano', country: 'Italy', country_code: 'IT', latitude: 41.87779, longitude: 12.47872, manualId: 'manual:rome:piatto-romano' },
  { pattern: /jewish ghetto/i, name: 'Jewish Ghetto', country: 'Italy', country_code: 'IT', latitude: 41.8924, longitude: 12.4751, manualId: 'manual:rome:jewish-ghetto' },
  { pattern: /trastevere/i, name: 'Trastevere', country: 'Italy', country_code: 'IT', latitude: 41.88802, longitude: 12.46984, manualId: 'manual:rome:trastevere' },
  { pattern: /colosseum|roman forum/i, name: 'Colosseum', country: 'Italy', country_code: 'IT', latitude: 41.89021, longitude: 12.49223, manualId: 'manual:rome:colosseum' },
  { pattern: /palatine hill/i, name: 'Palatine Hill', country: 'Italy', country_code: 'IT', latitude: 41.88933, longitude: 12.48899, manualId: 'manual:rome:palatine-hill' },
  { pattern: /vatican museums|sistine chapel/i, name: 'Vatican Museums', country: 'Vatican City', country_code: 'VA', latitude: 41.90649, longitude: 12.45362, manualId: 'manual:vatican:museums' },
  { pattern: /st\.?\s*peter'?s (basilica|square)|piazza san pietro|\bvatican\b/i, name: "St. Peter's Square", country: 'Italy', country_code: 'IT', latitude: 41.90217, longitude: 12.45394, manualId: 'manual:rome:st-peters-square' },
  { pattern: /villa borghese/i, name: 'Villa Borghese Gardens', country: 'Italy', country_code: 'IT', latitude: 41.9142, longitude: 12.49232, manualId: 'manual:rome:villa-borghese' },
  { pattern: /galleria borghese/i, name: 'Galleria Borghese', country: 'Italy', country_code: 'IT', latitude: 41.91421, longitude: 12.49217, manualId: 'manual:rome:galleria-borghese' },
  { pattern: /via del corso/i, name: 'Via del Corso', country: 'Italy', country_code: 'IT', latitude: 41.90263, longitude: 12.47918, manualId: 'manual:rome:via-del-corso' },
  { pattern: /piazza navona/i, name: 'Piazza Navona', country: 'Italy', country_code: 'IT', latitude: 41.89893, longitude: 12.47307, manualId: 'manual:rome:piazza-navona' },
  { pattern: /pantheon/i, name: 'Pantheon', country: 'Italy', country_code: 'IT', latitude: 41.89861, longitude: 12.47687, manualId: 'manual:rome:pantheon' },
  { pattern: /trevi fountain/i, name: 'Trevi Fountain', country: 'Italy', country_code: 'IT', latitude: 41.90093, longitude: 12.48331, manualId: 'manual:rome:trevi-fountain' },
  { pattern: /spanish steps/i, name: 'Spanish Steps', country: 'Italy', country_code: 'IT', latitude: 41.90599, longitude: 12.48278, manualId: 'manual:rome:spanish-steps' },
  { pattern: /campo de['']? fiori/i, name: "Campo de' Fiori", country: 'Italy', country_code: 'IT', latitude: 41.89574, longitude: 12.4722, manualId: 'manual:rome:campo-de-fiori' },
  { pattern: /testaccio/i, name: 'Testaccio', country: 'Italy', country_code: 'IT', latitude: 41.87416, longitude: 12.47543, manualId: 'manual:rome:testaccio' },
  // Additional Rome landmarks frequently misgeocoded
  { pattern: /castel sant'?angelo|castle sant'?angelo/i, name: "Castel Sant'Angelo", country: 'Italy', country_code: 'IT', latitude: 41.90317, longitude: 12.46631, manualId: 'manual:rome:castel-santangelo' },
  { pattern: /capitoline hill|campidoglio/i, name: 'Capitoline Hill', country: 'Italy', country_code: 'IT', latitude: 41.89330, longitude: 12.48275, manualId: 'manual:rome:capitoline-hill' },
  { pattern: /vittoriano|altare della patria|piazza venezia/i, name: 'Vittoriano', country: 'Italy', country_code: 'IT', latitude: 41.89492, longitude: 12.48278, manualId: 'manual:rome:vittoriano' },
  { pattern: /piazza del popolo/i, name: 'Piazza del Popolo', country: 'Italy', country_code: 'IT', latitude: 41.91102, longitude: 12.47625, manualId: 'manual:rome:piazza-del-popolo' },
  { pattern: /piazza di spagna/i, name: 'Piazza di Spagna', country: 'Italy', country_code: 'IT', latitude: 41.90599, longitude: 12.48278, manualId: 'manual:rome:piazza-di-spagna' },
  { pattern: /passeggiata del gianicolo|gianicolo/i, name: 'Passeggiata del Gianicolo', country: 'Italy', country_code: 'IT', latitude: 41.89137, longitude: 12.46143, manualId: 'manual:rome:gianicolo' },
  { pattern: /tonnarello/i, name: 'Tonnarello', country: 'Italy', country_code: 'IT', latitude: 41.88934, longitude: 12.47103, manualId: 'manual:rome:tonnarello' },
  { pattern: /jerry thomas/i, name: 'Jerry Thomas Speakeasy', country: 'Italy', country_code: 'IT', latitude: 41.89543, longitude: 12.47445, manualId: 'manual:rome:jerry-thomas' },
  { pattern: /freni e frizioni/i, name: 'Freni e Frizioni', country: 'Italy', country_code: 'IT', latitude: 41.88908, longitude: 12.47014, manualId: 'manual:rome:freni-e-frizioni' },
  { pattern: /^the court$|the court.*rome/i, name: 'The Court', country: 'Italy', country_code: 'IT', latitude: 41.88966, longitude: 12.49339, manualId: 'manual:rome:the-court' },
  { pattern: /\bmonti\b/i, name: 'Monti', country: 'Italy', country_code: 'IT', latitude: 41.89472, longitude: 12.49556, manualId: 'manual:rome:monti' },
  { pattern: /\bprati\b/i, name: 'Prati', country: 'Italy', country_code: 'IT', latitude: 41.90580, longitude: 12.46073, manualId: 'manual:rome:prati' },
  { pattern: /\borganic market\b/i, name: 'Testaccio Market', country: 'Italy', country_code: 'IT', latitude: 41.87416, longitude: 12.47543, manualId: 'manual:rome:testaccio-market' },
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
  { pattern: /senso-ji|sensō-ji|sensoji/i, name: 'Senso-ji Temple', country: 'Japan', country_code: 'JP', latitude: 35.71476, longitude: 139.79666, manualId: 'manual:tokyo:senso-ji' },
  { pattern: /nakamise/i, name: 'Nakamise-dori', country: 'Japan', country_code: 'JP', latitude: 35.71184, longitude: 139.79642, manualId: 'manual:tokyo:nakamise-dori' },
  { pattern: /daikokuya tempura|daikokuya/i, name: 'Daikokuya Tempura', country: 'Japan', country_code: 'JP', latitude: 35.71195, longitude: 139.79469, manualId: 'manual:tokyo:daikokuya-tempura' },
  { pattern: /tokyo national museum/i, name: 'Tokyo National Museum', country: 'Japan', country_code: 'JP', latitude: 35.71884, longitude: 139.77652, manualId: 'manual:tokyo:national-museum' },
  { pattern: /izakaya toyo/i, name: 'Izakaya Toyo', country: 'Japan', country_code: 'JP', latitude: 35.67513, longitude: 139.77316, manualId: 'manual:tokyo:izakaya-toyo' },
  { pattern: /meiji jingu/i, name: 'Meiji Jingu', country: 'Japan', country_code: 'JP', latitude: 35.6764, longitude: 139.69933, manualId: 'manual:tokyo:meiji-jingu' },
  { pattern: /afuri harajuku/i, name: 'AFURI Harajuku', country: 'Japan', country_code: 'JP', latitude: 35.67091, longitude: 139.70375, manualId: 'manual:tokyo:afuri-harajuku' },
  { pattern: /shibuya sky/i, name: 'Shibuya Sky', country: 'Japan', country_code: 'JP', latitude: 35.65854, longitude: 139.70208, manualId: 'manual:tokyo:shibuya-sky' },
  { pattern: /teamlab/i, name: 'teamLab Planets TOKYO', country: 'Japan', country_code: 'JP', latitude: 35.64915, longitude: 139.78975, manualId: 'manual:tokyo:teamlab-planets' },
  { pattern: /uobei/i, name: 'Uobei Shibuya Dogenzaka', country: 'Japan', country_code: 'JP', latitude: 35.66064, longitude: 139.69775, manualId: 'manual:tokyo:uobei-shibuya' },
  { pattern: /tsukiji/i, name: 'Tsukiji Outer Market', country: 'Japan', country_code: 'JP', latitude: 35.66549, longitude: 139.77074, manualId: 'manual:tokyo:tsukiji-outer-market' },
  { pattern: /sushi daiwa|daiwa sushi/i, name: 'Daiwa Sushi', country: 'Japan', country_code: 'JP', latitude: 35.64344, longitude: 139.7821, manualId: 'manual:tokyo:daiwa-sushi' },
  { pattern: /hachiko memorial statue|hachik[oō]/i, name: 'Hachiko Memorial Statue', country: 'Japan', country_code: 'JP', latitude: 35.65906, longitude: 139.70062, manualId: 'manual:tokyo:hachiko-statue' },
  { pattern: /kyubey ginza|ginza kyubey/i, name: 'Kyubey Ginza Main Shop', country: 'Japan', country_code: 'JP', latitude: 35.66962, longitude: 139.76365, manualId: 'manual:tokyo:kyubey-ginza' },
  { pattern: /caf[eé] de l'?ambre|cafe de lambre/i, name: "Cafe de L'Ambre", country: 'Japan', country_code: 'JP', latitude: 35.67082, longitude: 139.76554, manualId: 'manual:tokyo:cafe-de-lambre' },
  { pattern: /tsukiji itadori/i, name: 'Tsukiji Itadori Bekkan', country: 'Japan', country_code: 'JP', latitude: 35.66534, longitude: 139.77008, manualId: 'manual:tokyo:tsukiji-itadori-bekkan' },
  { pattern: /mikasa kaikan.*la viola|la viola/i, name: 'Mikasa Kaikan Honten Italian Bar LA VIOLA', country: 'Japan', country_code: 'JP', latitude: 35.67153, longitude: 139.76452, manualId: 'manual:tokyo:mikasa-kaikan-la-viola' },
  { pattern: /\bsmt tokyo\b/i, name: 'Omotesando Hills', country: 'Japan', country_code: 'JP', latitude: 35.6673, longitude: 139.7086, manualId: 'manual:tokyo:smt-omotesando-fallback' },
  { pattern: /nezu museum/i, name: 'Nezu Museum', country: 'Japan', country_code: 'JP', latitude: 35.66229, longitude: 139.71693, manualId: 'manual:tokyo:nezu-museum' },
  { pattern: /omotesando/i, name: 'Omotesando', country: 'Japan', country_code: 'JP', latitude: 35.66525, longitude: 139.71232, manualId: 'manual:tokyo:omotesando' },
  { pattern: /maisen aoyama/i, name: 'Maisen Aoyama', country: 'Japan', country_code: 'JP', latitude: 35.66863, longitude: 139.71172, manualId: 'manual:tokyo:maisen-aoyama' },
  { pattern: /ginza/i, name: 'Ginza', country: 'Japan', country_code: 'JP', latitude: 35.67175, longitude: 139.76502, manualId: 'manual:tokyo:ginza' },
  { pattern: /imperial palace/i, name: 'Imperial Palace East Gardens', country: 'Japan', country_code: 'JP', latitude: 35.68518, longitude: 139.75445, manualId: 'manual:tokyo:imperial-palace-east-gardens' },
  { pattern: /ramen street/i, name: 'Tokyo Ramen Street', country: 'Japan', country_code: 'JP', latitude: 35.68159, longitude: 139.7673, manualId: 'manual:tokyo:ramen-street' },
  { pattern: /golden gai/i, name: 'Shinjuku Golden Gai', country: 'Japan', country_code: 'JP', latitude: 35.69412, longitude: 139.70464, manualId: 'manual:tokyo:golden-gai' },
  { pattern: /easy evening stroll/i, name: 'Sumida Park', country: 'Japan', country_code: 'JP', latitude: 35.71013, longitude: 139.80336, manualId: 'manual:tokyo:sumida-park' },
  { pattern: /^day$/i, name: 'Shinjuku Golden Gai', country: 'Japan', country_code: 'JP', latitude: 35.69412, longitude: 139.70464, manualId: 'manual:tokyo:generic-evening' },
  { pattern: /kamiya bar/i, name: 'Kamiya Bar', country: 'Japan', country_code: 'JP', latitude: 35.71161, longitude: 139.79591, manualId: 'manual:tokyo:kamiya-bar' },
  { pattern: /ise sueyoshi.*ueno|ueno hirokoji/i, name: 'Ise Sueyoshi Ueno Hirokoji', country: 'Japan', country_code: 'JP', latitude: 35.70795, longitude: 139.77274, manualId: 'manual:tokyo:ise-sueyoshi-ueno' },
  { pattern: /izuei honten|izuei|inshotei|innsyoutei|innsyotei/i, name: 'Izuei Honten', country: 'Japan', country_code: 'JP', latitude: 35.70795, longitude: 139.77272, manualId: 'manual:tokyo:izuei-honten' },
  { pattern: /happo-?en garden|happo-?en/i, name: 'Happo-en Garden', country: 'Japan', country_code: 'JP', latitude: 35.63776, longitude: 139.72834, manualId: 'manual:tokyo:happo-en-garden' },
  { pattern: /sushi\s*zanmai|sushizanmai/i, name: 'Tsukiji Sushizanmai Honten', country: 'Japan', country_code: 'JP', latitude: 35.6657, longitude: 139.7707, manualId: 'manual:tokyo:sushizanmai-honten' },
  { pattern: /tonkatsu aoki.*ginza|aoki ginza/i, name: 'Tonkatsu Aoki Ginza', country: 'Japan', country_code: 'JP', latitude: 35.67173, longitude: 139.76626, manualId: 'manual:tokyo:tonkatsu-aoki-ginza' },
  { pattern: /tostadas coyoac[aá]n/i, name: 'Tostadas Coyoacán', country: 'Mexico', country_code: 'MX', latitude: 19.34921, longitude: -99.16111, manualId: 'manual:mexico-city:tostadas-coyoacan' },
]

function extractTripContext(title: string | null | undefined) {
  return extractDestinationFromTitle(title)
}

function haversineKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(latitude2 - latitude1)
  const dLng = toRad(longitude2 - longitude1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latitude1)) * Math.cos(toRad(latitude2)) * Math.sin(dLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildQueries(itemTitle: string, dayTitle: string | null, destinationContext: string) {
  const normalized = itemTitle.replace(/\s+/g, ' ').trim()
  const stripped = normalized
    .replace(/^(Breakfast|Brunch|Lunch|Dinner)\s+at\s+/i, '')
    .replace(/^(Lunch|Dinner|Breakfast|Brunch)\s+near\s+/i, '')
    .replace(/^(Morning|Afternoon|Evening)\s+(at|in)\s+/i, '')
    .replace(/^(Explore|Visit|Tour|Walk through|Stroll through)\s+/i, '')
    .replace(/\s+(Tour|Visit|Experience)$/i, '')
    .trim()

  const dayContext = dayTitle?.trim() || ''
  const canonicalOverride = CANONICAL_PLACE_OVERRIDES.find((entry) => entry.pattern.test(normalized))?.query

  return Array.from(
    new Set(
      [
        canonicalOverride || '',
        normalized && destinationContext ? `${normalized}, ${destinationContext}` : normalized,
        stripped && destinationContext ? `${stripped}, ${destinationContext}` : stripped,
        stripped && dayContext && destinationContext ? `${stripped}, ${dayContext}, ${destinationContext}` : '',
        normalized.includes(destinationContext) ? normalized : '',
        stripped.includes(destinationContext) ? stripped : '',
      ].filter(Boolean)
    )
  )
}

async function upsertCanonicalPlace(supabase: any, override: CanonicalPlaceOverride) {
  if (
    !override.name ||
    !override.country ||
    !override.country_code ||
    typeof override.latitude !== 'number' ||
    typeof override.longitude !== 'number' ||
    !override.manualId
  ) {
    return null
  }

  const { data: place, error } = await supabase
    .from('places')
    .upsert(
      {
        name: override.name,
        country: override.country,
        country_code: override.country_code,
        latitude: override.latitude,
        longitude: override.longitude,
        mapbox_id: override.manualId,
      },
      { onConflict: 'mapbox_id' }
    )
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return place
}

async function computeAndStoreDayRoute(
  supabase: any,
  tripDayId: string,
  token: string,
  mode: 'walk' | 'drive' | 'transit' = 'walk'
) {
  const { data: items, error } = await supabase
    .from('trip_items')
    .select('place:places(latitude,longitude)')
    .eq('trip_day_id', tripDayId)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)

  const coords = (items || [])
    .map((item: any) => ({ latitude: item.place?.latitude, longitude: item.place?.longitude }))
    .filter((coord: any) => typeof coord.latitude === 'number' && typeof coord.longitude === 'number')

  if (coords.length < 2) {
    await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId).eq('mode', mode)
    return false
  }

  const mappedRoute = await directionsGeojson(coords, token, mode)
  const route =
    mappedRoute?.distance_m != null && mappedRoute.distance_m > 0 && mappedRoute.distance_m <= ROUTE_MAX_METERS
      ? mappedRoute
      : buildStraightLineRoute(coords)
  if (!route) {
    await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId).eq('mode', mode)
    return false
  }

  if (route.distance_m == null || route.distance_m <= 0 || route.distance_m > ROUTE_MAX_METERS) {
    await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId).eq('mode', mode)
    return false
  }

  const { error: routeErr } = await supabase
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

  if (routeErr) throw new Error(routeErr.message)
  return true
}

function buildStraightLineRoute(coords: Array<{ latitude: number; longitude: number }>) {
  if (coords.length < 2) return null

  let distance_m = 0
  for (let index = 1; index < coords.length; index++) {
    distance_m += haversineKm(
      coords[index - 1].latitude,
      coords[index - 1].longitude,
      coords[index].latitude,
      coords[index].longitude
    ) * 1000
  }

  const roundedDistance = Math.round(distance_m)
  if (roundedDistance <= 0 || roundedDistance > ROUTE_MAX_METERS) return null

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

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 })
  }

  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('id,title,user_id,constraints')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (tripErr) return NextResponse.json({ error: tripErr.message }, { status: 500 })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: tripDays, error: daysErr } = await supabase
    .from('trip_days')
    .select('id,day_index,title')
    .eq('trip_id', id)
    .order('day_index', { ascending: true })

  if (daysErr) return NextResponse.json({ error: daysErr.message }, { status: 500 })

  const destinationContext =
    (typeof trip.constraints?.destination_query === 'string' && trip.constraints.destination_query.trim()) ||
    extractTripContext(trip.title)
  const destinationPlace = destinationContext
    ? await geocodePlace(destinationContext, token)
    : null
  const geocodeOptions = {
    proximity: destinationPlace,
    countryCode: destinationPlace?.country_code,
  }

  let geocodedItems = 0
  let routeDays = 0

  for (const day of tripDays || []) {
    const { data: items, error: itemsErr } = await supabase
      .from('trip_items')
      .select('id,title,type,place_id,place:places(id,name,country,latitude,longitude)')
      .eq('trip_day_id', day.id)
      .order('order_index', { ascending: true })

    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

    for (const item of items || []) {
      if (!['activity', 'meal', 'lodging', 'transport', 'transit'].includes(item.type)) continue
      const canonicalOverride = CANONICAL_PLACE_OVERRIDES.find((entry) => entry.pattern.test(item.title))

      const currentPlace = Array.isArray(item.place) ? item.place[0] : item.place
      const currentDistanceKm =
        destinationPlace &&
        typeof currentPlace?.latitude === 'number' &&
        typeof currentPlace?.longitude === 'number'
          ? haversineKm(
              currentPlace.latitude,
              currentPlace.longitude,
              destinationPlace.latitude,
              destinationPlace.longitude
            )
          : null

      const shouldRepair =
        canonicalOverride != null ||
        !item.place_id ||
        (destinationPlace != null && currentDistanceKm != null && currentDistanceKm > 30)

      if (!shouldRepair) continue

      let resolvedPlace: any = null
      if (canonicalOverride?.manualId) {
        resolvedPlace = await upsertCanonicalPlace(supabase, canonicalOverride)
      }

      for (const query of buildQueries(item.title, day.title, destinationContext)) {
        if (resolvedPlace) break
        const result = await geocodePlace(query, token, { ...geocodeOptions, strictName: true })
        if (!result) continue

        if (
          destinationPlace &&
          haversineKm(result.latitude, result.longitude, destinationPlace.latitude, destinationPlace.longitude) > 30
        ) {
          continue
        }

        const { data: place, error: placeErr } = await supabase
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
          .select('id')
          .single()

        if (placeErr) {
          return NextResponse.json({ error: placeErr.message }, { status: 500 })
        }

        resolvedPlace = place
        break
      }

      if (!resolvedPlace?.id) {
        if (currentDistanceKm != null && currentDistanceKm > 30 && item.place_id) {
          const { error: clearErr } = await supabase
            .from('trip_items')
            .update({ place_id: null, updated_at: new Date().toISOString() })
            .eq('id', item.id)

          if (clearErr) return NextResponse.json({ error: clearErr.message }, { status: 500 })
        }
        continue
      }

      const { error: updateErr } = await supabase
        .from('trip_items')
        .update({ place_id: resolvedPlace.id, updated_at: new Date().toISOString() })
        .eq('id', item.id)

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
      geocodedItems += 1
    }

    const routeCreated = await computeAndStoreDayRoute(supabase, day.id, token, 'walk')
    if (routeCreated) routeDays += 1
  }

  return NextResponse.json({ ok: true, geocodedItems, routeDays })
}
