import React from 'react';

const components = [
  {
    label: "GitHub Repository",
    description:
      "Source code repository for version control, collaboration, and CI/CD deployments. Triggers automatic deployments to Vercel (dashboard frontend) and DigitalOcean (backend worker).",
  },
  {
    label: "Backend Worker (Node.js on DigitalOcean)",
    description:
      "Always-on Node.js script running on a DigitalOcean Droplet. Subscribes to MQTT topics, processes messages, and writes events to the PlanetScale database. Ensures 24/7 data logging, independent of the dashboard UI.",
  },
  {
    label: "Vercel (Next.js Dashboard)",
    description:
      "Web application for real-time monitoring, reporting, and visualization. Hosted on Vercel, automatically deployed from GitHub. Fetches data from PlanetScale and displays it to users.",
  },
  {
    label: "DigitalOcean",
    description:
      "Cloud provider hosting the backend worker and (optionally) other infrastructure components.",
  },
  {
    label: "PlanetScale (MySQL Cloud DB)",
    description:
      "Serverless, scalable MySQL database in the cloud. Stores all activity, event, and reporting data. Third-party service.",
  },
  {
    label: "MQTT Broker (HiveMQ Cloud)",
    description:
      "Secure, cloud-hosted message broker that receives real-time events from all sensors/devices. Third-party service.",
  },
  {
    label: "Sensors/Devices",
    description:
      "Physical sensors (e.g., Lidar, cameras, gym equipment) detect activity and send data to the MQTT broker.",
  },
  {
    label: "User/Colleagues",
    description:
      "End users and team members who access the dashboard for real-time and historical reporting.",
  },
];

export default function InfrastructureSetup() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-brand-orange mb-6">Infrastructure Setup</h1>
      <p className="mb-4 text-lg text-brand-grey">
        This page provides a complete overview of the Smart Gym Monitoring Solution infrastructure, including all third-party services, data flow, and how each component connects. Share this with colleagues to understand the full system architecture.
      </p>
      <h2 className="text-xl font-semibold text-brand-orange mt-8 mb-2">System Flow Chart</h2>
      <div className="flex flex-col items-center gap-2 bg-white border border-brand-grey/20 rounded-lg p-4 mb-8">
        {components.map((comp, idx) => (
          <React.Fragment key={comp.label}>
            <div className="flex items-center gap-2 relative group">
              <span className="font-semibold text-brand-grey text-base md:text-lg">{comp.label}</span>
              <span className="relative group cursor-pointer">
                <span className="text-brand-orange ml-1">ℹ️</span>
                <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-white border border-gray-300 rounded p-2 text-xs w-64 shadow-lg text-brand-grey">
                  {comp.description}
                </span>
              </span>
            </div>
            {idx < components.length - 1 && (
              <div className="flex flex-col items-center">
                <span className="text-brand-grey text-2xl">▼</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <h2 className="text-xl font-semibold text-brand-orange mt-8 mb-2">Component Breakdown</h2>
      <ul className="list-disc pl-6 text-brand-grey mb-8">
        <li className="mb-2"><strong>GitHub Repository:</strong> Source code repository for version control, collaboration, and CI/CD deployments. Triggers automatic deployments to Vercel (dashboard frontend) and DigitalOcean (backend worker).</li>
        <li className="mb-2"><strong>Backend Worker (Node.js on DigitalOcean):</strong> Always-on Node.js script running on a DigitalOcean Droplet. Subscribes to MQTT topics, processes messages, and writes events to the PlanetScale database. Ensures 24/7 data logging, independent of the dashboard UI.</li>
        <li className="mb-2"><strong>Vercel (Next.js Dashboard):</strong> Web application for real-time monitoring, reporting, and visualization. Hosted on Vercel, automatically deployed from GitHub. Fetches data from PlanetScale and displays it to users.</li>
        <li className="mb-2"><strong>DigitalOcean:</strong> Cloud provider hosting the backend worker and (optionally) other infrastructure components.</li>
        <li className="mb-2"><strong>PlanetScale (MySQL Cloud DB):</strong> Serverless, scalable MySQL database in the cloud. Stores all activity, event, and reporting data. Third-party service.</li>
        <li className="mb-2"><strong>MQTT Broker (HiveMQ Cloud):</strong> Secure, cloud-hosted message broker that receives real-time events from all sensors/devices. Third-party service.</li>
        <li className="mb-2"><strong>Sensors/Devices:</strong> Physical sensors (e.g., Lidar, cameras, gym equipment) detect activity and send data to the MQTT broker.</li>
        <li className="mb-2"><strong>User/Colleagues:</strong> End users and team members who access the dashboard for real-time and historical reporting.</li>
      </ul>
      <h2 className="text-xl font-semibold text-brand-orange mt-8 mb-2">How It All Connects</h2>
      <ol className="list-decimal pl-6 text-brand-grey mb-8">
        <li className="mb-2">Sensors detect activity and send messages to the MQTT broker in real time.</li>
        <li className="mb-2">The backend worker (Node.js) subscribes to relevant MQTT topics, processes each message, and writes structured events to the PlanetScale database.</li>
        <li className="mb-2">The dashboard app is hosted on Vercel, automatically deployed from GitHub, and fetches data from PlanetScale to display live and historical reports to users.</li>
        <li className="mb-2">All code is managed in GitHub for collaboration and version control. Deployments to DigitalOcean and Vercel are automated via CI/CD.</li>
        <li className="mb-2">DigitalOcean provides the always-on infrastructure for the backend worker. Vercel provides scalable, global hosting for the dashboard frontend.</li>
      </ol>
      <h2 className="text-xl font-semibold text-brand-orange mt-8 mb-2">Third-Party Services Used</h2>
      <ul className="list-disc pl-6 text-brand-grey mb-8">
        <li><strong>HiveMQ Cloud:</strong> MQTT broker for real-time messaging</li>
        <li><strong>PlanetScale:</strong> Cloud MySQL database</li>
        <li><strong>DigitalOcean:</strong> Cloud VM hosting for backend worker</li>
        <li><strong>Vercel:</strong> Hosting for the Next.js dashboard frontend, with automatic GitHub deployments</li>
        <li><strong>GitHub:</strong> Source code management and CI/CD</li>
      </ul>
      <h2 className="text-xl font-semibold text-brand-orange mt-8 mb-2">Summary</h2>
      <p className="text-brand-grey mb-8">
        This infrastructure ensures reliable, real-time, and historical reporting for gym/club activity. All components are cloud-based, scalable, and designed for easy collaboration and handover. Share this page with colleagues to explain how the system works end-to-end.
      </p>
    </div>
  );
} 