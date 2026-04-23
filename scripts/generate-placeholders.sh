#!/bin/bash
cd /Users/gengbiaozeng/projects/SteamNewsAstro/public/images/heroes

generate_svg() {
  local name="$1" title="$2" color1="$3" color2="$4" icon="$5"
  cat > "${name}.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="100%" style="stop-color:${color2}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#grid)"/>
  <text x="600" y="300" font-family="sans-serif" font-size="72" font-weight="700" fill="rgba(255,255,255,0.9)" text-anchor="middle">${icon}</text>
  <text x="600" y="380" font-family="sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.7)" text-anchor="middle">${title}</text>
  <text x="600" y="420" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.4)" text-anchor="middle">SteamPulse</text>
</svg>
EOF
}

generate_svg "cs2-update" "Counter-Strike 2" "#1a2a3a" "#0d1b2a" "🎯"
generate_svg "bg3-review" "Baldur's Gate 3" "#2a1a2e" "#1a0d1e" "⚔️"
generate_svg "elden-ring-guide" "Elden Ring" "#2a2a1a" "#1e1a0d" "🗡️"
generate_svg "helldivers2-news" "Helldivers 2" "#1a2a1a" "#0d1e0d" "🪖"
generate_svg "palworld-update" "Palworld" "#1a2a2a" "#0d1e1e" "🦊"
generate_svg "steam-sale" "Steam Spring Sale" "#1a1a2a" "#0d0d1e" "🏷️"
generate_svg "hades2-review" "Hades II" "#2a1a1a" "#1e0d0d" "🔥"
generate_svg "lethal-company-guide" "Lethal Company" "#1a1a1a" "#0d0d0d" "👻"
generate_svg "dota2-esports" "Dota 2 TI" "#1a2a1e" "#0d1e12" "🏆"
generate_svg "cyberpunk-dlc" "Cyberpunk 2077" "#2a1a20" "#1e0d14" "🌆"

echo "Generated $(ls *.svg | wc -l) placeholder images"
