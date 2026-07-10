import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isSameMonth } from 'date-fns'
import { getCalendarDates, getMonthlySummary } from '../api/client'

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function CalendarPanel({ selectedDate, onSelectDate, refreshKey }) {
  const [viewDate, setViewDate] = useState(selectedDate || new Date())
  const [workoutDates, setWorkoutDates] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth() + 1
    Promise.all([
      getCalendarDates(year, month),
      getMonthlySummary(year, month)
    ]).then(([dates, sum]) => {
      setWorkoutDates(dates.map(d => new Date(d + 'T00:00:00')))
      setSummary(sum)
    }).catch(() => {})
  }, [viewDate, refreshKey])

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const leadingBlanks = getDay(monthStart) // 0=Sun

  const prevMonth = () => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const hasWorkout = (day) => workoutDates.some(w => isSameDay(w, day))

  return (
    <div className="calendar-panel">
      <div className="calendar-card">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={prevMonth}>
            <ChevronLeft size={14} />
          </button>
          <span className="calendar-month-title">
            {format(viewDate, 'MMMM yyyy')}
          </span>
          <button className="calendar-nav-btn" onClick={nextMonth}>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="calendar-grid">
          {DAYS_OF_WEEK.map(d => (
            <div key={d} className="calendar-dow">{d}</div>
          ))}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} className="calendar-day empty" />
          ))}
          {days.map(day => {
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const hasW = hasWorkout(day)
            const todayDay = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={[
                  'calendar-day',
                  todayDay ? 'today' : '',
                  isSelected && !todayDay ? 'selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onSelectDate(day)}
              >
                <span>{day.getDate()}</span>
                {hasW && <div className="cal-dot" />}
              </div>
            )
          })}
        </div>
      </div>

      {summary && (
        <div className="summary-card">
          <div className="summary-title">Monthly Summary</div>
          <div className="summary-stats">
            <div>
              <div className="summary-stat-value">{summary.workoutCount}</div>
              <div className="summary-stat-label">Workouts this month</div>
            </div>
            <div className="summary-consistency">
              <div className="summary-consistency-value">{summary.consistencyPercent}%</div>
              <div className="summary-stat-label">Consistency</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
