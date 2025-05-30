"use client";
import { useEffect, useRef, useState } from "react";

// Real zone names and new positions to fit the SVG (no Fire Exit, add Treadmill 2)
const zones = [
  { name: "Reception", x: 100, y: 80 },
  { name: "Gym Area", x: 300, y: 200 },
  { name: "Cardio Area", x: 550, y: 100 },
  { name: "Free Weights", x: 800, y: 200 },
  { name: "Studio 1", x: 300, y: 500 },
  { name: "Squat Rack", x: 550, y: 500 },
  { name: "Cafe Bar", x: 800, y: 500 },
  { name: "Treadmill 2", x: 1000, y: 80 },
  { name: "Male Changing", x: 100, y: 500 },
  { name: "Female Changing", x: 100, y: 350 },
  { name: "Comms Room", x: 1000, y: 350 },
];

const memberColors = ["#F7931E", "#4F46E5", "#059669", "#DC2626"];

function getZoneCoords(zoneName: string) {
  const zone = zones.find(z => z.name === zoneName);
  return zone ? { x: zone.x, y: zone.y } : { x: 0, y: 0 };
}

// SVG for a person icon
function PersonIcon({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      {/* Head */}
      <circle cx={x} cy={y - 8} r={6} fill={color} stroke="#fff" strokeWidth={2} />
      {/* Body */}
      <rect x={x - 4} y={y} width={8} height={14} rx={4} fill={color} stroke="#fff" strokeWidth={2} />
      {/* Arms */}
      <rect x={x - 10} y={y + 4} width={20} height={4} rx={2} fill={color} stroke="#fff" strokeWidth={1} />
      {/* Legs */}
      <rect x={x - 6} y={y + 14} width={4} height={10} rx={2} fill={color} stroke="#fff" strokeWidth={1} />
      <rect x={x + 2} y={y + 14} width={4} height={10} rx={2} fill={color} stroke="#fff" strokeWidth={1} />
    </g>
  );
}

// Add a simple dumbbell SVG icon for 'ball'
function DumbbellIcon({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <rect x={x - 12} y={y - 4} width={24} height={8} rx={4} fill={color} stroke="#fff" strokeWidth={2} />
      <rect x={x - 18} y={y - 8} width={6} height={16} rx={2} fill={color} stroke="#fff" strokeWidth={2} />
      <rect x={x + 12} y={y - 8} width={6} height={16} rx={2} fill={color} stroke="#fff" strokeWidth={2} />
    </g>
  );
}

// Simulated mock data for 3 members, replace 'Fire Exit' with 'Treadmill 2'
const simulatedMemberPaths: Record<string, { zone: string; time: string; objectClass: string }[]> = {
  MEM_650000: [
    { zone: "Reception", time: "08:01:00", objectClass: "person" },
    { zone: "Gym Area", time: "08:02:00", objectClass: "person" },
    { zone: "Free Weights", time: "08:03:00", objectClass: "person" },
    { zone: "Cafe Bar", time: "08:04:00", objectClass: "person" },
    { zone: "Male Changing", time: "08:05:00", objectClass: "person" },
    { zone: "Treadmill 2", time: "08:06:00", objectClass: "person" },
    { zone: "Comms Room", time: "08:07:00", objectClass: "ball" },
  ],
  MEM_650001: [
    { zone: "Studio 1", time: "08:00:30", objectClass: "person" },
    { zone: "Squat Rack", time: "08:01:30", objectClass: "person" },
    { zone: "Comms Room", time: "08:02:30", objectClass: "person" },
    { zone: "Female Changing", time: "08:03:30", objectClass: "human" },
    { zone: "Cardio Area", time: "08:04:30", objectClass: "person" },
    { zone: "Reception", time: "08:05:30", objectClass: "person" },
    { zone: "Gym Area", time: "08:06:30", objectClass: "ball" },
  ],
  MEM_650002: [
    { zone: "Free Weights", time: "08:00:45", objectClass: "person" },
    { zone: "Cardio Area", time: "08:01:45", objectClass: "person" },
    { zone: "Squat Rack", time: "08:02:45", objectClass: "person" },
    { zone: "Comms Room", time: "08:03:45", objectClass: "ball" },
    { zone: "Treadmill 2", time: "08:04:45", objectClass: "person" },
    { zone: "Male Changing", time: "08:05:45", objectClass: "human" },
    { zone: "Reception", time: "08:06:45", objectClass: "person" },
  ],
};

