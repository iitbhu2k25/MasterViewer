import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Extract query parameters
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const precision = searchParams.get('precision') || 'high';
  const endpoint = searchParams.get('endpoint') || 'watershed_api';

  // Validate required parameters
  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Missing required parameters: lat and lng' },
      { status: 400 }
    );
  }

  // Construct the mghydro API URL based on endpoint
  let apiUrl: string;
  if (endpoint === 'flowpath_api') {
    apiUrl = `https://mghydro.com/app/getwshed?task=flowpath&lat=${lat}&lng=${lng}&lang=en&precision=${precision}&source=merit`;
  } else {
    apiUrl = `https://mghydro.com/app/${endpoint}?lat=${lat}&lng=${lng}&precision=${precision}`;
  }

  try {
    // Make the request to the mghydro API
    const response = await fetch(apiUrl);

    // Handle non-OK responses
    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned status: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the response data
    const data = await response.json();

    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from mghydro API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from the API' },
      { status: 500 }
    );
  }
}