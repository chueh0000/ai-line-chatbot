// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, role, resident_id, line_id } = body;

  if (!name || !phone || !role || !resident_id || !line_id) {
    return NextResponse.json({ error: 'Missing fields', message: '所有欄位均為必填' }, { status: 400 });
  }

  try {
    // 檢查是否已存在
    const exists = await pool.query(
      `SELECT line_id FROM line_users WHERE line_id = $1`, [line_id]
    );
    if (exists.rowCount && exists.rowCount > 0) {
      return NextResponse.json({ error: 'User already registered', message: '您已註冊過，請勿重複提交' }, { status: 409 });
    }

    // 寫入資料庫
    await pool.query(
      `INSERT INTO line_users (line_id, resident_id, name, role, phone)
      VALUES ($1, $2, $3, $4, $5)`,
      [line_id, resident_id, name, role, phone]
    );

    return NextResponse.json({ success: true, line_id: line_id, message: '註冊成功！' });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: '伺服器內部錯誤，請稍後再試' }, { status: 500 });
  }
}