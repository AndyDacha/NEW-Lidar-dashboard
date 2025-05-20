import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">LiDAR Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to LiDAR Dashboard</h2>
            <p className="text-gray-600 mb-4">
              This dashboard provides interactive 3D visualization and analysis of LiDAR data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link 
                href="/visualization" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">3D Visualization</h3>
                <p className="text-sm text-gray-500">View and interact with LiDAR point clouds</p>
              </Link>
              <Link 
                href="/analysis" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Data Analysis</h3>
                <p className="text-sm text-gray-500">Analyze and process LiDAR data</p>
              </Link>
              <Link 
                href="/settings" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Settings</h3>
                <p className="text-sm text-gray-500">Configure visualization and analysis settings</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 