/**
 * CitySkylineIllustration
 * Handcrafted vector artwork featuring clouds, airplane, sun, hot air balloons,
 * and an architectural municipal city skyline matching the reference aesthetic.
 */
export function CitySkylineIllustration() {
  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none overflow-hidden h-[240px] sm:h-[300px] md:h-[340px] lg:h-[380px] z-0 flex items-end justify-center opacity-65 hover:opacity-90 transition-opacity duration-500">
      <svg
        viewBox="0 0 1440 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover object-bottom text-slate-400 stroke-current"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Sky: Airplane */}
        <g transform="translate(140, 45) scale(0.85)" opacity="0.75">
          <path d="M10 25 L45 22 L70 5 L78 6 L58 21 L105 18 L115 11 L120 12 L112 20 L130 19 C136 19 140 21 140 24 C140 27 136 29 130 29 L112 28 L120 36 L115 37 L105 30 L58 27 L78 42 L70 43 L45 26 L10 25 Z" fill="white" />
          <path d="M0 25 L8 25" strokeDasharray="2 2" />
        </g>

        {/* Sky: Clouds */}
        <g transform="translate(70, 110) scale(0.7)" opacity="0.6">
          <path d="M20 30 C12 30 5 24 5 16 C5 9 11 3 18 3 C20 1 23 0 26 0 C33 0 39 5 40 11 C42 10 44 10 46 10 C52 10 57 15 57 21 C57 26 53 30 47 30 Z" fill="white" />
        </g>
        <g transform="translate(260, 25) scale(0.9)" opacity="0.65">
          <path d="M25 35 C15 35 7 28 7 18 C7 10 14 3 22 3 C25 1 28 0 32 0 C40 0 47 6 49 13 C51 12 54 12 57 12 C64 12 70 18 70 25 C70 31 65 35 58 35 Z" fill="white" />
        </g>
        <g transform="translate(1080, 25) scale(0.85)" opacity="0.65">
          <path d="M25 35 C15 35 7 28 7 18 C7 10 14 3 22 3 C25 1 28 0 32 0 C40 0 47 6 49 13 C51 12 54 12 57 12 C64 12 70 18 70 25 C70 31 65 35 58 35 Z" fill="white" />
        </g>
        <g transform="translate(1280, 105) scale(0.65)" opacity="0.55">
          <path d="M20 30 C12 30 5 24 5 16 C5 9 11 3 18 3 C20 1 23 0 26 0 C33 0 39 5 40 11 C42 10 44 10 46 10 C52 10 57 15 57 21 C57 26 53 30 47 30 Z" fill="white" />
        </g>

        {/* Sky: Sun with Rays */}
        <g transform="translate(540, 20)" opacity="0.7">
          <circle cx="25" cy="25" r="14" fill="white" />
          <line x1="25" y1="3" x2="25" y2="7" />
          <line x1="25" y1="43" x2="25" y2="47" />
          <line x1="3" y1="25" x2="7" y2="25" />
          <line x1="43" y1="25" x2="47" y2="25" />
          <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
          <line x1="37.5" y1="37.5" x2="40.5" y2="40.5" />
          <line x1="9.5" y1="40.5" x2="12.5" y2="37.5" />
          <line x1="37.5" y1="12.5" x2="40.5" y2="9.5" />
        </g>

        {/* Sky: Hot Air Balloons */}
        <g transform="translate(860, 40) scale(0.85)" opacity="0.75">
          <path d="M30 0 C13.4 0 0 13.4 0 30 C0 42 12 55 22 65 L24 70 L36 70 L38 65 C48 55 60 42 60 30 C60 13.4 46.6 0 30 0 Z" fill="white" />
          <path d="M30 0 C22 15 20 45 24 70" />
          <path d="M30 0 C38 15 40 45 36 70" />
          <line x1="10" y1="22" x2="50" y2="22" strokeDasharray="1.5 1.5" />
          <line x1="26" y1="70" x2="26" y2="76" />
          <line x1="34" y1="70" x2="34" y2="76" />
          <rect x="24" y="76" width="12" height="9" rx="1.5" fill="white" />
        </g>
        <g transform="translate(1120, 85) scale(0.6)" opacity="0.6">
          <path d="M25 0 C11.2 0 0 11.2 0 25 C0 35 10 46 18 55 L20 59 L30 59 L32 55 C40 46 50 35 50 25 C50 11.2 38.8 0 25 0 Z" fill="white" />
          <line x1="22" y1="59" x2="22" y2="64" />
          <line x1="28" y1="59" x2="28" y2="64" />
          <rect x="20" y="64" width="10" height="7" rx="1" fill="white" />
        </g>

        {/* Ground baseline */}
        <line x1="0" y1="379" x2="1440" y2="379" strokeWidth="1.5" />

        {/* Bridge Pylons & Stadium (Left) */}
        <g transform="translate(40, 160)">
          <rect x="35" y="60" width="85" height="159" fill="white" />
          <rect x="35" y="60" width="10" height="159" fill="white" />
          <rect x="110" y="60" width="10" height="159" fill="white" />
          <line x1="45" y1="90" x2="110" y2="90" />
          <circle cx="77" cy="80" r="10" />
          <path d="M0 180 Q 40 120 45 70" />
          <path d="M120 70 Q 150 140 180 180" />
          <rect x="0" y="160" width="160" height="59" rx="4" fill="white" />
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`s-${i}`} x1={10 + i * 11} y1="175" x2={10 + i * 11} y2="219" />
          ))}
        </g>

        {/* Municipal Pavilion with Dome */}
        <g transform="translate(190, 140)">
          <path d="M70 120 C70 80 100 50 120 40 C140 50 170 80 170 120 Z" fill="white" />
          <rect x="115" y="20" width="10" height="20" fill="white" />
          <line x1="120" y1="5" x2="120" y2="20" />
          <circle cx="120" cy="5" r="3" fill="white" />
          <rect x="30" y="120" width="180" height="119" fill="white" />
          <path d="M80 160 L120 135 L160 160 Z" fill="white" />
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={`p-${i}`} x={45 + i * 20} y="170" width="8" height="69" fill="white" />
          ))}
        </g>

        {/* Mid-Rise Administration Tower */}
        <g transform="translate(380, 110)">
          <rect x="10" y="40" width="75" height="229" fill="white" />
          <line x1="10" y1="40" x2="47" y2="15" />
          <line x1="85" y1="40" x2="47" y2="15" />
          <line x1="47" y1="0" x2="47" y2="15" />
          {Array.from({ length: 10 }).map((_, r) => (
            <g key={`w-${r}`}>
              {Array.from({ length: 4 }).map((_, c) => (
                <rect key={`wc-${r}-${c}`} x={20 + c * 15} y={55 + r * 18} width="8" height="10" rx="1" fill="white" />
              ))}
            </g>
          ))}
        </g>

        {/* Classical Municipal Grand Hall & Colonnade */}
        <g transform="translate(460, 120)">
          <path d="M50 140 L160 80 L270 140 Z" fill="white" />
          <circle cx="160" cy="115" r="10" fill="white" />
          <rect x="40" y="140" width="240" height="14" fill="white" />
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={`c-${i}`} x={55 + i * 22} y="154" width="10" height="105" fill="white" />
          ))}
          <line x1="30" y1="259" x2="290" y2="259" />
          <line x1="20" y1="264" x2="300" y2="264" />
        </g>

        {/* Monument Column with Winged Statue */}
        <g transform="translate(680, 50)">
          <circle cx="35" cy="18" r="4" fill="white" />
          <path d="M35 22 L35 36" />
          <path d="M22 26 Q 35 30 35 22 Q 35 30 48 26" fill="white" />
          <rect x="26" y="45" width="18" height="12" rx="2" fill="white" />
          <rect x="29" y="57" width="12" height="232" fill="white" />
          <rect x="15" y="289" width="40" height="40" fill="white" />
        </g>

        {/* Clock Tower / Spire */}
        <g transform="translate(735, 10)">
          <line x1="40" y1="0" x2="40" y2="70" strokeWidth="1.5" />
          <circle cx="40" cy="95" r="22" fill="white" />
          <circle cx="40" cy="95" r="16" />
          <path d="M33 117 L25 369 L55 369 L47 117 Z" fill="white" />
          <line x1="31" y1="160" x2="49" y2="160" />
          <line x1="29" y1="210" x2="51" y2="210" />
        </g>

        {/* Commercial Grid High-Rise */}
        <g transform="translate(800, 110)">
          <rect x="10" y="30" width="70" height="239" fill="white" />
          {Array.from({ length: 8 }).map((_, r) => (
            <g key={`wr-${r}`}>
              {Array.from({ length: 5 }).map((_, c) => (
                <rect key={`wrc-${r}-${c}`} x={18 + c * 12} y={45 + r * 24} width="7" height="12" rx="1" fill="white" />
              ))}
            </g>
          ))}
        </g>

        {/* Heritage Cathedral Dome */}
        <g transform="translate(870, 130)">
          <path d="M40 130 C40 70 80 30 110 20 C140 30 180 70 180 130 Z" fill="white" />
          <rect x="105" y="5" width="10" height="15" fill="white" />
          <circle cx="110" cy="0" r="2.5" fill="white" />
          <rect x="25" y="130" width="170" height="119" fill="white" />
          {Array.from({ length: 5 }).map((_, i) => (
            <path key={`a-${i}`} d={`M${45 + i * 28} 200 Q${57 + i * 28} 175 ${69 + i * 28} 200 L${69 + i * 28} 249 L${45 + i * 28} 249 Z`} fill="white" />
          ))}
        </g>

        {/* Modern Tower & Gothic Spire (Right) */}
        <g transform="translate(1020, 115)">
          <path d="M20 264 L20 40 L110 0 L110 264 Z" fill="white" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`lv-${i}`} x1="30" y1={45 + i * 26} x2="100" y2={45 + i * 26} />
          ))}
        </g>
        <g transform="translate(1160, 105)">
          <path d="M40 180 L55 20 L70 180 Z" fill="white" />
          <circle cx="55" cy="5" r="2.5" fill="white" />
          <rect x="35" y="180" width="40" height="94" fill="white" />
          <path d="M100 180 L115 0 L130 180 Z" fill="white" />
          <rect x="95" y="180" width="40" height="94" fill="white" />
        </g>
      </svg>
    </div>
  );
}
