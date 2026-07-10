import { useState, useEffect, useRef } from 'react'
import { TrendingUp, ChevronDown, Activity, BarChart2, Clock } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getAllExercises, getExerciseProgress, getMuscleVolumeProgress, getRecentlyLoggedExercises } from '../api/client'

const METRICS = [
  { key: 'maxWeight', label: 'Max Weight' },
  { key: 'totalVolume', label: 'Total Volume' },
  { key: 'bestSetVolume', label: 'Best Set Vol.' },
  { key: 'estimatedOneRepMax', label: 'Est. 1RM' },
]

const MUSCLE_COLORS = {
  Legs: '#f97316',
  Back: '#3b82f6',
  Chest: '#06b6d4',
  Shoulders: '#8b5cf6',
  Triceps: '#d946ef',
  Biceps: '#22c55e',
  Other: '#64748b'
}

const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  const m = METRICS.find(x => x.key === metric)
  const unit = metric === 'maxWeight' || metric === 'estimatedOneRepMax' ? 'kg'
    : metric === 'totalVolume' || metric === 'bestSetVolume' ? 'kg·reps' : ''
  return (
    <div className="card" style={{ padding: '10px 14px', minWidth: 140 }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {val?.toLocaleString()} {unit}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m?.label}</p>
    </div>
  )
}

const VolumeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum, entry) => sum + entry.value, 0)
  
  return (
    <div className="card" style={{ padding: '10px 14px', minWidth: 160 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map(entry => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 2 }}>
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span style={{ fontWeight: 600 }}>{entry.value.toLocaleString()} kg</span>
        </div>
      ))}
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
        <span>Total</span>
        <span>{total.toLocaleString()} kg</span>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [viewMode, setViewMode] = useState('exercise') // 'exercise' or 'volume'
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [recentExercises, setRecentExercises] = useState([])
  const dropdownRef = useRef(null)
  
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  // Exercise state
  const [metric, setMetric] = useState('maxWeight')
  const [chartData, setChartData] = useState([])
  
  // Volume state
  const [volumeData, setVolumeData] = useState([])
  const [volumeSummary, setVolumeSummary] = useState({ total: 0, topMuscle: '-', peakWeek: 0 })
  const [activeMuscles, setActiveMuscles] = useState([])

  const [loadingChart, setLoadingChart] = useState(false)

  useEffect(() => {
    getAllExercises().then(data => setExercises(data.sort((a, b) => a.name.localeCompare(b.name)))).catch(() => {})
    getRecentlyLoggedExercises(10).then(setRecentExercises).catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch Exercise Progress
  useEffect(() => {
    if (viewMode !== 'exercise' || !selectedExercise) return
    setLoadingChart(true)
    getExerciseProgress(selectedExercise.id, startDate, endDate)
      .then(data => setChartData(data.map(d => ({ ...d, date: format(new Date(d.date + 'T00:00:00'), 'MMM d') }))))
      .catch(() => setChartData([]))
      .finally(() => setLoadingChart(false))
  }, [viewMode, selectedExercise, startDate, endDate])

  // Fetch Volume Progress
  useEffect(() => {
    if (viewMode !== 'volume') return
    setLoadingChart(true)
    getMuscleVolumeProgress(startDate, endDate)
      .then(data => {
        const byDate = {}
        let total = 0
        const muscleTotals = {}
        let peakWeekVol = 0
        const muscles = new Set()

        Object.entries(data).forEach(([muscle, points]) => {
          muscles.add(muscle)
          muscleTotals[muscle] = 0
          points.forEach(pt => {
            const iso = pt.date
            if (!byDate[iso]) byDate[iso] = { date: iso }
            byDate[iso][muscle] = pt.totalVolume
            
            total += pt.totalVolume
            muscleTotals[muscle] += pt.totalVolume
          })
        })

        const chartArr = Object.values(byDate)
          .sort((a,b) => a.date.localeCompare(b.date))
          .map(d => ({ ...d, label: format(new Date(d.date + 'T00:00:00'), 'MMM d') }))
        
        chartArr.forEach(day => {
          const dayTotal = Object.keys(day).filter(k => k !== 'date' && k !== 'label').reduce((sum, k) => sum + day[k], 0)
          if (dayTotal > peakWeekVol) peakWeekVol = dayTotal
        })

        let topMuscle = '-'
        let maxM = 0
        Object.entries(muscleTotals).forEach(([m, v]) => {
          if (v > maxM) { maxM = v; topMuscle = m }
        })

        setVolumeData(chartArr)
        setVolumeSummary({ total, topMuscle, peakWeek: peakWeekVol })
        setActiveMuscles(Array.from(muscles))
      })
      .catch(() => setVolumeData([]))
      .finally(() => setLoadingChart(false))
  }, [viewMode, startDate, endDate])



  return (
    <div className="page-container">
      <div className="progress-page">
        
        <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="progress-title">
              <TrendingUp size={22} color="var(--purple-light)" />
              Progress Tracker
            </div>
            <p className="progress-subtitle">
              {viewMode === 'exercise' ? 'Track your strength gains over time' : 'Weekly training tonnage broken down by muscle group.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'exercise' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('exercise')}
              style={{ padding: '6px 12px' }}
            >
              <TrendingUp size={14} /> Exercise
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'volume' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('volume')}
              style={{ padding: '6px 12px' }}
            >
              <BarChart2 size={14} /> Muscle Volume
            </button>
          </div>
        </div>

        <div className="progress-controls">
          <div className="controls-row">
            {viewMode === 'exercise' && (
              <div className="control-group" style={{ flex: 2, position: 'relative' }} ref={dropdownRef}>
                <div className="control-label">Exercise</div>
                <button
                  className="exercise-dropdown-trigger"
                  onClick={() => setDropdownOpen(prev => !prev)}
                >
                  <span
                    className="exercise-dropdown-value"
                    style={!selectedExercise ? { color: 'var(--text-muted)' } : {}}
                  >
                    {selectedExercise ? selectedExercise.name : 'Select an exercise...'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`exercise-dropdown-chevron ${dropdownOpen ? 'open' : ''}`}
                  />
                </button>
                {dropdownOpen && (
                  <div className="exercise-dropdown-menu">
                    <div className="exercise-dropdown-header">
                      <Clock size={13} />
                      Recent Exercises
                    </div>
                    {recentExercises.length === 0 ? (
                      <div className="exercise-dropdown-empty">No recent exercises found</div>
                    ) : (
                      recentExercises.map(ex => (
                        <div
                          key={ex.id}
                          className={`exercise-dropdown-item ${selectedExercise?.id === ex.id ? 'active' : ''}`}
                          onClick={() => { setSelectedExercise(ex); setDropdownOpen(false) }}
                        >
                          <span className="exercise-dropdown-name">{ex.name}</span>
                          <span className="exercise-dropdown-muscle">{ex.targetMuscle}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="control-group">
              <div className="control-label">From</div>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div className="control-group">
              <div className="control-label">To</div>
              <input
                type="date"
                className="input"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {viewMode === 'exercise' && (
            <div>
              <div className="control-label" style={{ marginBottom: 8 }}>Metric</div>
              <div className="metric-tabs">
                {METRICS.map(m => (
                  <button
                    key={m.key}
                    className={`metric-tab ${metric === m.key ? 'active' : ''}`}
                    onClick={() => setMetric(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {viewMode === 'exercise' ? (
          (() => {
            const showBestSets = metric === 'bestSetVolume' && selectedExercise && !loadingChart && chartData?.filter(d => d?.bestSetVolume > 0).length > 0;
            return (
              <div style={{ display: 'flex', gap: 24, width: '100%' }}>
                <div className="chart-container" style={{ position: 'relative', flex: showBestSets ? '0 0 calc(80% - 12px)' : '1', minWidth: 0 }}>
                  {!selectedExercise ? (
                    <div className="chart-empty">
                      <TrendingUp size={48} />
                      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select an exercise to view progress</p>
                      <p style={{ fontSize: '0.8rem' }}>Search and select an exercise above to get started</p>
                    </div>
                  ) : loadingChart ? (
                    <div className="spinner" />
                  ) : chartData.length === 0 ? (
                    <div className="chart-empty">
                      <TrendingUp size={48} />
                      <p style={{ color: 'var(--text-secondary)' }}>No data in this date range</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="99%" height={320}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip metric={metric} />} />
                        <Line
                          type="monotone"
                          dataKey={metric}
                          stroke="#8b5cf6"
                          strokeWidth={2.5}
                          dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#a78bfa' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {showBestSets && (
                  <div style={{ flex: '0 0 calc(20% - 12px)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24, minHeight: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24, textTransform: 'uppercase' }}>Best Sets</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', alignItems: 'center' }}>
                      {chartData.filter(d => d?.bestSetVolume > 0).sort((a, b) => b.bestSetVolume - a.bestSetVolume).slice(0, 3).map((d, i, arr) => {
                        let dateLabel = d.date;
                        try {
                          const dateStr = d.date.includes('T') ? d.date : d.date + 'T00:00:00';
                          dateLabel = format(new Date(dateStr), 'MMM d, yyyy');
                        } catch(e) {}
                        return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>{dateLabel}</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.2rem', marginBottom: 4 }}>{d.bestSetWeight || 0} kg × {d.bestSetReps || 0}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{Number(d.bestSetVolume).toLocaleString()} kg vol</div>
                          </div>
                          {i < arr.length - 1 && (
                            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 20, width: '100%' }} />
                          )}
                        </div>
                      )})}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div>
            <div className="chart-container" style={{ position: 'relative', marginBottom: 20 }}>
              {loadingChart ? (
                <div className="spinner" />
              ) : volumeData.length === 0 ? (
                <div className="chart-empty">
                  <Activity size={48} />
                  <p style={{ color: 'var(--text-secondary)' }}>No volume data in this date range</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={volumeData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    />
                    <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    {activeMuscles.map(m => (
                      <Bar key={m} dataKey={m} stackId="a" fill={MUSCLE_COLORS[m] || MUSCLE_COLORS.Other} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Summary cards below chart */}
            {volumeData.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {volumeSummary.total.toLocaleString()} kg
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Volume</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {volumeSummary.topMuscle}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Top Muscle</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {volumeSummary.peakWeek.toLocaleString()} kg
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Peak Week</div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
