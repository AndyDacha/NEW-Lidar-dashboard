"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { users } from "../auth/users";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      document.cookie = `auth=true; path=/; max-age=86400; SameSite=Strict; secure`;
      document.cookie = `userRole=${user.role}; path=/; max-age=86400; SameSite=Strict; secure`;
      document.cookie = `username=${user.username}; path=/; max-age=86400; SameSite=Strict; secure`;
      router.push("/scott-work");
      fetch('/api/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          user: username,
          action: 'Login Success',
          ip: '' // You can try to get the IP from the backend if needed
        })
      });
    } else {
      setError("Invalid username or password");
      fetch('/api/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          user: username,
          action: 'Login Failure',
          ip: '' // You can try to get the IP from the backend if needed
        })
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex justify-center mb-6">
          <img src="/Dacha Orange 300420 no backround.jpeg" alt="Dacha Logo" className="h-20 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-center text-brand-orange mb-6">Login</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-orange text-white py-2 px-4 rounded-md hover:bg-brand-orange/90 transition-colors"
          >
            Sign In
          </button>
        </form>

        <video
          src="/Ringwood_Office_SMALL.mp4"
          controls
          loop
          autoPlay
          muted
          className="rounded shadow border w-full"
          style={{ height: '400px', maxHeight: '600px' }}
        />
      </div>
    </div>
  );
} 