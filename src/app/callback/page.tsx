'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')

        if (!code) {
          setError('沒有取得授權碼')
          return
        }

        // 送後端 API 換 token
        const res = await fetch('/api/line-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.message || '換取 token 失敗')
          return
        }

        const data = await res.json()
        const lineId = data.lineId

        // 把 lineId 存到 cookie 或 localStorage，供 register 用
        localStorage.setItem('lineId', lineId)

        // 導向註冊頁
        router.push('/register')
      } catch (e) {
        setError('發生錯誤')
      }
    }

    fetchToken()
  }, [router])

  if (error) return <div className="text-red-600">錯誤：{error}</div>
  return <div>正在處理授權中...</div>
}
