import type { NextApiRequest, NextApiResponse } from 'next'
import * as line from '@line/bot-sdk'
import { parseCommand } from '@/utils/commandParser'
import { getUserDataFromSheets, notifyStaff } from '@/lib/googleSheets'
import { buildFlexMessage, buildResidentBubble } from '@/lib/flexBuilder'

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

          if (command === '照護紀錄') {
            const message: line.FlexMessage = buildFlexMessage(
                '點此查看詳細照護紀錄',
                buildResidentBubble({
                  id: '12345',
                  date: '2025-06-09',
                  imageUrl: 'https://stickershop.line-scdn.net/stickershop/v1/product/25219285/LINEStorePC/main.png?v=1',
                  name: '陳爺爺',
                  summary: '午睡充足，進食八分，無不適感。',
                  temperature: '36.5°C',
                  bloodPressure: '120/80',
                  bloodOxygen: '98%',
                  mood: '平穩',
                  food: '正常進食',
                  sleep: '淺眠易醒',
                  medicalRecord: '無',
                  activity: '園藝課',
                })
              );
            await client.replyMessage({
              replyToken: event.replyToken!,
              messages: [message as line.messagingApi.Message],
            })
            return
          }

          if (command === '個別化照護需求' || command === '自定義照護任務') {
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
        }

        if (replyText === `👋 嗨! 您的 ID 是 ${userId}`) {
          return
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