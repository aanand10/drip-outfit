// SVG figure dressed in the outfit: shapes follow the garment type, fills use the
// product colour. viewBox 200 × 500; `anchorsFor` gives OutfitStage's line anchors.
import { useId } from "react";
import type { Product, Slot } from "@/domain/types";
import {
  bottomKind,
  isEmbroidered,
  patternOf,
  shoeKind,
  textureOf,
  topKind,
  type BottomKind,
  type ShoeKind,
  type Texture,
  type TopKind,
} from "./garments";

export const FIGURE = { width: 200, height: 500 } as const;

const SKIN = "#c9986f";
const SKIN_SHADE = "#a87a55";
const HAIR = "#241b16";
const LINE = "rgba(17,17,17,0.28)";
const DETAIL = "rgba(17,17,17,0.22)";
const HILITE = "rgba(255,255,255,0.35)";
const MIRROR = "translate(200 0) scale(-1 1)";

export function anchorsFor(top: Product): Record<Slot, { x: number; y: number }> {
  const kurta = topKind(top) === "kurta";
  return {
    top: { x: 124, y: 150 },
    trousers: kurta ? { x: 121, y: 420 } : { x: 121, y: 330 },
    shoes: { x: 122, y: 482 },
  };
}

type Ids = Record<"shade" | "limb" | "pattern" | "floor" | "denim" | "rib" | "linen", string>;

