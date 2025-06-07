'use client'

import { useEffect } from 'react'

export default function LoginPage() {
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID
    const redirectUri = encodeURIComponent(`${window.location.origin}/callback`)
    const state = '1234' // 
    const scope = encodeURIComponent('profile openid')
    const nonce = 'nonce' // 

    const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}&nonce=${nonce}`
    window.location.href = loginUrl
  }, [])

  return <div>正在前往 LINE 登入頁...</div>
}
