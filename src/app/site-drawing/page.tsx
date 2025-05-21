import Image from 'next/image';
import Link from 'next/link';

export default function SiteDrawing() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-orange">Site Drawings & Video</h1>
        <Link href="/dashboard" className="text-brand-orange underline hover:text-orange-700">Back to Dashboard</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2 text-brand-orange text-center">Floor Plan - Floor 1</h2>
          <Image
            src="/Dacha%20SSI%20Ringwood%20Office%20Floor%20Plan%20Floor%201.png"
            alt="Dacha SSI Ringwood Office Floor Plan Floor 1"
            width={800}
            height={600}
            className="rounded shadow border"
            style={{objectFit: 'contain', width: '100%', height: 'auto'}}
          />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2 text-brand-orange text-center">Floor Plan - Floor 2</h2>
          <Image
            src="/Dacha%20SSI%20Ringwood%20Office%20Floor%20Plan%20Floor%202.png"
            alt="Dacha SSI Ringwood Office Floor Plan Floor 2"
            width={800}
            height={600}
            className="rounded shadow border"
            style={{objectFit: 'contain', width: '100%', height: 'auto'}}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2 text-brand-orange text-center">Walkthrough Video</h2>
          <video
            src="/Ringwood_Office.mp4"
            controls
            loop
            autoPlay
            muted
            className="rounded shadow border w-full"
            style={{ height: '400px', maxHeight: '600px' }}
          />
        </div>
      </div>
    </div>
  );
} 