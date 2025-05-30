import Link from 'next/link';

export default function DataFlow() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-orange">Data Flow</h1>
        <Link href="/dashboard" className="text-brand-orange underline hover:text-orange-700">Back to Dashboard</Link>
      </div>
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-lg font-semibold mb-2 text-brand-orange text-center">Gym Infrastructure Setup and Data Flow</h2>
        <div className="rounded shadow border w-full bg-white p-4 overflow-x-auto" style={{ height: '400px', maxHeight: '600px' }}>
          <svg
            viewBox="0 0 1200 400"
            className="w-[1200px] h-full min-w-[1200px]"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            {/* Building with Zones */}
            <rect x="50" y="100" width="200" height="200" fill="#f3f4f6" stroke="#F7931E" strokeWidth="2" />
            {/* Free Weights Area */}
            <rect x="70" y="120" width="80" height="60" fill="#F7931E" opacity="0.1" stroke="#F7931E" strokeWidth="1" />
            <text x="110" y="150" textAnchor="middle" fill="#F7931E" className="text-xs">Free Weights</text>
            {/* Cardio Area */}
            <rect x="70" y="190" width="80" height="60" fill="#F7931E" opacity="0.1" stroke="#F7931E" strokeWidth="1" />
            <text x="110" y="220" textAnchor="middle" fill="#F7931E" className="text-xs">Cardio</text>
            {/* Car Park */}
            <rect x="160" y="120" width="80" height="130" fill="#F7931E" opacity="0.1" stroke="#F7931E" strokeWidth="1" />
            <text x="200" y="185" textAnchor="middle" fill="#F7931E" className="text-xs">Car Park</text>
            {/* Sensors with Status - Multiple Locations */}
            {/* Free Weights Sensor */}
            <circle cx="110" cy="165" r="5" fill="#F7931E">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="110" cy="165" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Additional Free Weights Sensor */}
            <circle cx="130" cy="165" r="5" fill="#F7931E">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="130" cy="165" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Cardio Sensor */}
            <circle cx="110" cy="235" r="5" fill="#F7931E">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="110" cy="235" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Additional Cardio Sensor */}
            <circle cx="130" cy="235" r="5" fill="#F7931E">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="130" cy="235" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Car Park Sensor */}
            <circle cx="200" cy="200" r="5" fill="#F7931E">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="200" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Additional Car Park Sensor */}
            <circle cx="220" cy="200" r="5" fill="#F7931E">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="220" cy="200" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Server with Status */}
            <rect x="350" y="150" width="100" height="100" fill="#f3f4f6" stroke="#F7931E" strokeWidth="2" />
            <line x1="370" y1="170" x2="430" y2="170" stroke="#F7931E" strokeWidth="2" />
            <line x1="370" y1="190" x2="430" y2="190" stroke="#F7931E" strokeWidth="2" />
            <line x1="370" y1="210" x2="430" y2="210" stroke="#F7931E" strokeWidth="2" />
            <circle cx="400" cy="200" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Database Icon */}
            <path d="M420 270 L420 290 L380 290 L380 270" fill="none" stroke="#F7931E" strokeWidth="2" />
            <path d="M380 270 L420 270" stroke="#F7931E" strokeWidth="2" />
            <path d="M385 275 L415 275" stroke="#F7931E" strokeWidth="1" />
            <path d="M385 280 L415 280" stroke="#F7931E" strokeWidth="1" />
            <path d="M385 285 L415 285" stroke="#F7931E" strokeWidth="1" />
            {/* MQTT Broker with Status */}
            <rect x="550" y="150" width="100" height="100" fill="#f3f4f6" stroke="#F7931E" strokeWidth="2" />
            {/* Custom Middleware Icon */}
            <path d="M570 170 L630 170" stroke="#F7931E" strokeWidth="2" />
            <path d="M570 190 L630 190" stroke="#F7931E" strokeWidth="2" />
            <path d="M570 210 L630 210" stroke="#F7931E" strokeWidth="2" />
            <path d="M580 170 L580 210" stroke="#F7931E" strokeWidth="2" />
            <path d="M600 170 L600 210" stroke="#F7931E" strokeWidth="2" />
            <path d="M620 170 L620 210" stroke="#F7931E" strokeWidth="2" />
            <circle cx="600" cy="200" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Cloud Icon */}
            <path d="M580 120 Q600 100 620 120 Q640 100 660 120" fill="none" stroke="#F7931E" strokeWidth="2" />
            <path d="M580 120 Q600 140 620 120" fill="none" stroke="#F7931E" strokeWidth="2" />
            <path d="M620 120 Q640 140 660 120" fill="none" stroke="#F7931E" strokeWidth="2" />
            {/* Frontend with Status */}
            <rect x="700" y="150" width="80" height="100" fill="#f3f4f6" stroke="#F7931E" strokeWidth="2" />
            <line x1="720" y1="170" x2="760" y2="170" stroke="#F7931E" strokeWidth="2" />
            <line x1="720" y1="190" x2="760" y2="190" stroke="#F7931E" strokeWidth="2" />
            <line x1="720" y1="210" x2="760" y2="210" stroke="#F7931E" strokeWidth="2" />
            <circle cx="740" cy="200" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Mobile Device Icon */}
            <rect x="750" y="100" width="20" height="35" fill="#f3f4f6" stroke="#F7931E" strokeWidth="2" rx="2" />
            <circle cx="760" cy="115" r="2" fill="#F7931E" />
            {/* Connection Lines with Data Packets */}
            <path d="M250 200 L350 200" stroke="#F7931E" strokeWidth="2" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M450 200 L550 200" stroke="#F7931E" strokeWidth="2" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M650 200 L700 200" stroke="#F7931E" strokeWidth="2" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
            </path>
            {/* Data Packets */}
            <circle cx="300" cy="200" r="3" fill="#F7931E">
              <animate attributeName="cx" values="250;350" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="500" cy="200" r="3" fill="#F7931E">
              <animate attributeName="cx" values="450;550" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="675" cy="200" r="3" fill="#F7931E">
              <animate attributeName="cx" values="650;700" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Processing Icons */}
            <path d="M300 180 L310 190 L300 200 L290 190 Z" fill="#F7931E" opacity="0.5" />
            <path d="M500 180 L510 190 L500 200 L490 190 Z" fill="#F7931E" opacity="0.5" />
            <path d="M675 180 L685 190 L675 200 L665 190 Z" fill="#F7931E" opacity="0.5" />
            {/* Labels with Tooltips */}
            <g className="cursor-help">
              <text x="150" y="320" textAnchor="middle" fill="#F7931E" className="text-sm">Gym</text>
              <title>Real-time LiDAR sensors collecting occupancy and movement data from Free Weights, Cardio, and Car Park zones</title>
            </g>
            <g className="cursor-help">
              <text x="400" y="270" textAnchor="middle" fill="#F7931E" className="text-sm">Server</text>
              <title>Processing server handling sensor data and business logic</title>
            </g>
            <g className="cursor-help">
              <text x="600" y="270" textAnchor="middle" fill="#F7931E" className="text-sm">Custom Middleware</text>
              <title>Advanced middleware handling real-time data processing, filtering, and distribution with custom business logic</title>
            </g>
            <g className="cursor-help">
              <text x="740" y="270" textAnchor="middle" fill="#F7931E" className="text-sm">Frontend</text>
              <title>Dashboard interface displaying real-time data and analytics</title>
            </g>
            {/* Studio Area */}
            <rect x="160" y="250" width="80" height="50" fill="#F7931E" opacity="0.1" stroke="#F7931E" strokeWidth="1" />
            <text x="200" y="280" textAnchor="middle" fill="#F7931E" className="text-xs">Studio</text>
            {/* Studio Sensor */}
            <circle cx="200" cy="295" r="5" fill="#F7931E">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="295" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Reception Area (top center) */}
            <rect x="110" y="70" width="60" height="30" fill="#F7931E" opacity="0.1" stroke="#F7931E" strokeWidth="1" />
            <text x="140" y="90" textAnchor="middle" fill="#F7931E" className="text-xs">Reception</text>
            {/* Reception Sensor */}
            <circle cx="140" cy="105" r="5" fill="#F7931E">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="140" cy="105" r="8" fill="none" stroke="#22c55e" strokeWidth="2">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Frontend Feature Branches */}
            {/* Dashboard */}
            <rect x="900" y="140" width="110" height="30" fill="#fff7ed" stroke="#F7931E" strokeWidth="2" rx="8" />
            <text x="955" y="160" textAnchor="middle" fill="#F7931E" className="text-xs">Dashboard</text>
            {/* Arrow to Dashboard */}
            <path d="M780 170 Q830 155 900 155" stroke="#F7931E" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" >
              <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
            </path>
            {/* Reporting */}
            <rect x="900" y="190" width="110" height="30" fill="#fff7ed" stroke="#F7931E" strokeWidth="2" rx="8" />
            <text x="955" y="210" textAnchor="middle" fill="#F7931E" className="text-xs">Reporting</text>
            {/* Arrow to Reporting */}
            <path d="M780 200 Q830 205 900 205" stroke="#F7931E" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" >
              <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
            </path>
            {/* Help Guide */}
            <rect x="900" y="240" width="110" height="30" fill="#fff7ed" stroke="#F7931E" strokeWidth="2" rx="8" />
            <text x="955" y="260" textAnchor="middle" fill="#F7931E" className="text-xs">Help Guide</text>
            {/* Arrow to Help Guide */}
            <path d="M780 230 Q830 255 900 255" stroke="#F7931E" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" >
              <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
            </path>
            {/* Gym Alerts */}
            <rect x="900" y="290" width="110" height="30" fill="#fff7ed" stroke="#F7931E" strokeWidth="2" rx="8" />
            <text x="955" y="310" textAnchor="middle" fill="#F7931E" className="text-xs">Gym Alerts</text>
            {/* Arrow to Gym Alerts */}
            <path d="M780 260 Q830 305 900 305" stroke="#F7931E" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" >
              <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
            </path>
            {/* Integration lines */}
            {/* CCTV to building */}
            <line x1="53" y1="99" x2="70" y2="110" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="246" y1="99" x2="230" y2="110" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="53" y1="296" x2="70" y2="280" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="246" y1="296" x2="230" y2="280" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3,3" />
            {/* Arrowhead marker definition */}
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
                <polygon points="0 0, 8 4, 0 8" fill="#F7931E" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
} 