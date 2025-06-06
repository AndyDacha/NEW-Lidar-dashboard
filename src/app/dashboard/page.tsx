'use client';

import { useEffect, useState, useCallback } from "react";
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
import Script from "next/script";

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
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attendance, setAttendance] = useState<number>(0);
  const [objectCounts, setObjectCounts] = useState<Record<string, number>>({});
  const [zoneActivity, setZoneActivity] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>({});
  const [objectPresence, setObjectPresence] = useState<ObjectPresence>({});
  const [boxData, setBoxData] = useState<Box[]>([]);
  const [objectTypeCounts, setObjectTypeCounts] = useState<ObjectTypeCount>({});
  const [alarmEvents, setAlarmEvents] = useState<AlarmEvent[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [memberPaths, setMemberPaths] = useState<MemberPath>({});
  const [uploadedVideos, setUploadedVideos] = useState<(File | null)[]>([null, null, null, null]);
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [videoErrors, setVideoErrors] = useState<(string | null)[]>([null, null, null, null]);
  const [cctvCredentials, setCctvCredentials] = useState({ username: '', password: '' });
  const [showCctvLogin, setShowCctvLogin] = useState(false);
  const [unstaffedHoursCount, setUnstaffedHoursCount] = useState<UnstaffedHoursCount>({ count: 0, lastUpdate: '' });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [simulateFreeWeights, setSimulateFreeWeights] = useState(false);
  const [simulateDefib, setSimulateDefib] = useState(false);
  const [showFreeWeightsAlert, setShowFreeWeightsAlert] = useState<boolean>(false);
  const [showWeatherAlert, setShowWeatherAlert] = useState<boolean>(false);
  const [showLastUpdateAlert, setShowLastUpdateAlert] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  const [ballAlert, setBallAlert] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  // Add state for DB activity data for today
  const [dbActivityToday, setDbActivityToday] = useState<any[]>([]);

  // Add useEffect for defibrillator alert timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (simulateDefib) {
      timeoutId = setTimeout(() => {
        setSimulateDefib(false);
      }, 15000); // 15 seconds
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [simulateDefib]);

  const isUnstaffedHours = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    return day === 0 || (day === 6 && hour >= 12) || hour < 6 || hour >= 22;
  };

  // Move handleObjectDetection here with other hooks
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

  // Helper functions for weather codes
  const weatherCodeToDesc = (code: number) => {
    const map: { [key: number]: string } = {
      0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Dense Drizzle',
      56: 'Freezing Drizzle', 57: 'Freezing Drizzle', 61: 'Slight Rain', 63: 'Rain', 65: 'Heavy Rain',
      66: 'Freezing Rain', 67: 'Freezing Rain', 71: 'Slight Snow', 73: 'Snow', 75: 'Heavy Snow',
      77: 'Snow Grains', 80: 'Slight Showers', 81: 'Showers', 82: 'Violent Showers',
      85: 'Slight Snow Showers', 86: 'Heavy Snow Showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
    };
    return map[code] || 'Unknown';
  };

  const weatherCodeToIcon = (code: number) => {
    if ([0, 1].includes(code)) return '☀️';
    if ([2, 3].includes(code)) return '⛅';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '❔';
  };

  // Function to toggle alerts
  const toggleAlerts = () => {
    setShowFreeWeightsAlert(prev => !prev);
    setShowWeatherAlert(prev => !prev);
  };

  // Calculate total objects
  const totalObjects = Object.values(objectCounts).reduce((sum: number, count: number) => sum + count, 0);

  // Calculate other totals
  const totalDevices = Object.keys(sensorStatus).length;
  const totalZones = boxData.length;
  const memberIds = new Set(zoneActivity.filter(a => a.objectClass && ['human', 'person'].includes(a.objectClass.toLowerCase())).map(a => a.objectId));
  const totalMembers = memberIds.size;
  const vehicleIds = new Set(zoneActivity.filter(a => a.objectClass && ['car', 'truck'].includes(a.objectClass.toLowerCase())).map(a => a.objectId));
  const totalVehicles = vehicleIds.size;

  // MQTT message handler
  const handleMQTTMessage = (topic: string, parsed: any) => {
    console.log('[MQTT] handleMQTTMessage called with topic:', topic);
    console.log('[MQTT] handleMQTTMessage parsed data:', parsed);

    if (topic.includes("sensor_diagnostics")) {
      console.log('[MQTT] Processing sensor diagnostics');
      const sensorId = parsed.sensor_namespace;
      if (sensorId) {
        setSensorStatus((prev) => ({ ...prev, [sensorId]: true }));
      }
    }

    if ((topic.includes("event") || topic.includes("alarm")) && parsed.zone_name && parsed.object_class) {
      console.log('[MQTT] Processing event/alarm');
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

      // --- POST to /api/activity for DB logging ---
      const activityPayload = {
        zone: parsed.zone_name,
        activityType: parsed.event || "unknown",
        memberId: parsed.object_id,
        equipment: parsed.equipment, // if available
        objectType: parsed.object_class, // NEW: include object type
        timestamp: new Date().toISOString(),
      };
      console.log('[DEBUG] POST /api/activity payload:', activityPayload); // DEBUG LOG
      fetch(`${window.location.origin}/api/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityPayload),
      }).catch(err => {
        console.error('Failed to POST activity:', err);
      });
      // --- END POST ---

      // Trigger ball alert if object_class is 'ball'
      if (typeof parsed.object_class === 'string' && parsed.object_class.toLowerCase() === 'ball') {
        setBallAlert(true);
      }
    }

    if (parsed.zone_name && parsed.detection_value !== undefined) {
      console.log('[MQTT] Processing detection value');
      const zone = parsed.zone_name;
      const value = parsed.detection_value;

      setObjectPresence((prev) => ({
        ...prev,
        [zone]: value === 1 ? 1 : prev[zone] || 0
      }));
    }

    if (topic.includes("boxes") && parsed.box) {
      console.log('[MQTT] Processing boxes data');
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

      setAlarmEvents(prev => [alarm, ...prev.slice(0, 9)]);
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
      setTrackingEvents(prev => [tracking, ...prev.slice(0, 9)]);
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
  };

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
  }, []);

  // Load initial state from localStorage
  useEffect(() => {
    if (!isClient) return;

    const storedAttendance = localStorage.getItem('attendance');
    const storedObjectCounts = localStorage.getItem('objectCounts');
    const storedZoneActivity = localStorage.getItem('zoneActivity');
    const storedLastUpdate = localStorage.getItem('lastUpdate');
    const storedObjectTypeCounts = localStorage.getItem('objectTypeCounts');
    const storedMemberPaths = localStorage.getItem('memberPaths');

    if (storedAttendance) setAttendance(parseInt(storedAttendance, 10));
    if (storedObjectCounts) setObjectCounts(JSON.parse(storedObjectCounts));
    if (storedZoneActivity) setZoneActivity(JSON.parse(storedZoneActivity));
    if (storedLastUpdate) setLastUpdate(storedLastUpdate);
    if (storedObjectTypeCounts) setObjectTypeCounts(JSON.parse(storedObjectTypeCounts));
    if (storedMemberPaths) setMemberPaths(JSON.parse(storedMemberPaths));
    
    setIsLoading(false);
  }, [isClient]);

  // Update localStorage whenever state changes
  useEffect(() => {
    if (!isClient) return;

    localStorage.setItem('attendance', attendance.toString());
    localStorage.setItem('objectCounts', JSON.stringify(objectCounts));
    localStorage.setItem('zoneActivity', JSON.stringify(zoneActivity));
    localStorage.setItem('lastUpdate', lastUpdate);
    localStorage.setItem('memberPaths', JSON.stringify(memberPaths));
    localStorage.setItem('objectTypeCounts', JSON.stringify(objectTypeCounts));
  }, [isClient, attendance, objectCounts, zoneActivity, lastUpdate, memberPaths, objectTypeCounts]);

  // MQTT connection setup
  useEffect(() => {
    if (!isClient) return;

    let client: any;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 5000;

    // Store MQTT client in window object for persistence
    if (typeof window !== "undefined") {
      (window as any).mqttClient = client;
    }

    const setStatus = (status: "online" | "offline") => {
      if (typeof window !== "undefined") {
        console.log(`[MQTT] Status set to: ${status}`);
        window.dispatchEvent(new CustomEvent("mqtt-status", { detail: status }));
        localStorage.setItem("mqttStatus", status);
        const el = document.getElementById("mqtt-status-indicator");
        if (el) {
          el.innerHTML = status === "online"
            ? '<span style="color:green;font-size:12px;">●</span>'
            : '<span style="color:red;font-size:12px;">●</span>';
        }
      }
    };

    const connectMQTT = async () => {
      try {
        // Check if we already have a connected client
        if ((window as any).mqttClient?.connected) {
          console.log('[MQTT] Using existing connection');
          return;
        }

        console.log('[MQTT] Attempting to connect to MQTT broker...');
        const mqtt = (await import('mqtt')).default;
        
        const clientId = `dashboard-client-${Date.now()}`;
        
        console.log('[MQTT] Connecting with client ID:', clientId);
        client = mqtt.connect("wss://navyalkali-710f05f8.a01.euc1.aws.hivemq.cloud:8884/mqtt", {
          username: "AndyF",
          password: "Flasheye123",
          clientId: clientId,
          protocol: "wss",
          clean: true,
          reconnectPeriod: 0
        });

        // Store client in window object
        if (typeof window !== "undefined") {
          (window as any).mqttClient = client;
        }

        client.on("connect", () => {
          console.log('[MQTT] Connected successfully to broker');
          setStatus("online");
          reconnectAttempts = 0;
          
          const topics = [
            "Flasheye/flasheye-edge-35/event",
            "Flasheye/flasheye-edge-35/sensor_diagnostics",
            "Flasheye/flasheye-edge-35/boxes",
            "Flasheye/flasheye-edge-35/alarm",
            "Flasheye/flasheye-edge-35/tracking",
            "Flasheye/flasheye-edge-35/speed_event"
          ];
          
          console.log('[MQTT] Subscribing to topics:', topics);
          topics.forEach(topic => {
            client.subscribe(topic, (err: any) => {
              if (err) {
                console.error(`[MQTT] Failed to subscribe to ${topic}:`, err);
              } else {
                console.log(`[MQTT] Successfully subscribed to ${topic}`);
              }
            });
          });
        });

        client.on("error", (err: any) => {
          console.error('[MQTT] Connection error:', err);
          setStatus("offline");
          handleReconnect();
        });

        client.on("close", () => {
          console.log('[MQTT] Connection closed');
          setStatus("offline");
          handleReconnect();
        });

        client.on("offline", () => {
          console.log('[MQTT] Client went offline');
          setStatus("offline");
          handleReconnect();
        });

        client.on("message", (topic: string, message: any) => {
          console.log(`[MQTT] Message received on topic: ${topic}`);
          console.log('[MQTT] Raw message:', message.toString());
          try {
            const parsed = JSON.parse(message.toString());
            console.log('[MQTT] Parsed message:', parsed);

            // Update lastUpdate for non-sensor_diagnostics messages
            if (!topic.includes('sensor_diagnostics')) {
              const newTime = new Date().toTimeString().slice(0,8);
              setLastUpdate(newTime);

              if (isUnstaffedHours() && (topic.includes("event") || topic.includes("tracking")) && parsed.object_class) {
                console.log('[MQTT] Unstaffed hours detection:', parsed);
                setUnstaffedHoursCount(prev => ({
                  count: prev.count + 1,
                  lastUpdate: newTime
                }));
              }
            }

            // Handle different message types
            console.log('[MQTT] Processing message with handleMQTTMessage');
            handleMQTTMessage(topic, parsed);
          } catch (e) {
            console.error("[MQTT] Error processing message:", e);
            console.error("[MQTT] Raw message:", message.toString());
          }
        });

      } catch (error) {
        console.error('[MQTT] Failed to initialize MQTT:', error);
        handleReconnect();
      }
    };

    const handleReconnect = () => {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`[MQTT] Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        
        if (client) {
          client.end();
        }
        
        reconnectTimeout = setTimeout(() => {
          connectMQTT();
        }, RECONNECT_DELAY);
      } else {
        console.error('[MQTT] Max reconnection attempts reached. Please refresh the page.');
      }
    };

    // Initial connection
    connectMQTT();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      // Don't end the client on cleanup to maintain the connection
      setStatus("offline");
    };
  }, [isClient]);

  // Add a new effect to handle page visibility changes
  useEffect(() => {
    if (!isClient) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, check MQTT connection
        const mqttClient = (window as any).mqttClient;
        if (!mqttClient?.connected) {
          console.log('[MQTT] Page became visible, reconnecting...');
          // Trigger reconnection
          if (mqttClient) {
            mqttClient.end();
          }
          // The connection will be re-established by the MQTT effect
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient]);

  // Weather data fetch
  useEffect(() => {
    if (!isClient) return;

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
  }, [isClient]);

  // Clean up video URLs (move this above the conditional return)
  useEffect(() => {
    return () => {
      videoUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [videoUrls]);

  // useEffect for alerts (was after conditional return, move it up)
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
      sendEmergencyEmail(alert.subject, alert.message);
    });
    // eslint-disable-next-line
  }, [objectPresence, objectCounts, totalObjects]);

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        const res = await fetch('/api/activity');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setRecentActivity(Array.isArray(data) ? data.slice(0, 100) : []); // Show the 100 most recent
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
        setRecentActivity([]);
      }
    }
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Helper to get UK date string (YYYY-MM-DD)
  function getUKDateString(date: Date) {
    const uk = new Date(date.toLocaleString('en-GB', { timeZone: 'Europe/London' }));
    const year = uk.getFullYear();
    const month = String(uk.getMonth() + 1).padStart(2, '0');
    const day = String(uk.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fetch today's activity from DB on mount and at midnight
  useEffect(() => {
    async function fetchTodayActivity() {
      try {
        const today = getUKDateString(new Date());
        const params = new URLSearchParams();
        params.append('start', today);
        params.append('end', today);
        const res = await fetch(`/api/activity?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setDbActivityToday(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch today\'s activity:', error);
        setDbActivityToday([]);
      }
    }
    fetchTodayActivity();
    // Set up timer to refetch at next UK midnight
    const now = new Date();
    const ukNow = new Date(now.toLocaleString('en-GB', { timeZone: 'Europe/London' }));
    const nextMidnight = new Date(ukNow);
    nextMidnight.setHours(24, 0, 0, 0);
    const msToMidnight = nextMidnight.getTime() - ukNow.getTime();
    const timeout = setTimeout(() => {
      fetchTodayActivity();
    }, msToMidnight + 1000); // add 1s buffer
    return () => clearTimeout(timeout);
  }, []);

  // Compute member paths and average durations from dbActivityToday
  function computeZoneAvgDurations(activity: any[]) {
    // Group events by memberId, sort by timestamp
    const memberEvents: { [memberId: string]: any[] } = {};
    activity.forEach(a => {
      if (!a.memberId || !a.zone || !a.timestamp) return;
      if (!memberEvents[a.memberId]) memberEvents[a.memberId] = [];
      memberEvents[a.memberId].push(a);
    });
    Object.values(memberEvents).forEach(events => events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    // Build per-member zone paths with entry/exit times
    const zoneDurations: { [zone: string]: number[] } = {};
    Object.values(memberEvents).forEach(events => {
      for (let i = 0; i < events.length - 1; ++i) {
        const curr = events[i];
        const next = events[i + 1];
        if (curr.zone && next.zone && curr.zone === next.zone && curr.activityType === 'start' && next.activityType === 'stop') {
          const t1 = new Date(curr.timestamp).getTime();
          const t2 = new Date(next.timestamp).getTime();
          if (t2 > t1) {
            if (!zoneDurations[curr.zone]) zoneDurations[curr.zone] = [];
            zoneDurations[curr.zone].push((t2 - t1) / 1000); // seconds
          }
        }
      }
    });
    // Compute averages
    return Object.entries(zoneDurations).map(([zone, times]) => ({
      zone,
      avg: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0
    }));
  }

  // Use DB data for average time spent per zone (today)
  const zoneAvgDurations = computeZoneAvgDurations(dbActivityToday);
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
          updated[index] = `Invalid file type: ${file.type}. Supported types: ${validTypes.join(', ')};`;
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

  // Function to handle manual last update check
  const handleManualLastUpdate = () => {
    const newTime = new Date().toLocaleTimeString();
    setLastUpdate(newTime);
    localStorage.setItem("lastUpdate", newTime);
    
    // Toggle ball alert
    setBallAlert(prev => !prev);
  };

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
              title="Click to toggle DEFIBRILLATOR IN USE alert"
              onClick={() => {
                setSimulateDefib(prev => !prev);
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
        <button
          onClick={handleManualLastUpdate}
          className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-2 px-4 rounded"
        >
          Last Update: {mounted ? lastUpdate : ""}
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
              <span
                className="absolute left-4 font-bold text-sm z-10"
                style={{textShadow: 'none'}}>
                {objectPresence['Gym Area'] || totalObjects} / 700
              </span>
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
              <span
                className="absolute left-4 font-bold text-sm z-10"
                style={{textShadow: 'none'}}>
                {objectCounts['Cardio Area'] || 0} / 50
              </span>
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
              <span
                className="absolute left-4 font-bold text-sm z-10"
                style={{textShadow: 'none'}}>
                {objectCounts['Free Weights'] || 0} / 150
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* New Studio Capacity Sections */}
      <div className="w-full max-w-6xl mx-auto mb-8 flex flex-col md:flex-row gap-8">
        {/* Studio 1 */}
        <div className="flex-1 bg-gray-100 p-4 rounded-xl shadow-lg border-2 border-brand-grey/20">
          <h2 className="text-lg font-semibold text-brand-orange text-center mb-2">Studio 1</h2>
          <div className="w-full bg-gray-200 rounded-full h-8 flex items-center relative shadow">
            <div
              className={`h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-4 ${
                (objectCounts['LHS In'] || 0) / 30 >= 0.8 
                  ? 'bg-red-500' 
                  : 'bg-brand-orange'
              }`}
              style={{ width: `${Math.min((objectCounts['LHS In'] || 0) / 30 * 100, 100)}%` }}
            >
              <span
                className="absolute left-4 font-bold text-sm z-10 text-black"
                style={{textShadow: 'none'}}>
                {objectCounts['LHS In'] || 0} / 30
              </span>
            </div>
          </div>
        </div>
        {/* Spin Studio */}
        <div className="flex-1 bg-gray-100 p-4 rounded-xl shadow-lg border-2 border-brand-grey/20">
          <h2 className="text-lg font-semibold text-brand-orange text-center mb-2">Spin Studio</h2>
          <div className="w-full bg-gray-200 rounded-full h-8 flex items-center relative shadow">
            <div
              className={`h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-4 ${
                (objectCounts['Squat Rack 1'] || 0) / 20 >= 0.8 
                  ? 'bg-red-500' 
                  : 'bg-brand-orange'
              }`}
              style={{ width: `${Math.min((objectCounts['Squat Rack 1'] || 0) / 20 * 100, 100)}%` }}
            >
              <span
                className="absolute left-4 font-bold text-sm z-10 text-black"
                style={{textShadow: 'none'}}>
                {objectCounts['Squat Rack 1'] || 0} / 20
              </span>
            </div>
          </div>
        </div>
        {/* Studio 2 */}
        <div className="flex-1 bg-gray-100 p-4 rounded-xl shadow-lg border-2 border-brand-grey/20">
          <h2 className="text-lg font-semibold text-brand-orange text-center mb-2">Studio 2</h2>
          <div className="w-full bg-gray-200 rounded-full h-8 flex items-center relative shadow">
            <div
              className={`h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-4 ${
                ((objectCounts['Treadmill 1'] || 0) + (objectCounts['Treadmill 3'] || 0)) / 25 >= 0.8 
                  ? 'bg-red-500' 
                  : 'bg-brand-orange'
              }`}
              style={{ width: `${Math.min(((objectCounts['Treadmill 1'] || 0) + (objectCounts['Treadmill 3'] || 0)) / 25 * 100, 100)}%` }}
            >
              <span
                className="absolute left-4 font-bold text-sm z-10 text-black"
                style={{textShadow: 'none'}}>
                {(objectCounts['Treadmill 1'] || 0) + (objectCounts['Treadmill 3'] || 0)} / 25
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ball Alert - now in normal flow above Zone Capacity Alerts */}
      {ballAlert && (
        <div className="w-full max-w-6xl mx-auto mb-4">
          <div className="bg-red-600 text-white px-8 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-pulse border-2 border-red-800 justify-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-bold tracking-wide text-base">FREE WEIGHT LEFT ON FLOOR</span>
          </div>
        </div>
      )}

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

          {/* Studio 1 Alert */}
          {(() => {
            const occupancy = (objectCounts['LHS In'] || 0) / 30;
            return (
              <div className={`p-4 rounded-lg shadow-lg border-2 ${
                occupancy >= 0.9 
                  ? 'bg-red-100 border-red-500' 
                  : occupancy >= 0.8 
                    ? 'bg-yellow-100 border-yellow-500'
                    : 'bg-green-100 border-green-500'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Studio 1</h3>
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
                    ? '⚠️ Critical: Studio 1 is nearly at capacity!' 
                    : occupancy >= 0.8 
                      ? '⚠️ Warning: Studio 1 is getting busy'
                      : '✅ Capacity is good'}
                </p>
              </div>
            );
          })()}

          {/* Spin Studio Alert */}
          {(() => {
            const occupancy = (objectCounts['Squat Rack 1'] || 0) / 20;
            return (
              <div className={`p-4 rounded-lg shadow-lg border-2 ${
                occupancy >= 0.9 
                  ? 'bg-red-100 border-red-500' 
                  : occupancy >= 0.8 
                    ? 'bg-yellow-100 border-yellow-500'
                    : 'bg-green-100 border-green-500'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Spin Studio</h3>
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
                    ? '⚠️ Critical: Spin Studio is nearly at capacity!' 
                    : occupancy >= 0.8 
                      ? '⚠️ Warning: Spin Studio is getting busy'
                      : '✅ Capacity is good'}
                </p>
              </div>
            );
          })()}

          {/* Studio 2 Alert */}
          {(() => {
            const occupancy = ((objectCounts['Treadmill 1'] || 0) + (objectCounts['Treadmill 3'] || 0)) / 25;
            return (
              <div className={`p-4 rounded-lg shadow-lg border-2 ${
                occupancy >= 0.9 
                  ? 'bg-red-100 border-red-500' 
                  : occupancy >= 0.8 
                    ? 'bg-yellow-100 border-yellow-500'
                    : 'bg-green-100 border-green-500'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Studio 2</h3>
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
                    ? '⚠️ Critical: Studio 2 is nearly at capacity!' 
                    : occupancy >= 0.8 
                      ? '⚠️ Warning: Studio 2 is getting busy'
                      : '✅ Capacity is good'}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Dedicated Free Weights Left Out Alert Section */}
      {showFreeWeightsAlert && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Alert: </strong>
          <span className="block sm:inline">FREE WEIGHTS LEFT OUT!</span>
        </div>
      )}

      {/* Dedicated DEFIBRILLATOR IN USE Alert Section */}
      {simulateDefib && (
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
            {recentActivity.length > 0 ? (
              <ul className="text-sm space-y-1">
                {recentActivity.map((a, idx) => (
                  <li key={a.id || idx} className="border-b pb-1">
                    <strong>{a.zone}</strong>: <span className={
                      a.activityType === 'start' ? 'text-green-600' :
                      a.activityType === 'stop' ? 'text-red-600' :
                      'text-brand-orange'
                    }>{a.activityType}</span>
                    {(a.objectType || a.object_class || a.objectClass) && <span className="ml-1 text-xs text-gray-500">({a.objectType || a.object_class || a.objectClass})</span>}
                    {a.memberId && <> (ID: {a.memberId})</>}
                    {a.equipment && <> [Equipment: {a.equipment}]</>}
                    <span className="text-gray-500"> at {new Date(a.timestamp).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-grey">No activity yet.</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow overflow-y-auto border border-brand-grey/30" style={{ height: '450px' }}>
            <h2 className="text-lg font-semibold mb-2 text-brand-orange">Equipment Usage Status</h2>
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
          // Use dbActivityToday to count events per hour per zone
          dbActivityToday.forEach(activity => {
            if (includedZones.includes(activity.zone)) {
              const date = new Date(activity.timestamp);
              const ukHour = new Date(date.toLocaleString('en-GB', { timeZone: 'Europe/London' })).getHours();
              if (!isNaN(ukHour)) {
                hourlyCounts[activity.zone][ukHour]++;
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

      {/* Point Cloud Capture - Prominent Section */}
      <div className="w-full flex flex-col items-center justify-center relative mb-16 pb-8" style={{ background: '#0B0C2A', color: '#F7931E' }}>
        <h2 className="text-2xl font-bold text-brand-orange mb-4 pt-8">Smart Gym Monitoring Solutions Capture</h2>
        <video
          src="/Point Cloud Sample 29.05.25.mp4"
          controls
          loop
          autoPlay
          muted
          className="rounded-lg shadow-lg w-full max-w-3xl aspect-video"
          style={{ background: '#0B0C2A' }}
        />
        <p className="w-full text-center mt-4">
          This video demonstrates real-time 3D point cloud data captured by our Smart Gym Monitoring Solution,<br />
          visualizing the environment in high detail for advanced analytics and monitoring.
        </p>
      </div>

      {/* Video Upload Section (now 3 boxes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl w-full mx-auto">
        {[0, 1].map((idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow border border-brand-grey/30 flex flex-col items-center justify-center min-h-[320px] w-full transition-transform hover:scale-105">
            {idx === 1 ? (
              // CCTV Stream Box
              <div className="w-full flex flex-col items-center">
                <span className="text-brand-orange font-semibold block text-center mb-2">CCTV Live Stream</span>
                <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stream URL</label>
                      <input
                        type="text"
                        placeholder="rtsp://camera.example.com/stream"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        placeholder="admin"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Note: CCTV stream credentials are managed by system administrators
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Regular Video Upload Box (CCTV Capture)
              <>
                <label className="block w-full text-center cursor-pointer mb-2">
                  <span className="text-brand-orange font-semibold">CCTV Capture</span>
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
                    src="/CCTV_Capture_compressed.mp4"
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
                          duration = isFinite(t2 - t1) ? `(${t2 - t1}s)` : '';
                        }
                        return (
                          <span key={i} className="inline-block mr-2">
                            {entry.zone} <span className="text-xs text-gray-400">{entry.time}{duration}</span>
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
      {/* WhatsApp Widget by GetButton.io */}
      <Script id="whatsapp-widget" strategy="afterInteractive">
        {`
          (function () {
              var options = {
                  whatsapp: "+447931154221",
                  call_to_action: "Message us",
                  position: "left",
                  bottom: "50px",
              };
              var proto = document.location.protocol, host = "getbutton.io", url = proto + "//static." + host;
              var s = document.createElement('script'); s.type = 'text/javascript'; s.async = true; s.src = url + '/widget-send-button/js/init.js';
              s.onload = function () { if (window.WhWidgetSendButton) window.WhWidgetSendButton.init(host, proto, options); };
              var x = document.getElementsByTagName('script')[0]; if(x && x.parentNode) x.parentNode.insertBefore(s, x);
          })();
        `}
      </Script>
    </div>
  );
}