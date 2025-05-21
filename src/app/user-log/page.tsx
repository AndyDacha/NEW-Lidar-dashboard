"use client";
import { useState } from "react";

// Mock data for demonstration
const mockLogs = [
  { timestamp: "2024-05-21 15:00:01", user: "Dacha2025LIDAR", action: "Login Success", ip: "192.168.1.10" },
  { timestamp: "2024-05-21 15:01:12", user: "Dacha2025LIDAR", action: "Login Failure", ip: "192.168.1.10" },
  { timestamp: "2024-05-21 15:05:33", user: "Dacha2025LIDAR", action: "Viewed Dashboard", ip: "192.168.1.10" },
  { timestamp: "2024-05-21 15:10:45", user: "Dacha2025LIDAR", action: "Changed Settings", ip: "192.168.1.10" },
  { timestamp: "2024-05-21 15:12:22", user: "Dacha2025LIDAR", action: "Login Failure", ip: "192.168.1.11" },
];

export default function UserLogPage() {
  const [logs] = useState(mockLogs);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-brand-orange mb-6 text-center">User Log & Audit Trail</h1>
        <p className="mb-4 text-gray-700 text-center">This page displays all login attempts (success and failure) and admin actions for monitoring and security auditing.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Action</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 text-sm text-gray-800">{log.timestamp}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{log.user}</td>
                  <td className={`px-4 py-2 text-sm font-medium ${log.action.includes("Failure") ? "text-red-600" : log.action.includes("Success") ? "text-green-600" : "text-gray-800"}`}>{log.action}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 