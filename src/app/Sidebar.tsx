"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/login") return null;

  // Function to handle auto-logout
  const handleAutoLogout = () => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const part = parts.pop();
        if (part) return part.split(';').shift();
      }
      return '';
    };
    const username = getCookie('username');
    // Log the auto-logout event
    fetch('/api/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        user: username,
        action: 'Auto Logout - Inactivity',
        ip: ''
      })
    });
    document.cookie = "auth=; path=/; max-age=0; SameSite=Strict; secure";
    router.push("/login");
  };

  // Set up inactivity timer
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(handleAutoLogout, INACTIVITY_TIMEOUT);
    };

    // Events to monitor for user activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress',
      'scroll', 'touchstart', 'click'
    ];

    // Set up event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  const handleLogout = () => {
    // Get username from cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const part = parts.pop();
        if (part) return part.split(';').shift();
      }
      return '';
    };
    const username = getCookie('username');
    // Log the logout event
    fetch('/api/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        user: username,
        action: 'Logout',
        ip: ''
      })
    });
    document.cookie = "auth=; path=/; max-age=0; SameSite=Strict; secure";
    router.push("/login");
  };

  return (
    <div className="group fixed left-0 top-0 h-full z-50 flex flex-col justify-between">
      <div>
        {/* Menu trigger button */}
        <button className="absolute left-0 top-4 bg-brand-orange text-white p-2 rounded-r-lg shadow-lg hover:bg-brand-orange/90 transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Menu panel */}
        <div className="absolute left-0 top-0 h-full w-56 bg-brand-grey transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-8">Dashboard</h2>
            <nav className="space-y-4">
              <Link href="/dashboard" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Home
              </Link>
              <Link href="/reporting" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Reporting
              </Link>
              <Link href="/site-drawing" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Site Drawings & Video
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/mqtt-log" className="block text-white hover:text-brand-orange transition-colors duration-200">
                  MQTT Log & Status
                </Link>
                <div id="mqtt-status-indicator" className="ml-2">
                  <span style={{ color: 'red', fontSize: '12px' }}>●</span>
                </div>
              </div>
              <Link href="/info" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Info & User Guide
              </Link>
              <Link href="/user-log" className="block text-white hover:text-brand-orange transition-colors duration-200">
                User Log & Audit Trail
              </Link>
              <Link href="/data-flow" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Data Flow
              </Link>
              <Link href="/deployment-history" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Deployment History
              </Link>
              <Link href="/feedback" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Feedback & Feature Requests
              </Link>
            </nav>
          </div>
        </div>
      </div>
      {/* Log Out button at the bottom */}
      <div className="absolute left-0 bottom-0 w-56 p-6 group-hover:block hidden">
        <button
          onClick={handleLogout}
          className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
} 