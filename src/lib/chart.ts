import { TrendData } from '@/pages/resident/[id]'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js'

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
)


function formatDate(dateStr: string) {
	const date = new Date(dateStr)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}/${dd}`
}

export function getChartGroup1(trend: TrendData[]): {
  data: ChartData<'line'>
  options: ChartOptions<'line'>
} {
  const sorted = [...trend].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    data: {
      labels: sorted.map(d => formatDate(d.date)),
      datasets: [
        {
          label: '體溫 (°C)',
          data: sorted.map(d => d.temperature || 0),
          borderColor: 'rgb(255, 99, 132)',
          fill: false,
          tension: 0.3,
        },
        {
          label: '血氧 (%)',
          data: sorted.map(d => d.spo2 || 0),
          borderColor: 'rgb(75, 192, 192)',
          fill: false,
          tension: 0.3,
        },
        {
          label: '呼吸 (次/分)',
          data: sorted.map(d => d.respiration || 0),
          borderColor: 'rgb(153, 102, 255)',
          fill: false,
          tension: 0.3,
        },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
      },
      scales: {
        y: { beginAtZero: false },
      },
			interaction: {
				mode: 'nearest',
				intersect: false,
			},
    },
  }
}

export function getChartGroup2(trend: TrendData[]): {
  data: ChartData<'line'>
  options: ChartOptions<'line'>
} {
  const sorted = [...trend].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    data: {
      labels: sorted.map(d => formatDate(d.date)),
      datasets: [
        {
          label: '收縮壓 (mmHg)',
          data: sorted.map(d => d.systolic || 0),
          borderColor: 'rgb(255, 159, 64)',
          fill: false,
          tension: 0.3,
        },
        {
          label: '舒張壓 (mmHg)',
          data: sorted.map(d => d.diastolic || 0),
          borderColor: 'rgb(255, 205, 86)',
          fill: false,
          tension: 0.3,
        },
        {
          label: '血糖 (mg/dL)',
          data: sorted.map(d => d.bloodSugar || 0),
          borderColor: 'rgb(201, 203, 207)',
          fill: false,
          tension: 0.3,
        },
        {
          label: '脈搏 (次/分)',
          data: sorted.map(d => d.pulse || 0),
          borderColor: 'rgb(54, 162, 235)',
          fill: false,
          tension: 0.3,
        },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
      },
      scales: {
        y: { beginAtZero: false },
      },
			interaction: {
				mode: 'nearest',
				intersect: false,
			},
    },
  }
}

