import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export default function DeploymentHistory() {
  const logPath = path.join(process.cwd(), 'deployment-log.json');
  let log: any[] = [];
  if (fs.existsSync(logPath)) {
    log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-orange">Deployment History</h1>
        <Link href="/dashboard" className="text-brand-orange underline hover:text-orange-700">Back to Dashboard</Link>
      </div>
      <div className="bg-gray-50 rounded-xl shadow p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-brand-orange mb-4">Deployment Log</h2>
        <p className="text-gray-700 mb-2">This page will show a log of all deployments for audit and tracking purposes.</p>
        <div className="overflow-x-auto">
          <ul className="list-disc pl-6 text-gray-700">
            {log.map((entry: any, i: number) => (
              <li key={i} className="whitespace-nowrap font-mono">
                {new Date(entry.date).toLocaleString()} — {entry.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 