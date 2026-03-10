"use client";

import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────
export type AgentSplitPose =
  | "bored"
  | "searching"
  | "coin-flip"
  | "relaxed"
  | "mic-drop";

interface AgentSplitIllustrationProps {
  pose: AgentSplitPose;
  className?: string;
}

// ─── Floating animation helper ──────────────────────────
const float = (delay = 0) => ({
  y: [0, -6, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay,
  },
});

const spin = (delay = 0) => ({
  rotate: [0, 360],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "linear" as const,
    delay,
  },
});

// ─── Color Palette ──────────────────────────────────────
const C = {
  hoodie: "#312E81",      // indigo-900
  hoodieLight: "#3730A3", // indigo-700
  hoodieAccent: "#4338CA",// indigo-600
  eye: "#FFFFFF",
  eyeShadow: "#1E1B4B",  // indigo-950
  belt: "#D97706",        // amber-600
  coin: "#FBBF24",        // amber-400
  coinDark: "#F59E0B",    // amber-500
  receipt: "#E5E7EB",     // gray-200
  receiptLine: "#9CA3AF", // gray-400
  prop: "#6B7280",        // gray-500
  propLight: "#9CA3AF",   // gray-400
  surface: "#F3F4F6",     // gray-100
};

// ═══════════════════════════════════════════════════════
// ██ BASE CHARACTER PARTS (shared across poses)
// ═══════════════════════════════════════════════════════

/** Hood + Head shape */
function Head({ x = 100, y = 62 }: { x?: number; y?: number }) {
  return (
    <g>
      {/* Hood peak */}
      <path
        d={`M${x - 18} ${y - 28} Q${x} ${y - 42} ${x + 18} ${y - 28}`}
        fill={C.hoodie}
      />
      {/* Main head */}
      <ellipse cx={x} cy={y} rx={36} ry={36} fill={C.hoodie} />
      {/* Slight hood brim shadow */}
      <ellipse cx={x} cy={y - 12} rx={30} ry={6} fill={C.eyeShadow} opacity={0.15} />
    </g>
  );
}

/** Pair of expressive eyes */
function Eyes({
  x = 100,
  y = 65,
  leftAngle = 0,
  rightAngle = 0,
  leftScale = 1,
  rightScale = 1,
  gap = 28,
}: {
  x?: number;
  y?: number;
  leftAngle?: number;
  rightAngle?: number;
  leftScale?: number;
  rightScale?: number;
  gap?: number;
}) {
  const lx = x - gap / 2;
  const rx = x + gap / 2;
  return (
    <g>
      <ellipse
        cx={lx}
        cy={y}
        rx={10 * leftScale}
        ry={12 * leftScale}
        fill={C.eye}
        transform={`rotate(${leftAngle} ${lx} ${y})`}
      />
      <ellipse
        cx={rx}
        cy={y}
        rx={10 * rightScale}
        ry={12 * rightScale}
        fill={C.eye}
        transform={`rotate(${rightAngle} ${rx} ${y})`}
      />
    </g>
  );
}

/** Torso with belt */
function Torso({ x = 100, y = 108 }: { x?: number; y?: number }) {
  return (
    <g>
      <rect
        x={x - 32}
        y={y - 8}
        width={64}
        height={50}
        rx={12}
        fill={C.hoodieLight}
      />
      {/* Belt */}
      <rect x={x - 32} y={y + 20} width={64} height={6} rx={3} fill={C.belt} />
      {/* Belt buckle */}
      <circle cx={x} cy={y + 23} r={4} fill={C.coin} />
    </g>
  );
}

/** Simple legs */
function Legs({
  x = 100,
  y = 150,
  spread = 28,
}: {
  x?: number;
  y?: number;
  spread?: number;
}) {
  return (
    <g>
      <rect
        x={x - spread / 2 - 10}
        y={y}
        width={20}
        height={32}
        rx={9}
        fill={C.hoodie}
      />
      <rect
        x={x + spread / 2 - 10}
        y={y}
        width={20}
        height={32}
        rx={9}
        fill={C.hoodie}
      />
    </g>
  );
}