// Helper to get a heatmap color based on a value (0-1) with green, orange, red
function getHeatColor(value: number) {
  if (value <= 0.33) return '#4ade80'; // green
  if (value <= 0.66) return '#fbbf24'; // orange
  return '#ef4444'; // red
}

// Assign dwell times (in seconds) for each zone type
const ZONE_DWELL_TIMES: Record<string, number> = {
  'Treadmill 2': 12,
  'Squat Rack': 10,
  'Free Weights': 10,
  'Gym Area': 6,
  'Cafe Bar': 4,
  'Reception': 3,
  'Studio 1': 5,
  'Cardio Area': 6,
  'Comms Room': 3,
  'Male Changing': 3,
  'Female Changing': 3,
};

// Add static members (not associated with zones)
const staticMembers = [
  { id: 'MEM_650100', x: 500, y: 300, color: '#F7931E' }, // orange, center
  { id: 'MEM_650101', x: 700, y: 400, color: '#4F46E5' }, // blue, lower right
  { id: 'MEM_650102', x: 200, y: 150, color: '#059669' }, // green, upper left
  { id: 'MEM_650103', x: 400, y: 350, color: '#DC2626' }, // red, mid left
  { id: 'MEM_650104', x: 600, y: 250, color: '#F59E42' }, // orange, mid
  { id: 'MEM_650105', x: 850, y: 300, color: '#6366F1' }, // blue, right
  { id: 'MEM_650106', x: 950, y: 150, color: '#10B981' }, // green, upper right
  { id: 'MEM_650107', x: 300, y: 420, color: '#EF4444' }, // red, lower left
  { id: 'MEM_650108', x: 750, y: 500, color: '#FBBF24' }, // yellow, lower right
  { id: 'MEM_650109', x: 1000, y: 400, color: '#3B82F6' }, // blue, far right
  { id: 'MEM_650110', x: 600, y: 100, color: '#A21CAF' }, // purple, top mid
  { id: 'MEM_650111', x: 400, y: 200, color: '#E11D48' }, // pink, mid left
  { id: 'MEM_650112', x: 900, y: 450, color: '#22D3EE' }, // cyan, lower right
];

