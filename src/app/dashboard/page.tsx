'use client';

import { useEffect, useState, useCallback } from "react";
import mqtt from "mqtt";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  BarElement,
  LineElement
} from "chart.js";
import { Bubble, Bar, Line } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  PointElement, 
  LinearScale, 
  Tooltip, 
  Legend, 
  Title, 
  CategoryScale, 
  BarElement, 
  LineElement,
  ChartDataLabels
);

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

interface MemberPathEntry {
  zone: string;
  time: string;
  objectClass?: string;
}

interface MemberPath {
  [objectId: string]: MemberPathEntry[];
}

// Add new interface for unstaffed hours tracking
interface UnstaffedHoursCount {
  count: number;
  lastUpdate: string;
}

// Weather API integration
interface WeatherData {
  temp: number;
  description: string;
  icon: string;
}

// Helper to parse HH:MM:SS or HH:MM time to seconds
function timeStringToSeconds(time: string) {
  const parts = time.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 3600 + parts[1] * 60;
  }
  return 0;
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper to check if a box should be excluded
function isExcludedZone(box: Box) {
  const name = box.name.trim();
  const lower = name.toLowerCase();
  return (
    lower === 'high level mask' ||
    name === 'ID 15' ||
    name === 'ID 16' ||
    name === 'ID 17' ||
    name === 'ID 18'
  );
}

// Helper to check if a box should be excluded from Equipment Status only
function isEquipmentStatusExcluded(box: Box) {
  const name = box.name.trim();
  const excludedNames = [
    'Gym Car Park',
    'Male Changing',
    'Female Changing',
    'Server Room',
    'Fire Exit',
    'Cardio Area',
    'Free Weights',
    'LHS In',
    'RHS Out',
  ];
  return excludedNames.includes(name);
}

