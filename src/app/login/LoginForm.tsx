"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { users } from "../auth/users";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      document.cookie = `auth=true; path=/; max-age=86400; SameSite=Strict;`;
      document.cookie = `userRole=${user.role}; path=/; max-age=86400; SameSite=Strict;`;
      document.cookie = `username=${user.username}; path=/; max-age=86400; SameSite=Strict;`;
      router.push("/scott-work");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md flex flex-col items-center">
        <img src="/Dacha Orange 300420 no backround.jpeg" alt="Dacha Logo" className="h-20 mb-2" />
        <div className="text-brand-orange text-lg font-semibold mb-6" style={{letterSpacing: 1}}>safety • security • intelligence</div>
        <h1 className="text-3xl font-bold text-brand-orange mb-6 text-center">Login</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="block text-gray-700 font-semibold mb-1">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 font-semibold mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-orange text-white py-3 rounded-md font-bold text-lg hover:bg-orange-500 transition-colors mt-2"
          >
            Sign In
          </button>
          {error && (
            <div className="text-red-500 text-center mt-2">{error}</div>
          )}
        </form>
      </div>
    </div>
  );
} 