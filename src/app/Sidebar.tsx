"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [lastDeployment, setLastDeployment] = useState<string>('Loading...');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDeploymentTime = async () => {
      try {
        const response = await fetch('/api/deployment-time');
        const data = await response.json();
        if (isMounted) {
          if (data.lastDeployment) {
            const date = new Date(data.lastDeployment);
            setLastDeployment(date.toLocaleString());
          } else {
            setLastDeployment('Unknown');
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching deployment time:', error);
          setLastDeployment('Unknown');
        }
      }
    };

    fetchDeploymentTime();
    // Refresh deployment time every 5 minutes
    const interval = setInterval(fetchDeploymentTime, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  useEffect(() => {
    // Check for auth cookie on mount
    const getCookie = (name: string) => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          const part = parts.pop();
          if (part) return part.split(';').shift();
        }
      } catch (e) {
        return '';
      }
      return '';
    };
    setIsAuthenticated(getCookie('auth') === 'true');
  }, []);

  const handleLogout = () => {
    const getCookie = (name: string) => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          const part = parts.pop();
          if (part) return part.split(';').shift();
        }
      } catch (e) {
        return '';
      }
      return '';
    };
    const username = getCookie('username');
    if (username) {
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
      }).then(response => {
        const logEvent = response.headers.get('X-Log-Event');
        if (logEvent) {
          window.dispatchEvent(new CustomEvent('new-log', { detail: JSON.parse(logEvent) }));
        }
      });
    }
    document.cookie = "auth=; path=/; max-age=0; SameSite=Strict; secure";
    router.push("/login");
    return;
  };

  // Function to handle auto-logout
  const handleAutoLogout = () => {
    const getCookie = (name: string) => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          const part = parts.pop();
          if (part) return part.split(';').shift();
        }
      } catch (e) {
        return '';
      }
      return '';
    };
    const username = getCookie('username');
    if (username) {
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
      }).then(response => {
        const logEvent = response.headers.get('X-Log-Event');
        if (logEvent) {
          window.dispatchEvent(new CustomEvent('new-log', { detail: JSON.parse(logEvent) }));
        }
      });
    }
    document.cookie = "auth=; path=/; max-age=0; SameSite=Strict; secure";
    router.push("/login");
    return;
  };

  return (!pathname || pathname === "/login") ? null : (
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
              <Link href="/sensor-diagnostics" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Sensor Diagnostics
              </Link>
              <Link href="/info" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Info & User Guide
              </Link>
              <Link href="/user-log" className="block text-white hover:text-brand-orange transition-colors duration-200">
                User Log & Audit Trail
              </Link>
              <Link href="/data-flow" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Data Flow
              </Link>
              <Link href="/infrastructure-setup" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Infrastructure Setup
              </Link>
              <Link href="/deployment-history" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Deployment History
              </Link>
              <Link href="/member-tracking-visual" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Member Tracking Visual
              </Link>
              <Link href="/clubs" className="block text-white hover:text-brand-orange transition-colors duration-200">
                Global Clubs
              </Link>
              {isAuthenticated && (
                <div className="mt-8">
                  <button
                    onClick={handleLogout}
                    className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              )}
              <div className="mt-2">
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem('attendance');
                      localStorage.removeItem('objectCounts');
                      localStorage.removeItem('zoneActivity');
                      localStorage.removeItem('lastUpdate');
                      localStorage.removeItem('memberPaths');
                      localStorage.removeItem('objectTypeCounts');
                    } catch (e) {
                      // ignore errors
                    }
                    window.location.reload();
                  }}
                  className="w-full bg-red-500 hover:bg-red-700 text-white text-xs py-2 px-4 rounded transition-colors mt-2"
                >
                  Reset Dashboard Data
                </button>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Last Deployment: {lastDeployment}
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-2 text-brand-orange hover:text-brand-orange-dark"
                    title="Refresh deployment time"
                  >
                    ↻
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 