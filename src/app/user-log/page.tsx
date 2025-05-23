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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch logs from the server
    fetch('/api/log-event')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load logs");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-brand-orange mb-6 text-center">User Log & Audit Trail</h1>
        <p className="mb-4 text-gray-700 text-center">This page displays all login attempts (success and failure), logouts, and auto logouts for monitoring and security auditing across all users and devices.</p>
        {loading ? (
          <div className="text-center text-gray-500">Loading logs...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 text-sm text-gray-800">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{log.user}</td>
                  <td className={`px-4 py-2 text-sm font-medium ${log.action && log.action.includes("Failure") ? "text-red-600" : log.action && log.action.includes("Success") ? "text-green-600" : "text-gray-800"}`}>{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
} 