export function Mannequin({
  top,
  trousers,
  shoes,
  active = null,
  onZone,
}: {
  top: Product;
  trousers: Product;
  shoes: Product;
  active?: Slot | null;
  onZone?: (slot: Slot) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const t = topKind(top);
  const b = bottomKind(trousers);
  const s = shoeKind(shoes);
  const tucked = t === "shirt" && (b === "tailored" || b === "wide");
  const hem = t === "kurta" ? 340 : t === "shirt" ? (tucked ? 226 : 242) : 240;
  const pattern = patternOf(top);

  const ids: Ids = {
    shade: `shade-${uid}`,
    limb: `limb-${uid}`,
    pattern: `pat-${uid}`,
    floor: `floor-${uid}`,
    denim: `denim-${uid}`,
    rib: `rib-${uid}`,
    linen: `linen-${uid}`,
  };
  const colour = (hex: string) => ({ fill: hex, transition: "fill 500ms ease" });
  const texture = (tex: Texture) => (tex ? ids[tex] : null);

  const zone = (slot: Slot) => ({
    onClick: onZone ? () => onZone(slot) : undefined,
    style: {
      opacity: active && active !== slot ? 0.62 : 1,
      filter: active === slot ? "drop-shadow(0 4px 10px rgba(0,0,0,0.18))" : "none",
      transition: "opacity 400ms ease, filter 400ms ease",
      cursor: onZone ? "pointer" : undefined,
    } as React.CSSProperties,
  });

  return (
    <svg viewBox={`0 0 ${FIGURE.width} ${FIGURE.height}`} className="h-full w-full" aria-hidden>
      <Defs ids={ids} pattern={pattern} />

      <ellipse cx="100" cy="494" rx="62" ry="5" fill={`url(#${ids.floor})`} />

      <Arms limbShade={ids.limb} dim={active !== null && active !== "top"} />
      <g {...zone("trousers")}>
        <Bottom kind={b} fill={colour(trousers.tags.colourHex)} shade={ids.shade} texture={texture(textureOf(trousers))} />
        {tucked && <Belt />}
      </g>
      <g {...zone("shoes")}>
        <Shoes kind={s} fill={colour(shoes.tags.colourHex)} />
      </g>
      <g {...zone("top")}>
        <Top
          kind={t}
          hem={hem}
          fill={colour(top.tags.colourHex)}
          shade={ids.shade}
          pattern={pattern === "plain" ? null : ids.pattern}
          texture={texture(textureOf(top))}
          embroidered={isEmbroidered(top)}
        />
      </g>
      <Head />
    </svg>
  );
}

function Defs({ ids, pattern }: { ids: Ids; pattern: ReturnType<typeof patternOf> }) {
  return (
    <defs>
      <linearGradient id={ids.shade} x1="0" x2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.2" />
        <stop offset="0.3" stopColor="#000" stopOpacity="0" />
        <stop offset="0.65" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="1" stopColor="#000" stopOpacity="0.18" />
      </linearGradient>
      <linearGradient id={ids.limb} x1="0" x2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.18" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.06" />
        <stop offset="1" stopColor="#000" stopOpacity="0.12" />
      </linearGradient>
      <radialGradient id={ids.floor}>
        <stop offset="0" stopColor="#000" stopOpacity="0.2" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      {pattern === "checks" && (
        <pattern id={ids.pattern} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="5" fill="#000" fillOpacity="0.16" />
          <rect width="5" height="12" fill="#000" fillOpacity="0.16" />
          <rect y="8" width="12" height="1" fill="#fff" fillOpacity="0.25" />
        </pattern>
      )}
      {pattern === "stripes" && (
        <pattern id={ids.pattern} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="3" fill="#000" fillOpacity="0.14" />
        </pattern>
      )}
      {/* Fabric textures */}
      <pattern id={ids.denim} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width="1.2" height="4" fill="#fff" fillOpacity="0.09" />
      </pattern>
      <pattern id={ids.rib} width="3" height="6" patternUnits="userSpaceOnUse">
        <rect width="1" height="6" fill="#000" fillOpacity="0.07" />
      </pattern>
      <pattern id={ids.linen} width="9" height="7" patternUnits="userSpaceOnUse">
        <rect y="1" width="6" height="0.8" fill="#000" fillOpacity="0.07" />
        <rect x="3" y="4.5" width="5" height="0.7" fill="#fff" fillOpacity="0.12" />
      </pattern>
    </defs>
  );
}

/* ---------- body ---------- */

function Arms({ limbShade, dim }: { limbShade: string; dim: boolean }) {
  const arm =
    "M58 92 Q47 96 45 112 L40 180 L36 246 Q33 262 37 276 Q42 284 47 276 Q49 266 48 252 L54 184 L62 122 Z";
  return (
    <g stroke={LINE} strokeWidth="0.9" style={{ opacity: dim ? 0.8 : 1, transition: "opacity 400ms" }}>
      {[undefined, MIRROR].map((tf, i) => (
        <g key={i} transform={tf}>
          <path d={arm} fill={SKIN} />
          <path d={arm} fill={`url(#${limbShade})`} stroke="none" />
          <path d="M39 266 L40 276 M42.5 267 L43 279 M46 266 L45.5 276" stroke={SKIN_SHADE} strokeWidth="0.7" fill="none" />
        </g>
      ))}
    </g>
  );
}

function Head() {
  return (
    <g>
      <path d="M91 58 L109 58 L111 84 Q100 90 89 84 Z" fill={SKIN} stroke={LINE} strokeWidth="0.9" />
      <path d="M92 62 Q100 71 108 62 L108 67 Q100 74 92 67 Z" fill={SKIN_SHADE} opacity="0.5" />
      <ellipse cx="83.5" cy="42" rx="3" ry="6" fill={SKIN} stroke={LINE} strokeWidth="0.8" />
      <ellipse cx="116.5" cy="42" rx="3" ry="6" fill={SKIN} stroke={LINE} strokeWidth="0.8" />
      <path d="M84 38 Q84 64 100 67 Q116 64 116 38 Q116 18 100 18 Q84 18 84 38 Z" fill={SKIN} stroke={LINE} strokeWidth="0.9" />
      <g fill="none" strokeLinecap="round">
        <path d="M90 36 Q94 34 97 36 M103 36 Q106 34 110 36" stroke={HAIR} strokeOpacity="0.7" strokeWidth="1.2" />
        <path d="M100 41 L98.5 50 Q100 51.5 102 50" stroke={SKIN_SHADE} strokeWidth="1" />
        <path d="M95.5 57 Q100 59.5 104.5 57" stroke={SKIN_SHADE} strokeWidth="1.1" />
      </g>
      <path d="M83 40 Q80 13 100 11 Q121 11 117 40 Q116 28 110 24 Q100 30 90 27 Q85 31 83 40 Z" fill={HAIR} />
      <path d="M92 17 Q102 13 112 19" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ---------- tops ---------- */

function Top({
  kind,
  hem,
  fill,
  shade,
  pattern,
  texture,
  embroidered,
}: {
  kind: TopKind;
  hem: number;
  fill: React.CSSProperties;
  shade: string;
  pattern: string | null;
  texture: string | null;
  embroidered: boolean;
}) {
  const flare = kind === "kurta" ? 8 : kind === "tee" ? 2 : 0;
  const body = `M60 88 Q76 80 90 80 Q100 87 110 80 Q124 80 140 88 L144 122 L141 200 L${142 + flare} ${hem} L${58 - flare} ${hem} L59 200 L56 122 Z`;
  const longSleeve = kind === "shirt" || kind === "kurta";
  const sleeve = longSleeve
    ? "M59 89 Q46 94 44 112 L38 180 L34 244 L50 246 L54 184 L62 124 Z"
    : "M59 89 Q45 94 43 114 L40 142 L58 146 L62 124 Z";
  const overlays = (d: string) => (
    <>
      {pattern && <path d={d} fill={`url(#${pattern})`} stroke="none" />}
      {texture && <path d={d} fill={`url(#${texture})`} stroke="none" />}
      <path d={d} fill={`url(#${shade})`} stroke="none" />
    </>
  );

  return (
    <g stroke={LINE} strokeWidth="1" strokeLinejoin="round">
      {[undefined, MIRROR].map((tf, i) => (
        <g key={i} transform={tf}>
          <path d={sleeve} style={fill} />
          {overlays(sleeve)}
          {longSleeve ? (
            <>
              <path d="M35 236 L50.5 238 L50 246 L34 244 Z" fill="#000" fillOpacity="0.12" />
              <circle cx="46" cy="241" r="0.9" fill={DETAIL} stroke="none" />
              {/* Elbow folds */}
              <path d="M41 176 Q46 172 52 176 M40.5 184 Q45 181 51 184" fill="none" stroke={DETAIL} />
            </>
          ) : (
            <path d="M40.5 136 L58.5 140" stroke={DETAIL} fill="none" />
          )}
        </g>
      ))}

      <path d={body} style={fill} />
      {overlays(body)}
      <path d={`M63 128 Q68 170 63 ${hem - 6}`} fill="none" stroke="rgba(17,17,17,0.1)" />
      <path d="M72 108 Q86 102 96 108" fill="none" stroke={HILITE} strokeWidth="1.4" strokeLinecap="round" />

      {kind === "tee" && (
        <g fill="none">
          <path d="M89 81 Q100 93 111 81" stroke={DETAIL} strokeWidth="2.2" />
          <path d={`M58 ${hem - 6} L142 ${hem - 6}`} stroke={DETAIL} strokeDasharray="1.5 1.5" />
        </g>
      )}

      {kind === "polo" && (
        <g>
          <path d="M88 79 L100 91 L93 99 L85 85 Z M112 79 L100 91 L107 99 L115 85 Z" style={fill} />
          <path d="M86.5 84 L92.5 96 M113.5 84 L107.5 96" fill="none" stroke={DETAIL} strokeWidth="0.7" />
          <path d="M100 91 L100 118" fill="none" stroke={DETAIL} />
          <circle cx="100" cy="100" r="1.4" fill={DETAIL} stroke="none" />
          <circle cx="100" cy="110" r="1.4" fill={DETAIL} stroke="none" />
        </g>
      )}

      {kind === "shirt" && (
        <g>
          <path d="M87 78 L100 93 L91 104 L84 86 Z M113 78 L100 93 L109 104 L116 86 Z" style={fill} />
          <path d={`M100 93 L100 ${hem}`} fill="none" stroke={DETAIL} />
          {Array.from({ length: Math.floor((hem - 105) / 24) + 1 }, (_, i) => (
            <circle key={i} cx="102.5" cy={108 + i * 24} r="1.3" fill={DETAIL} stroke="none" />
          ))}
          {/* Chest pocket */}
          <path d="M112 116 L126 116 L126 132 Q119 135 112 132 Z" fill="none" stroke={DETAIL} />
        </g>
      )}

      {kind === "kurta" && (
        <g>
          <path d="M89 79 Q100 84 111 79 L111 87 Q100 92 89 87 Z" style={fill} />
          <path d="M100 89 L100 146" fill="none" stroke={DETAIL} />
          {[100, 114, 128].map((y) => (
            <circle key={y} cx="102.5" cy={y} r="1.4" fill={DETAIL} stroke="none" />
          ))}
          <path d={`M57 ${hem - 46} L50 ${hem} M143 ${hem - 46} L150 ${hem}`} fill="none" stroke={DETAIL} />
          {embroidered && (
            <path
              d="M89 88 Q100 93 111 88 M96 92 L96 150 M104 92 L104 150"
              fill="none"
              stroke="#c9a14a"
              strokeWidth="1.6"
              strokeDasharray="1.5 2.5"
            />
          )}
        </g>
      )}
    </g>
  );
}

function Belt() {
  return (
    <g>
      <path d="M59 223 L141 223 L141 231 L59 231 Z" fill="#2a2420" />
      <path d="M60 225 L140 225" stroke="#fff" strokeOpacity="0.12" />
      <rect x="95" y="222" width="10" height="10" rx="1.5" fill="none" stroke="#c7c2b8" strokeWidth="1.4" />
    </g>
  );
}

/* ---------- bottoms ---------- */

const LEGS: Record<BottomKind, string> = {
  tailored: "M61 224 L139 224 L142 300 L134 472 L106 472 L100 262 L94 472 L66 472 L58 300 Z",
  jeans: "M61 224 L139 224 L142 300 L135 472 L106 472 L100 262 L94 472 L65 472 L58 300 Z",
  wide: "M61 224 L139 224 L147 300 L153 472 L106 472 L100 262 L94 472 L47 472 L53 300 Z",
  cargo: "M61 224 L139 224 L146 300 L148 472 L106 472 L100 262 L94 472 L52 472 L54 300 Z",
  joggers: "M60 224 L140 224 L145 300 L129 462 L106 462 L100 262 L94 462 L71 462 L55 300 Z",
};

function Bottom({
  kind,
  fill,
  shade,
  texture,
}: {
  kind: BottomKind;
  fill: React.CSSProperties;
  shade: string;
  texture: string | null;
}) {
  const legs = LEGS[kind];
  const loops = kind !== "joggers";
  return (
    <g stroke={LINE} strokeWidth="1" strokeLinejoin="round">
      <path d="M68 466 L92 466 L92 478 L68 478 Z M108 466 L132 466 L132 478 L108 478 Z" fill={SKIN} stroke="none" />
      <path d={legs} style={fill} />
      {texture && <path d={legs} fill={`url(#${texture})`} stroke="none" />}
      <path d={legs} fill={`url(#${shade})`} stroke="none" />
      <path d="M61 224 L139 224 L139 232 L61 232 Z" fill="#000" fillOpacity="0.1" stroke="none" />

      {loops && (
        <path d="M70 223 L70 233 M86 223 L86 233 M114 223 L114 233 M130 223 L130 233" stroke={DETAIL} strokeWidth="1.6" />
      )}
      {/* Knee and hem breaks */}
      <path d="M70 352 Q80 349 90 353 M110 353 Q120 349 130 352" fill="none" stroke="rgba(17,17,17,0.1)" />

      {(kind === "tailored" || kind === "wide" || kind === "cargo") && (
        <path d="M63 236 Q68 248 72 262 M137 236 Q132 248 128 262" fill="none" stroke={DETAIL} />
      )}
      {kind === "tailored" && <path d="M80 250 L80 470 M120 250 L120 470" fill="none" stroke={DETAIL} />}
      {kind === "wide" && (
        <path d="M78 233 L79 262 M86 233 L86 252 M122 233 L121 262 M114 233 L114 252" fill="none" stroke={DETAIL} />
      )}
      {kind === "jeans" && (
        <g>
          <g fill="none" stroke="#e0b25a" strokeOpacity="0.75" strokeDasharray="2 2">
            <path d="M64 238 Q75 242 79 233 M136 238 Q125 242 121 233" />
            <path d="M100 233 Q105 248 100 260" />
            <path d="M62 300 L66 470 M138 300 L134 470" strokeOpacity="0.4" />
          </g>
          <circle cx="78" cy="235" r="1.1" fill="#d6b06a" stroke="none" />
          <circle cx="122" cy="235" r="1.1" fill="#d6b06a" stroke="none" />
        </g>
      )}
      {kind === "joggers" && (
        <g>
          <path d="M71 452 L94 452 L94 466 L71 466 Z M106 452 L129 452 L129 466 L106 466 Z" fill="#000" fillOpacity="0.14" />
          <path d="M74 454 L74 464 M80 454 L80 464 M86 454 L86 464 M114 454 L114 464 M120 454 L120 464 M126 454 L126 464" stroke="rgba(17,17,17,0.12)" />
          <path d="M96 232 L93 254 M104 232 L107 254" fill="none" stroke="#f4f1ea" strokeWidth="1.4" />
        </g>
      )}
      {kind === "cargo" && (
        <g>
          <path d="M49 318 L63 318 L63 354 L49 354 Z M137 318 L151 318 L151 354 L137 354 Z" fill="#000" fillOpacity="0.08" />
          <path d="M49 326 L63 326 M137 326 L151 326" stroke={DETAIL} />
        </g>
      )}
    </g>
  );
}

/* ---------- shoes ---------- */

const SHOE: Record<ShoeKind, { upper: string; sole: string; soleFill: string; detail: string }> = {
  sneaker: {
    upper: "M64 476 Q66 467 80 467 Q93 467 96 477 L98 486 L61 486 Z",
    sole: "M59 485 L100 485 Q101 494 94 494 L64 494 Q57 494 59 485 Z",
    soleFill: "#f3f1ec",
    detail: "M73 471 L86 473 M72 476 L87 478 M62 490 L98 490",
  },
  loafer: {
    upper: "M63 480 Q67 472 80 472 Q94 472 99 484 L99 490 L60 490 Q60 484 63 480 Z",
    sole: "M60 489 L99 489 L99 492.5 L60 492.5 Z",
    soleFill: "#2a2420",
    detail: "M70 478 Q80 474 90 478 M68 482 Q80 477 94 483",
  },
  formal: {
    upper: "M63 480 Q67 471 82 471 Q97 473 103 486 L103 490 L60 490 Q60 484 63 480 Z",
    sole: "M60 489 L103 489 L103 492.5 L60 492.5 Z",
    soleFill: "#2a2420",
    detail: "M76 474 L84 475 M75 478 L85 479 M92 476 Q96 481 95 488",
  },
  boot: {
    upper: "M66 450 L94 450 L95 478 Q99 480 99 487 L61 487 Q61 478 65 476 Z",
    sole: "M60 486 L100 486 L100 492.5 L60 492.5 Z",
    soleFill: "#2a2420",
    detail: "M66 462 L94 462 M71 452 L73 468 L78 468 L80 452",
  },
};

function Shoes({ kind, fill }: { kind: ShoeKind; fill: React.CSSProperties }) {
  const shoe = SHOE[kind];
  return (
    <g stroke={LINE} strokeWidth="1" strokeLinejoin="round">
      {[undefined, MIRROR].map((tf, i) => (
        <g key={i} transform={tf}>
          <path d={shoe.upper} style={fill} />
          <path d={shoe.sole} fill={shoe.soleFill} />
          <path d={shoe.detail} fill="none" stroke={DETAIL} strokeWidth="1.1" />
          <path d="M68 471 Q76 468 84 469" fill="none" stroke={HILITE} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}
