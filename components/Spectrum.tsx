'use client';
import { useRef, useCallback, useEffect, useState } from 'react';

interface SpectrumProps {
  leftLabel: string;
  rightLabel: string;
  value: number;            // 0–1, current needle position
  onChange?: (v: number) => void; // if provided, dial is interactive
  targetPosition?: number;  // shown on reveal (0–1)
  guesses?: { position: number; name: string; score: number; isMine: boolean }[];
  showBullseye?: boolean;   // show the psychic's hidden target zone
  locked?: boolean;         // player has locked in
  isOwner?: boolean;        // this player is the card owner (stays silent)
}

const R = 140;   // arc radius
const CX = 180;  // SVG centre x
const CY = 165;  // SVG centre y (arc starts here pointing down)
const SW = 360;  // SVG width
const SH = 185;  // SVG height

function posToAngle(pos: number): number {
  // pos 0 → angle 180° (left), pos 1 → angle 0° (right)
  return Math.PI - pos * Math.PI;
}

function angleToPos(angle: number): number {
  return 1 - angle / Math.PI;
}

function polarToXY(angle: number, r = R): { x: number; y: number } {
  return { x: CX + r * Math.cos(angle), y: CY - r * Math.sin(angle) };
}

function arcPath(startAngle: number, endAngle: number, r = R): string {
  const s = polarToXY(startAngle, r);
  const e = polarToXY(endAngle, r);
  const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
}

// Score zones: ±8% = 4pt, ±16% = 3pt, ±25% = 2pt
const ZONES = [
  { half: 0.25, color: '#1e3a5f', score: 2 },
  { half: 0.16, color: '#1e4a3a', score: 3 },
  { half: 0.08, color: '#4a2a6a', score: 4 },
];

export default function Spectrum({
  leftLabel,
  rightLabel,
  value,
  onChange,
  targetPosition,
  guesses = [],
  showBullseye = false,
  locked = false,
  isOwner = false,
}: SpectrumProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const [hovered, setHovered] = useState(false);

  const getPos = useCallback((clientX: number, clientY: number): number => {
    const svg = svgRef.current;
    if (!svg) return value;
    const rect = svg.getBoundingClientRect();
    const scaleX = SW / rect.width;
    const scaleY = SH / rect.height;
    const x = (clientX - rect.left) * scaleX - CX;
    const y = CY - (clientY - rect.top) * scaleY;
    let angle = Math.atan2(y, x);
    if (angle < 0) angle = 0;
    if (angle > Math.PI) angle = Math.PI;
    return angleToPos(angle);
  }, [value]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onChange || locked || isOwner) return;
    dragging.current = true;
    onChange(getPos(e.clientX, e.clientY));
  }, [onChange, locked, isOwner, getPos]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onChange || locked || isOwner) return;
    dragging.current = true;
    const t = e.touches[0];
    onChange(getPos(t.clientX, t.clientY));
  }, [onChange, locked, isOwner, getPos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !onChange) return;
      onChange(getPos(e.clientX, e.clientY));
    };
    const onTMove = (e: TouchEvent) => {
      if (!dragging.current || !onChange) return;
      onChange(getPos(e.touches[0].clientX, e.touches[0].clientY));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onChange, getPos]);

  const needleAngle = posToAngle(value);
  const needleTip = polarToXY(needleAngle, R - 4);
  const needleBase1 = polarToXY(needleAngle + Math.PI / 2, 8);
  const needleBase2 = polarToXY(needleAngle - Math.PI / 2, 8);

  const interactive = !!onChange && !locked && !isOwner;

  return (
    <div className="w-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SW} ${SH}`}
        className="w-full"
        style={{ cursor: interactive ? (hovered ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Background arc */}
        <path
          d={arcPath(Math.PI, 0)}
          fill="none"
          stroke="#2d2d44"
          strokeWidth={32}
          strokeLinecap="round"
        />

        {/* Gradient fill on arc (colour spectrum) */}
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path
          d={arcPath(Math.PI, 0)}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth={30}
          strokeLinecap="round"
        />

        {/* Bullseye zones (shown when showBullseye or revealed) */}
        {showBullseye && targetPosition !== undefined &&
          ZONES.map(({ half, color }) => {
            const tAngle = posToAngle(targetPosition);
            const startAngle = Math.min(Math.max(tAngle - half * Math.PI, 0), Math.PI);
            const endAngle = Math.min(Math.max(tAngle + half * Math.PI, 0), Math.PI);
            return (
              <path
                key={half}
                d={arcPath(endAngle, startAngle)}
                fill="none"
                stroke={color}
                strokeWidth={30}
                strokeLinecap="butt"
              />
            );
          })
        }

        {/* Bullseye centre line */}
        {showBullseye && targetPosition !== undefined && (() => {
          const tAngle = posToAngle(targetPosition);
          const inner = polarToXY(tAngle, R - 15);
          const outer = polarToXY(tAngle, R + 15);
          return (
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="#fbbf24" strokeWidth={3} strokeLinecap="round" />
          );
        })()}

        {/* Other player guesses on reveal */}
        {guesses.map((g, i) => {
          const ga = posToAngle(g.position);
          const dot = polarToXY(ga, R);
          return (
            <g key={i}>
              <circle cx={dot.x} cy={dot.y} r={g.isMine ? 9 : 7}
                fill={g.isMine ? '#ec4899' : '#a78bfa'}
                stroke={g.isMine ? '#fce7f3' : '#ede9fe'}
                strokeWidth={2} />
              <text x={dot.x} y={dot.y - 14} textAnchor="middle"
                fill="white" fontSize={9} fontWeight="bold">
                {g.name.slice(0, 8)}{g.score ? ` +${g.score}` : ''}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        {!isOwner && (
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${CX},${CY} ${needleBase2.x},${needleBase2.y}`}
            fill={locked ? '#f9a8d4' : (interactive ? '#c4b5fd' : '#9ca3af')}
            stroke={locked ? '#ec4899' : '#7c3aed'}
            strokeWidth={1.5}
            style={{ filter: interactive ? 'drop-shadow(0 0 6px #7c3aed)' : 'none', transition: 'fill 0.2s' }}
          />
        )}

        {/* Centre pivot */}
        <circle cx={CX} cy={CY} r={8} fill="#1a1a2e" stroke="#7c3aed" strokeWidth={2} />
        <circle cx={CX} cy={CY} r={3} fill="#c4b5fd" />

        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => {
          const a = posToAngle(p);
          const inner = polarToXY(a, R - 20);
          const outer = polarToXY(a, R + 20);
          return (
            <line key={p} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="#ffffff22" strokeWidth={p === 0.5 ? 2 : 1} />
          );
        })}
      </svg>

      {/* Labels */}
      <div className="flex justify-between px-2 -mt-1">
        <span className="text-xs text-purple-300 font-medium max-w-[42%] text-left leading-tight">{leftLabel}</span>
        <span className="text-xs text-pink-300 font-medium max-w-[42%] text-right leading-tight">{rightLabel}</span>
      </div>
    </div>
  );
}
