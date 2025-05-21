"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/login") return null;

  const handleLogout = () => {
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