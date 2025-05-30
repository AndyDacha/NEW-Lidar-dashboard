'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SensorData {
  timestamp: string;
  sensor_namespace: string;
  non_zero_points_reference: number;
  non_zero_points: number;
  mean_intensity_reference: number;
  mean_intensity: number;
  status: 'online' | 'offline';
  last_seen: string;
}

export default function SensorDiagnosticsPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('Never');
  const [mqttStatus, setMqttStatus] = useState<'online' | 'offline'>('offline');
  const [error, setError] = useState<string>('');

  // Load initial state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('sensorData');
      const savedLastUpdate = localStorage.getItem('sensorLastUpdate');
      if (savedData) {
        setSensorData(JSON.parse(savedData));
      }
      if (savedLastUpdate) {
        setLastUpdate(savedLastUpdate);
      }
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sensorData', JSON.stringify(sensorData));
      localStorage.setItem('sensorLastUpdate', lastUpdate);
    }
  }, [sensorData, lastUpdate]);

  // Check for offline sensors every minute
  useEffect(() => {
    const checkOfflineSensors = () => {
      setSensorData(prevData => {
        const now = new Date();
        const updatedData = prevData.map(sensor => {
          const lastSeen = new Date(sensor.last_seen);
          const minutesSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
          
          return {
            ...sensor,
            status: minutesSinceLastSeen > 5 ? 'offline' as const : 'online' as const
          };
        });
        return updatedData;
      });
    };

    const interval = setInterval(checkOfflineSensors, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let client: any;
    let reconnectTimeout: NodeJS.Timeout;
    const MAX_RECONNECT_ATTEMPTS = 5;
    let reconnectAttempts = 0;
    const RECONNECT_DELAY = 5000;

    const connectMQTT = async () => {
      try {
        const mqtt = (await import('mqtt')).default;
        const clientId = `sensor-diagnostics-${Date.now()}`;
        
        client = mqtt.connect("wss://navyalkali-710f05f8.a01.euc1.aws.hivemq.cloud:8884/mqtt", {
          username: "AndyF",
          password: "Flasheye123",
          clientId: clientId,
          protocol: "wss",
          clean: true,
          reconnectPeriod: 0
        });

        client.on("connect", () => {
          console.log('[MQTT] Connected successfully to broker');
          setMqttStatus("online");
          reconnectAttempts = 0;
          
          // Subscribe to diagnostics, wildcard, and heartbeat topics
          const topics = [
            "Flasheye/flasheye-edge-35/sensor_diagnostics",
            "Flasheye/flasheye-edge-35/sensor-diagnostics",
            "Flasheye/flasheye-edge-35/#",
            "Flasheye/flasheye-edge-35/heartbeat/#" // Heartbeat topic
          ];
          
          console.log('[MQTT] Attempting to subscribe to topics:', topics);
          
          topics.forEach(topic => {
            client.subscribe(topic, (err: any) => {
              if (err) {
                console.error(`[MQTT] Failed to subscribe to ${topic}:`, err);
                setError(`Failed to subscribe to ${topic}`);
              } else {
                console.log(`[MQTT] Successfully subscribed to ${topic}`);
              }
            });
          });
        });

        client.on("message", (topic: string, message: Buffer) => {
          console.log('[MQTT] Received message on topic:', topic);
          console.log('[MQTT] Raw message:', message.toString());
          try {
            const data = JSON.parse(message.toString());
            console.log('[MQTT] Parsed sensor data:', data);

            // Heartbeat message handler
            if (topic.startsWith("Flasheye/flasheye-edge-35/heartbeat/")) {
              const sensor_namespace = data.sensor_namespace || topic.split("/").pop();
              setSensorData(prevData => {
                const existingSensorIndex = prevData.findIndex(s => s.sensor_namespace === sensor_namespace);
                const newSensorData = {
                  ...prevData[existingSensorIndex],
                  sensor_namespace,
                  timestamp: data.timestamp || new Date().toISOString(),
                  last_seen: new Date().toISOString(),
                  status: 'online' as const,
                  // fallback values for other fields if not present
                  non_zero_points_reference: prevData[existingSensorIndex]?.non_zero_points_reference || 0,
                  non_zero_points: prevData[existingSensorIndex]?.non_zero_points || 0,
                  mean_intensity_reference: prevData[existingSensorIndex]?.mean_intensity_reference || 0,
                  mean_intensity: prevData[existingSensorIndex]?.mean_intensity || 0
                };
                if (existingSensorIndex >= 0) {
                  const updatedData = [...prevData];
                  updatedData[existingSensorIndex] = newSensorData;
                  console.log('[MQTT] Heartbeat: Updated existing sensor:', sensor_namespace);
                  return updatedData;
                } else {
                  console.log('[MQTT] Heartbeat: Added new sensor:', sensor_namespace);
                  return [...prevData, newSensorData];
                }
              });
              setLastUpdate(new Date().toLocaleString());
              return;
            }

            // Only process messages from the sensor diagnostics topic
            if (topic === "Flasheye/flasheye-edge-35/sensor_diagnostics" || 
                topic === "Flasheye/flasheye-edge-35/sensor-diagnostics") {
              setSensorData(prevData => {
                // Update existing sensor data or add new sensor
                const existingSensorIndex = prevData.findIndex(s => s.sensor_namespace === data.sensor_namespace);
                const newSensorData = {
                  ...data,
                  timestamp: new Date().toISOString(),
                  last_seen: new Date().toISOString(),
                  status: 'online' as const
                };

                if (existingSensorIndex >= 0) {
                  const updatedData = [...prevData];
                  updatedData[existingSensorIndex] = newSensorData;
                  console.log('[MQTT] Updated existing sensor:', data.sensor_namespace);
                  return updatedData;
                } else {
                  console.log('[MQTT] Added new sensor:', data.sensor_namespace);
                  return [...prevData, newSensorData];
                }
              });
              setLastUpdate(new Date().toLocaleString());
            }
          } catch (err) {
            console.error('[MQTT] Failed to parse message:', err);
            console.error('[MQTT] Raw message:', message.toString());
            setError('Failed to parse sensor data');
          }
        });

        client.on("error", (err: any) => {
          console.error('[MQTT] Connection error:', err);
          setMqttStatus("offline");
          handleReconnect();
        });

        client.on("close", () => {
          console.log('[MQTT] Connection closed');
          setMqttStatus("offline");
          handleReconnect();
        });

        client.on("reconnect", () => {
          console.log('[MQTT] Attempting to reconnect...');
        });

        client.on("offline", () => {
          console.log('[MQTT] Client went offline');
          setMqttStatus("offline");
        });
      } catch (err) {
        console.error('[MQTT] Failed to connect:', err);
        setError('Failed to connect to MQTT broker');
        setMqttStatus("offline");
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
        setError('Max reconnection attempts reached. Please refresh the page.');
      }
    };

    connectMQTT();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (client) {
        client.end();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-brand-orange mb-4">Sensor Diagnostics</h1>
          
          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">MQTT Status</h3>
              <p className={`text-lg font-semibold ${mqttStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                {mqttStatus.toUpperCase()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Last Update</h3>
              <p className="text-lg font-semibold">{lastUpdate}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Online Sensors</h3>
              <p className="text-lg font-semibold">
                {sensorData.filter(s => s.status === 'online').length} / {sensorData.length}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Total Sensors</h3>
              <p className="text-lg font-semibold">{sensorData.length}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Individual Sensor Status */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Individual Sensor Status</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sensor ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Seen
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Non-Zero Points
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mean Intensity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference Points
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference Intensity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sensorData.map((sensor, index) => (
                    <tr key={sensor.sensor_namespace || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sensor.sensor_namespace}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          sensor.status === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sensor.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sensor.last_seen).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sensor.non_zero_points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sensor.mean_intensity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sensor.non_zero_points_reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sensor.mean_intensity_reference.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 