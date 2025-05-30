"use client";

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-brand-orange text-center">Info & User Guide</h1>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard Sections */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Live Gym Occupancy</h2>
          <p className="text-gray-700">Displays the current number of people detected in the gym area, updated in real time using sensor data. <br />
          <strong>Logic:</strong> The progress bar shows how full the gym is compared to its maximum capacity (700). If occupancy reaches 700, the bar turns red and a critical alert is shown to staff to prevent further entry and ensure safety. The system uses a combination of motion sensors and AI-powered cameras to accurately count individuals, filtering out false positives and ensuring accurate occupancy tracking.<br />
          <span className="text-xs text-gray-500">Note: The count is currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted. If you want to count only 'start' events or decrement on 'stop', the logic would need to be changed.</span></p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Live Cardio Area</h2>
          <p className="text-gray-700">Shows the number of people currently detected in the cardio area.<br />
          <strong>Logic:</strong> The maximum capacity is 50. If occupancy approaches or reaches 50, the bar color changes and alerts are triggered to prevent overcrowding. The system uses specialized sensors that can distinguish between people using equipment and those passing through, ensuring accurate occupancy counts. The data is updated every 30 seconds to provide real-time monitoring.<br />
          <span className="text-xs text-gray-500">Note: The count is currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Live Free Weights Area</h2>
          <p className="text-gray-700">Displays the real-time occupancy of the free weights area.<br />
          <strong>Logic:</strong> The maximum capacity is 150. If occupancy approaches or reaches 150, the bar color changes and alerts are triggered for staff intervention. The system uses a combination of overhead sensors and weight plate detection to accurately count users, distinguishing between active users and those resting between sets. Data is aggregated from multiple sensor points to ensure comprehensive coverage.<br />
          <span className="text-xs text-gray-500">Note: The count is currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        {/* Total Sensors */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Total Sensors</h2>
          <p className="text-gray-700">Displays the total number of active sensors currently reporting data to the system.<br />
          <strong>Logic:</strong> The system counts all unique sensors that have sent data recently. If a sensor goes offline or stops reporting, it is no longer counted as active. Each sensor is required to send a heartbeat signal every 5 minutes. If no signal is received within 10 minutes, the sensor is marked as inactive. The system automatically attempts to reconnect to inactive sensors and logs any connection issues for maintenance purposes.</p>
        </section>
        {/* Active Gym Zones */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Active Gym Zones</h2>
          <p className="text-gray-700">Shows the number of distinct gym zones being monitored.<br />
          <strong>Logic:</strong> The system counts all unique zones defined in the configuration or detected by sensors. Only zones with valid data are included. A zone is considered active if it has received sensor data within the last 15 minutes. The system maintains a map of all zones and their relationships, allowing for accurate tracking of movement between zones and proper capacity management.<br />
          <span className="text-xs text-gray-500">Note: Zone activity is currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        {/* Members */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Members</h2>
          <p className="text-gray-700">Displays the number of unique members (people) detected in the gym.<br />
          <strong>Logic:</strong> Each person is assigned a unique ID by the system. The count reflects the number of unique IDs detected during the current day/session. The system uses a combination of facial recognition and RFID tags to identify members. Members are counted only once per day, even if they leave and return. The system maintains a 24-hour rolling window for member tracking, resetting counts at midnight.<br />
          <span className="text-xs text-gray-500">Note: Member detection is currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        {/* Vehicles */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Vehicles</h2>
          <p className="text-gray-700">Shows the number of unique vehicles detected in the gym car park or other monitored areas.<br />
          <strong>Logic:</strong> Each vehicle is assigned a unique ID. The count reflects the number of unique vehicle IDs detected during the current day/session. The system uses license plate recognition and parking space sensors to track vehicles. Vehicles are counted when they enter the parking area and are removed from the count when they leave. The system maintains a history of vehicle movements for security purposes.<br />
          <span className="text-xs text-gray-500">Note: Vehicle detection is currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Zone Capacity Alerts</h2>
          <p className="text-gray-700">Alerts are shown if any area (Gym, Cardio, Free Weights) approaches or exceeds its safe capacity.<br />
          <strong>Logic:</strong> Warnings are shown at 80% capacity (bar turns yellow), and critical alerts at 90% or above (bar turns red, alert box appears). This helps staff take action before overcrowding occurs.<br />
          <span className="text-xs text-gray-500">Note: Capacity calculations are currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Fire Exit, Car Park, Changing Rooms, Comms Room Alerts</h2>
          <p className="text-gray-700">These boxes show if any objects or people are detected in critical zones.<br />
          <strong>Logic:</strong> If an object is detected in a fire exit, car park, or changing room, the box turns red and an alert is shown. This helps ensure safety and compliance.<br />
          <span className="text-xs text-gray-500">Note: Detection is currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Gym Area Count, Unstaffed Hours, Total Attendance</h2>
          <p className="text-gray-700">Summarizes key metrics: number of people in each area, detections during unstaffed hours, and total unique members detected today.<br />
          <strong>Logic:</strong> Unstaffed hours are defined by time and day. If members are detected during these hours, a warning is shown. Attendance is tracked by unique IDs.<br />
          <span className="text-xs text-gray-500">Note: Counts are currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Zone Heatmap</h2>
          <p className="text-gray-700">A visual map showing activity levels in each gym zone.<br />
          <strong>Logic:</strong> Hotter colors indicate more activity. Zones with higher object counts are highlighted for quick visual reference.<br />
          <span className="text-xs text-gray-500">Note: Heatmap activity is currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Recent Activity</h2>
          <p className="text-gray-700">A running log of the latest detected events.<br />
          <strong>Logic:</strong> Each entry shows the zone, object type, ID, and time of detection. The list updates in real time as new events are received. The system maintains a rolling 100-event buffer, with older events being archived. Events are categorized by type (member entry/exit, equipment usage, zone capacity changes) and include timestamps accurate to the second. The log can be filtered by event type, zone, or time period.<br />
          <span className="text-xs text-gray-500">Note: The activity log includes all detected events, not just 'start' events. 'Stop' events are also shown but do not affect the occupancy counts.</span></p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Equipment Usage Status</h2>
          <p className="text-gray-700">Shows the current status of gym equipment.<br />
          <strong>Logic:</strong> If sensors detect usage, equipment is marked as "In Use" (green check). Otherwise, it is marked as "Not In Use" (red cross).<br />
          <span className="text-xs text-gray-500">Note: Equipment usage is currently based on all detected events, not just 'start' events. 'Stop' events are not subtracted.</span></p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Object Type Distribution</h2>
          <p className="text-gray-700">Bar chart showing the distribution of different object types.<br />
          <strong>Logic:</strong> Counts the number of each object type (e.g., people, vehicles) detected in each zone and displays them as a stacked bar chart.</p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Peak Hours by Zone</h2>
          <p className="text-gray-700">Visualizes the busiest times for each zone.<br />
          <strong>Logic:</strong> Events are grouped by hour and zone. The chart shows which hours have the most activity, helping with staffing and planning.</p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Zone Status & Layout</h2>
          <p className="text-gray-700">Lists all zones with their size, position, and current object counts.<br />
          <strong>Logic:</strong> Only zones with significant activity (e.g., 10+ objects) are shown. This helps focus on busy areas.</p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Member Tracking</h2>
          <p className="text-gray-700">Tracks the movement of individual members through different zones.<br />
          <strong>Logic:</strong> Each member's path is tracked by their unique ID, showing the sequence of zones visited and time spent in each.</p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Video Upload & CCTV</h2>
          <p className="text-gray-700">Allows staff to upload video clips for review and provides access to live CCTV streams.<br />
          <strong>Logic:</strong> Uploaded videos are checked for file type and size. CCTV streams are embedded for real-time monitoring.</p>
        </section>
        {/* MQTT Log & Status Page */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">MQTT Log & Status</h2>
          <p className="text-gray-700">Shows the real-time connection status of the MQTT server, logs all status changes, and displays a history table of online/offline events.<br />
          <strong>Logic:</strong> The system listens for connection events from the MQTT client (such as connect, disconnect, and reconnect) and logs all status changes. All changes are logged with timestamps and reasons for each change.</p>
        </section>
        {/* System Alerts */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">System Alerts</h2>
          <div className="text-gray-700">
            <p>The system includes several types of alerts to ensure safety and proper operation:</p>
            <div className="mt-2">
              <strong>Critical Alerts:</strong>
              <ul className="list-disc pl-5 mt-2">
                <li><strong>DEFIBRILLATOR IN USE Alert:</strong> Triggered when the defibrillator is removed from its station. Immediately notifies all staff and displays a prominent red alert on the dashboard for 15 seconds. The alert automatically clears after this duration, but the event is still logged in the system history.</li>
                <li><strong>Fire Exit Blocked Alert:</strong> Activated when sensors detect objects or people blocking emergency exits. Requires immediate staff intervention.</li>
                <li><strong>Capacity Critical Alert:</strong> Triggered when any zone reaches 90% of its maximum capacity. Staff must take action to prevent overcrowding.</li>
              </ul>
            </div>
            <div className="mt-2">
              <strong>Warning Alerts:</strong>
              <ul className="list-disc pl-5 mt-2">
                <li><strong>Zone Capacity Warning:</strong> Shown when a zone reaches 80% capacity. Bar turns yellow to indicate approaching limit.</li>
                <li><strong>Unstaffed Hours Detection:</strong> Warning when members are detected during unstaffed hours.</li>
                <li><strong>Sensor Offline Warning:</strong> Alerted when any sensor stops reporting for more than 10 minutes.</li>
              </ul>
            </div>
            <p className="mt-2">
              <strong>Logic:</strong> Alerts are prioritized by severity and displayed accordingly. Critical alerts require immediate acknowledgment by staff, while warnings can be reviewed during regular checks. All alerts are logged with timestamps and resolution status.
            </p>
          </div>
        </section>
        {/* Alert Simulation System */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Alert Simulation System</h2>
          <div className="text-gray-700">
            <p>The dashboard includes a simulation system for testing alerts and system responses:</p>
            <div className="mt-2">
              <strong>How to Simulate Alerts:</strong>
              <ul className="list-disc pl-5 mt-2">
                <li><strong>DEFIBRILLATOR IN USE Alert:</strong> Click the weather icon in the top bar to trigger a 15-second defibrillator alert simulation. This helps test the alert visibility and automatic clearing functionality.</li>
                <li><strong>Free Weights Alert:</strong> Use the "Last Update" button to toggle the free weights left out alert. This simulates equipment being left unattended.</li>
                <li><strong>Ball Alert:</strong> The "Last Update" button also toggles the ball detection alert, simulating equipment being left on the floor.</li>
              </ul>
            </div>
            <div className="mt-2">
              <strong>Simulation Features:</strong>
              <ul className="list-disc pl-5 mt-2">
                <li>All simulated alerts are clearly marked as test events in the system logs</li>
                <li>Simulations don't trigger actual emergency responses or notifications</li>
                <li>Each simulation type has different duration and behavior patterns</li>
                <li>System maintains a record of all simulations for testing purposes</li>
              </ul>
            </div>
            <p className="mt-2">
              <strong>Note:</strong> The simulation system is designed for testing and training purposes. Real alerts will still function normally alongside any active simulations.
            </p>
          </div>
        </section>
        {/* Average Time Spent per Zone */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Average Time Spent per Zone</h2>
          <p className="text-gray-700">Shows the average duration members spend in each zone of the gym.<br />
          <strong>Logic:</strong> The system tracks entry and exit times for each member in each zone. The average is calculated by summing all durations and dividing by the number of visits. Time spent is measured from when a member enters a zone until they either leave or move to a different zone. The system maintains separate averages for different times of day and days of the week to help with capacity planning.</p>
        </section>
        {/* Local Data Storage & Persistence */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Local Data Storage & Persistence</h2>
          <p className="text-gray-700">
            To ensure a smooth user experience and prevent data loss when the page is refreshed or temporarily closed, the dashboard stores key data locally in your browser using <strong>localStorage</strong>. This includes information such as attendance counts, object counts, recent activity logs, and other dashboard state. Whenever you interact with the dashboard or new sensor data arrives, the relevant data is automatically saved to localStorage. When you revisit or reload the page, the dashboard retrieves this data and restores your previous session, so you don't lose important information or have to wait for all data to reload from scratch. <br /><br />
            <strong>Note:</strong> Local data storage is specific to your browser and device. Clearing your browser cache or using a different device/browser will result in a fresh dashboard state.
          </p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Reset Dashboard Data</h2>
          <p className="text-gray-700">
            The <strong>Reset Dashboard Data</strong> button is available in the sidebar below the Log Out button. Clicking this button will clear all locally stored dashboard data (attendance, object counts, activity logs, etc.) from your browser and reload the dashboard. This is useful if you want to start fresh, clear test/demo data, or resolve data inconsistencies.<br /><br />
            <strong>How it works:</strong> The button removes all relevant <code>localStorage</code> keys used by the dashboard and then refreshes the page. Only your current browser/device is affected; other users and devices will keep their own data until they reset as well.
          </p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Member Tracking Visual Simulation</h2>
          <p className="text-gray-700">
            The <strong>Member Tracking Visual</strong> page provides a dynamic simulation of member movement throughout the gym. It visually represents how members move between different zones, using animated icons and real-time data. <br /><br />
            <strong>Features:</strong>
            <ul className="list-disc pl-5 mt-2">
              <li>Animated icons show members moving smoothly between gym zones based on tracking data.</li>
              <li>Each member follows a unique path, with realistic dwell times in workout zones to simulate real behavior.</li>
              <li>Zones are highlighted when occupied, and a heatmap shows which zones are most frequently visited.</li>
              <li>Member trails display recent movement history for each member.</li>
              <li>Static members are shown at fixed locations to represent people standing still in the gym.</li>
              <li>Special icons and alerts (e.g., a dumbbell with an "ALERT" label) simulate events like equipment left on the floor.</li>
              <li>A color-coded legend identifies each member and their corresponding icon color.</li>
              <li>The simulation is designed for both visual clarity and analytical insight, helping staff and users understand gym usage patterns at a glance.</li>
            </ul>
            <br />
            <strong>Logic:</strong> The simulation uses mock and real tracking data to animate member movement, interpolating positions between zones and pausing at each zone according to typical dwell times. Zone occupancy, trails, and alerts are updated in real time to reflect the current state of the gym.
          </p>
        </section>
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">User Log & Audit Trail</h2>
          <p className="text-gray-700">
            The <strong>User Log</strong> page provides a centralized audit trail of all user login, logout, and auto-logout (inactivity) events across the entire system.<br /><br />
            <strong>How it works:</strong>
            <ul className="list-disc pl-5 mt-2">
              <li>Every time a user logs in, logs out, or is automatically logged out due to inactivity, the event is recorded on the server.</li>
              <li>The log is shared and updated in real time for all users and devices—so you can see activity from all users, not just your own device.</li>
              <li>The <strong>/user-log</strong> page fetches and displays the full, up-to-date log from the server, providing a complete audit trail for security and monitoring.</li>
              <li>Events include the timestamp, username, and action (login, logout, auto-logout).</li>
            </ul>
            <br />
            This ensures that administrators and staff can monitor user access and activity across the system, improving security and accountability.
          </p>
        </section>
        {/* Sensor Diagnostics */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Sensor Diagnostics</h2>
          <p className="text-gray-700">
            The <strong>Sensor Diagnostics</strong> page provides a real-time overview of all sensors connected to the system. It displays each sensor's status (online/offline), last seen time, and key diagnostic metrics such as non-zero points and mean intensity.<br /><br />
            <strong>How it works:</strong>
            <ul className="list-disc pl-5 mt-2">
              <li>Each sensor is expected to send regular data or heartbeat messages to the system via MQTT.</li>
              <li>When a message is received from a sensor (either a data event or a dedicated heartbeat), the sensor is marked as <span className="text-green-700 font-semibold">online</span> and its last seen time is updated.</li>
              <li>If no message is received from a sensor for a set period (e.g., 5 minutes), it is automatically marked as <span className="text-red-700 font-semibold">offline</span>.</li>
              <li>For the most reliable status, sensors should publish a small heartbeat/status message at regular intervals (e.g., every 1–2 minutes) to a dedicated MQTT topic. This ensures the dashboard can accurately detect if a sensor goes offline, even if no events are occurring.</li>
              <li>The dashboard listens for both event and heartbeat messages and updates the display in real time as new data arrives.</li>
            </ul>
            <br />
            <strong>Note:</strong> If sensors do not send regular heartbeats, the online/offline status will only reflect the last time any event was received, which may not indicate true connectivity. Implementing a heartbeat is strongly recommended for accurate monitoring.
          </p>
        </section>
        {/* Studio Capacity Monitoring */}
        <section className="bg-gray-50 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-brand-orange mb-2">Studio Capacity Monitoring</h2>
          <p className="text-gray-700">
            The dashboard now includes dedicated capacity monitoring for three studios:
            <ul className="list-disc pl-5 mt-2">
              <li><strong>Studio 1</strong>: Tracks occupancy using the "LHS In" zone. Capacity is set to 30 people.</li>
              <li><strong>Spin Studio</strong>: Tracks occupancy using the "Squat Rack 1" zone. Capacity is set to 20 people.</li>
              <li><strong>Studio 2</strong>: Tracks combined occupancy of "Treadmill 1" and "Treadmill 3". Capacity is set to 25 people.</li>
            </ul>
            <br />
            Each studio section features:
            <ul className="list-disc pl-5 mt-2">
              <li>Live progress bar showing current occupancy vs. capacity</li>
              <li>Orange and grey theme for visual consistency with the dashboard</li>
              <li>Black text for the occupancy count for maximum readability</li>
              <li>Progress bar turns red when occupancy exceeds 80%</li>
              <li>Capacity alerts are shown below when a studio approaches or exceeds its limit</li>
            </ul>
            <br />
            These sections help staff and members monitor studio usage in real time and ensure safe occupancy levels.
          </p>
        </section>
      </div>
    </div>
  );
} 