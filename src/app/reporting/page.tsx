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

export default function ReportingPage() {
  // Helper to get date string (YYYY-MM-DD) from time
  function getDateString(date: Date) {
    return date.toISOString().split('T')[0];
  }
  const today = getDateString(new Date());

  // Date range state
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  // Equipment Usage date range state
  const [equipmentStartDate, setEquipmentStartDate] = useState<string>(today);
  const [equipmentEndDate, setEquipmentEndDate] = useState<string>(today);

  // Load zoneActivity from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zoneActivity');
      if (stored) {
        setAttendanceData(JSON.parse(stored));
      }
    }
  }, []);

  // Prepare filtered attendance per day
  const filteredAttendance: { [date: string]: Set<string> } = {};
  attendanceData.forEach((a: any) => {
    if (!a.objectClass) return;
    const cls = a.objectClass.toLowerCase();
    if (cls !== 'human' && cls !== 'person') return;
    // Try to parse a.time as a Date
    let dateObj: Date;
    if (a.time && !isNaN(Date.parse(a.time))) {
      dateObj = new Date(a.time);
    } else {
      // fallback: today
      dateObj = new Date();
    }
    const dateStr = getDateString(dateObj);
    // Filter by date range
    if (
      (!startDate || dateStr >= startDate) &&
      (!endDate || dateStr <= endDate)
    ) {
      if (!filteredAttendance[dateStr]) filteredAttendance[dateStr] = new Set();
      filteredAttendance[dateStr].add(a.objectId);
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

      {/* Daily Attendance Report with date range filter */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow border border-brand-grey/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
          <h2 className="text-xl font-semibold text-brand-orange">Daily Attendance Report</h2>
          <span className="text-sm text-brand-grey bg-brand-orange/10 rounded px-3 py-1 md:ml-4">
            This report shows the number of unique members (humans/persons) who attended the gym each day, based on entry events. Use the date range below to filter the results.
          </span>
        </div>
        <p className="text-brand-grey mb-4">Shows the number of unique members attending the gym each day. Use the date range below to filter.</p>
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <label className="flex flex-col">
            <span className="text-xs text-brand-grey mb-1">Start Date</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-brand-grey mb-1">End Date</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
          </label>
        </div>
        <div className="h-64">
          {chartLabels.length > 0 ? (
            <Bar data={data} options={options} />
          ) : (
            <div className="text-brand-grey/60 flex items-center justify-center h-full">No attendance data for selected range.</div>
          )}
        </div>
      </section>

      {/* Example Report 2: Equipment Usage Summary */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow border border-brand-grey/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
          <h2 className="text-xl font-semibold text-brand-orange">Equipment Usage Summary</h2>
          <span className="text-sm text-brand-grey bg-brand-orange/10 rounded px-3 py-1 md:ml-4">
            This report shows the number of times each equipment type was used in each zone, based on detected activity. Use the chart below to compare usage across equipment and zones.
          </span>
        </div>
        {/* Date range filter for Equipment Usage */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <label className="flex flex-col">
            <span className="text-xs text-brand-grey mb-1">Start Date</span>
            <input type="date" value={equipmentStartDate} onChange={e => setEquipmentStartDate(e.target.value)} className="border rounded px-2 py-1" />
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-brand-grey mb-1">End Date</span>
            <input type="date" value={equipmentEndDate} onChange={e => setEquipmentEndDate(e.target.value)} className="border rounded px-2 py-1" />
          </label>
        </div>
        {/* Equipment Usage Chart */}
        <EquipmentUsageChart startDate={equipmentStartDate} endDate={equipmentEndDate} />
      </section>

      {/* Example Report 3: Peak Hours Analysis */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow border border-brand-grey/20">
        <h2 className="text-xl font-semibold text-brand-orange mb-2">Peak Hours Analysis</h2>
        <p className="text-brand-grey mb-2">Shows the busiest hours in the gym based on member activity.</p>
        <PeakHoursPieChart />
      </section>

      {/* Member Access Points Report */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow border border-brand-grey/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
          <h2 className="text-xl font-semibold text-brand-orange">Member Access Points</h2>
          <span className="text-sm text-brand-grey bg-brand-orange/10 rounded px-3 py-1 md:ml-4">
            This report summarizes member activity at key access points (LHS IN, RHS IN, LHS OUT, RHS OUT). It counts the number of entries and exits detected at each access point zone (case-insensitive).
          </span>
        </div>
        <MemberAccessPointsChart />
      </section>
    </div>
  );
}

// Equipment Usage Chart Component
function EquipmentUsageChart({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [zoneActivity, setZoneActivity] = useState<any[]>([]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zoneActivity');
      if (stored) setZoneActivity(JSON.parse(stored));
    }
  }, []);

  // Helper to get date string (YYYY-MM-DD) from time
  function getDateString(date: Date) {
    return date.toISOString().split('T')[0];
  }

  // Aggregate equipment usage by zone and type, filtered by date
  const usage: { [zone: string]: { [type: string]: number } } = {};
  zoneActivity.forEach((a: any) => {
    if (!a.zoneName || !a.objectClass) return;
    // Try to parse a.time as a Date
    let dateObj: Date;
    if (a.time && !isNaN(Date.parse(a.time))) {
      dateObj = new Date(a.time);
    } else {
      dateObj = new Date();
    }
    const dateStr = getDateString(dateObj);
    if (
      (!startDate || dateStr >= startDate) &&
      (!endDate || dateStr <= endDate)
    ) {
      const zone = a.zoneName;
      const type = a.objectClass;
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
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zoneActivity');
      if (stored) setZoneActivity(JSON.parse(stored));
    }
  }, []);

  // Only include access point zones (case-insensitive)
  const accessZones = ['lhs in', 'rhs in', 'lhs out', 'rhs out'];
  const counts: { [zone: string]: number } = {};
  zoneActivity.forEach((a: any) => {
    if (!a.zoneName) return;
    const zone = a.zoneName.trim().toLowerCase();
    if (accessZones.includes(zone)) {
      const label = a.zoneName.trim().toUpperCase();
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
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zoneActivity');
      if (stored) setZoneActivity(JSON.parse(stored));
    }
  }, []);

  // Only include events between 17:00 and 20:00 (inclusive)
  const counts: { [zone: string]: number } = {};
  zoneActivity.forEach((a: any) => {
    if (!a.zoneName || !a.time) return;
    // Accept both 'HH:MM:SS' and 'HH:MM' formats
    const hour = Number(a.time.split(':')[0]);
    if (hour >= 17 && hour <= 20) {
      const zone = a.zoneName.trim();
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