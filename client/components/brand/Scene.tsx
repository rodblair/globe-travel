import { cn } from '@/lib/utils'

export type SceneName = 'lisbon' | 'kyoto' | 'athens' | 'marrakech'

export const SCENE_NAMES: SceneName[] = ['lisbon', 'kyoto', 'athens', 'marrakech']

/** Pick a stable scene for any string (trip ids, titles). */
export function sceneForSeed(seed: string): SceneName {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return SCENE_NAMES[h % SCENE_NAMES.length]
}

/** Best-effort scene for a destination mentioned in a trip title. */
export function sceneForTitle(title: string, fallbackSeed = title): SceneName {
  const t = title.toLowerCase()
  if (/lisbon|porto|portugal|belem|sintra/.test(t)) return 'lisbon'
  if (/kyoto|tokyo|osaka|japan|nara/.test(t)) return 'kyoto'
  if (/athens|greece|hydra|santorini|crete|mykonos|island/.test(t)) return 'athens'
  if (/marrakech|morocco|fez|casablanca|sahara/.test(t)) return 'marrakech'
  return sceneForSeed(fallbackSeed)
}

const LABELS: Record<SceneName, string> = {
  lisbon: "Illustration of Lisbon at sunset with a yellow tram",
  kyoto: "Illustration of Kyoto at dusk with a red torii gate and layered mountains",
  athens: "Illustration of the Acropolis in Athens above a bright blue sea",
  marrakech: "Illustration of Marrakech with a minaret, domes and palm trees in warm sand light",
}

