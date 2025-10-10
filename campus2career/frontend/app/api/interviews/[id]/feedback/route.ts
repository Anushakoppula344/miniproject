import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to proxy feedback requests to the backend
 * This route forwards requests to the backend API for interview feedback
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;
    const authHeader = request.headers.get('authorization');

    console.log('🔄 [FRONTEND API] Proxying feedback request for interview:', interviewId);

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_URL || 'process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'';
    const backendEndpoint = `${backendUrl}/api/interviews/${interviewId}/feedback`;

    console.log('📤 [FRONTEND API] Forwarding request to:', backendEndpoint);

    // Forward the request to the backend
    const response = await fetch(backendEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [FRONTEND API] Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ [FRONTEND API] Successfully retrieved feedback');
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [FRONTEND API] Error proxying feedback request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
