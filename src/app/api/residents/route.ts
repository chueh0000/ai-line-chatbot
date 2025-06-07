import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const res = await pool.query('SELECT id, name FROM residents ORDER BY id')
    // Return an object with a 'residents' key
    return NextResponse.json({ residents: res.rows })
  } catch (error) {
    console.error("Error fetching residents:", error);
    return NextResponse.json({ error: "Failed to fetch residents" }, { status: 500 });
  }
}