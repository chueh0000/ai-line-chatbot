import type { NextApiRequest, NextApiResponse } from 'next'
import * as line from '@line/bot-sdk'
// import { middleware as lineMiddleware, Client, middleware } from '@line/bot-sdk'

// create LINE SDK config from env variables
const config = {
	channelSecret: process.env.LINE_CHANNEL_SECRET || '',
}

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
});

// This disables the default body parser so LINE can verify the signature
export const configApi = {
  api: {
    bodyParser: false,
  },
}

// Apply LINE middleware
const runMiddleware = (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  return new Promise((resolve, reject) => {
    line.middleware(config)(req as any, res as any, (result: unknown) =>
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

    const events = (req as any).body.events

    const promises = events.map(async (event: any) => {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId
        const userMessage = event.message.text

        // TODO: You can handle commands here (e.g. /summary, /chart, etc.)

        const replyText = `👋 Hello! You said: "${userMessage}". Your user ID is ${userId}.`

        await client.replyMessage({
					replyToken: event.replyToken,
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