const SCENES: Record<SceneName, React.ReactNode> = {
  lisbon: (
    <>
<defs>
<linearGradient id="lisSky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stopColor="#5E3F78"></stop>
<stop offset="0.5" stopColor="#E4694F"></stop>
<stop offset="1" stopColor="#FFC58A"></stop>
</linearGradient>
</defs>
<rect width="400" height="280" fill="url(#lisSky)"></rect>
<circle cx="262" cy="150" r="70" fill="#FFE29A" opacity="0.22"></circle>
<circle cx="262" cy="150" r="44" fill="#FFE29A"></circle>
<rect x="0" y="176" width="400" height="34" fill="#E98B63" opacity="0.75"></rect>
<rect x="236" y="182" width="52" height="3" rx="1.5" fill="#FFE29A" opacity="0.9"></rect>
<rect x="244" y="190" width="36" height="3" rx="1.5" fill="#FFE29A" opacity="0.7"></rect>
<rect x="252" y="198" width="20" height="3" rx="1.5" fill="#FFE29A" opacity="0.5"></rect>
<rect x="320" y="118" width="30" height="72" fill="#7B3647"></rect>
<rect x="316" y="108" width="38" height="14" fill="#8F4056"></rect>
<rect x="316" y="100" width="7" height="9" fill="#8F4056"></rect>
<rect x="327" y="100" width="7" height="9" fill="#8F4056"></rect>
<rect x="338" y="100" width="7" height="9" fill="#8F4056"></rect>
<path d="M328 190 V150 a7 7 0 0 1 14 0 V190Z" fill="#3E1B2C"></path>
<path d="M0 205 L0 160 Q40 138 92 152 L132 142 L190 162 L236 182 L236 210 L0 210Z" fill="#C0513F"></path>
<rect x="18" y="164" width="16" height="22" fill="#F6C9A0"></rect>
<rect x="38" y="156" width="18" height="30" fill="#EFAE86"></rect>
<rect x="62" y="162" width="16" height="24" fill="#F9DDB8"></rect>
<rect x="84" y="154" width="18" height="32" fill="#F6C9A0"></rect>
<rect x="108" y="158" width="16" height="28" fill="#EFAE86"></rect>
<rect x="130" y="150" width="18" height="36" fill="#F9DDB8"></rect>
<rect x="154" y="160" width="16" height="26" fill="#F6C9A0"></rect>
<rect x="176" y="170" width="16" height="20" fill="#EFAE86"></rect>
<path d="M0 280 L0 222 Q70 198 150 220 T300 214 T400 204 L400 280Z" fill="#7A2F3F"></path>
<path d="M0 280 L0 246 Q90 232 180 246 T400 240 L400 280Z" fill="#5A2231"></path>
<rect x="0" y="262" width="400" height="3" fill="#A8566A"></rect>
<g>
<rect x="52" y="226" width="86" height="32" rx="8" fill="#F5B83D"></rect>
<rect x="52" y="248" width="86" height="6" fill="#E09A1E"></rect>
<rect x="60" y="232" width="14" height="14" rx="2" fill="#FFF1D0"></rect>
<rect x="78" y="232" width="14" height="14" rx="2" fill="#FFF1D0"></rect>
<rect x="96" y="232" width="14" height="14" rx="2" fill="#FFF1D0"></rect>
<rect x="114" y="232" width="16" height="14" rx="2" fill="#FFF1D0"></rect>
<circle cx="72" cy="260" r="5" fill="#2A1620"></circle>
<circle cx="118" cy="260" r="5" fill="#2A1620"></circle>
<path d="M95 226 L105 206 H132" stroke="#2A1620" strokeWidth="2" fill="none"></path>
</g>
    </>
  ),
  kyoto: (
    <>
<defs>
<linearGradient id="kySky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stopColor="#24244E"></stop>
<stop offset="0.5" stopColor="#9A5A86"></stop>
<stop offset="1" stopColor="#FFC09F"></stop>
</linearGradient>
</defs>
<rect width="400" height="280" fill="url(#kySky)"></rect>
<circle cx="110" cy="92" r="58" fill="#FFF1D6" opacity="0.2"></circle>
<circle cx="110" cy="92" r="38" fill="#FFF1D6"></circle>
<circle cx="40" cy="40" r="1.6" fill="#FFF1D6"></circle>
<circle cx="190" cy="30" r="1.4" fill="#FFF1D6"></circle>
<circle cx="260" cy="58" r="1.8" fill="#FFF1D6"></circle>
<circle cx="340" cy="34" r="1.4" fill="#FFF1D6"></circle>
<path d="M0 190 L70 130 L120 168 L190 106 L260 170 L330 120 L400 178 L400 280 L0 280Z" fill="#6A4580"></path>
<rect x="0" y="176" width="400" height="14" fill="#FFD9C0" opacity="0.28"></rect>
<path d="M0 214 L60 166 L130 206 L210 148 L290 210 L360 164 L400 196 L400 280 L0 280Z" fill="#43305F"></path>
<rect x="0" y="206" width="400" height="12" fill="#FFD9C0" opacity="0.2"></rect>
<path d="M0 250 Q80 220 170 244 T320 238 T400 232 L400 280 L0 280Z" fill="#241C42"></path>
<path d="M30 252 L44 214 L58 252Z" fill="#17122F"></path>
<path d="M44 252 L60 200 L76 252Z" fill="#17122F"></path>
<g>
<rect x="252" y="170" width="11" height="90" fill="#E5482A"></rect>
<rect x="318" y="170" width="11" height="90" fill="#E5482A"></rect>
<path d="M238 160 Q290 176 344 160 L340 176 Q290 190 242 176Z" fill="#E5482A"></path>
<rect x="250" y="186" width="80" height="8" fill="#E5482A"></rect>
<rect x="248" y="248" width="19" height="12" fill="#17122F"></rect>
<rect x="314" y="248" width="19" height="12" fill="#17122F"></rect>
</g>
<path d="M0 280 L0 262 Q100 252 200 266 T400 258 L400 280Z" fill="#120E26"></path>
    </>
  ),
  athens: (
    <>
<defs>
<linearGradient id="athSky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stopColor="#7FCDE6"></stop>
<stop offset="0.75" stopColor="#FFEFD0"></stop>
<stop offset="1" stopColor="#FFE3B8"></stop>
</linearGradient>
</defs>
<rect width="400" height="280" fill="url(#athSky)"></rect>
<circle cx="326" cy="62" r="26" fill="#F5B83D"></circle>
<circle cx="326" cy="62" r="40" fill="#F5B83D" opacity="0.22"></circle>
<path d="M60 40 q12 -12 26 -4 q10 -10 24 0 q14 -2 12 10 H60Z" fill="#FFFFFF" opacity="0.85"></path>
<path d="M220 78 q10 -9 20 -3 q9 -8 19 0 q11 -1 9 8 H220Z" fill="#FFFFFF" opacity="0.7"></path>
<path d="M0 196 Q60 170 110 140 L300 140 Q350 168 400 190 V280 H0Z" fill="#E7CF9F"></path>
<path d="M0 196 Q60 170 110 140 L130 140 Q70 176 0 214Z" fill="#CDB07A"></path>
<g>
<rect x="124" y="124" width="156" height="16" fill="#FFF8EA"></rect>
<rect x="132" y="68" width="8" height="56" fill="#FFF8EA"></rect>
<rect x="150" y="68" width="8" height="56" fill="#FFF8EA"></rect>
<rect x="168" y="68" width="8" height="56" fill="#FFF8EA"></rect>
<rect x="186" y="68" width="8" height="56" fill="#FFF8EA"></rect>
<rect x="204" y="68" width="8" height="56" fill="#FFF8EA"></rect>
<rect x="222" y="68" width="8" height="56" fill="#FFF8EA"></rect>
<rect x="240" y="68" width="8" height="56" fill="#FFF8EA"></rect>
<rect x="258" y="68" width="8" height="56" fill="#FFF8EA"></rect>
<rect x="128" y="62" width="144" height="8" fill="#FFF8EA"></rect>
<path d="M126 62 L200 30 L274 62Z" fill="#FFF8EA"></path>
<rect x="140" y="68" width="3" height="56" fill="#D8C6A0" opacity="0.7"></rect>
<rect x="158" y="68" width="3" height="56" fill="#D8C6A0" opacity="0.7"></rect>
<rect x="176" y="68" width="3" height="56" fill="#D8C6A0" opacity="0.7"></rect>
<rect x="194" y="68" width="3" height="56" fill="#D8C6A0" opacity="0.7"></rect>
<rect x="212" y="68" width="3" height="56" fill="#D8C6A0" opacity="0.7"></rect>
<rect x="230" y="68" width="3" height="56" fill="#D8C6A0" opacity="0.7"></rect>
<rect x="248" y="68" width="3" height="56" fill="#D8C6A0" opacity="0.7"></rect>
<rect x="266" y="68" width="3" height="56" fill="#D8C6A0" opacity="0.7"></rect>
</g>
<g>
<rect x="40" y="170" width="6" height="26" fill="#6B4E36"></rect>
<circle cx="43" cy="162" r="18" fill="#7E9A63"></circle>
<circle cx="30" cy="170" r="12" fill="#6F8C57"></circle>
<circle cx="56" cy="170" r="12" fill="#8DA873"></circle>
</g>
<rect x="0" y="222" width="400" height="58" fill="#2B8A94"></rect>
<path d="M0 238 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke="#A5DCD2" strokeWidth="2.4" fill="none" opacity="0.8"></path>
<path d="M0 258 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke="#A5DCD2" strokeWidth="2.4" fill="none" opacity="0.55"></path>
<path d="M300 232 L318 214 L336 232Z" fill="#FFF8EA"></path>
<path d="M318 214 V196" stroke="#FFF8EA" strokeWidth="2"></path>
<path d="M318 198 L330 214 H318Z" fill="#EE5B3C"></path>
    </>
  ),
  marrakech: (
    <>
<defs>
<linearGradient id="marSky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stopColor="#F7A15B"></stop>
<stop offset="0.6" stopColor="#FFD08A"></stop>
<stop offset="1" stopColor="#FFEBC4"></stop>
</linearGradient>
</defs>
<rect width="400" height="280" fill="url(#marSky)"></rect>
<circle cx="86" cy="96" r="46" fill="#FFF1D0" opacity="0.5"></circle>
<circle cx="86" cy="96" r="28" fill="#FFF8E6"></circle>
<path d="M0 214 L0 168 H70 V150 H130 V176 H400 V214Z" fill="#D9774C"></path>
<g>
<rect x="244" y="62" width="50" height="152" fill="#C45F3A"></rect>
<rect x="238" y="52" width="62" height="14" fill="#B2512F"></rect>
<rect x="258" y="34" width="22" height="20" fill="#B2512F"></rect>
<path d="M258 34 Q269 10 280 34Z" fill="#2B8A94"></path>
<path d="M269 10 V2" stroke="#B2512F" strokeWidth="2.4"></path>
<circle cx="269" cy="4" r="3" fill="#F5B83D"></circle>
<path d="M258 130 V104 a11 11 0 0 1 22 0 V130Z" fill="#FFEBC4"></path>
<path d="M258 186 V160 a11 11 0 0 1 22 0 V186Z" fill="#FFEBC4"></path>
<rect x="244" y="88" width="50" height="6" fill="#F5B83D"></rect>
</g>
<path d="M312 176 V150 Q340 112 368 150 V176Z" fill="#E08A5C"></path>
<path d="M326 176 V160 a14 14 0 0 1 28 0 V176Z" fill="#FFEBC4"></path>
<path d="M0 214 H400 V280 H0Z" fill="#F2C98F"></path>
<path d="M0 238 Q100 226 200 240 T400 236 V280 H0Z" fill="#E8B676"></path>
<g>
<path d="M48 238 Q52 190 44 150" stroke="#5B3A22" strokeWidth="5" fill="none" strokeLinecap="round"></path>
<path d="M44 150 Q20 140 8 156" stroke="#2F6B4F" strokeWidth="6" fill="none" strokeLinecap="round"></path>
<path d="M44 150 Q62 130 86 142" stroke="#2F6B4F" strokeWidth="6" fill="none" strokeLinecap="round"></path>
<path d="M44 150 Q36 126 18 120" stroke="#3E8061" strokeWidth="6" fill="none" strokeLinecap="round"></path>
<path d="M44 150 Q60 122 78 118" stroke="#3E8061" strokeWidth="6" fill="none" strokeLinecap="round"></path>
<path d="M44 150 Q46 124 50 108" stroke="#2F6B4F" strokeWidth="6" fill="none" strokeLinecap="round"></path>
</g>
<g>
<path d="M360 244 Q356 206 364 172" stroke="#5B3A22" strokeWidth="4" fill="none" strokeLinecap="round"></path>
<path d="M364 172 Q344 166 336 180" stroke="#2F6B4F" strokeWidth="5" fill="none" strokeLinecap="round"></path>
<path d="M364 172 Q382 160 396 172" stroke="#2F6B4F" strokeWidth="5" fill="none" strokeLinecap="round"></path>
<path d="M364 172 Q358 152 346 148" stroke="#3E8061" strokeWidth="5" fill="none" strokeLinecap="round"></path>
</g>
    </>
  ),
}

/**
 * Hand-drawn postcard illustration. Fills its parent, so size the wrapper.
 * Decorative by default; pass `label` to expose the description.
 */
export function Scene({
  scene,
  className,
  label,
}: {
  scene: SceneName
  className?: string
  label?: boolean
}) {
  return (
    <svg
      viewBox="0 0 400 280"
      preserveAspectRatio="xMidYMid slice"
      role={label ? 'img' : undefined}
      aria-label={label ? LABELS[scene] : undefined}
      aria-hidden={label ? undefined : true}
      className={cn('block h-full w-full', className)}
    >
      {SCENES[scene]}
    </svg>
  )
}
