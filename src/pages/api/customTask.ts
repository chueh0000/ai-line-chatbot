import type { NextApiRequest, NextApiResponse } from 'next'
import * as line from '@line/bot-sdk'

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { userId, action, name } = req.body

  if (!userId) return res.status(400).json({ error: '缺少 userId' })

  try {

    if (action === 'showForm') {
      // 傳送 Flex Message 表單連結
      await client.pushMessage({
        to: userId,
        messages: [
          {
            type: 'flex',
            altText: '點此填寫個別化照護需求表單',
            contents: {
              type: 'bubble',
              hero: {
                type: 'image',
                url: 'https://i.ibb.co/b5xXZk0b/Chat-GPT-Image-May-23-2025-12-15-26-AM.png',
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
                    text: '個別化照護需求表單',
                    weight: 'bold',
                    size: 'xl'
                  },
                  {
                    type: 'text',
                    text: '如您有進一步細緻化/個別化照護需求，請填答下列資訊以完成表單。',
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
    if (name) {
      await client.pushMessage({
        to: userId,
        messages: [
          {
            type: 'text',
            text: `親愛的家屬您好：\n我們已收到您於近日提出的需求，請您不必太過擔心。謝謝您，祝您順心！`
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