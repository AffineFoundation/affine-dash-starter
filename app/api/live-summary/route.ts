import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SUMMARY_URL = 'https://weight-watcher-nfvr.onrender.com/summary/latest';

export async function GET() {
  try {
    const res = await fetch(SUMMARY_URL, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    return NextResponse.json(json);
  } catch (error) {
    console.error('Live summary query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
