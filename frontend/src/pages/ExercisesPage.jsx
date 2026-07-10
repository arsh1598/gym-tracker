import { useState, useEffect } from 'react'
import { ListChecks, Search } from 'lucide-react'
import { getAllExercises, updateExercise } from '../api/client'
import { useToast } from '../components/ToastProvider'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core']
const MUSCLE_COLORS = {
  Chest: '#8b5cf6', Back: '#3b82f6', Legs: '#f59e0b',
  Shoulders: '#10b981', Biceps: '#22c55e', Triceps: '#f97316',
  Core: '#06b6d4',
}

function muscleCount(exercises, muscle) {
  return exercises.filter(e => e.targetMuscle === muscle).length
}

export default function ExercisesPage() {
  const toast = useToast()
  const [exercises, setExercises] = useState([])
  const [filteredMuscle, setFilteredMuscle] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllExercises()
      .then(data => setExercises(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleMuscleChange = async (id, muscle) => {
    const ex = exercises.find(e => e.id === id)
    if (!ex) return
    try {
      const updated = await updateExercise(id, { ...ex, targetMuscle: muscle })
      setExercises(prev => prev.map(e => e.id === id ? updated : e))
      toast('Target muscle updated!', 'success')
    } catch {
      toast('Failed to update', 'error')
    }
  }

  const displayed = exercises.filter(ex => {
    const matchesMuscle = !filteredMuscle || ex.targetMuscle === filteredMuscle
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    return matchesMuscle && matchesSearch
  })

  return (
    <div className="page-container">
      <div className="exercises-page">
        <div className="exercises-header">
          <ListChecks size={22} color="var(--purple-light)" />
          <h1 className="exercises-title">Exercises</h1>
        </div>
        <p className="exercises-subtitle">
          {exercises.length} exercises in your history. Configure target muscles to improve volume tracking.
        </p>

        <div className="muscle-filter-bar">
          {MUSCLE_GROUPS.map(m => (
            <button
              key={m}
              className={`muscle-chip ${filteredMuscle === m ? 'active' : ''}`}
              onClick={() => setFilteredMuscle(prev => prev === m ? null : m)}
            >
              <div
                className="muscle-dot"
                style={{ background: MUSCLE_COLORS[m], width: 8, height: 8 }}
              />
              {m}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {muscleCount(exercises, m)}
              </span>
            </button>
          ))}
        </div>

        <div className="search-wrapper mb-3">
          <Search size={15} className="search-icon" />
          <input
            className="input"
            placeholder="Filter exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="exercises-table-container">
          <table className="exercises-table">
            <thead className="exercises-table-head">
              <tr>
                <th>Exercise</th>
                <th style={{ width: 180, textAlign: 'right' }}>Target Muscle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: 40 }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No exercises found
                  </td>
                </tr>
              ) : (
                displayed.map(ex => (
                  <tr key={ex.id}>
                    <td>
                      <div className="exercise-name-cell">
                        <div
                          className="muscle-dot"
                          style={{ background: MUSCLE_COLORS[ex.targetMuscle] || '#6b7280' }}
                        />
                        {ex.name}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <select
                        className="muscle-select"
                        value={ex.targetMuscle || ''}
                        onChange={e => handleMuscleChange(ex.id, e.target.value)}
                      >
                        <option value="">None</option>
                        {MUSCLE_GROUPS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
