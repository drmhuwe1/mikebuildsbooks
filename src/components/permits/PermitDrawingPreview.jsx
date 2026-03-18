import React from "react";
import { Card } from "@/components/ui/card";

export default function PermitDrawingPreview({ data }) {
  const drawTopView = () => {
    const scale = 30; // pixels per foot
    const w = data.deckWidth * scale;
    const d = data.deckDepth * scale;
    const stairW = data.stairWidth * scale;

    return (
      <svg width={Math.min(w + 40, 500)} height={Math.min(d + 40, 500)} className="border border-gray-300">
        <g transform="translate(20, 20)">
          {/* Deck outline */}
          <rect x="0" y="0" width={w} height={d} fill="none" stroke="#000" strokeWidth="2" />

          {/* Stairs */}
          {data.numStairs > 0 && (
            <>
              {data.stairLocation === "front" && (
                <rect x={(w - stairW) / 2} y={d} width={stairW} height={scale * 1.5} fill="none" stroke="#666" strokeWidth="1.5" strokeDasharray="4,4" />
              )}
              {data.stairLocation === "side" && (
                <rect x={w} y={(d - stairW) / 2} width={scale * 1.5} height={stairW} fill="none" stroke="#666" strokeWidth="1.5" strokeDasharray="4,4" />
              )}
              {data.stairLocation === "back" && (
                <rect x={(w - stairW) / 2} y={-scale * 1.5} width={stairW} height={scale * 1.5} fill="none" stroke="#666" strokeWidth="1.5" strokeDasharray="4,4" />
              )}
            </>
          )}

          {/* Support posts (grid pattern) */}
          {[...Array(Math.min(data.supportPostCount, 4))].map((_, i) => {
            const xPos = (w / (Math.min(data.supportPostCount, 2))) * (i % 2 + 0.5);
            const yPos = (d / 2) + (i < 2 ? -d / 4 : d / 4);
            return (
              <circle key={i} cx={xPos} cy={yPos} r="4" fill="#c41e3a" stroke="#000" strokeWidth="0.5" />
            );
          })}

          {/* Railing indicator */}
          {data.hasRailing && (
            <>
              <line x1="0" y1="0" x2="0" y2={d} stroke="#999" strokeWidth="1" strokeDasharray="3,3" />
              <line x1={w} y1="0" x2={w} y2={d} stroke="#999" strokeWidth="1" strokeDasharray="3,3" />
            </>
          )}

          {/* Labels */}
          <text x={w / 2} y={-5} textAnchor="middle" fontSize="12" fontWeight="bold">{data.deckWidth}'</text>
          <text x={-5} y={d / 2} textAnchor="end" fontSize="12" fontWeight="bold">{data.deckDepth}'</text>

          {/* Attachment line */}
          {data.isDeckAttached && (
            <line x1="0" y1="0" x2="0" y2={d} stroke="#0066cc" strokeWidth="3" />
          )}
        </g>

        <text x={10} y={Math.min(d + 40, 500) - 5} fontSize="10" fontWeight="bold">TOP VIEW (Not to Scale)</text>
      </svg>
    );
  };

  const drawElevation = () => {
    const scale = 30;
    const h = (data.deckHeight + 2) * scale;
    const w = data.deckWidth * scale;

    return (
      <svg width={Math.min(w + 40, 500)} height={Math.min(h + 40, 500)} className="border border-gray-300">
        <g transform="translate(20, 20)">
          {/* Ground line */}
          <line x1="0" y1={h - data.deckHeight * scale} x2={w} y2={h - data.deckHeight * scale} stroke="#8b7355" strokeWidth="3" />

          {/* Deck surface */}
          <rect x="0" y={h - data.deckHeight * scale - 8} width={w} height="8" fill="#d4a574" stroke="#000" strokeWidth="1.5" />

          {/* Support posts */}
          {[...Array(Math.max(2, Math.min(data.supportPostCount, 4)))].map((_, i) => {
            const xPos = (w / (Math.max(2, Math.min(data.supportPostCount, 4)) - 1)) * i;
            return (
              <rect
                key={i}
                x={xPos - 6}
                y={h - data.deckHeight * scale}
                width="12"
                height={data.deckHeight * scale}
                fill="none"
                stroke="#c41e3a"
                strokeWidth="2"
              />
            );
          })}

          {/* Railing */}
          {data.hasRailing && (
            <>
              <line x1="0" y1={h - data.deckHeight * scale - 8} x2="0" y2={h - data.deckHeight * scale - 24} stroke="#999" strokeWidth="2" />
              <line x1={w} y1={h - data.deckHeight * scale - 8} x2={w} y2={h - data.deckHeight * scale - 24} stroke="#999" strokeWidth="2" />
            </>
          )}

          {/* Height dimension */}
          <g>
            <line x1={w + 10} y1={h - data.deckHeight * scale - 8} x2={w + 10} y2={h - data.deckHeight * scale} stroke="#000" strokeWidth="1" />
            <line x1={w + 5} y1={h - data.deckHeight * scale - 8} x2={w + 15} y2={h - data.deckHeight * scale - 8} stroke="#000" strokeWidth="1" />
            <line x1={w + 5} y1={h - data.deckHeight * scale} x2={w + 15} y2={h - data.deckHeight * scale} stroke="#000" strokeWidth="1" />
            <text x={w + 25} y={h - data.deckHeight * scale + 5} fontSize="11" fontWeight="bold">{data.deckHeight}'</text>
          </g>
        </g>

        <text x={10} y={Math.min(h + 40, 500) - 5} fontSize="10" fontWeight="bold">SIDE ELEVATION (Not to Scale)</text>
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Drawing Preview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">TOP VIEW</p>
          {drawTopView()}
        </Card>
        <Card className="p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">SIDE ELEVATION</p>
          {drawElevation()}
        </Card>
      </div>
      <Card className="p-3 bg-amber-50 border-amber-200">
        <p className="text-xs text-amber-900">
          <strong>Note:</strong> These previews are simplified representations. The exported PDF will include full dimensions, notes, and permit details.
        </p>
      </Card>
    </div>
  );
}