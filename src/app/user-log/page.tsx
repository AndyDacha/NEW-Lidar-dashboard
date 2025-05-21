"use client";
import { useEffect, useState } from "react";

type LogEntry = {
  timestamp: string;
  user: string;
  action: string;
  ip: string;
};

export default function UserLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    fetch('/api/log-event')
      .then(res => res.json())
      .then(setLogs);
  }, []);

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
                  <td className="px-4 py-2 text-sm text-gray-800">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{log.user}</td>
                  <td className={`px-4 py-2 text-sm font-medium ${log.action && log.action.includes("Failure") ? "text-red-600" : log.action && log.action.includes("Success") ? "text-green-600" : "text-gray-800"}`}>{log.action}</td>
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