import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'Karachi';
  const country = searchParams.get('country') || 'Pakistan';
  
  // Get current date in Pakistan timezone
  const now = new Date();
  const pakistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
  const day = pakistanTime.getDate();
  const month = pakistanTime.getMonth() + 1;
  const year = pakistanTime.getFullYear();
  const date = `${day}-${month}-${year}`;

  try {
    // Use method=2 (Islamic Society of North America) which works better for Pakistan
    // Add latitude/longitude for Karachi for more accurate local times
    const url = `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2&school=1&latitudeAdjustmentMethod=3`;
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Prayer times API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prayer times' },
      { status: 500 }
    );
  }
}