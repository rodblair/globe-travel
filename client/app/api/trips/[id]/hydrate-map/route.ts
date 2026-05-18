import { NextResponse } from 'next/server'
import { directionsGeojson, geocodePlace } from '@/app/api/trips/_mapbox'
import { requireUser } from '@/app/api/trips/_utils'
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

const WALK_ROUTE_MAX_METERS = 8500

const CANONICAL_PLACE_OVERRIDES: CanonicalPlaceOverride[] = [
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
  { pattern: /time out market/i, name: 'Time Out Market Lisboa', country: 'Portugal', country_code: 'PT', latitude: 38.70697, longitude: -9.14562, manualId: 'manual:lisbon:time-out-market' },
  { pattern: /by the wine/i, name: 'By The Wine', country: 'Portugal', country_code: 'PT', latitude: 38.71047, longitude: -9.14355, manualId: 'manual:lisbon:by-the-wine' },
  { pattern: /pink street|rua nova do carvalho/i, name: 'Pink Street', country: 'Portugal', country_code: 'PT', latitude: 38.70728, longitude: -9.14323, manualId: 'manual:lisbon:pink-street' },
  { pattern: /hello,?\s*kristof/i, name: 'Hello, Kristof', country: 'Portugal', country_code: 'PT', latitude: 38.71007, longitude: -9.15159, manualId: 'manual:lisbon:hello-kristof' },
  { pattern: /cascais historic center|cascais historic centre/i, name: 'Cascais Historic Center', country: 'Portugal', country_code: 'PT', latitude: 38.69792, longitude: -9.42149, manualId: 'manual:cascais:historic-center' },
  { pattern: /mar do inferno/i, name: 'Mar do Inferno', country: 'Portugal', country_code: 'PT', latitude: 38.69322, longitude: -9.42918, manualId: 'manual:cascais:mar-do-inferno' },
  { pattern: /praia da rainha/i, name: 'Praia da Rainha', country: 'Portugal', country_code: 'PT', latitude: 38.69986, longitude: -9.41819, manualId: 'manual:cascais:praia-da-rainha' },
  { pattern: /boca do inferno/i, name: 'Boca do Inferno', country: 'Portugal', country_code: 'PT', latitude: 38.69161, longitude: -9.43134, manualId: 'manual:cascais:boca-do-inferno' },
  { pattern: /taberna da rua das flores|farewell dinner/i, name: 'Taberna da Rua das Flores', country: 'Portugal', country_code: 'PT', latitude: 38.70947, longitude: -9.1441, manualId: 'manual:lisbon:taberna-rua-das-flores' },
  { pattern: /ferry from piraeus to aegina|return ferry to piraeus/i, name: 'Port of Piraeus', country: 'Greece', country_code: 'GR', latitude: 37.94486, longitude: 23.64082, manualId: 'manual:athens:piraeus-port' },
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
  { pattern: /la taverna dei fori imperiali/i, name: 'La Taverna dei Fori Imperiali', country: 'Italy', country_code: 'IT', latitude: 41.89303, longitude: 12.48923, manualId: 'manual:rome:taverna-fori-imperiali' },
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
  { pattern: /st\.?\s*peter'?s (basilica|square)|piazza san pietro|\bvatican\b/i, name: "St. Peter's Square", country: 'Vatican City', country_code: 'VA', latitude: 41.90217, longitude: 12.45394, manualId: 'manual:vatican:st-peters' },
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
  { pattern: /\bmonti\b/i, name: 'Monti', country: 'Italy', country_code: 'IT', latitude: 41.89472, longitude: 12.49556, manualId: 'manual:rome:monti' },
  { pattern: /\bprati\b/i, name: 'Prati', country: 'Italy', country_code: 'IT', latitude: 41.90580, longitude: 12.46073, manualId: 'manual:rome:prati' },
  { pattern: /\borganic market\b/i, name: 'Testaccio Market', country: 'Italy', country_code: 'IT', latitude: 41.87416, longitude: 12.47543, manualId: 'manual:rome:testaccio-market' },
  { pattern: /senso-ji|sensō-ji|sensoji/i, name: 'Senso-ji Temple', country: 'Japan', country_code: 'JP', latitude: 35.71476, longitude: 139.79666, manualId: 'manual:tokyo:senso-ji' },
  { pattern: /nakamise/i, name: 'Nakamise-dori', country: 'Japan', country_code: 'JP', latitude: 35.71184, longitude: 139.79642, manualId: 'manual:tokyo:nakamise-dori' },
  { pattern: /daikokuya/i, name: 'Daikokuya Tempura', country: 'Japan', country_code: 'JP', latitude: 35.71195, longitude: 139.79469, manualId: 'manual:tokyo:daikokuya-tempura' },
  { pattern: /tokyo national museum/i, name: 'Tokyo National Museum', country: 'Japan', country_code: 'JP', latitude: 35.71884, longitude: 139.77652, manualId: 'manual:tokyo:national-museum' },
  { pattern: /izakaya toyo/i, name: 'Izakaya Toyo', country: 'Japan', country_code: 'JP', latitude: 35.67513, longitude: 139.77316, manualId: 'manual:tokyo:izakaya-toyo' },
  { pattern: /meiji jingu/i, name: 'Meiji Jingu', country: 'Japan', country_code: 'JP', latitude: 35.6764, longitude: 139.69933, manualId: 'manual:tokyo:meiji-jingu' },
  { pattern: /afuri harajuku/i, name: 'AFURI Harajuku', country: 'Japan', country_code: 'JP', latitude: 35.67091, longitude: 139.70375, manualId: 'manual:tokyo:afuri-harajuku' },
  { pattern: /shibuya sky/i, name: 'Shibuya Sky', country: 'Japan', country_code: 'JP', latitude: 35.65854, longitude: 139.70208, manualId: 'manual:tokyo:shibuya-sky' },
  { pattern: /teamlab/i, name: 'teamLab Planets TOKYO', country: 'Japan', country_code: 'JP', latitude: 35.64915, longitude: 139.78975, manualId: 'manual:tokyo:teamlab-planets' },
  { pattern: /uobei/i, name: 'Uobei Shibuya Dogenzaka', country: 'Japan', country_code: 'JP', latitude: 35.66064, longitude: 139.69775, manualId: 'manual:tokyo:uobei-shibuya' },
  { pattern: /tsukiji/i, name: 'Tsukiji Outer Market', country: 'Japan', country_code: 'JP', latitude: 35.66549, longitude: 139.77074, manualId: 'manual:tokyo:tsukiji-outer-market' },
  { pattern: /sushi daiwa|daiwa sushi/i, name: 'Daiwa Sushi', country: 'Japan', country_code: 'JP', latitude: 35.64344, longitude: 139.7821, manualId: 'manual:tokyo:daiwa-sushi' },
  { pattern: /nezu museum/i, name: 'Nezu Museum', country: 'Japan', country_code: 'JP', latitude: 35.66229, longitude: 139.71693, manualId: 'manual:tokyo:nezu-museum' },
  { pattern: /omotesando/i, name: 'Omotesando', country: 'Japan', country_code: 'JP', latitude: 35.66525, longitude: 139.71232, manualId: 'manual:tokyo:omotesando' },
  { pattern: /maisen aoyama/i, name: 'Maisen Aoyama', country: 'Japan', country_code: 'JP', latitude: 35.66863, longitude: 139.71172, manualId: 'manual:tokyo:maisen-aoyama' },
  { pattern: /ginza/i, name: 'Ginza', country: 'Japan', country_code: 'JP', latitude: 35.67175, longitude: 139.76502, manualId: 'manual:tokyo:ginza' },
  { pattern: /imperial palace/i, name: 'Imperial Palace East Gardens', country: 'Japan', country_code: 'JP', latitude: 35.68518, longitude: 139.75445, manualId: 'manual:tokyo:imperial-palace-east-gardens' },
  { pattern: /ramen street/i, name: 'Tokyo Ramen Street', country: 'Japan', country_code: 'JP', latitude: 35.68159, longitude: 139.7673, manualId: 'manual:tokyo:ramen-street' },
  { pattern: /golden gai/i, name: 'Shinjuku Golden Gai', country: 'Japan', country_code: 'JP', latitude: 35.69412, longitude: 139.70464, manualId: 'manual:tokyo:golden-gai' },
  { pattern: /easy evening stroll/i, name: 'Sumida Park', country: 'Japan', country_code: 'JP', latitude: 35.71013, longitude: 139.80336, manualId: 'manual:tokyo:sumida-park' },
  { pattern: /^day$/i, name: 'Shinjuku Golden Gai', country: 'Japan', country_code: 'JP', latitude: 35.69412, longitude: 139.70464, manualId: 'manual:tokyo:generic-evening' },
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

  const route = await directionsGeojson(coords, token, mode)
  if (!route) {
    await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId).eq('mode', mode)
    return false
  }

  if (route.distance_m == null || route.distance_m <= 0 || route.distance_m > WALK_ROUTE_MAX_METERS) {
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
    const dayFallbackPlace =
      destinationContext && day.title
        ? await geocodePlace(`${day.title}, ${destinationContext}`, token, geocodeOptions)
        : null

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
        const result = await geocodePlace(query, token, geocodeOptions)
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

      if (!resolvedPlace && dayFallbackPlace) {
        const { data: place, error: placeErr } = await supabase
          .from('places')
          .upsert(
            {
              name: dayFallbackPlace.name,
              country: dayFallbackPlace.country,
              country_code: dayFallbackPlace.country_code || null,
              latitude: dayFallbackPlace.latitude,
              longitude: dayFallbackPlace.longitude,
              mapbox_id: dayFallbackPlace.mapbox_place_id,
            },
            { onConflict: 'mapbox_id' }
          )
          .select('id')
          .single()

        if (placeErr) return NextResponse.json({ error: placeErr.message }, { status: 500 })
        resolvedPlace = place
      }

      if (!resolvedPlace && destinationPlace) {
        const { data: place, error: placeErr } = await supabase
          .from('places')
          .upsert(
            {
              name: destinationPlace.name,
              country: destinationPlace.country,
              country_code: destinationPlace.country_code || null,
              latitude: destinationPlace.latitude,
              longitude: destinationPlace.longitude,
              mapbox_id: destinationPlace.mapbox_place_id,
            },
            { onConflict: 'mapbox_id' }
          )
          .select('id')
          .single()

        if (placeErr) return NextResponse.json({ error: placeErr.message }, { status: 500 })
        resolvedPlace = place
      }

      if (!resolvedPlace?.id) continue

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
