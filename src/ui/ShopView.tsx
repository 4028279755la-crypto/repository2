export default function ShopView() {
  return (
    <section
      className="flex-1 flex items-center justify-center bg-[#ede5d0] border-b border-[#c8b89a] overflow-hidden"
      aria-label="店内見下ろしビュー"
    >
      <svg
        viewBox="0 0 480 240"
        className="w-full max-w-2xl h-auto"
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
      >
        {/* 床 */}
        <rect x="0" y="0" width="480" height="240" fill="#c8a97a" />
        {/* 畳エリア */}
        <rect x="20" y="20" width="440" height="100" fill="#a8b870" rx="4" />
        {/* 畳の線 */}
        <line x1="20" y1="70" x2="460" y2="70" stroke="#8a9a58" strokeWidth="1" />
        <line x1="165" y1="20" x2="165" y2="120" stroke="#8a9a58" strokeWidth="1" />
        <line x1="315" y1="20" x2="315" y2="120" stroke="#8a9a58" strokeWidth="1" />

        {/* カウンター */}
        <rect x="20" y="130" width="440" height="30" fill="#5c3d1e" rx="2" />
        <rect x="20" y="132" width="440" height="4" fill="#7a5230" />

        {/* ネタケース */}
        <rect x="30" y="140" width="420" height="16" fill="#d0eeff" rx="2" opacity="0.7" />
        <rect x="30" y="140" width="420" height="16" fill="none" stroke="#90b8d0" strokeWidth="1" rx="2" />

        {/* 板前（中央） */}
        <g transform="translate(220, 168)">
          {/* 体 */}
          <rect x="-14" y="0" width="28" height="36" fill="#f5f0e8" rx="3" />
          {/* 前掛け */}
          <rect x="-10" y="8" width="20" height="26" fill="#2c6090" rx="2" />
          {/* 頭 */}
          <ellipse cx="0" cy="-8" rx="12" ry="11" fill="#f5cba7" />
          {/* 帽子 */}
          <rect x="-10" y="-20" width="20" height="14" fill="#f5f0e8" rx="2" />
          {/* 腕（左） */}
          <rect x="-22" y="10" width="10" height="6" fill="#f5cba7" rx="2" />
          {/* 腕（右） */}
          <rect x="12" y="10" width="10" height="6" fill="#f5cba7" rx="2" />
        </g>

        {/* 客1（左） */}
        <g transform="translate(90, 70)">
          <ellipse cx="0" cy="-6" rx="10" ry="9" fill="#f5cba7" />
          <rect x="-10" y="2" width="20" height="28" fill="#e74c3c" rx="2" />
          <text x="0" y="48" textAnchor="middle" fontSize="8" fill="#5c3d1e">観光客</text>
        </g>

        {/* 客2（中央） */}
        <g transform="translate(240, 70)">
          <ellipse cx="0" cy="-6" rx="10" ry="9" fill="#e8c99a" />
          <rect x="-10" y="2" width="20" height="28" fill="#3498db" rx="2" />
          <text x="0" y="48" textAnchor="middle" fontSize="8" fill="#5c3d1e">常連</text>
        </g>

        {/* 客3（右） */}
        <g transform="translate(390, 70)">
          <ellipse cx="0" cy="-6" rx="10" ry="9" fill="#f5d5a0" />
          <rect x="-10" y="2" width="20" height="28" fill="#8e44ad" rx="2" />
          <text x="0" y="48" textAnchor="middle" fontSize="8" fill="#5c3d1e">富裕層</text>
        </g>

        {/* 暖簾 */}
        <rect x="0" y="0" width="480" height="18" fill="#2c1a0e" />
        <text x="240" y="13" textAnchor="middle" fontSize="10" fill="#f0d060" fontFamily="sans-serif">
          ── 寿司ドラフト ──
        </text>
        <rect x="60" y="0" width="20" height="22" fill="#c0392b" rx="0 0 4 4" />
        <rect x="180" y="0" width="20" height="22" fill="#c0392b" rx="0 0 4 4" />
        <rect x="280" y="0" width="20" height="22" fill="#c0392b" rx="0 0 4 4" />
        <rect x="400" y="0" width="20" height="22" fill="#c0392b" rx="0 0 4 4" />
      </svg>
    </section>
  )
}