/** Crossed receipt swords on back */
function ReceiptSwords({ x = 100, y = 50 }: { x?: number; y?: number }) {
  return (
    <g opacity={0.7}>
      <rect
        x={x - 3}
        y={y - 35}
        width={6}
        height={50}
        rx={2}
        fill={C.receipt}
        transform={`rotate(-20 ${x} ${y})`}
      />
      <rect
        x={x - 3}
        y={y - 35}
        width={6}
        height={50}
        rx={2}
        fill={C.receipt}
        transform={`rotate(20 ${x} ${y})`}
      />
      {/* Receipt lines */}
      {[0, 8, 16, 24].map((offset) => (
        <g key={offset}>
          <line
            x1={x - 1}
            y1={y - 30 + offset}
            x2={x + 1}
            y2={y - 30 + offset}
            stroke={C.receiptLine}
            strokeWidth={1}
            transform={`rotate(-20 ${x} ${y})`}
          />
          <line
            x1={x - 1}
            y1={y - 30 + offset}
            x2={x + 1}
            y2={y - 30 + offset}
            stroke={C.receiptLine}
            strokeWidth={1}
            transform={`rotate(20 ${x} ${y})`}
          />
        </g>
      ))}
    </g>
  );
}

// ═══════════════════════════════════════════════════════
// ██ POSE 1 — BORED (Groups Empty)
// ═══════════════════════════════════════════════════════
function PoseBored() {
  return (
    <svg viewBox="0 0 240 220" fill="none" className="w-full h-auto">
      {/* Sitting surface */}
      <rect x={40} y={170} width={160} height={12} rx={6} fill={C.surface} />

      {/* Receipt swords */}
      <ReceiptSwords x={118} y={55} />

      {/* Body sitting */}
      <Torso x={100} y={108} />

      {/* Legs dangling */}
      <rect x={72} y={148} width={20} height={28} rx={9} fill={C.hoodie} />
      <rect x={108} y={148} width={20} height={28} rx={9} fill={C.hoodie} />
      {/* Swinging foot */}
      <motion.rect
        x={110}
        y={170}
        width={16}
        height={10}
        rx={5}
        fill={C.eyeShadow}
        animate={{ rotate: [0, 12, 0, -5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "110px", originY: "170px" }}
      />

      {/* Left arm — chin rest */}
      <rect
        x={56}
        y={95}
        width={18}
        height={38}
        rx={9}
        fill={C.hoodie}
        transform="rotate(15 56 95)"
      />
      {/* Right arm — resting */}
      <rect x={126} y={105} width={18} height={35} rx={9} fill={C.hoodie} />

      {/* Head resting on hand */}
      <Head x={100} y={62} />

      {/* Half-lidded bored eyes */}
      <Eyes
        x={100}
        y={68}
        leftScale={0.85}
        rightScale={0.85}
        leftAngle={-5}
        rightAngle={5}
      />
      {/* Eyelids (half closed = bored) */}
      <rect x={78} y={55} width={22} height={8} rx={2} fill={C.hoodie} />
      <rect x={104} y={55} width={22} height={8} rx={2} fill={C.hoodie} />

      {/* Floating "..." thought bubble */}
      <motion.g animate={float(0)}>
        <circle cx={155} cy={35} r={3} fill={C.propLight} />
        <circle cx={165} cy={30} r={3} fill={C.propLight} />
        <circle cx={175} cy={25} r={3} fill={C.propLight} />
      </motion.g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// ██ POSE 2 — SEARCHING (Friends Empty)
// ═══════════════════════════════════════════════════════
function PoseSearching() {
  return (
    <svg viewBox="0 0 240 220" fill="none" className="w-full h-auto">
      <ReceiptSwords x={122} y={52} />
      <Torso x={105} y={108} />
      <Legs x={105} y={150} />

      {/* Left arm holding magnifying glass */}
      <rect
        x={55}
        y={90}
        width={18}
        height={42}
        rx={9}
        fill={C.hoodie}
        transform="rotate(-30 55 90)"
      />

      {/* Magnifying glass */}
      <motion.g animate={float(0.3)}>
        <circle
          cx={42}
          cy={58}
          r={22}
          stroke={C.prop}
          strokeWidth={5}
          fill="none"
        />
        <circle cx={42} cy={58} r={18} fill={C.surface} opacity={0.5} />
        {/* Glass shine */}
        <ellipse cx={36} cy={52} rx={5} ry={3} fill="white" opacity={0.6} />
        {/* Handle */}
        <rect
          x={58}
          y={74}
          width={7}
          height={22}
          rx={3}
          fill={C.prop}
          transform="rotate(-45 58 74)"
        />
      </motion.g>

      {/* Right arm pointing */}
      <rect
        x={140}
        y={98}
        width={18}
        height={35}
        rx={9}
        fill={C.hoodie}
        transform="rotate(10 140 98)"
      />

      {/* Head leaning forward */}
      <Head x={100} y={60} />

      {/* Wide curious eyes */}
      <Eyes
        x={98}
        y={63}
        leftScale={1.15}
        rightScale={1.15}
        leftAngle={-3}
        rightAngle={3}
      />

      {/* Floating question marks */}
      <motion.text
        x={180}
        y={45}
        fontSize={18}
        fontWeight="bold"
        fill={C.coinDark}
        animate={float(0.5)}
      >
        ?
      </motion.text>
      <motion.text
        x={195}
        y={65}
        fontSize={14}
        fontWeight="bold"
        fill={C.propLight}
        animate={float(1)}
      >
        ?
      </motion.text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// ██ POSE 3 — COIN FLIP (Expenses Empty)
// ═══════════════════════════════════════════════════════
function PoseCoinFlip() {
  return (
    <svg viewBox="0 0 240 220" fill="none" className="w-full h-auto">
      <ReceiptSwords x={115} y={52} />
      <Torso x={100} y={110} />
      <Legs x={100} y={152} spread={32} />

      {/* Left arm — casual at side */}
      <rect x={56} y={108} width={18} height={36} rx={9} fill={C.hoodie} />

      {/* Right arm — raised for coin toss */}
      <rect
        x={132}
        y={78}
        width={18}
        height={40}
        rx={9}
        fill={C.hoodie}
        transform="rotate(-15 132 78)"
      />

      {/* Flipping coin */}
      <motion.g
        animate={{
          y: [0, -25, 0],
          rotateY: [0, 180, 360],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <circle cx={152} cy={48} r={10} fill={C.coin} />
        <text
          x={152}
          y={53}
          textAnchor="middle"
          fontSize={12}
          fontWeight="bold"
          fill={C.belt}
        >
          $
        </text>
      </motion.g>

      {/* Head */}
      <Head x={100} y={62} />

      {/* Eyes looking up at coin */}
      <Eyes x={100} y={60} leftAngle={8} rightAngle={-8} />

      {/* Empty money bag */}
      <g transform="translate(30, 150)">
        <path
          d="M0 20 Q0 0 15 0 Q30 0 30 20 Q30 35 15 38 Q0 35 0 20Z"
          fill={C.surface}
          stroke={C.propLight}
          strokeWidth={1.5}
        />
        <text
          x={15}
          y={24}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill={C.propLight}
        >
          $
        </text>
      </g>

      {/* Floating small coins */}
      <motion.circle cx={185} cy={80} r={5} fill={C.coin} animate={float(0.2)} />
      <motion.circle cx={200} cy={95} r={4} fill={C.coinDark} animate={float(0.8)} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// ██ POSE 4 — RELAXED (Notifications Empty)
// ═══════════════════════════════════════════════════════
function PoseRelaxed() {
  return (
    <svg viewBox="0 0 240 220" fill="none" className="w-full h-auto">
      {/* Chair / surface */}
      <rect x={55} y={140} width={130} height={10} rx={5} fill={C.surface} />
      {/* Chair back */}
      <rect x={145} y={90} width={10} height={60} rx={5} fill={C.propLight} />
      <rect x={140} y={85} width={20} height={10} rx={5} fill={C.propLight} />

      <ReceiptSwords x={108} y={50} />

      {/* Reclined body */}
      <rect
        x={68}
        y={98}
        width={64}
        height={48}
        rx={12}
        fill={C.hoodieLight}
        transform="rotate(-8 100 120)"
      />
      {/* Belt */}
      <rect
        x={68}
        y={120}
        width={64}
        height={6}
        rx={3}
        fill={C.belt}
        transform="rotate(-8 100 120)"
      />
      <circle
        cx={100}
        cy={125}
        r={4}
        fill={C.coin}
        transform="rotate(-8 100 120)"
      />

      {/* Legs — feet up on invisible surface */}
      <rect
        x={60}
        y={145}
        width={20}
        height={30}
        rx={9}
        fill={C.hoodie}
        transform="rotate(-70 70 160)"
      />
      <rect
        x={80}
        y={145}
        width={20}
        height={30}
        rx={9}
        fill={C.hoodie}
        transform="rotate(-70 90 160)"
      />

      {/* Left arm resting */}
      <rect x={52} y={105} width={18} height={32} rx={9} fill={C.hoodie} />

      {/* Right arm — thumbs up */}
      <rect
        x={130}
        y={88}
        width={18}
        height={32}
        rx={9}
        fill={C.hoodie}
        transform="rotate(-20 130 88)"
      />
      {/* Thumb */}
      <motion.g animate={float(0)}>
        <rect
          x={145}
          y={75}
          width={8}
          height={16}
          rx={4}
          fill={C.hoodie}
          transform="rotate(-10 149 83)"
        />
      </motion.g>

      {/* Head tilted */}
      <g transform="rotate(-5 95 60)">
        <Head x={95} y={60} />
        {/* Happy squinty eyes */}
        <path
          d="M76 62 Q83 56 90 62"
          stroke={C.eye}
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M104 62 Q111 56 118 62"
          stroke={C.eye}
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* Floating Z's */}
      <motion.text
        x={160}
        y={45}
        fontSize={16}
        fontWeight="bold"
        fill={C.propLight}
        animate={float(0)}
      >
        z
      </motion.text>
      <motion.text
        x={175}
        y={32}
        fontSize={13}
        fontWeight="bold"
        fill={C.propLight}
        opacity={0.6}
        animate={float(0.5)}
      >
        z
      </motion.text>
      <motion.text
        x={188}
        y={22}
        fontSize={10}
        fontWeight="bold"
        fill={C.propLight}
        opacity={0.35}
        animate={float(1)}
      >
        z
      </motion.text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// ██ POSE 5 — MIC DROP (Settlements Empty)
// ═══════════════════════════════════════════════════════
function PoseMicDrop() {
  return (
    <svg viewBox="0 0 240 220" fill="none" className="w-full h-auto">
      <ReceiptSwords x={115} y={50} />
      <Torso x={108} y={106} />
      <Legs x={108} y={148} spread={30} />

      {/* Left arm — on hip */}
      <rect
        x={63}
        y={100}
        width={18}
        height={38}
        rx={9}
        fill={C.hoodie}
        transform="rotate(15 63 100)"
      />

      {/* Right arm — extended down, dropping the bag */}
      <rect
        x={140}
        y={104}
        width={18}
        height={42}
        rx={9}
        fill={C.hoodie}
        transform="rotate(-10 140 104)"
      />

      {/* Dropping coin bag */}
      <motion.g
        animate={{
          y: [0, 30],
          opacity: [1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: "easeIn",
        }}
      >
        <path
          d="M148 150 Q148 140 156 138 Q164 140 164 150 Q164 160 156 162 Q148 160 148 150Z"
          fill={C.coin}
        />
        <text
          x={156}
          y={154}
          textAnchor="middle"
          fontSize={10}
          fontWeight="bold"
          fill={C.belt}
        >
          $
        </text>
      </motion.g>

      {/* Head */}
      <Head x={108} y={60} />

      {/* Confident smug eyes — one slightly smaller (wink-ish) */}
      <Eyes
        x={108}
        y={63}
        leftScale={1}
        rightScale={0.8}
        leftAngle={-5}
        rightAngle={8}
        gap={28}
      />

      {/* Sparkle effects */}
      <motion.g animate={float(0)}>
        <path
          d="M45 60 L48 52 L51 60 L48 68Z"
          fill={C.coin}
          opacity={0.7}
        />
      </motion.g>
      <motion.g animate={float(0.4)}>
        <path
          d="M190 80 L192 74 L194 80 L192 86Z"
          fill={C.coin}
          opacity={0.5}
        />
      </motion.g>
      <motion.g animate={float(0.8)}>
        <path
          d="M175 40 L177 35 L179 40 L177 45Z"
          fill={C.coinDark}
          opacity={0.6}
        />
      </motion.g>

      {/* Impact lines at bottom */}
      <motion.g
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5 }}
      >
        <line
          x1={140}
          y1={195}
          x2={130}
          y2={200}
          stroke={C.propLight}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <line
          x1={156}
          y1={195}
          x2={156}
          y2={202}
          stroke={C.propLight}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <line
          x1={172}
          y1={195}
          x2={180}
          y2={200}
          stroke={C.propLight}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </motion.g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// ██ POSE MAP & EXPORT
// ═══════════════════════════════════════════════════════
const POSE_MAP: Record<AgentSplitPose, () => JSX.Element> = {
  bored: PoseBored,
  searching: PoseSearching,
  "coin-flip": PoseCoinFlip,
  relaxed: PoseRelaxed,
  "mic-drop": PoseMicDrop,
};

export function AgentSplitIllustration({
  pose,
  className = "",
}: AgentSplitIllustrationProps) {
  const PoseComponent = POSE_MAP[pose];
  return (
    <div className={`select-none ${className}`}>
      <PoseComponent />
    </div>
  );
}