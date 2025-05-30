"use client";
import { useEffect, useState } from "react";

interface StatusLog {
  timestamp: string;
  status: "online" | "offline";
  reason?: string;
}

export default function MqttLogPage() {
  const [lastMqttUpdate, setLastMqttUpdate] = useState<string>("Never");
  const [mqttStatus, setMqttStatus] = useState<"online" | "offline">("offline");
  const [statusLog, setStatusLog] = useState<StatusLog[]>([]);

  // Function to check MQTT connection status
  const checkMqttStatus = () => {
    if (typeof window !== "undefined") {
      // Get the MQTT client from the global scope
      const mqttClient = (window as any).mqttClient;
      const isConnected = mqttClient?.connected;
      const newStatus = isConnected ? "online" : "offline";
      
      // Only update if status has changed
      if (newStatus !== mqttStatus) {
        setMqttStatus(newStatus);
        
        // Add new status to log
        const newLogEntry: StatusLog = {
          timestamp: new Date().toLocaleString(),
          status: newStatus,
          reason: isConnected ? "Connection verified" : "Connection lost"
        };
        
        setStatusLog(prevLog => {
          const updatedLog = [newLogEntry, ...prevLog].slice(0, 50); // Keep last 50 entries
          localStorage.setItem("mqttStatusLog", JSON.stringify(updatedLog));
          return updatedLog;
        });
      }
    }
  };

  useEffect(() => {
    // Read last update from localStorage
    if (typeof window !== "undefined") {
      const last = localStorage.getItem("lastUpdate");
      setLastMqttUpdate(last || "Never");

      // Load status log from localStorage
      const savedLog = localStorage.getItem("mqttStatusLog");
      if (savedLog) {
        setStatusLog(JSON.parse(savedLog));
      }
    }

    // Initial status check
    checkMqttStatus();

    // Set up polling interval (every minute)
    const pollInterval = setInterval(checkMqttStatus, 60000);

    // Listen for custom MQTT status events
    const handler = (e: any) => {
      const newStatus = e.detail === "online" ? "online" : "offline";
      setMqttStatus(newStatus);
      
      // Add new status to log
      const newLogEntry: StatusLog = {
        timestamp: new Date().toLocaleString(),
        status: newStatus,
        reason: e.detail === "online" ? "Connection established" : "Connection lost"
      };
      
      setStatusLog(prevLog => {
        const updatedLog = [newLogEntry, ...prevLog].slice(0, 50); // Keep last 50 entries
        localStorage.setItem("mqttStatusLog", JSON.stringify(updatedLog));
        return updatedLog;
      });
    };

    window.addEventListener("mqtt-status", handler);
    
    // Try to read initial status from localStorage
    if (typeof window !== "undefined") {
      const status = localStorage.getItem("mqttStatus");
      if (status === "online" || status === "offline") setMqttStatus(status);
    }

    return () => {
      window.removeEventListener("mqtt-status", handler);
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-brand-orange text-center">MQTT Log & Status</h1>
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-50 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-lg font-semibold">MQTT Server Status:</span>
            {mqttStatus === "online" ? (
              <span className="flex items-center text-green-600 font-bold">
                <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Online
              </span>
            ) : (
              <span className="flex items-center text-red-600 font-bold">
                <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Offline
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">Last Data Received:</span>
            <span className="text-brand-orange font-mono text-lg">{lastMqttUpdate}</span>
          </div>
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">MQTT Connection Description:</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              This page monitors the real-time connection status of the MQTT server. The system listens for connection events from the MQTT client (such as connect, disconnect, and reconnect) and logs all status changes. The connection history table below shows the last 50 status changes, including timestamps and reasons for each change. This helps track the stability and reliability of the MQTT connection over time.
            </p>
          </div>
        </div>

        {/* Status Log Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-4 bg-gray-50 border-b">Connection History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statusLog.map((log, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status === 'online' ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Online
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Offline
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 