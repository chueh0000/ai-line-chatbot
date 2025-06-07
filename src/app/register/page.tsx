'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Loader2Icon } from "lucide-react"

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: 'family',
    resident_id: '',
    line_id: '',
  })
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [residents, setResidents] = useState<{ id: number; name: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false); // state for loading indicator

  useEffect(() => {
    // 從 localStorage 讀 lineId
    const lineId = localStorage.getItem('lineId') || ''
    setForm((f) => ({ ...f, line_id: lineId }))

    // 取得住民列表
    fetch('/api/residents')
      .then((res) => res.json())
      .then((data) => setResidents(data.residents))
      .catch((error) => {
        console.error('Failed to fetch residents:', error);
        setFeedback({ type: 'error', message: '無法載入住民列表。' });
      });
  }, [])

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null); // Clear previous feedback
    setIsSubmitting(true); // Set submitting state to true

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) { // Check if the response status is in the 200 range (success)
        setFeedback({ type: 'success', message: data.message || '註冊成功！' });
        // Optionally, clear the form after successful registration
        setForm({
          name: '',
          phone: '',
          role: 'family',
          resident_id: '',
          line_id: localStorage.getItem('lineId') || '', // Keep line_id if it's auto-populated
        });
      } else { // Handle HTTP errors (e.g., 400, 409, 500)
        setFeedback({ type: 'error', message: data.message || '註冊失敗，請重試。' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setFeedback({ type: 'error', message: '網路錯誤或伺服器無回應，請檢查連線。' });
    } finally {
      setIsSubmitting(false); // Always set submitting state to false after the request
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 border rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">註冊家屬 / 照服員</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="姓名"
          required
          value={form.name} // Add value prop for controlled component
          onChange={(e) => handleChange('name', e.target.value)}
        />
        <Input
          placeholder="電話"
          required
          value={form.phone} // Add value prop
          onChange={(e) => handleChange('phone', e.target.value)}
        />
        <Select
          onValueChange={(val) => handleChange('role', val)}
          defaultValue={form.role}
        >
          <SelectTrigger>
            <SelectValue placeholder="身份角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="family">家屬</SelectItem>
            <SelectItem value="caregiver">照服員</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          onValueChange={(val) => handleChange('resident_id', val)}
          value={form.resident_id} // Set value from state
        >
          <SelectTrigger>
            <SelectValue placeholder="請選擇照護住民" />
          </SelectTrigger>
          <SelectContent>
            {residents.length > 0 ? (
              residents.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name} (ID: {r.id})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-residents-available" disabled>載入中或無住民可選</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button 
          type="submit" 
          className='hover:shadow-md'
          disabled={isSubmitting} // Disable the button while submitting
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              請稍候...
            </>
          ) : (
            '註冊'
          )}
        </Button>
      </form>
      {/* Display feedback message */}
      {feedback && (
        <p className={`mt-4 text-center font-medium ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {feedback.message}
        </p>
      )}
    </div>
  )
}
