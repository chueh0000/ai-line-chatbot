import { google } from 'googleapis'
import type { NextApiRequest, NextApiResponse } from 'next'
import * as line from '@line/bot-sdk'

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})

const sheets = google.sheets({ version: 'v4', auth })
const spreadsheetId = process.env.GOOGLE_SHEET_ID!


export async function getUserDataFromSheets(userId: string | undefined): Promise<string> {
  const noData = "❌ Could not find your data in the sheet."
  if (!userId) return Promise.resolve(noData)


  const range = 'Sheet2!A:F'

  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  const rows = response.data.values

  if (!rows) return Promise.resolve(noData)

  for (const row of rows) {
    if (row[2] === userId) {
      // Assuming the rest of the row is user-specific data
      return Promise.resolve("Here is your data:\n\n" + row.slice(2).join(', '))
    }
  }

  return Promise.resolve(noData)
}


export async function notifyStaff(userId: string | undefined): Promise<string> {
  const noData = "沒有照服員資料，請稍後再試。"
  if (!userId) return Promise.resolve(noData)

  const range = 'Sheet2!A:D'

  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  const rows = response.data.values

  if (!rows) return Promise.resolve(noData)

  for (const row of rows) {
    if (row[2] === userId) {
      const staffId = row[3]
      const residentName = row[1]
      const staffMessage = `📩 有新的通知來自 ${residentName} 的家屬，請查看。`

      await client.pushMessage({
        to: staffId,
        messages: [
          {
            type: 'text',
            text: staffMessage,
          },
        ],
      })

      // Notify the user that the staff has been informed
      return Promise.resolve("已經通知照服員，請稍等。")
    }
  }

  return Promise.resolve(noData)
}

export async function fetchResidentDataWithTrend(id: string, targetDate: string) {
  // Step 1: 查 UUID → 名稱
  const mapRes = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: `sheet2!A2:B`,
  })
  const mapRows = mapRes.data.values || []
  const resident = mapRows.find(row => row[0] === id)
  if (!resident) throw new Error('找不到對應住民 UUID')
  const residentName = resident[1]

  // Step 2: 抓資料表
  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: `sheet1!A1:Z`,
  })
  const [headerRow, ...rows] = dataRes.data.values || []

  const nameIndex = headerRow.findIndex(cell => cell === residentName)
  if (nameIndex === -1) throw new Error('找不到住民欄位')

  // Step 3: 找目標日期的 index
  // 將資料按日期升冪排序（以確保從早到晚）
  const sortedRows = rows
    .filter(row => row[0]) // 確保有日期
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())

  // 找出選擇日期的 index
  const dateIndex = sortedRows.findIndex(row => row[0] === targetDate.replace(/-/g, '/'))
  if (dateIndex === -1) throw new Error('找不到指定日期')

  // 往前找 6 天，共 7 筆
  const recentRows = sortedRows.slice(Math.max(0, dateIndex - 6), dateIndex + 1)

  const parseRow = (row: string[]) => ({
    date: row[0],
    temperature: parseFloat(row[nameIndex]),
    pulse: parseInt(row[nameIndex + 1]),
    respiration: parseInt(row[nameIndex + 2]),
    systolic: parseInt((row[nameIndex + 3] || '').split('/')[0] || '0'),
    diastolic: parseInt((row[nameIndex + 3] || '').split('/')[1] || '0'),
    spo2: parseInt(row[nameIndex + 4]),
    bloodSugar: parseFloat(row[nameIndex + 5]),
  })

  const trend = recentRows.map(parseRow)
  const singleDayData = parseRow(rows[dateIndex])

  return { name: residentName, singleDayData, trend }
}