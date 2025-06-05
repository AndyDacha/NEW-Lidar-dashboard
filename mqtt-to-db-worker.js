// MQTT to DB Worker
// Run this script with: node mqtt-to-db-worker.js
// Make sure you have installed 'mqtt' and '@prisma/client' (npm install mqtt @prisma/client)

const mqtt = require('mqtt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// --- CONFIG ---
const MQTT_URL = 'wss://navyalkali-710f05f8.a01.euc1.aws.hivemq.cloud:8884/mqtt';
const MQTT_USERNAME = 'AndyF';
const MQTT_PASSWORD = 'Flasheye123';
const TOPICS = [
  'Flasheye/flasheye-edge-35/event',
  'Flasheye/flasheye-edge-35/sensor_diagnostics',
  'Flasheye/flasheye-edge-35/boxes',
  'Flasheye/flasheye-edge-35/alarm',
  'Flasheye/flasheye-edge-35/tracking',
  'Flasheye/flasheye-edge-35/speed_event',
];
// --------------

console.log('[MQTT-DB] Starting worker...');

const client = mqtt.connect(MQTT_URL, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  protocol: 'wss',
  clean: true,
});

client.on('connect', () => {
  console.log('[MQTT-DB] Connected to MQTT broker');
  TOPICS.forEach(topic => {
    client.subscribe(topic, err => {
      if (err) {
        console.error(`[MQTT-DB] Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`[MQTT-DB] Subscribed to ${topic}`);
      }
    });
  });
});

client.on('error', err => {
  console.error('[MQTT-DB] MQTT error:', err);
});

client.on('message', async (topic, message) => {
  try {
    const parsed = JSON.parse(message.toString());
    // Only process event/alarm messages with required fields
    if ((topic.includes('event') || topic.includes('alarm')) && parsed.zone_name && parsed.object_class) {
      // Use event's original timestamp if available
      const eventTimestamp = parsed.unix_time
        ? new Date(parsed.unix_time * 1000)
        : new Date();
      const activity = {
        zone: parsed.zone_name,
        activityType: parsed.event || 'unknown',
        memberId: parsed.object_id ? String(parsed.object_id) : null,
        equipment: parsed.equipment,
        objectType: parsed.object_class,
        timestamp: eventTimestamp.toISOString(),
      };
      // Deduplication: check for existing event in ±2s window
      const windowStart = new Date(eventTimestamp.getTime() - 2000);
      const windowEnd = new Date(eventTimestamp.getTime() + 2000);
      const existing = await prisma.activity.findFirst({
        where: {
          memberId: activity.memberId,
          zone: activity.zone,
          activityType: activity.activityType,
          objectType: activity.objectType,
          timestamp: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
      });
      if (!existing) {
        await prisma.activity.create({ data: activity });
        console.log('[MQTT-DB] Saved activity:', activity);
      } else {
        console.log('[MQTT-DB] Duplicate event ignored:', activity);
      }
    }
  } catch (err) {
    console.error('[MQTT-DB] Failed to process message:', err);
  }
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await prisma.$disconnect();
  client.end();
  process.exit(0);
}); 