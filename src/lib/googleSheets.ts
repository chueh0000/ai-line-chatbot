import { google } from 'googleapis'
import * as line from '@line/bot-sdk'

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY,
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

  const normalizedTarget = targetDate.replace(/-/g, '/')
  let dateIndex = sortedRows.findIndex(row => row[0] === normalizedTarget)
  let exactMatch = true

  // If exact date not found, fallback to nearest earlier date (or next available if none earlier)
  if (dateIndex === -1) {
    exactMatch = false
    const targetTime = new Date(normalizedTarget).getTime()
    const times = sortedRows.map(r => new Date(r[0]).getTime())

    // prefer the latest date strictly before targetTime
    let prevIndex = -1
    for (let i = 0; i < times.length; i++) {
      if (times[i] < targetTime) prevIndex = i
    }

    if (prevIndex !== -1) {
      dateIndex = prevIndex
    } else {
      // if no earlier date, pick the earliest date after targetTime
      const nextIndex = times.findIndex(t => t > targetTime)
      if (nextIndex !== -1) {
        dateIndex = nextIndex
      } else {
        // no rows at all or cannot find any date to use
        throw new Error('找不到指定日期或可用的替代日期')
      }
    }
  }

  // 往前找 6 天，共 7 筆（基於已選定的 dateIndex）
  const recentRows = sortedRows.slice(Math.max(0, dateIndex - 6), dateIndex + 1)

  const parseRow = (row: string[]) => ({
    date: row[0],
    temperature: (() => {
      const v = parseFloat(row[nameIndex])
      return isNaN(v) ? undefined : v
    })(),
    pulse: (() => {
      const v = parseInt(row[nameIndex + 1])
      return isNaN(v) ? undefined : v
    })(),
    respiration: (() => {
      const v = parseInt(row[nameIndex + 2])
      return isNaN(v) ? undefined : v
    })(),
    systolic: (() => {
      const bp = (row[nameIndex + 3] || '')
      const s = bp.split('/')[0] || ''
      const v = parseInt(s)
      return isNaN(v) ? undefined : v
    })(),
    diastolic: (() => {
      const bp = (row[nameIndex + 3] || '')
      const d = bp.split('/')[1] || ''
      const v = parseInt(d)
      return isNaN(v) ? undefined : v
    })(),
    spo2: (() => {
      const v = parseInt(row[nameIndex + 4])
      return isNaN(v) ? undefined : v
    })(),
    bloodSugar: (() => {
      const v = parseFloat(row[nameIndex + 5])
      return isNaN(v) ? undefined : v
    })(),
  })

  const trend = recentRows.map(parseRow)
  // singleDayData should use the chosen (possibly fallback) sortedRows[dateIndex]
  const singleDayData = parseRow(sortedRows[dateIndex])

  // Include extra metadata so the caller can show a fallback notice if needed
  return {
    name: residentName,
    singleDayData,
    trend,
    dateUsed: sortedRows[dateIndex][0], // the actual date string used from the sheet (YYYY/MM/DD)
    exactDateMatch: exactMatch,
  }
}