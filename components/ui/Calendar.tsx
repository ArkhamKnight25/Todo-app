'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTaskStore } from '@/store/useTaskStore'

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export default function CalendarModal() {
  const { tasks, fetchTasks } = useTaskStore()
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const grouped = useMemo(() => {
    const map: Record<string, typeof tasks> = {}
    tasks.forEach((task) => {
      if (!task.dueDate) return
      const key = new Date(task.dueDate).toDateString()
      if (!map[key]) {
        map[key] = []
      }
      map[key].push(task)
    })
    return map
  }, [tasks])

  const first = startOfMonth(cursor)
  const last = endOfMonth(cursor)
  const gridStart = addDays(first, -first.getDay())
  const gridEnd = addDays(last, 6 - last.getDay())

  const days: Date[] = []
  for (let day = new Date(gridStart); day <= gridEnd; day = addDays(day, 1)) {
    days.push(new Date(day))
  }

  const dayTasks = (date: Date) => grouped[date.toDateString()] || []

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg className="mr-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium">View Calendar</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-3xl rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Previous month"
                >
                  &lt;
                </button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Next month"
                >
                  &gt;
                </button>
              </div>
              <button
                onClick={() => {
                  setOpen(false)
                  setSelectedDay(null)
                }}
                className="rounded bg-gray-100 px-3 py-1 dark:bg-gray-700"
              >
                Close
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date) => {
                const inMonth = date.getMonth() === cursor.getMonth()
                const list = dayTasks(date)

                return (
                  <button
                    key={date.toDateString()}
                    onClick={() => setSelectedDay(date)}
                    className={`flex h-20 flex-col items-start justify-between rounded p-2 text-left ${
                      inMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/60'
                    } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={`text-sm ${inMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                        {date.getDate()}
                      </span>
                      {list.length > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                          {list.length}
                        </span>
                      )}
                    </div>
                    <div className="w-full line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {list.slice(0, 2).map((task) => (
                        <div key={task.id} className="truncate">
                          - {task.title}
                        </div>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4">
              {selectedDay ? (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Tasks for {selectedDay.toDateString()}</h4>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {(grouped[selectedDay.toDateString()] || []).map((task) => (
                      <div key={task.id} className="rounded border bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{task.project?.name || 'No project'}</div>
                      </div>
                    ))}
                    {(grouped[selectedDay.toDateString()] || []).length === 0 && (
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
