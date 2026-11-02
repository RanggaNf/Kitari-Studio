"use client";

import { useMemo, useState } from "react";

interface CountryStat {
  country: string;
  countryId?: string;
  users: number;
  views?: number;
}

interface WorldMapHeatmapProps {
  countries: CountryStat[];
}

// Country centroid coordinates on an 1000x500 equirectangular SVG map
// x: (lon + 180) * (1000 / 360) = (lon + 180) * 2.777
// y: (90 - lat) * (500 / 180) = (90 - lat) * 2.777
const COUNTRY_COORDS: Record<string, { x: number; y: number; r: number; flag: string; name: string }> = {
  US: { x: 260, y: 145, r: 42, flag: "🇺🇸", name: "United States" },
  CA: { x: 250, y: 85, r: 38, flag: "🇨🇦", name: "Canada" },
  MX: { x: 220, y: 195, r: 20, flag: "🇲🇽", name: "Mexico" },
  BR: { x: 350, y: 320, r: 35, flag: "🇧🇷", name: "Brazil" },
  AR: { x: 325, y: 390, r: 22, flag: "🇦🇷", name: "Argentina" },
  GB: { x: 495, y: 105, r: 16, flag: "🇬🇧", name: "United Kingdom" },
  FR: { x: 505, y: 125, r: 18, flag: "🇫🇷", name: "France" },
  DE: { x: 525, y: 110, r: 18, flag: "🇩🇪", name: "Germany" },
  IT: { x: 535, y: 135, r: 16, flag: "🇮🇹", name: "Italy" },
  ES: { x: 490, y: 140, r: 18, flag: "🇪🇸", name: "Spain" },
  NL: { x: 512, y: 106, r: 14, flag: "🇳🇱", name: "Netherlands" },
  PL: { x: 550, y: 105, r: 18, flag: "🇵🇱", name: "Poland" },
  UA: { x: 585, y: 115, r: 20, flag: "🇺🇦", name: "Ukraine" },
  RU: { x: 720, y: 85, r: 55, flag: "🇷🇺", name: "Russia" },
  TR: { x: 595, y: 145, r: 18, flag: "🇹🇷", name: "Turkey" },
  IR: { x: 645, y: 165, r: 22, flag: "🇮🇷", name: "Iran" },
  SA: { x: 625, y: 195, r: 22, flag: "🇸🇦", name: "Saudi Arabia" },
  AE: { x: 650, y: 190, r: 12, flag: "🇦🇪", name: "United Arab Emirates" },
  IN: { x: 715, y: 205, r: 32, flag: "🇮🇳", name: "India" },
  CN: { x: 785, y: 165, r: 48, flag: "🇨🇳", name: "China" },
  JP: { x: 885, y: 155, r: 20, flag: "🇯🇵", name: "Japan" },
  KR: { x: 850, y: 155, r: 14, flag: "🇰🇷", name: "South Korea" },
  SG: { x: 788, y: 248, r: 10, flag: "🇸🇬", name: "Singapore" },
  MY: { x: 785, y: 242, r: 16, flag: "🇲🇾", name: "Malaysia" },
  ID: { x: 825, y: 275, r: 35, flag: "🇮🇩", name: "Indonesia" },
  AU: { x: 870, y: 355, r: 38, flag: "🇦🇺", name: "Australia" },
  NZ: { x: 960, y: 405, r: 16, flag: "🇳🇿", name: "New Zealand" },
  ZA: { x: 565, y: 365, r: 22, flag: "🇿🇦", name: "South Africa" },
  NG: { x: 520, y: 235, r: 18, flag: "🇳🇬", name: "Nigeria" },
  EG: { x: 580, y: 175, r: 18, flag: "🇪🇬", name: "Egypt" },
};

