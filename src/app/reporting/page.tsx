"use client";
import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Link from 'next/link';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// For UK timezone conversion
function getUKDateString(date: Date) {
  // Convert to UK time (Europe/London)
  const uk = new Date(date.toLocaleString('en-GB', { timeZone: 'Europe/London' }));
  const year = uk.getFullYear();
  const month = String(uk.getMonth() + 1).padStart(2, '0');
  const day = String(uk.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReportingPage() {
  // Helper to get UK date string (YYYY-MM-DD) from time
  function getDateString(date: Date) {
    return getUKDateString(date);
  }
  // Use UK timezone for today
  const now = new Date();
  const ukNow = new Date(now.toLocaleString('en-GB', { timeZone: 'Europe/London' }));
  const today = getUKDateString(ukNow);

  // Date range state (allow user to change)
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  // Equipment Usage date range state (allow user to change)
  const [equipmentStartDate, setEquipmentStartDate] = useState<string>(today);
  const [equipmentEndDate, setEquipmentEndDate] = useState<string>(today);
  // New Zone Usage Report date range state (allow user to change)
  const [zoneStartDate, setZoneStartDate] = useState<string>(today);
  const [zoneEndDate, setZoneEndDate] = useState<string>(today);
  // State for when to run the zone usage report
  const [zoneReportStart, setZoneReportStart] = useState<string>(today);
  const [zoneReportEnd, setZoneReportEnd] = useState<string>(today);
  // State for zone usage data
  const [zoneUsageData, setZoneUsageData] = useState<any[]>([]);

  // Always reset date pickers to today on mount
  useEffect(() => {
    setZoneStartDate(today);
    setZoneEndDate(today);
    setZoneReportStart(today);
    setZoneReportEnd(today);
  }, [today]);

  // Fetch zone usage data when Run Report is clicked
  useEffect(() => {
    async function fetchZoneUsage() {
      if (!zoneReportStart || !zoneReportEnd) return;
      try {
      const params = new URLSearchParams();
      params.append('start', zoneReportStart);
      params.append('end', zoneReportEnd);
      const res = await fetch(`/api/activity?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      const data = await res.json();
        setZoneUsageData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch zone usage data:', error);
        setZoneUsageData([]);
      }
    }
    fetchZoneUsage();
  }, [zoneReportStart, zoneReportEnd]);

  // Fetch attendance data from API
  useEffect(() => {
    async function fetchAttendance() {
      try {
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      const res = await fetch(`/api/activity?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      const data = await res.json();
        setAttendanceData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch attendance data:', error);
        setAttendanceData([]);
      }
    }
    fetchAttendance();
  }, [startDate, endDate]);

  // Prepare filtered attendance per day
  const filteredAttendance: { [date: string]: Set<string> } = {};
  const safeAttendanceData = Array.isArray(attendanceData) ? attendanceData : [];
  safeAttendanceData.forEach((a: any) => {
    if (!a || a.activityType !== 'start' && a.activityType !== 'stop') return;
    if (!a.memberId) return;
    const dateObj = new Date(a.timestamp);
    const dateStr = getDateString(dateObj);
    // Filter by date range
    if (
      (!startDate || dateStr >= startDate) &&
      (!endDate || dateStr <= endDate)
    ) {
      if (!filteredAttendance[dateStr]) filteredAttendance[dateStr] = new Set();
      filteredAttendance[dateStr].add(a.memberId);
    }
  });

  const chartLabels = Object.keys(filteredAttendance).sort();
  const chartData = chartLabels.map(date => filteredAttendance[date].size);

  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Unique Members',
        data: chartData,
        backgroundColor: 'rgba(247, 147, 30, 0.85)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Daily Attendance',
        color: '#F7931E',
        font: { size: 18 },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Date', color: '#F7931E' },
        ticks: { color: '#666' },
      },
      y: {
        title: { display: true, text: 'Unique Members', color: '#F7931E' },
        beginAtZero: true,
        ticks: { color: '#666' },
      },
    },
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-orange">Reporting</h1>
        <Link href="/dashboard" className="text-brand-orange underline hover:text-orange-700">Back to Dashboard</Link>
      </div>

      {/* New Zone Usage Report */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow border border-brand-grey/20">
        <h2 className="text-xl font-semibold text-brand-orange mb-2">Zone Usage Report (All Start/Stop Events)</h2>
        <p className="text-brand-grey mb-4">Shows all 'start' and 'stop' events from the database, grouped by zone, for the selected date range.</p>
        {/* Dedicated date pickers for this report */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <label className="flex flex-col">
            <span className="text-xs text-brand-grey mb-1">Start Date</span>
            <input type="date" value={zoneStartDate} onChange={e => setZoneStartDate(e.target.value)} className="border rounded px-2 py-1" />
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-brand-grey mb-1">End Date</span>
            <input type="date" value={zoneEndDate} onChange={e => setZoneEndDate(e.target.value)} className="border rounded px-2 py-1" />
          </label>
          <button
            className="bg-brand-orange text-white px-4 py-2 rounded shadow hover:bg-orange-700 transition"
            onClick={() => {
              setZoneReportStart(zoneStartDate);
              setZoneReportEnd(zoneEndDate);
            }}
          >
            Run Report
          </button>
        </div>
        {/* Only show the summary table here */}
        <ZoneUsageSummaryTable attendanceData={zoneUsageData} startDate={zoneReportStart} endDate={zoneReportEnd} />
      </section>
    </div>
  );
}

// Equipment Usage Chart Component
function EquipmentUsageChart({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [zoneActivity, setZoneActivity] = useState<any[]>([]);
  useEffect(() => {
    async function fetchEquipmentUsage() {
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      const res = await fetch(`/api/activity?${params.toString()}`);
      const data = await res.json();
      setZoneActivity(data);
    }
    fetchEquipmentUsage();
  }, [startDate, endDate]);

  // Helper to get date string (YYYY-MM-DD) from time
  function getDateString(date: Date) {
    return date.toISOString().split('T')[0];
  }

  // Aggregate equipment usage by zone and type, filtered by date
  const usage: { [zone: string]: { [type: string]: number } } = {};
  zoneActivity.forEach((a: any) => {
    if (!a.zone || !a.equipment) return;
    const dateObj = new Date(a.timestamp);
    const dateStr = getDateString(dateObj);
    if (
      (!startDate || dateStr >= startDate) &&
      (!endDate || dateStr <= endDate)
    ) {
      const zone = a.zone;
      const type = a.equipment;
      if (!usage[zone]) usage[zone] = {};
      usage[zone][type] = (usage[zone][type] || 0) + 1;
    }
  });

  const zones = Object.keys(usage);
  const typesSet = new Set<string>();
  zones.forEach(zone => Object.keys(usage[zone]).forEach(type => typesSet.add(type)));
  const types = Array.from(typesSet);

  const data = {
    labels: zones,
    datasets: types.map((type, i) => ({
      label: type,
      data: zones.map(zone => usage[zone][type] || 0),
      backgroundColor: `hsl(${(i * 60) % 360}, 70%, 60%)`,
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Equipment Usage by Zone and Type',
        color: '#F7931E',
        font: { size: 18 },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Zone', color: '#F7931E' },
        ticks: { color: '#666' },
      },
      y: {
        stacked: true,
        title: { display: true, text: 'Usage Count', color: '#F7931E' },
        beginAtZero: true,
        ticks: { color: '#666' },
      },
    },
  };

  return (
    <div className="h-64">
      {zones.length > 0 && types.length > 0 ? (
        <Bar data={data} options={options} />
      ) : (
        <div className="text-brand-grey/60 flex items-center justify-center h-full">No equipment usage data available.</div>
      )}
    </div>
  );
}

// Member Access Points Chart Component
function MemberAccessPointsChart() {
  const [zoneActivity, setZoneActivity] = useState<any[]>([]);
  useEffect(() => {
    async function fetchAccessPoints() {
      const res = await fetch('/api/activity');
      const data = await res.json();
      setZoneActivity(data);
    }
    fetchAccessPoints();
  }, []);

  // Only include access point zones (case-insensitive)
  const accessZones = ['lhs in', 'rhs in', 'lhs out', 'rhs out'];
  const counts: { [zone: string]: number } = {};
  zoneActivity.forEach((a: any) => {
    if (!a.zone) return;
    const zone = a.zone.trim().toLowerCase();
    if (accessZones.includes(zone)) {
      const label = a.zone.trim().toUpperCase();
      counts[label] = (counts[label] || 0) + 1;
    }
  });

  const labels = Object.keys(counts);
  const data = {
    labels,
    datasets: [
      {
        label: 'Member Events',
        data: labels.map(l => counts[l]),
        backgroundColor: 'rgba(128, 128, 255, 0.7)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Access Point Activity',
        color: '#F7931E',
        font: { size: 18 },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Access Point', color: '#F7931E' },
        ticks: { color: '#666' },
      },
      y: {
        title: { display: true, text: 'Events', color: '#F7931E' },
        beginAtZero: true,
        ticks: { color: '#666' },
      },
    },
  };

  return (
    <div className="h-64">
      {labels.length > 0 ? (
        <Bar data={data} options={options} />
      ) : (
        <div className="text-brand-grey/60 flex items-center justify-center h-full">No access point activity data available.</div>
      )}
    </div>
  );
}

// --- Pie Chart for Proportion of Events by Zone During Peak Hours ---
function PeakHoursPieChart() {
  const [zoneActivity, setZoneActivity] = useState<any[]>([]);
  useEffect(() => {
    async function fetchPeakHours() {
      const res = await fetch('/api/activity');
      const data = await res.json();
      setZoneActivity(data);
    }
    fetchPeakHours();
  }, []);

  // Only include events between 17:00 and 20:00 (inclusive)
  const counts: { [zone: string]: number } = {};
  zoneActivity.forEach((a: any) => {
    if (!a.zone || !a.timestamp) return;
    const dateObj = new Date(a.timestamp);
    const hour = dateObj.getHours();
    if (hour >= 17 && hour <= 20) {
      const zone = a.zone.trim();
      counts[zone] = (counts[zone] || 0) + 1;
    }
  });
  const labels = Object.keys(counts);
  const data = {
    labels,
    datasets: [
      {
        data: labels.map(l => counts[l]),
        backgroundColor: labels.map((_, i) => `hsl(${(i * 60) % 360}, 70%, 60%)`),
      },
    ],
  };
  return (
    <div className="h-96 flex flex-col items-center justify-center">
      {labels.length > 0 ? (
        <Pie data={data} options={{
          plugins: {
            legend: { position: 'right', labels: { color: '#F7931E', font: { size: 14 } } },
            title: { display: false },
            tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed} events` } }
          }
        }} />
      ) : (
        <div className="text-brand-grey/60 flex items-center justify-center h-full">No peak hour event data available.</div>
      )}
    </div>
  );
}

// Helper to get event date string in UK time (YYYY-MM-DD)
function getEventDateString(ts: string) {
  const d = new Date(ts);
  // Get UK date string as YYYY-MM-DD
  const [day, month, year] = d.toLocaleDateString('en-GB', { timeZone: 'Europe/London' }).split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Add ZoneUsageTable component at the end of the file
function ZoneUsageTable({ attendanceData, startDate, endDate, getDateString }: { attendanceData: any[], startDate: string, endDate: string, getDateString: (d: Date) => string }) {
  // Filter for start/stop events in date range using UK date string
  const filtered = attendanceData.filter((a: any) => {
    if (a.activityType !== 'start' && a.activityType !== 'stop') return false;
    if (!a.zone) return false;
    const eventDateStr = getEventDateString(a.timestamp);
    return (!startDate || eventDateStr >= startDate) && (!endDate || eventDateStr <= endDate);
  });
  if (filtered.length === 0) {
    return <div className="text-brand-grey/60 flex items-center justify-center h-full">No zone usage data for selected range.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-brand-grey/20">
        <thead>
          <tr className="bg-brand-orange/10">
            <th className="px-2 py-1 text-left">Zone</th>
            <th className="px-2 py-1 text-left">Member ID</th>
            <th className="px-2 py-1 text-left">Activity Type</th>
            <th className="px-2 py-1 text-left">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((a, idx) => (
            <tr key={idx} className="border-b border-brand-grey/20">
              <td className="px-2 py-1 font-semibold">{a.zone}</td>
              <td className="px-2 py-1">{a.memberId}</td>
              <td className="px-2 py-1">{a.activityType}</td>
              <td className="px-2 py-1 font-mono">{new Date(a.timestamp).toLocaleString('en-GB', { timeZone: 'Europe/London' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Add ZoneUsageSummaryTable component
function ZoneUsageSummaryTable({ attendanceData, startDate, endDate }: { attendanceData: any[], startDate: string, endDate: string }) {
  // Ensure attendanceData is an array
  const safeAttendanceData = Array.isArray(attendanceData) ? attendanceData : [];
  
  // Filter for start/stop events in date range using UK date string
  const filtered = safeAttendanceData.filter((a: any) => {
    if (!a || a.activityType !== 'start' && a.activityType !== 'stop') return false;
    if (!a.zone) return false;
    const eventDateStr = getEventDateString(a.timestamp);
    return (!startDate || eventDateStr >= startDate) && (!endDate || eventDateStr <= endDate);
  });

  // Aggregate counts per zone and activityType
  const zoneCounts: { [zone: string]: { start: number; stop: number } } = {};
  filtered.forEach((a: any) => {
    const zone = a.zone;
    if (!zoneCounts[zone]) zoneCounts[zone] = { start: 0, stop: 0 };
    if (a.activityType === 'start') zoneCounts[zone].start++;
    if (a.activityType === 'stop') zoneCounts[zone].stop++;
  });

  const zones = Object.keys(zoneCounts).sort();
  if (zones.length === 0) {
    return <div className="text-brand-grey/60 flex items-center justify-center h-full mb-4">No zone usage data for selected range.</div>;
  }

  return (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full text-sm border border-brand-grey/20">
        <thead>
          <tr className="bg-brand-orange/10">
            <th className="px-2 py-1 text-left">Zone</th>
            <th className="px-2 py-1 text-left">Start Events</th>
            <th className="px-2 py-1 text-left">Stop Events</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone} className="border-b border-brand-grey/20">
              <td className="px-2 py-1 font-semibold">{zone}</td>
              <td className="px-2 py-1">{zoneCounts[zone].start}</td>
              <td className="px-2 py-1">{zoneCounts[zone].stop}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 