export default function MemberTrackingVisual() {
  // Remove step logic, use continuous progress
  const [progress, setProgress] = useState(0); // 0 to 1, represents progress through the full path
  const memberPathsRaw = simulatedMemberPaths;
  const memberIds = Object.keys(memberPathsRaw);
  const maxSteps = Math.max(...memberIds.map(id => memberPathsRaw[id].length));
  const memberPaths: typeof memberPathsRaw = {};
  memberIds.forEach(id => {
    const path = memberPathsRaw[id];
    if (path.length < maxSteps) {
      memberPaths[id] = [...path, ...Array(maxSteps - path.length).fill(path[path.length - 1])];
    } else {
      memberPaths[id] = path;
    }
  });
  // Build a per-member, per-segment dwell time array
  const memberDwellTimes: Record<string, number[]> = {};
  let totalDwell = 0;
  memberIds.forEach(id => {
    const path = memberPaths[id];
    if (!path) return;
    const times: number[] = [];
    for (let i = 0; i < path.length - 1; ++i) {
      const dwell = ZONE_DWELL_TIMES[path[i].zone] || 4;
      times.push(dwell);
      totalDwell += dwell;
    }
    memberDwellTimes[id] = times;
  });
  // Use the max total dwell for all members for a consistent loop
  const totalDuration = Math.max(...Object.values(memberDwellTimes).map(arr => arr.reduce((a, b) => a + b, 0)), 1);
  const duration = totalDuration * 1000; // ms for a full loop

  // Animate progress from 0 to 1, looping
  useEffect(() => {
    let animationFrame: number;
    let start: number;
    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = (ts - start) % duration;
      setProgress(elapsed / duration);
      animationFrame = requestAnimationFrame(animate);
    }
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [duration]);

  function interpolate(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  // Helper to get interpolated position for a member with dwell times
  function getInterpolatedPositionWithDwell(path: { zone: string }[], dwellTimes: number[], progress: number) {
    const n = path.length;
    const segs = dwellTimes.length;
    // Build cumulative time array
    const cumTimes = [0];
    for (let i = 0; i < segs; ++i) {
      cumTimes.push(cumTimes[i] + dwellTimes[i]);
    }
    const total = cumTimes[cumTimes.length - 1];
    const t = progress * total;
    // Find which segment we're in
    let seg = 0;
    while (seg < segs && t > cumTimes[seg + 1]) seg++;
    const segStart = cumTimes[seg];
    const segEnd = cumTimes[seg + 1];
    const localT = (t - segStart) / (segEnd - segStart);
    const from = getZoneCoords(path[seg].zone);
    const to = getZoneCoords(path[(seg + 1) % n].zone);
    return {
      x: interpolate(from.x, to.x, localT),
      y: interpolate(from.y, to.y, localT),
      seg,
      t: localT,
    };
  }

  // Track zone visit counts for heatmap
  const zoneVisitCounts: Record<string, number> = {};
  memberIds.forEach(id => {
    const path = memberPaths[id];
    if (!path) return;
    path.forEach(entry => {
      zoneVisitCounts[entry.zone] = (zoneVisitCounts[entry.zone] || 0) + 1;
    });
  });
  const maxVisits = Math.max(1, ...Object.values(zoneVisitCounts));

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-brand-orange text-center">Member Tracking Visual</h1>
      <p className="mb-4 text-center text-gray-700">Visualization of member movement through gym zones. Each icon represents a member moving between zones based on tracking data.</p>
      <svg width={1100} height={600} style={{ background: "#f9fafb", borderRadius: 16, margin: "0 auto", display: "block" }}>
        {/* Draw zones with heatmap overlay and highlight if a member is present */}
        {zones.map((zone, i) => {
          // Heatmap color based on visit count
          const visitCount = zoneVisitCounts[zone.name] || 0;
          const heatValue = visitCount / maxVisits;
          // Highlight if any member is currently in this zone
          const isActive = memberIds.some(memberId => {
            const path = memberPaths[memberId];
            if (!path || path.length < 2) return false;
            const dwellTimes = memberDwellTimes[memberId];
            const { x, y } = getInterpolatedPositionWithDwell(path, dwellTimes, progress);
            const dist = Math.hypot(x - zone.x, y - zone.y);
            return dist < 36; // within 36px of the zone center
          });
          return (
            <g key={zone.name}>
              <circle
                cx={zone.x}
                cy={zone.y}
                r={32}
                fill={getHeatColor(heatValue)}
                stroke="#F7931E"
                strokeWidth={2}
                style={isActive ? { filter: 'drop-shadow(0 0 16px #F7931E88)' } : {}}
              />
              <text x={zone.x} y={zone.y + 48} textAnchor="middle" fill="#F7931E" fontSize={16}>{zone.name}</text>
            </g>
          );
        })}
        {/* Draw member trails */}
        {memberIds.map((id, idx) => {
          const path = memberPaths[id];
          if (!path || path.length < 2) return null;
          const dwellTimes = memberDwellTimes[id];
          const n = path.length;
          const segs = dwellTimes.length;
          // Build cumulative time array
          const cumTimes = [0];
          for (let i = 0; i < segs; ++i) {
            cumTimes.push(cumTimes[i] + dwellTimes[i]);
          }
          const total = cumTimes[cumTimes.length - 1];
          const t = progress * total;
          let seg = 0;
          while (seg < segs && t > cumTimes[seg + 1]) seg++;
          const segStart = cumTimes[seg];
          const segEnd = cumTimes[seg + 1];
          const localT = (t - segStart) / (segEnd - segStart);
          const points = [];
          for (let i = 0; i < seg; ++i) {
            const from = getZoneCoords(path[i].zone);
            const to = getZoneCoords(path[i + 1].zone);
            points.push([from.x, from.y, to.x, to.y]);
          }
          // Add current segment up to localT
          if (seg < n - 1) {
            const from = getZoneCoords(path[seg].zone);
            const to = getZoneCoords(path[seg + 1].zone);
            const x = interpolate(from.x, to.x, localT);
            const y = interpolate(from.y, to.y, localT);
            points.push([from.x, from.y, x, y]);
          }
          return points.map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={memberColors[idx % memberColors.length]}
              strokeWidth={4}
              opacity={0.15 + 0.5 * (i + 1) / points.length}
              strokeLinecap="round"
            />
          ));
        })}
        {/* Draw members with animation */}
        {(() => {
          return memberIds.map((id, idx) => {
            const path = memberPaths[id];
            if (!path || path.length < 2) return null;
            const dwellTimes = memberDwellTimes[id];
            const { x, y, seg, t } = getInterpolatedPositionWithDwell(path, dwellTimes, progress);
            const prev = path[seg];
            const curr = path[(seg + 1) % path.length];
            const prevPos = getZoneCoords(prev.zone);
            const currPos = getZoneCoords(curr.zone);
            const isCar = curr.objectClass === "car";
            const isPerson = curr.objectClass === "person" || curr.objectClass === "human";
            const isBall = curr.objectClass === "ball";
            return (
              <g key={id}>
                {/* Dotted line for the current segment */}
                <line
                  x1={prevPos.x}
                  y1={prevPos.y}
                  x2={currPos.x}
                  y2={currPos.y}
                  stroke={memberColors[idx % memberColors.length]}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
                {isBall ? (
                  <DumbbellIcon x={x} y={y} color={memberColors[idx % memberColors.length]} />
                ) : isPerson ? (
                  <PersonIcon x={x} y={y} color={memberColors[idx % memberColors.length]} />
                ) : null}
              </g>
            );
          });
        })()}
        {/* Draw static members on top with strong colors and white outline */}
        {staticMembers.map((member) => (
          <g key={member.id}>
            <g>
              <circle cx={member.x} cy={member.y} r={18} fill={member.color} stroke="#fff" strokeWidth={4} />
              <PersonIcon x={member.x} y={member.y} color={member.color} />
            </g>
          </g>
        ))}
        {/* Static dumbbell icon to simulate free weights alert near Gym Area, drawn last and with white outline */}
        <g>
          <circle cx={370} cy={270} r={18} fill="#ef4444" stroke="#fff" strokeWidth={4} />
          <DumbbellIcon x={370} y={270} color="#ef4444" />
        </g>
        <rect x={370 - 28} y={270 + 20} width={56} height={18} rx={6} fill="#fff" opacity={0.92} />
        <text x={370} y={270 + 33} textAnchor="middle" fill="#ef4444" fontWeight="bold" fontSize={12} style={{dominantBaseline: 'middle'}}>ALERT</text>
      </svg>
      {/* Color Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm max-w-3xl mx-auto">
        {[...memberIds, ...staticMembers.map(m => m.id)].map((id, idx) => (
          <div key={id} className="flex items-center gap-2">
            <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 9, background: memberColors[idx % memberColors.length], border: '2px solid #fff' }}></span>
            <span>Member {id.replace('MEM_', 'M')}</span>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center text-gray-500 text-sm">
        {memberIds.length === 0 ? "No member tracking data available." : ""}
      </div>
    </div>
  );
} 