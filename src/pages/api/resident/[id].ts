// /pages/api/resident/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchResidentDataWithTrend } from '@/lib/googleSheets'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const date = req.query.date as string

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '缺少住民 ID' })
  }

  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: '缺少日期參數' })
  }

  try {
    const result = await fetchResidentDataWithTrend(id, date)
    res.status(200).json(result)
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Google Sheets Error:', err.message)
      res.status(500).json({ error: err.message })
    } else {
      console.error('Unknown Error:', err)
      res.status(500).json({ error: 'An unknown error occurred' })
    }
  }
}
