import type { NextApiRequest, NextApiResponse } from 'next'
import * as line from '@line/bot-sdk'

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { userId, action, name, remarks } = req.body

  if (!userId) return res.status(400).json({ error: '缺少 userId' })

  try {

    if (action === 'showForm') {
      // 傳送 Flex Message 表單連結
      await client.pushMessage({
        to: userId,
        messages: [
          {
            type: 'flex',
            altText: '點此填寫照護任務表單',
            contents: {
              type: 'bubble',
              hero: {
                type: 'image',
                url: 'https://atmarksol.jp/wp-content/uploads/2023/08/liff-1.jpg',
                size: 'full',
                aspectRatio: '20:13',
                aspectMode: 'cover'
              },
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '照護任務表單',
                    weight: 'bold',
                    size: 'xl'
                  },
                  {
                    type: 'text',
                    text: '請協助填寫住民需求，我們會即時通知照服員。',
                    size: 'sm',
                    wrap: true,
                    margin: 'md'
                  }
                ]
              },
              footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                  {
                    type: 'button',
                    style: 'primary',
                    action: {
                      type: 'uri',
                      label: '立即填寫',
                      uri: process.env.BASE_URL + '/customTask/customTask.html',
                    }
                  }
                ]
              }
            }
          }
        ]
      })
      return res.status(200).json({ status: 'form_sent' })
    }

    // 表單填寫完畢通知
    if (name && remarks) {
      await client.pushMessage({
        to: userId,
        messages: [
          {
            type: 'text',
            text: `📥 已收到一份照護任務：\n👤 姓名：${name}\n📌 備註：${remarks}`
          }
        ]
      })
      return res.status(200).json({ status: 'form_saved' })
    }

    return res.status(400).json({ error: '未知動作或缺少欄位' })

  } catch (error) {
    console.error('推播錯誤:', error)
    return res.status(500).json({ error: '推播失敗' })
  }
}