export default function Dashboard() {
  // Initialize all state variables with localStorage values
  const [attendance, setAttendance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('attendance');
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const [objectCounts, setObjectCounts] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('objectCounts');
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  const [zoneActivity, setZoneActivity] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zoneActivity');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [lastUpdate, setLastUpdate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastUpdate') || 'Never';
    }
    return 'Never';
  });

  const [sensorStatus, setSensorStatus] = useState<SensorStatus>({});
  const [objectPresence, setObjectPresence] = useState<ObjectPresence>({});
  const [boxData, setBoxData] = useState<Box[]>([]);
  const [objectTypeCounts, setObjectTypeCounts] = useState<ObjectTypeCount>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('objectTypeCounts');
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });
  const [alarmEvents, setAlarmEvents] = useState<AlarmEvent[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [memberPaths, setMemberPaths] = useState<MemberPath>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('memberPaths');
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });
  const [uploadedVideos, setUploadedVideos] = useState<(File | null)[]>([null, null, null, null]);
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [videoErrors, setVideoErrors] = useState<(string | null)[]>([null, null, null, null]);
  const [cctvCredentials, setCctvCredentials] = useState({ username: '', password: '' });
  const [showCctvLogin, setShowCctvLogin] = useState(false);
  const [unstaffedHoursCount, setUnstaffedHoursCount] = useState<UnstaffedHoursCount>({ count: 0, lastUpdate: '' });
  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [simulateFreeWeights, setSimulateFreeWeights] = useState(false);
  const [simulateDefib, setSimulateDefib] = useState(false);

  // --- Emergency Email Notification Logic ---
  const [lastAlertTimes, setLastAlertTimes] = useState<{ [key: string]: number }>({});

  // --- Free Weights Left Out Alert Logic ---
  const freeWeightsLeftOutCount = zoneActivity.filter(activity => activity.objectClass && activity.objectClass.toLowerCase() === 'ball').length;

  const totalDevices = Object.keys(sensorStatus).length;
  const totalZones = boxData.length;
  const totalObjects = Object.values(objectCounts).reduce((sum: number, count: number) => sum + count, 0);

  // Members count: only count unique objectIds where objectClass is 'human' or 'person'
  const memberIds = new Set(zoneActivity.filter(a => a.objectClass && ['human', 'person'].includes(a.objectClass.toLowerCase())).map(a => a.objectId));
  const totalMembers = memberIds.size;
  // Vehicles count: only count unique objectIds where objectClass is 'car' or 'truck'
  const vehicleIds = new Set(zoneActivity.filter(a => a.objectClass && ['car', 'truck'].includes(a.objectClass.toLowerCase())).map(a => a.objectId));
  const totalVehicles = vehicleIds.size;

  // Update localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendance', attendance.toString());
      localStorage.setItem('objectCounts', JSON.stringify(objectCounts));
      localStorage.setItem('zoneActivity', JSON.stringify(zoneActivity));
      localStorage.setItem('lastUpdate', lastUpdate);
      localStorage.setItem('memberPaths', JSON.stringify(memberPaths));
      localStorage.setItem('objectTypeCounts', JSON.stringify(objectTypeCounts));
    }
  }, [attendance, objectCounts, zoneActivity, lastUpdate, memberPaths, objectTypeCounts]);

  // Update the handleObjectDetection function to work with persisted data
  const handleObjectDetection = useCallback((data: any) => {
    if (!data || !data.objects) return;

    setLastUpdate(new Date().toTimeString().slice(0,8));

    // Update object counts
    setObjectCounts(prevCounts => {
      const newCounts = { ...prevCounts };
      data.objects.forEach((obj: any) => {
        const zoneName = obj.zoneName || 'Unknown Zone';
        newCounts[zoneName] = (newCounts[zoneName] || 0) + 1;
      });
      return newCounts;
    });

    // Update zone activity
    setZoneActivity(prevActivity => {
      const newActivity = [...prevActivity];
      data.objects.forEach((obj: any) => {
        newActivity.unshift({
          zoneName: obj.zoneName || 'Unknown Zone',
          objectClass: obj.objectClass || 'Unknown',
          timestamp: new Date().toTimeString().slice(0,8)
        });
      });
      return newActivity.slice(0, 1000); // Keep last 1000 activities
    });

    // Update attendance if objects are detected in the entrance zone
    const entranceObjects = data.objects.filter((obj: any) => 
      obj.zoneName === 'Entrance' || obj.zoneName === 'Main Entrance'
    );
    if (entranceObjects.length > 0) {
      setAttendance(prev => prev + entranceObjects.length);
    }
  }, []);

  async function sendEmergencyEmail(subject: string, message: string) {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'andy@dacha-uk.com',
          subject,
          text: message,
        }),
      });
    } catch (err) {
      console.error('Failed to send emergency email:', err);
    }
  }

  useEffect(() => {
    const now = Date.now();
    const alertWindow = 5 * 60 * 1000; // 5 minutes
    const alerts: { key: string; subject: string; message: string }[] = [];

    // Gym Area
    const gymOcc = (objectPresence['Gym Area'] || totalObjects) / 700;
    if (gymOcc >= 0.9) {
      alerts.push({
        key: 'Gym Area',
        subject: 'EMERGENCY: Gym Area at Critical Capacity',
        message: `The Gym Area is at or above 90% capacity (${objectPresence['Gym Area'] || totalObjects}/700). Immediate action required.`
      });
    }
    // Cardio Area
    const cardioOcc = (objectCounts['Cardio Area'] || 0) / 50;
    if (cardioOcc >= 0.9) {
      alerts.push({
        key: 'Cardio Area',
        subject: 'EMERGENCY: Cardio Area at Critical Capacity',
        message: `The Cardio Area is at or above 90% capacity (${objectCounts['Cardio Area'] || 0}/50). Immediate action required.`
      });
    }
    // Free Weights Area
    const freeWeightsOcc = (objectCounts['Free Weights'] || 0) / 30;
    if (freeWeightsOcc >= 0.9) {
      alerts.push({
        key: 'Free Weights',
        subject: 'EMERGENCY: Free Weights Area at Critical Capacity',
        message: `The Free Weights Area is at or above 90% capacity (${objectCounts['Free Weights'] || 0}/30). Immediate action required.`
      });
    }
    // Fire Exit
    if (objectPresence['Fire Exit']) {
      alerts.push({
        key: 'Fire Exit',
        subject: 'EMERGENCY: Fire Exit Blocked',
        message: 'An object has been detected in the Fire Exit zone. Immediate action required.'
      });
    }

    alerts.forEach(alert => {
      if (!lastAlertTimes[alert.key] || now - lastAlertTimes[alert.key] > alertWindow) {
        sendEmergencyEmail(alert.subject, alert.message);
        setLastAlertTimes(prev => ({ ...prev, [alert.key]: now }));
      }
    });
    // eslint-disable-next-line
  }, [objectPresence, objectCounts, totalObjects]);

  // Add function to check if current time is in unstaffed hours
  const isUnstaffedHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 22 || hour < 6;
  };

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
        setLastUpdate(new Date().toTimeString().slice(0,8));

        // Update unstaffed hours count if activity is detected during unstaffed hours
        if (isUnstaffedHours() && (topic.includes("event") || topic.includes("tracking")) && parsed.object_class) {
          setUnstaffedHoursCount(prev => ({
            count: prev.count + 1,
            lastUpdate: new Date().toTimeString().slice(0,8)
          }));
        }

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
            time: new Date().toTimeString().slice(0,8)
          };

          setZoneActivity((prev) => {
            const filtered = prev.filter(
              (a) => !(a.zoneName === activity.zoneName && a.objectId === activity.objectId)
            );
            return [activity, ...filtered.slice(0, 999)]; // Keep last 1000 activities
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
            time: new Date().toTimeString().slice(0,8),
            severity: parsed.severity || "medium",
            details: parsed.details || "No additional details"
          };

          setAlarmEvents(prev => [{
            zoneName: parsed.zone_name || "Unknown Zone",
            objectClass: parsed.object_class || "Unknown Object",
            objectId: parsed.object_id || "Unknown ID",
            event: parsed.event || "Unknown Event",
            time: new Date().toTimeString().slice(0,8),
            severity: parsed.severity || "medium",
            details: parsed.details || "No additional details"
          }, ...prev.slice(0, 9)]);
        }

        if (topic.includes("tracking")) {
          const tracking: TrackingEvent = {
            objectId: parsed.object_id || "Unknown ID",
            objectClass: parsed.object_class || "Unknown Object",
            zoneName: parsed.zone_name,
            position: parsed.position || (parsed.x !== undefined && parsed.y !== undefined && parsed.z !== undefined ? { x: parsed.x, y: parsed.y, z: parsed.z } : undefined),
            time: new Date().toTimeString().slice(0,8),
            ...parsed
          };
          setTrackingEvents(prev => [{
            objectId: parsed.object_id || "Unknown ID",
            objectClass: parsed.object_class || "Unknown Object",
            zoneName: parsed.zone_name,
            position: parsed.position || (parsed.x !== undefined && parsed.y !== undefined && parsed.z !== undefined ? { x: parsed.x, y: parsed.y, z: parsed.z } : undefined),
            time: new Date().toTimeString().slice(0,8),
            ...parsed
          }, ...prev.slice(0, 9)]);
        }

        // Member Tracking: speed_event (primary), event/tracking (fallback)
        if ((topic.includes("speed_event") || topic.includes("event") || topic.includes("tracking")) && parsed.object_id && parsed.zone_name) {
          setMemberPaths(prev => {
            const prevPath = prev[parsed.object_id] || [];
            if (prevPath.length === 0 || prevPath[prevPath.length - 1].zone !== parsed.zone_name) {
              return {
                ...prev,
                [parsed.object_id]: [...prevPath, { zone: parsed.zone_name, time: new Date().toTimeString().slice(0,8), objectClass: parsed.object_class }].slice(-10)
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

  // Colour gradient based on object count
  const getColor = (count: number) => {
    if (count >= 50) return "rgba(255, 0, 0, 0.7)"; // red
    if (count >= 25) return "rgba(255, 165, 0, 0.7)"; // orange
    if (count >= 10) return "rgba(255, 255, 0, 0.7)"; // yellow
    if (count >= 5) return "rgba(144, 238, 144, 0.7)"; // light green
    return "rgba(13, 13, 13, 0.4)"; // dark grey
  };

  // Exclude 'High level mask' and 'ID 15' from heatmap
  const filteredBoxData = boxData.filter(box => !isExcludedZone(box));

  const heatmapData = {
    datasets: [
      {
        label: "Zone Activity",
        data: filteredBoxData.map((box) => ({
          x: box.position.x,
          y: box.position.y,
          r: Math.min((objectCounts[box.name] || 1) * 2, 20),
          label: box.name,
          count: objectCounts[box.name] || 0,
          showLabel: (objectCounts[box.name] || 0) >= 10
        })),
        backgroundColor: filteredBoxData.map((box) => getColor(objectCounts[box.name] || 0)),
        borderColor: filteredBoxData.map((box) => getColor(objectCounts[box.name] || 0)),
        borderWidth: 1,
      },
    ],
  };

  const heatmapOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (ctx: any) {
            const d = ctx.raw;
            return [
              `Zone: ${d.label}`,
              `Objects: ${d.count}`,
              `Position: (${d.x.toFixed(1)}, ${d.y.toFixed(1)})`
            ];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F7931E',
        bodyColor: '#fff',
        borderColor: '#F7931E',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4
      },
      datalabels: {
        display: function(context: any) {
          // Always show label if zone is at max (red), otherwise only on hover
          const value = context.dataset.data[context.dataIndex];
          if (value && value.count >= 50) return true;
          return context.active ? true : false;
        },
        listeners: {
          enter: function(context: any) {
            context.active = true;
            return true;
          },
          leave: function(context: any) {
            context.active = false;
            return true;
          }
        },
        color: 'black',
        font: {
          weight: 'bold' as const
        },
        formatter: function(value: any) {
          return `${value.label} (${value.count})`;
        }
      }
    },
    scales: {
      x: {
        title: { 
          display: true, 
          text: "X Position (meters)",
          color: '#F7931E',
          font: {
            weight: 'bold' as const
          }
        },
        ticks: {
          stepSize: 5,
          color: '#666'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: true
        }
      },
      y: {
        title: { 
          display: true, 
          text: "Y Position (meters)",
          color: '#F7931E',
          font: {
            weight: 'bold' as const
          }
        },
        ticks: {
          color: '#666'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: true
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true,
      animationDuration: 200
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

  // Calculate average time spent per zone for the line graph
  const zoneDurations: { [zone: string]: number[] } = {};
  Object.values(memberPaths).forEach(path => {
    path.forEach((entry, i) => {
      if (i < path.length - 1) {
        const next = path[i + 1];
        const t1 = timeStringToSeconds(entry.time);
        const t2 = timeStringToSeconds(next.time);
        if (isFinite(t2 - t1) && t2 > t1) {
          if (!zoneDurations[entry.zone]) zoneDurations[entry.zone] = [];
          zoneDurations[entry.zone].push(t2 - t1);
        }
      }
    });
  });
  const zoneAvgDurations = Object.entries(zoneDurations).map(([zone, times]) => ({
    zone,
    avg: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }));
  const avgTimeLineData = {
    labels: zoneAvgDurations.map(z => z.zone),
    datasets: [
      {
        label: 'Avg Time Spent (s)',
        data: zoneAvgDurations.map(z => z.avg),
        fill: false,
        borderColor: '#F7931E',
        backgroundColor: '#F7931E',
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#F7931E',
        pointBorderColor: '#fff',
        pointHoverRadius: 7
      }
    ]
  };
  const avgTimeLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Average Time Spent per Zone',
        color: '#F7931E',
        font: { size: 16 }
      },
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(ctx: any) {
            return `Avg: ${Math.round(ctx.parsed.y)}s`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#F7931E',
        anchor: 'center' as const,
        align: 'top' as const,
        formatter: function(value: any) {
          return Math.round(value) + 's';
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Zone', color: '#F7931E' },
        ticks: { color: '#666' }
      },
      y: {
        title: { display: true, text: 'Seconds', color: '#F7931E' },
        ticks: { color: '#666' },
        beginAtZero: true
      }
    }
  };

  // Handler for file upload
  const handleVideoUpload = (index: number, file: File | null) => {
    console.log(`Handling video upload for index ${index}:`, file);
    
    if (file) {
      // Check file type
      const validTypes = ['video/quicktime', 'video/mp4', 'video/webm', 'video/ogg'];
      if (!validTypes.includes(file.type)) {
        console.error(`Invalid file type: ${file.type}`);
        setVideoErrors(prev => {
          const updated = [...prev];
          updated[index] = `Invalid file type: ${file.type}. Supported types: ${validTypes.join(', ')}`;
          return updated;
        });
        return;
      }

      // Check file size (limit to 150MB)
      const maxSize = 150 * 1024 * 1024; // 150MB in bytes
      if (file.size > maxSize) {
        console.error(`File too large: ${file.size} bytes`);
        setVideoErrors(prev => {
          const updated = [...prev];
          updated[index] = `File too large (${formatFileSize(file.size)}). Maximum size is 150MB. Please choose a smaller file.`;
          return updated;
        });
        return;
      }
    }

    setVideoErrors(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });

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

  useEffect(() => {
    // Open-Meteo API for Ringwood, UK (lat: 50.846, lon: -1.788)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=50.846&longitude=-1.788&current_weather=true')
      .then(res => res.json())
      .then(data => {
        if (data.current_weather) {
          setWeather({
            temp: data.current_weather.temperature,
            description: data.current_weather.weathercode ? weatherCodeToDesc(data.current_weather.weathercode) : '',
            icon: weatherCodeToIcon(data.current_weather.weathercode)
          });
        }
      });
  }, []);

  // Helper to map weather code to description
  function weatherCodeToDesc(code: number) {
    const map: { [key: number]: string } = {
      0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Dense Drizzle',
      56: 'Freezing Drizzle', 57: 'Freezing Drizzle', 61: 'Slight Rain', 63: 'Rain', 65: 'Heavy Rain',
      66: 'Freezing Rain', 67: 'Freezing Rain', 71: 'Slight Snow', 73: 'Snow', 75: 'Heavy Snow',
      77: 'Snow Grains', 80: 'Slight Showers', 81: 'Showers', 82: 'Violent Showers',
      85: 'Slight Snow Showers', 86: 'Heavy Snow Showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
    };
    return map[code] || 'Unknown';
  }
  // Helper to map weather code to icon
  function weatherCodeToIcon(code: number) {
    if ([0, 1].includes(code)) return '☀️';
    if ([2, 3].includes(code)) return '⛅';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '❔';
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-center mb-4">
        <img src="/Dacha Orange 300420 no backround.jpeg" alt="Dacha Logo" className="h-20 w-auto" />
      </div>
      <h1 className="text-3xl font-bold mb-6 text-brand-orange text-center animate-fadein">Smart Gym Monitoring Solutions</h1>
      <p className="text-lg text-center text-brand-grey mb-2">Gym: Ringwood, United Kingdom, BH24 3PB</p>
      {/* Weather Widget - now above last update and logout bar */}
      {weather && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 bg-brand-orange/10 px-3 py-1 rounded shadow text-brand-orange">
            <span
              className="text-2xl cursor-pointer"
              title="Click to simulate DEFIBRILLATOR IN USE alert for 1 minute"
              onClick={() => {
                setSimulateDefib(true);
                setTimeout(() => setSimulateDefib(false), 60000);
              }}
            >
              {weather.icon}
            </span>
            <span className="font-bold">{weather.temp}°C</span>
            <span className="text-sm">{weather.description}</span>
          </div>
        </div>
      )}
      {/* Last update and Logout bar */}
      <div className="w-full flex items-center justify-end gap-6 mb-4">
        <p
          className="text-xs text-brand-grey cursor-pointer"
          title="Click to simulate Free Weights Left Out alert for 1 minute"
          onClick={() => {
            setSimulateFreeWeights(true);
            setTimeout(() => setSimulateFreeWeights(false), 60000);
          }}
        >
          Last update: {lastUpdate || "Waiting..."}
        </p>
        <button
          onClick={() => {
            document.cookie = 'auth=; Max-Age=0; path=/';
            window.location.href = '/login';
          }}
          className="bg-brand-grey hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>

      {/* Live Occupancy, Cardio Area, and Free Weights Area Gauges Side by Side */}
      <div className="w-full max-w-6xl mx-auto mb-8 flex flex-col md:flex-row gap-8">
        {/* Live Gym Occupancy */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-brand-orange text-center mb-2">Live Gym Occupancy</h2>
          <div className="w-full bg-gray-200 rounded-full h-8 flex items-center relative shadow">
            <div
              className={`h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-4 ${
                (objectPresence['Gym Area'] || totalObjects) / 700 >= 0.8 
                  ? 'bg-red-500' 
                  : 'bg-brand-orange'
              }`}
              style={{ width: `${Math.min((objectPresence['Gym Area'] || totalObjects) / 700 * 100, 100)}%` }}
            >
              {((objectPresence['Gym Area'] || totalObjects) / 700) < 0.5 && (
                <span className="absolute left-4 font-bold text-sm text-gray-400 z-10" style={{textShadow: 'none'}}>
                  {objectPresence['Gym Area'] || totalObjects} / 700
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Live Cardio Area */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-brand-orange text-center mb-2">Live Cardio Area</h2>
          <div className="w-full bg-gray-200 rounded-full h-8 flex items-center relative shadow">
            <div
              className={`h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-4 ${
                (objectCounts['Cardio Area'] || 0) / 50 >= 0.8 
                  ? 'bg-red-500' 
                  : 'bg-brand-orange'
              }`}
              style={{ width: `${Math.min((objectCounts['Cardio Area'] || 0) / 50 * 100, 100)}%` }}
            >
              {((objectCounts['Cardio Area'] || 0) / 50) < 0.5 && (
                <span className="absolute left-4 font-bold text-sm text-gray-400 z-10" style={{textShadow: 'none'}}>
                  {objectCounts['Cardio Area'] || 0} / 50
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Live Free Weights Area */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-brand-orange text-center mb-2">Live Free Weights Area</h2>
          <div className="w-full bg-gray-200 rounded-full h-8 flex items-center relative shadow">
            <div
              className={`h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-4 ${
                (objectCounts['Free Weights'] || 0) / 150 >= 0.8 
                  ? 'bg-red-500' 
                  : 'bg-brand-orange'
              }`}
              style={{ width: `${Math.min((objectCounts['Free Weights'] || 0) / 150 * 100, 100)}%` }}
            >
              {((objectCounts['Free Weights'] || 0) / 150) < 0.5 && (
                <span className="absolute left-4 font-bold text-sm text-gray-400 z-10" style={{textShadow: 'none'}}>
                  {objectCounts['Free Weights'] || 0} / 150
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zone Capacity Alerts and Emergency Alerts Section */}
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-lg font-semibold text-brand-orange text-center mb-4">Zone Capacity Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gym Area Alert */}
          {(() => {
            const occupancy = (objectPresence['Gym Area'] || totalObjects) / 700;
            return (
              <div className={`p-4 rounded-lg shadow-lg border-2 ${
                occupancy >= 0.9 
                  ? 'bg-red-100 border-red-500' 
                  : occupancy >= 0.8 
                    ? 'bg-yellow-100 border-yellow-500'
                    : 'bg-green-100 border-green-500'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Gym Area</h3>
                  <span className={`text-sm font-bold ${
                    occupancy >= 0.9 
                      ? 'text-red-600' 
                      : occupancy >= 0.8 
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}>
                    {Math.round(occupancy * 100)}% Full
                  </span>
                </div>
                <p className="text-sm mt-2">
                  {occupancy >= 0.9 
                    ? '⚠️ Critical: Gym is nearly at capacity!' 
                    : occupancy >= 0.8 
                      ? '⚠️ Warning: Gym is getting busy'
                      : '✅ Capacity is good'}
                </p>
              </div>
            );
          })()}

          {/* Cardio Area Alert */}
          {(() => {
            const occupancy = (objectCounts['Cardio Area'] || 0) / 50;
            return (
              <div className={`p-4 rounded-lg shadow-lg border-2 ${
                occupancy >= 0.9 
                  ? 'bg-red-100 border-red-500' 
                  : occupancy >= 0.8 
                    ? 'bg-yellow-100 border-yellow-500'
                    : 'bg-green-100 border-green-500'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Cardio Area</h3>
                  <span className={`text-sm font-bold ${
                    occupancy >= 0.9 
                      ? 'text-red-600' 
                      : occupancy >= 0.8 
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}>
                    {Math.round(occupancy * 100)}% Full
                  </span>
                </div>
                <p className="text-sm mt-2">
                  {occupancy >= 0.9 
                    ? '⚠️ Critical: Cardio area is nearly at capacity!' 
                    : occupancy >= 0.8 
                      ? '⚠️ Warning: Cardio area is getting busy'
                      : '✅ Capacity is good'}
                </p>
              </div>
            );
          })()}

          {/* Free Weights Area Alert */}
          {(() => {
            const occupancy = (objectCounts['Free Weights'] || 0) / 150;
            return (
              <div className={`p-4 rounded-lg shadow-lg border-2 ${
                occupancy >= 0.9 
                  ? 'bg-red-100 border-red-500' 
                  : occupancy >= 0.8 
                    ? 'bg-yellow-100 border-yellow-500'
                    : 'bg-green-100 border-green-500'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Free Weights Area</h3>
                  <span className={`text-sm font-bold ${
                    occupancy >= 0.9 
                      ? 'text-red-600' 
                      : occupancy >= 0.8 
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}>
                    {Math.round(occupancy * 100)}% Full
                  </span>
                </div>
                <p className="text-sm mt-2">
                  {occupancy >= 0.9 
                    ? '⚠️ Critical: Free weights area is nearly at capacity!' 
                    : occupancy >= 0.8 
                      ? '⚠️ Warning: Free weights area is getting busy'
                      : '✅ Capacity is good'}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Dedicated Free Weights Left Out Alert Section */}
      {(freeWeightsLeftOutCount > 0 || simulateFreeWeights) && (
        <div className="w-full max-w-3xl mx-auto mb-8">
          <div className="flashing-alert bg-red-100 border-l-8 border-red-600 text-red-800 p-6 rounded-xl shadow-xl flex items-center justify-center">
            <svg className="w-8 h-8 mr-4 text-red-600 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
            <div>
              <span className="font-bold text-lg">FREE WEIGHTS LEFT OUT!</span>
              <div className="mt-1 text-base">{freeWeightsLeftOutCount > 0 ? freeWeightsLeftOutCount : 1} free weight(s) detected in the gym. Please check the free weights area immediately.</div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated DEFIBRILLATOR IN USE Alert Section */}
      {((objectCounts['Treadmill 5'] || 0) > 0 || simulateDefib) && (
        <div className="w-full max-w-3xl mx-auto mb-8">
          <div className="flashing-alert bg-red-100 border-l-8 border-red-600 text-red-800 p-6 rounded-xl shadow-xl flex items-center justify-center">
            <svg className="w-8 h-8 mr-4 text-red-600 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
            <div>
              <span className="font-bold text-lg">DEFIBRILLATOR IN USE</span>
              <div className="mt-1 text-base">Defibrillator alert: Defibrillator is active! Please check immediately.</div>
            </div>
          </div>
        </div>
      )}

      {/* Fire Exit & Gym Car Park & Male Changing & Female Changing & Comms Room Alert Boxes */}
      <div className="mb-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Fire Exit Alert */}
        <div className={`bg-white shadow-lg rounded-2xl p-4 text-center transform transition-all duration-300 border-4 ${
          objectPresence['Fire Exit'] 
            ? 'bg-red-500 text-white border-red-600' 
            : 'bg-green-500 text-white border-green-600'
        } border-brand-orange min-h-[120px] flex flex-col justify-center`}>
          <h2 className="text-xl font-bold">Fire Exit Alert</h2>
          <p className="text-lg mt-2">
            {objectPresence['Fire Exit'] ? '⚠️ Object Detected in Fire Exit Zone' : 'No Members Detected'}
          </p>
        </div>
        {/* Gym Car Park Alert */}
        {(() => {
          const carParkCount = objectCounts['Gym Car Park'] || 0;
          let recentObject = null;
          for (const activity of zoneActivity) {
            if (activity.zoneName === 'Gym Car Park') {
              recentObject = activity.objectClass;
              break;
            }
          }
          const capitalizedObject = recentObject ? (recentObject.charAt(0).toUpperCase() + recentObject.slice(1)) : null;
          return (
            <div className={`bg-white shadow-lg rounded-2xl p-4 text-center transform transition-all duration-300 border-4
              ${carParkCount >= 200
                ? 'bg-red-500 text-white border-red-600 flashing-alert'
                : carParkCount >= 1
                  ? 'bg-yellow-400 text-black border-yellow-600'
                  : 'bg-green-500 text-white border-green-600'}
              border-brand-orange min-h-[120px] flex flex-col justify-center`}>
              <h2 className="text-xl font-bold">Gym Car Park Alert</h2>
              <p className="text-lg mt-2">
                {carParkCount >= 200
                  ? 'CAR PARK FULL'
                  : carParkCount >= 1
                    ? (capitalizedObject ? `${capitalizedObject} Detected in Gym Car Park` : 'Object Detected in Gym Car Park')
                    : 'No Members Detected'}
              </p>
            </div>
          );
        })()}
        {/* Male Changing Alert */}
        <div className={`bg-white shadow-lg rounded-2xl p-4 text-center transform transition-all duration-300 border-4 ${
          objectPresence['Male Changing'] 
            ? 'bg-red-500 text-white border-red-600' 
            : 'bg-green-500 text-white border-green-600'
        } border-brand-orange min-h-[120px] flex flex-col justify-center`}>
          <h2 className="text-xl font-bold">Male Changing</h2>
          <p className="text-lg mt-2">
            {objectPresence['Male Changing'] ? '⚠️ Object Detected in Male Changing Zone' : 'No Members Detected'}
          </p>
        </div>
        {/* Female Changing Alert */}
        <div className={`bg-white shadow-lg rounded-2xl p-4 text-center transform transition-all duration-300 border-4 ${
          objectPresence['Female Changing'] 
            ? 'bg-red-500 text-white border-red-600' 
            : 'bg-green-500 text-white border-green-600'
        } border-brand-orange min-h-[120px] flex flex-col justify-center`}>
          <h2 className="text-xl font-bold">Female Changing</h2>
          <p className="text-lg mt-2">
            {objectPresence['Female Changing'] ? '⚠️ Object Detected in Female Changing Zone' : 'No Members Detected'}
          </p>
        </div>
        {/* Comms Room Alert */}
        <div className={`bg-white shadow-lg rounded-2xl p-4 text-center transform transition-all duration-300 border-4 ${
          objectPresence['Comms Room'] 
            ? 'bg-red-500 text-white border-red-600' 
            : 'bg-green-500 text-white border-green-600'
        } border-brand-orange min-h-[120px] flex flex-col justify-center`}>
          <h2 className="text-xl font-bold">Comms Room</h2>
          <p className="text-lg mt-2">
            {objectPresence['Comms Room'] ? '⚠️ Object Detected in Comms Room Zone' : 'No Staff Detected'}
          </p>
        </div>
      </div>

      {/* Gym Area Count and Unstaffed Hours Row - Full Width */}
      <div className="mb-6 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gym Area Count Box */}
        <div className="bg-white shadow-lg rounded-2xl p-4 text-center transform transition-all duration-300 border-4 border-brand-orange">
          <h2 className="text-xl font-bold">Gym Area Count</h2>
          <p className="text-lg mt-2">
            Cardio Area: {objectCounts['Cardio Area'] || 0} <br />
            Free Weights: {objectCounts['Free Weights'] || 0} <br />
            Gym Car Park: {objectCounts['Gym Car Park'] || 0}
          </p>
        </div>
        {/* Unstaffed Hours Box (same style as Gym Area Count) */}
        <div className="bg-white shadow-lg rounded-2xl p-4 text-center transform transition-all duration-300 border-4 border-brand-orange">
          <h2 className="text-xl font-bold">Unstaffed Hours</h2>
          <p className="text-lg mt-2">
            {unstaffedHoursCount.count > 0 
              ? `⚠️ ${unstaffedHoursCount.count} Members Detected` 
              : 'No Members Detected'}
          </p>
          <p className="text-sm mt-1 opacity-80">
            {unstaffedHoursCount.lastUpdate ? `Last update: ${unstaffedHoursCount.lastUpdate}` : ''}
          </p>
        </div>
        {/* Total Gym Attendance Box */}
        <div className="bg-white shadow-lg rounded-2xl p-4 text-center transform transition-all duration-300 border-4 border-brand-orange">
          <h2 className="text-xl font-bold">Total Gym Attendance</h2>
          <p className="text-4xl font-extrabold text-brand-orange mt-2">
            {new Set(zoneActivity.filter(a => a.objectClass && ['human', 'person'].includes(a.objectClass.toLowerCase())).map(a => a.objectId)).size}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-brand-orange shadow-lg rounded-2xl p-3 w-48 mx-auto text-center text-white transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-xs uppercase tracking-wider font-semibold opacity-90">Total Sensors</h2>
          <p className="text-3xl font-extrabold mt-1">{totalDevices}</p>
          <p className="text-xs opacity-80 mt-1">active sensors</p>
        </div>
        <div className="bg-brand-orange shadow-lg rounded-2xl p-3 w-48 mx-auto text-center text-white transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-xs uppercase tracking-wider font-semibold opacity-90">Active Gym Zones</h2>
          <p className="text-3xl font-extrabold mt-1">{totalZones}</p>
          <p className="text-xs opacity-80 mt-1">zones</p>
        </div>
        <div className="bg-brand-orange shadow-lg rounded-2xl p-3 w-48 mx-auto text-center text-white transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-xs uppercase tracking-wider font-semibold opacity-90">Members</h2>
          <p className="text-3xl font-extrabold mt-1">{totalMembers}</p>
          <p className="text-xs opacity-80 mt-1">humans/persons</p>
        </div>
        <div className="bg-brand-orange shadow-lg rounded-2xl p-3 w-48 mx-auto text-center text-white transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-xs uppercase tracking-wider font-semibold opacity-90">Vehicles</h2>
          <p className="text-3xl font-extrabold mt-1">{totalVehicles}</p>
          <p className="text-xs opacity-80 mt-1">cars/trucks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div
          className="bg-white p-4 rounded-lg shadow border border-brand-grey/30 col-span-1 lg:col-span-2"
          style={{ height: '900px' }}
        >
          <h2 className="text-lg font-semibold mb-2 text-brand-orange">Zone Heatmap</h2>
          {boxData.length > 0 ? (
            <Bubble data={heatmapData} options={heatmapOptions} />
          ) : (
            <p className="text-sm text-brand-grey">Waiting for box data...</p>
          )}
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow overflow-y-auto border border-brand-grey/30" style={{ height: '450px' }}>
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

          <div className="bg-white p-4 rounded-lg shadow overflow-y-auto border border-brand-grey/30" style={{ height: '450px' }}>
            <h2 className="text-lg font-semibold mb-2 text-brand-orange">Equipment Status</h2>
            {boxData.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 text-sm">
                {boxData
                  .filter(box => !isExcludedZone(box) && !isEquipmentStatusExcluded(box))
                  .map((box, idx) => {
                    const count = objectTypeCounts[box.name]
                      ? Object.values(objectTypeCounts[box.name]).reduce((sum, c) => sum + c, 0)
                      : 0;
                    return (
                      <div key={idx} className="py-1 border-b col-span-1 flex items-center gap-2">
                        <strong className="text-brand-orange">{box.name}</strong>
                        {count > 0 ? (
                          <span className="text-lg" style={{ color: '#16a34a' }} title="In Use">✅</span>
                        ) : (
                          <span className="text-red-600 text-lg" title="Not In Use">❌</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-brand-grey">No equipment data available.</p>
            )}
          </div>
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

      {/* Average Time Spent per Zone Line Graph */}
      <div className="bg-white p-4 rounded-lg shadow border border-brand-grey/30 mb-6" style={{ height: '400px' }}>
        <Line data={avgTimeLineData} options={avgTimeLineOptions} />
      </div>

      {/* Peak Hours Visualization for Equipment Status Zones */}
      <div className="bg-white p-4 rounded-lg shadow border border-brand-grey/30 mb-8" style={{ height: '400px' }}>
        <h2 className="text-lg font-semibold mb-2 text-brand-orange">Peak Hours by Zone</h2>
        {(() => {
          // Get only zones included in Equipment Status
          const includedZones = boxData.filter(box => !isExcludedZone(box) && !isEquipmentStatusExcluded(box)).map(box => box.name);
          // Prepare hourly counts for each included zone
          const hourlyCounts: { [zone: string]: number[] } = {};
          includedZones.forEach(zone => {
            hourlyCounts[zone] = Array(24).fill(0);
          });
          // Use zoneActivity to count events per hour per zone
          zoneActivity.forEach(activity => {
            if (includedZones.includes(activity.zoneName)) {
              const hour = Number(activity.time.split(':')[0]);
              if (!isNaN(hour)) {
                hourlyCounts[activity.zoneName][hour]++;
              }
            }
          });
          // Prepare data for Chart.js
          const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
          const datasets = includedZones.map((zone, i) => ({
            label: zone,
            data: hourlyCounts[zone],
            backgroundColor: `hsl(${(i * 60) % 360}, 70%, 60%)`,
            borderColor: `hsl(${(i * 60) % 360}, 70%, 40%)`,
            borderWidth: 1
          }));
          const data = { labels, datasets };
          const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: false
              },
              legend: {
                position: 'top' as const,
                labels: { color: '#F7931E' }
              },
              tooltip: {
                callbacks: {
                  label: function(ctx: any) {
                    return `${ctx.dataset.label}: ${ctx.parsed.y}`;
                  }
                }
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'Hour', color: '#F7931E' },
                ticks: { color: '#666' }
              },
              y: {
                title: { display: true, text: 'Events', color: '#F7931E' },
                beginAtZero: true,
                ticks: { color: '#666' }
              }
            }
          };
          return includedZones.length > 0 ? (
            <Bar data={data} options={options} />
          ) : (
            <p className="text-sm text-brand-grey">No data available for included zones.</p>
          );
        })()}
      </div>

      {/* Video Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow border border-brand-grey/30 flex flex-col items-center justify-center min-h-[320px] min-w-[320px] max-w-full transition-transform hover:scale-105">
            {idx === 1 ? (
              // CCTV Stream Box
              <div className="w-full flex flex-col items-center">
                <span className="text-brand-orange font-semibold block text-center mb-2">CCTV Live Stream</span>
                <iframe
                  src="http://localhost:4000/cctv-stream"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="mt-2 w-full h-64 rounded border border-brand-grey/20"
                  title="CCTV Live Stream"
                />
              </div>
            ) : (
              // Regular Video Upload Box
              <>
                <label className="block w-full text-center cursor-pointer mb-2">
                  <span className="text-brand-orange font-semibold">{idx === 0 ? 'CCTV Capture' : idx === 1 ? 'CCTV Live Feed' : idx === 2 ? 'Event Logs' : `Upload MP4 Video ${idx + 1}`}</span>
                  <input
                    type="file"
                    accept="video/quicktime,video/mp4,video/webm,video/ogg"
                    className="hidden"
                    onChange={e => handleVideoUpload(idx, e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  />
                </label>
                {videoErrors[idx] && (
                  <div className="text-red-500 text-sm mt-2">{videoErrors[idx]}</div>
                )}
                {videoUrls[idx] && (
                  <video
                    src={videoUrls[idx]!}
                    controls
                    loop
                    autoPlay
                    className="mt-2 w-full"
                    onError={(e) => {
                      console.error('Video error:', e);
                      setVideoErrors(prev => {
                        const updated = [...prev];
                        updated[idx] = 'Error loading video. Please try another file.';
                        return updated;
                      });
                    }}
                  />
                )}
                {/* Show default video for CCTV Capture if no file uploaded */}
                {idx === 0 && !videoUrls[0] && !videoErrors[0] && (
                  <video
                    src="/Sample%20Video.mov"
                    controls
                    loop
                    autoPlay
                    muted
                    className="mt-2 w-full"
                  />
                )}
              </>
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
              .filter(box => !isExcludedZone(box))
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
                  <th className="text-left px-2 py-1 text-brand-orange">Member ID</th>
                  <th className="text-left px-2 py-1 text-brand-orange">Zone Path</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(memberPaths).slice(-10).reverse().map(([objectId, zones], idx) => (
                  <tr key={objectId} className="border-b border-brand-grey/20">
                    <td className="px-2 py-1 font-mono text-brand-grey">{objectId}</td>
                    <td className="px-2 py-1">
                      {zones.map((entry, i) => {
                        let duration = '';
                        if (i < zones.length - 1) {
                          const t1 = timeStringToSeconds(entry.time);
                          const t2 = timeStringToSeconds(zones[i + 1].time);
                          duration = isFinite(t2 - t1) ? `- ${t2 - t1}s` : '';
                        } else {
                          duration = '- current';
                        }
                        return (
                          <span key={i} className="inline-block bg-brand-orange/10 text-brand-orange rounded px-2 py-0.5 mr-1 mb-1 border border-brand-orange/20">
                            {entry.zone} <span className="text-xs text-brand-grey">({entry.time} {duration}{entry.objectClass ? `, ${entry.objectClass}` : ''})</span>
                          </span>
                        );
                      })}
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

      <style jsx global>{`
        @keyframes fadein {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein {
          animation: fadein 1.2s cubic-bezier(0.4,0,0.2,1);
        }
        .flashing-alert {
          animation: flash-red 1s infinite alternate;
        }
        @keyframes flash-red {
          0% { background-color: #fee2e2; border-color: #dc2626; }
          100% { background-color: #f87171; border-color: #b91c1c; }
        }
      `}</style>
    </div>
  );
} 