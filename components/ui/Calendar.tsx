 'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTaskStore } from '../../store/useTaskStore'

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}
function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function CalendarModal() {
  const { tasks, fetchTasks, isLoading } = useTaskStore()
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    // load user tasks (dashboard view: all tasks for user)
    fetchTasks()
  }, [fetchTasks])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    tasks.forEach((t: any) => {
      if (!t.dueDate) return
      const d = new Date(t.dueDate)
      const key = d.toDateString()
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [tasks])

  const first = startOfMonth(cursor)
  const last = endOfMonth(cursor)
  // compute start of calendar grid (Sunday before or equal to first)
  const gridStart = addDays(first, -first.getDay())
  const gridEnd = addDays(last, 6 - last.getDay())

  const days: Date[] = []
  for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
    days.push(new Date(d))
  }

  const prevMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  const nextMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))

  const dayTasks = (d: Date) => grouped[d.toDateString()] || []

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
        <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        <span className="text-sm font-medium">View Calendar</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button onClick={prevMonth} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">◀</button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3>
                <button onClick={nextMonth} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">▶</button>
              </div>
              <div>
                <button onClick={() => { setOpen(false); setSelectedDay(null) }} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded">Close</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> (
                <div key={d} className="text-gray-500 dark:text-gray-400">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                const inMonth = d.getMonth() === cursor.getMonth()
                const key = d.toDateString()
                const list = dayTasks(d)
                return (
                  <button key={key} onClick={() => setSelectedDay(d)} className={`p-2 h-20 flex flex-col items-start justify-between rounded ${inMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/60'} hover:bg-gray-100 dark:hover:bg-gray-700`}>
                    <div className="w-full flex items-center justify-between">
                      <span className={`text-sm ${inMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{d.getDate()}</span>
                      {list.length > 0 && <span className="inline-flex items-center justify-center text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">{list.length}</span>}
                    </div>
                    <div className="w-full text-xs text-left text-gray-500 dark:text-gray-400 line-clamp-2">
                      {list.slice(0,2).map((t:any)=> (
                        <div key={t.id} className="truncate">• {t.title}</div>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4">
              {selectedDay ? (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Tasks for {selectedDay.toDateString()}</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    { (grouped[selectedDay.toDateString()] || []).map((t:any)=> (
                      <div key={t.id} className="p-2 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t.project?.name || 'No project'}</div>
                      </div>
                    )) }
                    { (grouped[selectedDay.toDateString()] || []).length === 0 && (
                      <div className="text-sm text-gray-500">No tasks for this day</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Select a day to see tasks</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
