"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScottWorkPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow p-10 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold text-brand-orange mb-4 text-center">Hang on!</h1>
        <h2 className="text-2xl font-bold text-brand-orange mb-6 text-center">All of Scott's work is now coming</h2>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-orange mb-4"></div>
          <span className="text-gray-500 mt-2">Please wait for Scott's magic...</span>
        </div>
      </div>
    </div>
  );
} 