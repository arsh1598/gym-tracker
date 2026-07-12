import { useState, useEffect } from 'react'
import { Search, X, Plus } from 'lucide-react'
import { getAllExercises, createExercise } from '../api/client'
import { MUSCLE_COLORS } from '../utils/muscleColors'

export default function ExerciseSelector({ onSelect, onClose }) {
  const [exercises, setExercises] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [newMuscle, setNewMuscle] = useState('Chest')
  const [addingNew, setAddingNew] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAllExercises().then(data => {
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name))
      setExercises(sorted)
      setFiltered(sorted)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(exercises.filter(e => e.name.toLowerCase().includes(q)))
    if (search && exercises.every(e => !e.name.toLowerCase().includes(q))) {
      setAddingNew(true)
      setNewName(search)
    } else {
      setAddingNew(false)
    }
  }, [search, exercises])

  const handleCreateAndSelect = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const created = await createExercise({ name: newName.trim(), targetMuscle: newMuscle })
      onSelect(created)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Exercise</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-search">
          <Search size={16} className="modal-search-icon" />
          <input
            className="input"
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="exercise-list-scroll">
          {filtered.length === 0 && !addingNew && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '0.875rem' }}>
              No exercises found
            </div>
          )}
          {filtered.map(ex => (
            <div key={ex.id} className="exercise-list-item" onClick={() => onSelect(ex)}>
              <div
                className="muscle-dot"
                style={{ background: MUSCLE_COLORS[ex.targetMuscle] || MUSCLE_COLORS.Other }}
              />
              <span className="exercise-list-item-name">{ex.name}</span>
              <span className="exercise-list-item-muscle">{ex.targetMuscle}</span>
            </div>
          ))}
        </div>

        {(addingNew || (search && filtered.length === 0)) && (
          <div className="modal-new-exercise">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
              Create new exercise "{newName}"
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Exercise name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                className="muscle-select"
                value={newMuscle}
                onChange={e => setNewMuscle(e.target.value)}
              >
                {['Chest','Back','Legs','Shoulders','Biceps','Triceps','Core'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={handleCreateAndSelect}
                disabled={loading}
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
