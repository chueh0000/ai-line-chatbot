import '@/app/globals.css'
import { useRouter } from 'next/router'
import { useRef, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS } from 'chart.js'
import { getChartGroup1, getChartGroup2 } from '@/lib/chart'

export default function ResidentPage() {
  const router = useRouter()
  const { id } = router.query

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [name, setName] = useState<string | null>(null)
  const [dayData, setDayData] = useState<any | null>(null)
  const [trend, setTrend] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const chart1Ref = useRef<ChartJS<'line'> | null>(null)
  const chart2Ref = useRef<ChartJS<'line'> | null>(null)

  useEffect(() => {
    const handleResize = () => {
      chart1Ref.current?.resize()
      chart2Ref.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/resident/${id}?date=${date}`)
      .then(res => {
        if (!res.ok) throw new Error('資料載入失敗')
        return res.json()
      })
      .then(res => {
        setName(res.name)
        setDayData(res.singleDayData)
        setTrend(res.trend)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
      })
  }, [id, date])

  if (error) return <div className="p-6 text-red-500">錯誤：{error}</div>
  if (!name || !dayData || !trend) return <div className="p-6">資料載入中...</div>

  return (
    <div className="p-6 space-y-6">
      {/* 標題與日期選擇器 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{name}．照護數據紀錄</h1>
          {/* <p className="text-sm text-gray-500">{date}</p> */}
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          onClick={e => {
            const input = e.target as HTMLInputElement; // Cast to HTMLInputElement
            if (input.showPicker) input.showPicker(); // Safely call showPicker
          }}
          className="border rounded px-3 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-103 hover:shadow-lg transition-transform duration-200"
        />
      </div>

      {/* 單日資料卡片 */}
      <h2 className="text-lg font-semibold mb-2">生理指標</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <InfoCard title="體溫" value={`${dayData.temperature ?? '-'} °C`} />
        <InfoCard title="血氧" value={`${dayData.spo2 ?? '-'} %`} />
        <InfoCard title="呼吸" value={`${dayData.respiration ?? '-'} 次/分`} />
        <InfoCard
          title="血壓"
          value={`${dayData.systolic ?? '-'} / ${dayData.diastolic ?? '-'} mmHg`}
        />
        <InfoCard title="脈搏" value={`${dayData.pulse ?? '-'} 次/分`} />
        <InfoCard title="血糖" value={`${dayData.bloodSugar ?? '-'} mg/dL`} />
      </div>

      <h2 className="text-lg font-semibold mb-2">飲食狀況</h2>
      <div className="grid grid-cols-3 gap-2">
        <InfoCard title="飲食頻率" value="二餐一點心"/>
        <InfoCard title="飲食份量" value="約八成餐量"/>
        <InfoCard title="飲食質量" value="均衡攝取主菜與蔬果"/>
      </div>

      <h2 className="text-lg font-semibold mb-2">用藥狀況</h2>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <InfoCard title="用藥頻率" value="一日三次"/>
        <InfoCard title="用藥內容" value="降壓藥/降糖藥"/>
        <InfoCard title="副作用觀察" value="無不適情形"/>
      </div>

      {/* 多日趨勢 */}
      <h2 className="text-lg font-semibold mb-2">健康趨勢</h2>
      <InfoCard
        title={<span className="font-semibold">📈 趨勢評估</span>}
        value={<span className="text-sm text-gray-600">整體舒張壓與心率穩定，收縮壓偶有輕微波動</span>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow flex justify-center items-center">
          <div className="w-full max-w-[500px]">
            <Line ref={chart1Ref} {...getChartGroup1(trend)} />
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex justify-center items-center">
          <div className="w-full max-w-[500px]">
            <Line ref={chart2Ref} {...getChartGroup2(trend)} />
          </div>
        </div>
      </div>
    </div>
  )
}


function InfoCard({ title, value }: { title: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="info-card">
      <h3 className="info-card-title">{title}</h3>
      <p className="info-card-value">{value}</p>
    </div>
  )
}
