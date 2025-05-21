import type { NextApiRequest, NextApiResponse } from 'next'
import * as line from '@line/bot-sdk'
import { parseCommand } from '@/utils/commandParser'
import { getUserDataFromSheets, notifyStaff } from '@/lib/googleSheets'

// create LINE SDK config from env variables
const config_line = {
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
}

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!
});

// This disables the default body parser so LINE can verify the signature
export const config = {
  api: {
    bodyParser: false,
  },
}

// Apply LINE middleware
const runMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // It might be necessary to cast to 'any' here due to the middleware's internal type expectations
    line.middleware(config_line)(req, res, (result: unknown) =>
      result instanceof Error ? reject(result) : resolve()
    )
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  try {
    await runMiddleware(req, res)

    // Now we can assert the type of req.body
    const body = req.body as line.WebhookRequestBody;
    const events = body.events;

    const promises = events.map(async (event: line.WebhookEvent) => {
      if (event.type === 'message' && event.message?.type === 'text') {
        const userId = event.source.userId
        const userMessage = event.message.text
        const parsed = parseCommand(userMessage)
        let replyText = `👋 嗨! 您的 ID 是 ${userId}`

        if (parsed) {
          const { command, args } = parsed

          // TODO: You can handle commands here (e.g. /summary, /chart, etc.)

          if (command === '註冊') {
            if (!args[0] || !args[1] || !args[2]) {
              await client.replyMessage({
                replyToken: event.replyToken!,
                messages: [{
                  type: 'text',
                  text: '請提供完整的註冊資訊：/註冊 關係 姓名 住民姓名',
                }],
              })
              return
            }
            replyText = `${args[1]} 您好～ 已註冊成功！您是 ${args[2]} 的 ${args[0]}，您的 ID 是 ${userId}`
          }

          if (command === '照護紀錄') {
            await client.replyMessage({
              replyToken: event.replyToken!,
              messages: [
                {
                  type: 'flex',
                  altText: '點此查看詳細照護紀錄',
                  contents: {
                    type: 'bubble',
                    size: 'mega',
                    body: {
                      type: 'box',
                      layout: 'vertical',
                      spacing: 'md',
                      contents: [
                        {
                          type: 'text',
                          text: '2025/05/23・照護紀錄摘要',
                          size: 'sm',
                          color: '#888888',
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'image',
                              url: 'https://stickershop.line-scdn.net/stickershop/v1/product/25219285/LINEStorePC/main.png?v=1', // 替換為實際住民頭像
                              size: 'xs',
                              aspectMode: 'cover',
                              aspectRatio: '1:1',
                            },
                            {
                              type: 'box',
                              layout: 'vertical',
                              contents: [
                                {
                                  type: 'text',
                                  text: '陳爺爺',
                                  weight: 'bold',
                                  size: 'md'
                                },
                                {
                                  type: 'text',
                                  text: '午睡充足，進食八分，無不適感。',
                                  size: 'sm',
                                  wrap: true,
                                  color: '#666666'
                                }
                              ]
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'box',
                              layout: 'vertical',
                              contents: [
                                {
                                  type: 'text',
                                  text: '體溫',
                                  size: 'xs',
                                  color: '#888888'
                                },
                                {
                                  type: 'text',
                                  text: '36.4 ℃',
                                  weight: 'bold',
                                  size: 'md',
                                  color: '#D94D4D'
                                }
                              ]
                            },
                            {
                              type: 'box',
                              layout: 'vertical',
                              contents: [
                                {
                                  type: 'text',
                                  text: '血壓',
                                  size: 'xs',
                                  color: '#888888'
                                },
                                {
                                  type: 'text',
                                  text: '120/80',
                                  weight: 'bold',
                                  size: 'md',
                                  color: '#D94D4D'
                                }
                              ]
                            },
                            {
                              type: 'box',
                              layout: 'vertical',
                              contents: [
                                {
                                  type: 'text',
                                  text: '血氧',
                                  size: 'xs',
                                  color: '#888888'
                                },
                                {
                                  type: 'text',
                                  text: '96%',
                                  weight: 'bold',
                                  size: 'md',
                                  color: '#D94D4D'
                                }
                              ]
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          contents: [
                            {
                              type: 'text',
                              text: '😌 情緒狀態：平穩',
                              size: 'sm',
                              color: '#AA1D4E'
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          contents: [
                            {
                              type: 'text',
                              text: '🍽 飲食狀況：正常進食',
                              size: 'sm',
                              color: '#AA1D4E'
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          contents: [
                            {
                              type: 'text',
                              text: '🌙 睡眠狀況：淺眠易醒',
                              size: 'sm',
                              color: '#AA1D4E'
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          contents: [
                            {
                              type: 'text',
                              text: '🩺 就醫紀錄：無',
                              size: 'sm',
                              color: '#666666'
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          contents: [
                            {
                              type: 'text',
                              text: '🎨 活動紀錄：園藝課',
                              size: 'sm',
                              color: '#666666'
                            }
                          ]
                        }
                      ]
                    },
                    footer: {
                      type: 'box',
                      layout: 'vertical',
                      contents: [
                        {
                          type: 'button',
                          style: 'primary',
                          color: '#D94D4D',
                          action: {
                            type: 'uri',
                            label: '查看詳細照護數據',
                            uri: process.env.BASE_URL + '/resident/12345'
                          }
                        }
                      ]
                    }
                  }
                }
              ]
            })
            return
          }

          if (command === '填寫照護表單') {
            // 呼叫 /api/customTask，讓它幫忙推送 Flex Message
            await fetch(`${process.env.BASE_URL}/api/customTask`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, action: 'showForm' })
            })
            return
          }


          if (userMessage === '資料') {
            replyText = await getUserDataFromSheets(userId)
          }


          if (userMessage === '通知照服員') {
            replyText = await notifyStaff(userId)
          }

          // Unknown command
          // replyText = "請重試"
        }

        await client.replyMessage({
          replyToken: event.replyToken!, // Add a non-null assertion as replyToken should always exist for message events
          messages: [{
            type: 'text',
            text: replyText,
          }],
        })
      }
    })

    await Promise.all(promises)
    res.status(200).end()
  } catch (error) {
    console.error('LINE webhook error:', error)
    res.status(500).send('Internal Server Error')
  }
}



// using raw data instead of middleware

/* 
import type { NextApiRequest, NextApiResponse } from 'next'
import * as line from '@line/bot-sdk'
import getRawBody from 'raw-body'

const config_line = {
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
}

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const rawBody = await getRawBody(req)
    const signature = req.headers['x-line-signature'] as string

    // Verify signature
    const isValid = line.validateSignature(rawBody, config_line.channelSecret, signature)
    if (!isValid) {
      console.error('❌ Signature validation failed')
      return res.status(401).send('Invalid signature')
    }

    // Parse body manually
    const body = JSON.parse(rawBody.toString()) as line.WebhookRequestBody

    const events = body.events
    const promises = events.map(async (event: line.WebhookEvent) => {
      if (event.type === 'message' && event.message?.type === 'text') {
        const userId = event.source.userId
        const userMessage = event.message.text

        const replyText = `👋 Hello! You said: "${userMessage}". Your user ID is ${userId}.`

        await client.replyMessage({
          replyToken: event.replyToken!,
          messages: [{ type: 'text', text: replyText }],
        })
      }
    })

    await Promise.all(promises)
    res.status(200).end()
  } catch (err) {
    console.error('LINE webhook error:', err)
    res.status(500).send('Internal Server Error')
  }
}
*/