'use client';

import { useEffect, useState } from "react";
import mqtt from "mqtt";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  BarElement
} from "chart.js";
import { Bubble, Bar } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(PointElement, LinearScale, Tooltip, Legend, Title, CategoryScale, BarElement, ChartDataLabels);

interface ZoneActivity {
  zoneName: string;
  objectClass: string;
  objectId: string;
  event: string;
  time: string;
}

interface Box {
  name: string;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface SensorStatus {
  [key: string]: boolean;
}

interface ObjectPresence {
  [key: string]: number;
}

interface ObjectCounts {
  [key: string]: number;
}

interface ObjectTypeCount {
  [zoneName: string]: {
    [objectType: string]: number;
  };
}

interface AlarmEvent {
  zoneName: string;
  objectClass: string;
  objectId: string;
  event: string;
  time: string;
  severity?: string;
  details?: string;
}

interface TrackingEvent {
  objectId: string;
  objectClass: string;
  zoneName?: string;
  position?: { x: number; y: number; z: number };
  time: string;
  [key: string]: any;
}

interface MemberPath {
  [objectId: string]: string[];
}

export default function Dashboard() {
  const [lastUpdate, setLastUpdate] = useState("");
  const [zoneActivity, setZoneActivity] = useState<ZoneActivity[]>([]);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>({});
  const [objectPresence, setObjectPresence] = useState<ObjectPresence>({});
  const [boxData, setBoxData] = useState<Box[]>([]);
  const [objectCounts, setObjectCounts] = useState<ObjectCounts>({});
  const [objectTypeCounts, setObjectTypeCounts] = useState<ObjectTypeCount>({});
  const [alarmEvents, setAlarmEvents] = useState<AlarmEvent[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [memberPaths, setMemberPaths] = useState<MemberPath>({});
  const [uploadedVideos, setUploadedVideos] = useState<(File | null)[]>([null, null, null, null]);
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null, null, null]);