// Simplified SVG silhouette paths for the world continents
const CONTINENT_PATHS = [
  // North America
  "M 140 60 L 260 40 L 320 60 L 300 95 L 340 120 L 290 145 L 260 215 L 230 220 L 210 185 L 175 165 L 140 125 Z",
  // Greenland
  "M 360 30 L 415 35 L 400 80 L 360 85 Z",
  // South America
  "M 265 245 L 330 255 L 390 300 L 365 375 L 320 445 L 295 440 L 285 365 L 260 295 Z",
  // Europe
  "M 470 90 L 550 75 L 610 90 L 590 145 L 530 155 L 485 145 L 470 120 Z",
  // Africa
  "M 480 170 L 585 165 L 620 235 L 585 370 L 540 375 L 490 280 L 465 210 Z",
  // Asia
  "M 605 75 L 850 65 L 920 125 L 880 185 L 805 210 L 740 250 L 675 220 L 615 160 Z",
  // Australia
  "M 820 330 L 910 320 L 920 395 L 850 410 L 815 375 Z",
];

export function WorldMapHeatmap({ countries }: WorldMapHeatmapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<CountryStat | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const totalUsers = useMemo(
    () => countries.reduce((sum, c) => sum + c.users, 0),
    [countries],
  );

  const maxUsers = useMemo(
    () => Math.max(...countries.map((c) => c.users), 1),
    [countries],
  );

  const countryMap = useMemo(() => {
    const map = new Map<string, CountryStat>();
    countries.forEach((c) => {
      if (c.countryId) map.set(c.countryId.toUpperCase(), c);
      map.set(c.country.toLowerCase(), c);
    });
    return map;
  }, [countries]);

  return (
    <div className="admin-geo-card">
      <div className="admin-geo-header">
        <div>
          <h3>Pengguna aktif menurut ID Negara</h3>
          <p>Distribusi persebaran pengunjung global 28 hari terakhir</p>
        </div>
        <div className="admin-geo-legend">
          <span>0</span>
          <div className="admin-geo-bar" />
          <span>{maxUsers}+</span>
        </div>
      </div>

      <div className="admin-geo-content">
        {/* World Map SVG Canvas */}
        <div className="admin-map-container">
          <svg
            viewBox="0 0 1000 500"
            className="admin-world-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background Grid Lines (Subtle latitude/longitude) */}
            <g className="admin-map-grid" opacity="0.15">
              <line x1="0" y1="125" x2="1000" y2="125" stroke="currentColor" strokeDasharray="3,3" />
              <line x1="0" y1="250" x2="1000" y2="250" stroke="currentColor" />
              <line x1="0" y1="375" x2="1000" y2="375" stroke="currentColor" strokeDasharray="3,3" />
              <line x1="250" y1="0" x2="250" y2="500" stroke="currentColor" strokeDasharray="3,3" />
              <line x1="500" y1="0" x2="500" y2="500" stroke="currentColor" strokeDasharray="3,3" />
              <line x1="750" y1="0" x2="750" y2="500" stroke="currentColor" strokeDasharray="3,3" />
            </g>

            {/* Base Continents Background */}
            <g className="admin-map-continents">
              {CONTINENT_PATHS.map((path, idx) => (
                <path
                  key={idx}
                  d={path}
                  className="admin-continent-path"
                />
              ))}
            </g>

            {/* Country Heatmap Nodes & Highlights */}
            <g className="admin-map-nodes">
              {Object.entries(COUNTRY_COORDS).map(([code, coord]) => {
                const stat =
                  countryMap.get(code) ||
                  countryMap.get(coord.name.toLowerCase());
                const users = stat ? stat.users : 0;
                const ratio = users > 0 ? users / maxUsers : 0;
                const hasUsers = users > 0;

                // Color scale matching GA4: soft blue to rich royal blue
                let fillColor = "rgba(148, 163, 184, 0.12)";
                let strokeColor = "rgba(148, 163, 184, 0.25)";
                let glowColor = "transparent";

                if (hasUsers) {
                  if (ratio > 0.6) {
                    fillColor = "#1d4ed8";
                    strokeColor = "#3b82f6";
                    glowColor = "rgba(59, 130, 246, 0.5)";
                  } else if (ratio > 0.3) {
                    fillColor = "#2563eb";
                    strokeColor = "#60a5fa";
                    glowColor = "rgba(96, 165, 250, 0.4)";
                  } else if (ratio > 0.1) {
                    fillColor = "#3b82f6";
                    strokeColor = "#93c5fd";
                    glowColor = "rgba(147, 197, 253, 0.3)";
                  } else {
                    fillColor = "#60a5fa";
                    strokeColor = "#bfdbfe";
                    glowColor = "rgba(191, 219, 254, 0.2)";
                  }
                }

                const isHovered =
                  hoveredCountry &&
                  (hoveredCountry.countryId === code ||
                    hoveredCountry.country === coord.name);

                return (
                  <g
                    key={code}
                    className="admin-country-node"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                      });
                      setHoveredCountry(
                        stat || {
                          country: coord.name,
                          countryId: code,
                          users: 0,
                          views: 0,
                        },
                      );
                    }}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Pulsing glow for countries with visitors */}
                    {hasUsers && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={coord.r * 1.25}
                        fill={glowColor}
                        opacity={isHovered ? 0.8 : 0.35}
                        className={isHovered ? "admin-node-pulse" : ""}
                      />
                    )}

                    {/* Main country circle / area */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isHovered ? coord.r * 1.15 : coord.r}
                      fill={fillColor}
                      stroke={isHovered ? "#ffffff" : strokeColor}
                      strokeWidth={isHovered ? 2 : 1}
                      style={{ transition: "all 0.2s ease" }}
                    />

                    {/* ISO Label or Flag inside major nodes */}
                    {hasUsers && (
                      <text
                        x={coord.x}
                        y={coord.y + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={coord.r > 24 ? "11px" : "9px"}
                        fontWeight="700"
                        pointerEvents="none"
                      >
                        {code}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Tooltip ala GA4 */}
          {hoveredCountry && (
            <div
              className="admin-map-tooltip"
              style={{
                position: "fixed",
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                transform: "translate(-50%, -100%)",
                zIndex: 1000,
              }}
            >
              <div className="admin-tooltip-title">
                <span>
                  {COUNTRY_COORDS[hoveredCountry.countryId || ""]?.flag || "🌐"}
                </span>
                <strong>{hoveredCountry.country}</strong>
              </div>
              <div className="admin-tooltip-body">
                <div>
                  <span>Pengguna Aktif:</span>
                  <strong>{hoveredCountry.users}</strong>
                </div>
                {hoveredCountry.views !== undefined && (
                  <div>
                    <span>Tampilan:</span>
                    <strong>{hoveredCountry.views}</strong>
                  </div>
                )}
                <div>
                  <span>Pangsa:</span>
                  <strong>
                    {totalUsers > 0
                      ? Math.round((hoveredCountry.users / totalUsers) * 100)
                      : 0}
                    %
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Ranked Country List (Matching GA4 layout) */}
        <div className="admin-geo-list-wrap">
          <div className="admin-geo-list-header">
            <span>NEGARA</span>
            <span>PENGGUNA AKTIF</span>
          </div>

          <div className="admin-geo-list">
            {countries.map((c) => {
              const pct = totalUsers > 0 ? (c.users / totalUsers) * 100 : 0;
              const isHovered =
                hoveredCountry && hoveredCountry.country === c.country;
              const flag =
                COUNTRY_COORDS[c.countryId?.toUpperCase() || ""]?.flag || "🌐";

              return (
                <div
                  key={c.country}
                  className={`admin-geo-item ${isHovered ? "active" : ""}`}
                  onMouseEnter={() => setHoveredCountry(c)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  <div className="admin-geo-item-name">
                    <span className="admin-country-flag">{flag}</span>
                    <span className="admin-country-label">{c.country}</span>
                  </div>

                  <div className="admin-geo-item-stats">
                    <strong>{c.users}</strong>
                    <span className="admin-geo-share">{Math.round(pct)}%</span>
                  </div>

                  {/* Progress bar under item */}
                  <div className="admin-geo-bar-track">
                    <div
                      className="admin-geo-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
