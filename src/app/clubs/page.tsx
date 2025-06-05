'use client';

interface Club {
  name: string;
  location: string;
  region: string;
}

const ukClubs: Club[] = [
  { name: "London Club", location: "London", region: "UK" },
  { name: "Manchester Club", location: "Manchester", region: "UK" },
  { name: "Birmingham Club", location: "Birmingham", region: "UK" },
  { name: "Edinburgh Club", location: "Edinburgh", region: "UK" }
];

const australianClubs: Club[] = [
  { name: "Sydney Club", location: "Sydney", region: "Australia" },
  { name: "Melbourne Club", location: "Melbourne", region: "Australia" },
  { name: "Brisbane Club", location: "Brisbane", region: "Australia" },
  { name: "Perth Club", location: "Perth", region: "Australia" },
  { name: "Adelaide Club", location: "Adelaide", region: "Australia" },
  { name: "Gold Coast Club", location: "Gold Coast", region: "Australia" },
  { name: "Newcastle Club", location: "Newcastle", region: "Australia" },
  { name: "Canberra Club", location: "Canberra", region: "Australia" },
  { name: "Hobart Club", location: "Hobart", region: "Australia" },
  { name: "Darwin Club", location: "Darwin", region: "Australia" }
];

export default function ClubsPage() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Global Club Locations</h1>
      
      {/* UK Clubs Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-600">United Kingdom</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ukClubs.map((club, index) => (
            <div key={`uk-${index}`} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg">{club.name}</h3>
              <p className="text-gray-600">{club.location}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Australian Clubs Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-blue-600">Australia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {australianClubs.map((club, index) => (
            <div key={`au-${index}`} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg">{club.name}</h3>
              <p className="text-gray-600">{club.location}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 