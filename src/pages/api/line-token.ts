import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' })
    return
  }

  try {
    const { code } = req.body

    // 換 token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.BASE_URL}/callback`,
        client_id: process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID!,
        client_secret: process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.json()
      res.status(400).json({ message: 'Token 交換失敗', error: err })
      return
    }

    const tokenData = await tokenRes.json()
    const access_token = tokenData.access_token

    // 用 access token 取得使用者資料
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!profileRes.ok) {
      const err = await profileRes.json()
      res.status(400).json({ message: '取得使用者資料失敗', error: err })
      return
    }

    const profile = await profileRes.json()
    // profile.userId 就是 Line ID
    res.status(200).json({ lineId: profile.userId })
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤', error })
  }
}
