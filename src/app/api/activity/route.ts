import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Helper to determine environment
function getEnvironment() {
  return process.env.NODE_ENV === 'development' ? 'development' : 'production';
}

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  let where: any = {};
  if (start || end) {
    let endDate: Date | undefined = undefined;
    if (end) {
      // If end is YYYY-MM-DD, set to end of day (23:59:59.999)
      const endObj = new Date(end);
      endObj.setHours(23, 59, 59, 999);
      endDate = endObj;
    }
    where.timestamp = {
      ...(start ? { gte: new Date(start) } : {}),
      ...(end ? { lte: endDate } : {}),
    };
  }
  const activities = await prisma.activity.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  });

    // Deduplicate activities based on their unique characteristics
    const uniqueActivities = activities.reduce((acc: any[], current: any) => {
      // Create a unique key for each activity
      const key = `${current.memberId}-${current.activityType}-${current.zone}-${current.objectType}-${current.timestamp}`;
      
      // Check if we've seen this activity before
      const isDuplicate = acc.some((item: any) => {
        const itemKey = `${item.memberId}-${item.activityType}-${item.zone}-${item.objectType}-${item.timestamp}`;
        return itemKey === key;
      });

      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    }, []);

    return NextResponse.json(uniqueActivities || []);
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('POST /api/activity body:', body);
    const { memberId, activityType, equipment, zone, timestamp, objectType } = body;
    if (!activityType) {
      return NextResponse.json({ error: 'Missing required field: activityType' }, { status: 400 });
    }
    const activity = await prisma.activity.create({
      data: {
        memberId: memberId != null ? String(memberId) : null,
        activityType,
        equipment,
        zone,
        timestamp: timestamp ? new Date(timestamp) : undefined,
        objectType,
        environment: getEnvironment(),
      },
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Failed to create activity:', error);
    return NextResponse.json({ error: 'Failed to create activity', details: String(error) }, { status: 500 });
  }
} 