  useEffect(() => {
    const client = mqtt.connect("wss://navyalkali-710f05f8.a01.euc1.aws.hivemq.cloud:8884/mqtt", {
      username: "AndyF",
      password: "Flasheye123",
      clientId: "dashboard-client-modern",
      protocol: "wss"
    });

    client.on("connect", () => {
      client.subscribe("Flasheye/flasheye-edge-35/event");
      client.subscribe("Flasheye/flasheye-edge-35/sensor_diagnostics");
      client.subscribe("Flasheye/flasheye-edge-35/boxes");
      client.subscribe("Flasheye/flasheye-edge-35/alarm");
      client.subscribe("Flasheye/flasheye-edge-35/tracking");
      client.subscribe("Flasheye/flasheye-edge-35/speed_event");
    });

    client.on("message", (topic, message) => {
      try {
        const parsed = JSON.parse(message.toString());
        setLastUpdate(new Date().toLocaleTimeString());

        // Debug log for all incoming messages
        console.log('[MQTT]', topic, parsed);

        if (topic.includes("sensor_diagnostics")) {
          const sensorId = parsed.sensor_namespace;
          if (sensorId) {
            setSensorStatus((prev) => ({ ...prev, [sensorId]: true }));
          }
        }

        if ((topic.includes("event") || topic.includes("alarm")) && parsed.zone_name && parsed.object_class) {
          const activity: ZoneActivity = {
            zoneName: parsed.zone_name,
            objectClass: parsed.object_class,
            objectId: parsed.object_id,
            event: parsed.event || "unknown",
            time: new Date().toLocaleTimeString()
          };

          setZoneActivity((prev) => {
            const filtered = prev.filter(
              (a) => !(a.zoneName === activity.zoneName && a.objectId === activity.objectId)
            );
            return [activity, ...filtered.slice(0, 9)];
          });

          setObjectCounts((prev) => ({
            ...prev,
            [parsed.zone_name]: (prev[parsed.zone_name] || 0) + 1
          }));

          setObjectTypeCounts(prev => {
            const newCounts = { ...prev };
            if (!newCounts[parsed.zone_name]) {
              newCounts[parsed.zone_name] = {};
            }
            newCounts[parsed.zone_name][parsed.object_class] = 
              (newCounts[parsed.zone_name][parsed.object_class] || 0) + 1;
            return newCounts;
          });
        }

        if (parsed.zone_name && parsed.detection_value !== undefined) {
          const zone = parsed.zone_name;
          const value = parsed.detection_value;

          setObjectPresence((prev) => ({
            ...prev,
            [zone]: value === 1 ? 1 : prev[zone] || 0
          }));
        }

        if (topic.includes("boxes") && parsed.box) {
          const simplifiedBoxes: Box[] = parsed.box
            .filter((b: any) => b.id !== 33 && b.id !== 35) // Exclude Zone ID33
            .map((b: any) => ({
              name: b.name || `ID ${b.id}`,
              dimensions: {
                x: b.dimensions_x,
                y: b.dimensions_y,
                z: b.dimensions_z
              },
              position: {
                x: b.position_x,
                y: b.position_y,
                z: b.position_z
              }
            }));
          setBoxData(simplifiedBoxes);
        }

        if (topic.includes("alarm")) {
          const alarm: AlarmEvent = {
            zoneName: parsed.zone_name || "Unknown Zone",
            objectClass: parsed.object_class || "Unknown Object",
            objectId: parsed.object_id || "Unknown ID",
            event: parsed.event || "Unknown Event",
            time: new Date().toLocaleTimeString(),
            severity: parsed.severity || "medium",
            details: parsed.details || "No additional details"
          };

          setAlarmEvents(prev => [alarm, ...prev.slice(0, 9)]);
        }

        if (topic.includes("tracking")) {
          const tracking: TrackingEvent = {
            objectId: parsed.object_id || "Unknown ID",
            objectClass: parsed.object_class || "Unknown Object",
            zoneName: parsed.zone_name,
            position: parsed.position || (parsed.x !== undefined && parsed.y !== undefined && parsed.z !== undefined ? { x: parsed.x, y: parsed.y, z: parsed.z } : undefined),
            time: new Date().toLocaleTimeString(),
            ...parsed
          };
          setTrackingEvents(prev => [tracking, ...prev.slice(0, 9)]);
        }

        // Member Tracking: speed_event (primary), event/tracking (fallback)
        if ((topic.includes("speed_event") || topic.includes("event") || topic.includes("tracking")) && parsed.object_id && parsed.zone_name) {
          setMemberPaths(prev => {
            const prevPath = prev[parsed.object_id] || [];
            if (prevPath[prevPath.length - 1] !== parsed.zone_name) {
              return {
                ...prev,
                [parsed.object_id]: [...prevPath, parsed.zone_name].slice(-10)
              };
            }
            return prev;
          });
        }

      } catch (e) {
        console.error("Invalid JSON", e);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  // Clean up object URLs when files change or component unmounts
  useEffect(() => {
    return () => {
      videoUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [videoUrls]);

  const totalDevices = Object.keys(sensorStatus).length;
  const totalZones = boxData.length;
  const totalObjects = Object.values(objectCounts).reduce((sum: number, count: number) => sum + count, 0);

  // Colour gradient based on object count
  const getColor = (count: number) => {
    if (count >= 50) return "rgba(255, 0, 0, 0.6)"; // red
    if (count >= 25) return "rgba(255, 165, 0, 0.6)"; // orange   
    if (count >= 5) return "rgba(255, 255, 0, 0.6)"; // yellow
    return "rgba(13, 13, 13, 0.6)"; // green
  };

  const heatmapData = {
    datasets: [
      {
        label: "Zone Activity",
        data: boxData.map((box) => ({
          x: box.position.x,
          y: box.position.y,
          r: Math.min((objectCounts[box.name] || 1) * 2, 20),
          label: box.name,
          count: objectCounts[box.name] || 0,
          backgroundColor: getColor(objectCounts[box.name] || 0),
          showLabel: (objectCounts[box.name] || 0) >= 10
        })),
        parsing: {
          xAxisKey: "x",
          yAxisKey: "y",
          r: "r"
        },
        backgroundColor: boxData.map((box) =>
          getColor(objectCounts[box.name] || 0)
        )
      }
    ]
  };

  const heatmapOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (ctx: any) {
            const d = ctx.raw;
            return `${d.label} — Count: ${d.count}`;
          }
        }
      },
      datalabels: {
        display: function(context: any) {
          return context.dataset.data[context.dataIndex].showLabel;
        },
        color: 'black',
        font: {
          weight: 'bold' as const
        },
        formatter: function(value: any) {
          // Show 'ZoneName (Count)' if count >= 10
          return value.showLabel ? `${value.label} (${value.count})` : '';
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: "X" },
        ticks: {
          stepSize: 5
        }
      },
      y: {
        title: { display: true, text: "Y" }
      }
    }
  };

  // Prepare data for the bar chart
  const barColors = [
    'rgba(247, 147, 30, 0.85)', // brand orange
    'rgba(128, 128, 128, 0.85)', // brand grey
    'rgba(247, 147, 30, 0.45)', // lighter orange for more types
    'rgba(128, 128, 128, 0.45)', // lighter grey
  ];
  const barChartData = {
    labels: Object.keys(objectTypeCounts),
    datasets: Object.keys(Object.values(objectTypeCounts)[0] || {}).map((objectType, i) => ({
      label: objectType,
      data: Object.keys(objectTypeCounts).map(zone => 
        objectTypeCounts[zone][objectType] || 0
      ),
      backgroundColor: barColors[i % barColors.length],
    }))
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Object Types per Zone',
        color: '#F7931E',
        font: {
          size: 16
        }
      },
      legend: {
        position: 'top' as const,
      },
      datalabels: {
        display: true,
        color: 'white',
        anchor: 'center' as const,
        align: 'center' as const,
        font: {
          weight: 'bold' as const
        },
        formatter: function(value: any) {
          return value > 0 ? value : '';
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Zone Name',
          color: '#F7931E'
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Count',
          color: '#F7931E'
        }
      }
    }
  };

  // Handler for file upload
  const handleVideoUpload = (index: number, file: File | null) => {
    setUploadedVideos(prev => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });
    setVideoUrls(prev => {
      const updated = [...prev];
      if (prev[index]) URL.revokeObjectURL(prev[index]!);
      updated[index] = file ? URL.createObjectURL(file) : null;
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-center mb-6">
        <img src="/Dacha Orange 300420 no backround.jpeg" alt="Dacha Logo" className="h-20 w-auto" />
      </div>
      <h1 className="text-3xl font-bold mb-6 text-brand-orange">Smart Gym Monitoring Solutions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-brand-orange shadow-lg rounded-2xl p-6 text-center text-white transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-sm uppercase tracking-wider font-semibold opacity-90">Total Devices</h2>
          <p className="text-4xl font-extrabold mt-2">{totalDevices}</p>
          <p className="text-xs opacity-80 mt-1">active sensors</p>
        </div>
        <div className="bg-brand-orange shadow-lg rounded-2xl p-6 text-center text-white transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-sm uppercase tracking-wider font-semibold opacity-90">Active Zones</h2>
          <p className="text-4xl font-extrabold mt-2">{totalZones}</p>
          <p className="text-xs opacity-80 mt-1">zones</p>
        </div>
        <div className="bg-brand-orange shadow-lg rounded-2xl p-6 text-center text-white transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-sm uppercase tracking-wider font-semibold opacity-90">Detected Objects</h2>
          <p className="text-4xl font-extrabold mt-2">{totalObjects}</p>
          <p className="text-xs opacity-80 mt-1">objects</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div
          className="bg-white p-4 rounded-lg shadow border border-brand-grey/30 col-span-1 lg:col-span-2"
          style={{ height: '800px' }}
        >
          <h2 className="text-lg font-semibold mb-2 text-brand-orange">Zone Heatmap</h2>
          {boxData.length > 0 ? (
            <Bubble data={heatmapData} options={heatmapOptions} />
          ) : (
            <p className="text-sm text-brand-grey">Waiting for box data...</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow overflow-y-auto border border-brand-grey/30 col-span-1" style={{ height: '800px' }}>
          <h2 className="text-lg font-semibold mb-2 text-brand-orange">Recent Activity</h2>
          {zoneActivity.length > 0 ? (
            <ul className="text-sm space-y-1">
              {zoneActivity.map((a, idx) => (
                <li key={idx} className="border-b pb-1">
                  <strong>{a.zoneName}</strong>: <span className="text-brand-orange">{a.objectClass}</span> (ID: {a.objectId}) detected at {a.time}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-brand-grey">No activity yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-brand-grey/30 mb-6" style={{ height: '400px' }}>
        <h2 className="text-lg font-semibold mb-2 text-brand-orange">Object Type Distribution</h2>
        {Object.keys(objectTypeCounts).length > 0 ? (
          <Bar data={barChartData} options={barChartOptions} />
        ) : (
          <p className="text-sm text-brand-grey">Waiting for object data...</p>
        )}
      </div>

      {/* Video Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow border border-brand-grey/30 flex flex-col items-center justify-center min-h-[180px]">
            <label className="block w-full text-center cursor-pointer">
              <span className="text-brand-orange font-semibold">{idx === 0 ? 'CCTV Capture' : `Upload MP4 Video ${idx + 1}`}</span>
              <input
                type="file"
                accept="video/quicktime"
                className="hidden"
                onChange={e => handleVideoUpload(idx, e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              />
            </label>
            {videoUrls[idx] && (
              <video
                src={videoUrls[idx]!}
                controls
                loop
                autoPlay
                className="mt-2 w-full"
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-brand-grey/30 mb-6">
        <h2 className="text-lg font-semibold mb-2 text-brand-orange">📦 Zone Status & Layout</h2>
        {boxData.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
            {boxData
              .slice() // copy to avoid mutating state
              .sort((a, b) => {
                const aCount = objectTypeCounts[a.name]
                  ? Object.values(objectTypeCounts[a.name]).reduce((sum, c) => sum + c, 0)
                  : 0;
                const bCount = objectTypeCounts[b.name]
                  ? Object.values(objectTypeCounts[b.name]).reduce((sum, c) => sum + c, 0)
                  : 0;
                return bCount - aCount;
              })
              .filter(box => {
                const count = objectTypeCounts[box.name]
                  ? Object.values(objectTypeCounts[box.name]).reduce((sum, c) => sum + c, 0)
                  : 0;
                return count >= 10;
              })
              .map((box, idx) => (
                <li key={idx} className="bg-gray-50 p-3 rounded border border-brand-grey/20">
                  <strong className="text-brand-orange">{box.name}</strong><br />
                  <span className="text-brand-grey">Size: (x:{box.dimensions.x.toFixed(1)} y:{box.dimensions.y.toFixed(1)} z:{box.dimensions.z.toFixed(1)})<br />
                  Pos: (x:{box.position.x.toFixed(1)} y:{box.position.y.toFixed(1)} z:{box.position.z.toFixed(1)})<br /></span>
                  {objectTypeCounts[box.name] ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(objectTypeCounts[box.name])
                        .map(([type, count]) => (
                          <span key={type} className="inline-block bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-full px-3 py-1 text-xs font-semibold">
                            {type}: {count}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-brand-grey text-xs">No objects</div>
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-brand-grey">No zone data available.</p>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-brand-grey/30 mb-6">
        <h2 className="text-lg font-semibold mb-2 text-brand-orange">Member Tracking</h2>
        {Object.keys(memberPaths).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1 text-brand-orange">Object ID</th>
                  <th className="text-left px-2 py-1 text-brand-orange">Zone Path</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(memberPaths).slice(-10).reverse().map(([objectId, zones], idx) => (
                  <tr key={objectId} className="border-b border-brand-grey/20">
                    <td className="px-2 py-1 font-mono text-brand-grey">{objectId}</td>
                    <td className="px-2 py-1">
                      {zones.map((zone, i) => (
                        <span key={i} className="inline-block bg-brand-orange/10 text-brand-orange rounded px-2 py-0.5 mr-1 mb-1 border border-brand-orange/20">
                          {zone}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-brand-grey">No member tracking data available.</p>
        )}
      </div>

      <p className="text-right text-xs mt-6 text-brand-grey">Last update: {lastUpdate || "Waiting..."}</p>
    </div>
  );
} 