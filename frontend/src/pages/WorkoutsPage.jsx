import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { History, Save, Plus, ChevronDown, Trash2, Calendar, Activity, X } from 'lucide-react'
import CalendarPanel from '../components/CalendarPanel'
import ExerciseCard from '../components/ExerciseCard'
import { useToast } from '../components/ToastProvider'
import {
  getWorkoutByDate, saveWorkout, deleteWorkoutByDate, getRecentWorkouts,
  getWorkoutById, getAllExercises, createExercise, getAllPRs
} from '../api/client'

// ── Title autocomplete ────────────────────────────────────────────────────────
function TitleAutocomplete({ value, onChange, onLoadWorkout }) {
  const [suggestions, setSuggestions] = useState([])
  const [allWorkouts, setAllWorkouts] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  // Track whether the value was set by user typing vs programmatic load
  const userTypingRef = useRef(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    getRecentWorkouts(50).then(setAllWorkouts).catch(() => {})
  }, [])

  useEffect(() => {
    // Only show dropdown if user is actively typing
    if (!userTypingRef.current) return
    if (!value.trim()) { setSuggestions([]); setShowDropdown(false); return }
    const q = value.toLowerCase()
    const seen = new Set()
    const hits = allWorkouts.filter(w => {
      if (!w.title) return false
      const key = w.title.toLowerCase()
      if (!key.includes(q)) return false
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    setSuggestions(hits.slice(0, 6))
    setShowDropdown(hits.length > 0)
  }, [value, allWorkouts])

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = async (workout) => {
    setShowDropdown(false)
    userTypingRef.current = false
    try {
      const full = await getWorkoutById(workout.id)
      onLoadWorkout(full)
    } catch {}
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        className="input"
        placeholder="Day title (e.g. Chest Day, Push Day)..."
        value={value}
        onChange={e => {
          userTypingRef.current = true
          onChange(e.target.value)
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="title-autocomplete-dropdown">
          {suggestions.map(w => (
            <div key={w.id} className="title-autocomplete-item" onMouseDown={() => handleSelect(w)}>
              <span className="title-autocomplete-title">{w.title}</span>
              <span className="title-autocomplete-date">
                {format(new Date(w.date + 'T00:00:00'), 'MMM d, yyyy')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Load previous dropdown ────────────────────────────────────────────────────
function LoadPreviousDropdown({ onLoad }) {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    if (open && recent.length === 0) {
      getRecentWorkouts(8).then(setRecent).catch(() => {})
    }
  }, [open])

  const handleLoad = async (w) => {
    try {
      const full = await getWorkoutById(w.id)
      onLoad(full)
      setOpen(false)
    } catch {
      setOpen(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="load-previous-btn" onClick={() => setOpen(o => !o)}>
        <History size={14} />
        Load previous
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div className="load-previous-dropdown">
            {recent.length === 0 && (
              <div className="load-previous-item" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No previous workouts
              </div>
            )}
            {recent.map(w => (
              <div key={w.id} className="load-previous-item" onClick={() => handleLoad(w)}>
                <div className="load-previous-item-date">
                  {format(new Date(w.date + 'T00:00:00'), 'EEE, MMM d yyyy')}
                </div>
                {w.title && <div className="load-previous-item-title">{w.title}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ date, onConfirm, onCancel, deleting }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: 'var(--red)' }}>Delete Workout</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
          Are you sure you want to delete the workout for <strong style={{ color: 'var(--text-primary)' }}>{format(date, 'EEEE, MMMM d yyyy')}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={deleting}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {deleting ? <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--red)' }} /> : <Trash2 size={14} />}
            Delete Workout
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
const newSet = (override = {}) => ({
  setNumber: 1, weight: null, reps: null, rpe: null, isDropSet: false, ...override
})

export default function WorkoutsPage() {
  const toast = useToast()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hasExistingWorkout, setHasExistingWorkout] = useState(false)
  const [mobileModal, setMobileModal] = useState(null)

  const scrollableRef = useRef(null)
  const exercisesEndRef = useRef(null)

  // Load workout when date changes
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    setLoading(true)
    setHasExistingWorkout(false)
    getWorkoutByDate(dateStr)
      .then(data => {
        if (data) {
          setHasExistingWorkout(true)
          setTitle(data.title || '')
          setNotes(data.notes || '')
          setExercises(data.workoutExercises.map(we => ({
            id: we.id,
            exercise: we.exercise,
            sets: we.sets.map(s => ({ ...s })),
          })))
        } else {
          setTitle('')
          setNotes('')
          setExercises([])
        }
      })
      .catch(() => {
        setTitle('')
        setNotes('')
        setExercises([])
      })
      .finally(() => setLoading(false))
  }, [selectedDate])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (exercisesEndRef.current) {
        exercisesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    })
  }, [])

  const scrollToBottomIfNearBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollableRef.current
      if (el && exercisesEndRef.current) {
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 250
        if (isNearBottom) {
          exercisesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      }
    })
  }, [])

  const handleAddExercise = useCallback(async () => {
    const tempExercise = {
      id: `temp-${Date.now()}`,
      name: '',
      targetMuscle: null,
      _isNew: true,
    }
    setExercises(prev => [...prev, { exercise: tempExercise, sets: [newSet({ setNumber: 1 })] }])
    scrollToBottom()
  }, [scrollToBottom])

  const handleLoadPrevious = useCallback((workout) => {
    setTitle(workout.title || '')
    setNotes(workout.notes || '')
    setExercises(workout.workoutExercises.map(we => ({
      exercise: we.exercise,
      sets: we.sets.map(s => ({ ...s, id: undefined })),
    })))
    toast('Previous workout loaded!', 'success')
  }, [toast])

  const handleLoadFromTitle = useCallback((workout) => {
    setTitle(workout.title || '')
    setNotes(workout.notes || '')
    setExercises(workout.workoutExercises.map(we => ({
      exercise: we.exercise,
      sets: we.sets.map(s => ({ ...s, id: undefined })),
    })))
    toast('Workout loaded from title!', 'success')
  }, [toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      let oldPRs = []
      try {
        oldPRs = await getAllPRs()
      } catch (err) {}

      const allEx = await getAllExercises()
      const resolvedExercises = await Promise.all(
        exercises.map(async (we) => {
          if (we.exercise._isNew) {
            const name = we.exercise.name?.trim()
            if (!name) return null
            const existing = allEx.find(e => e.name.toLowerCase() === name.toLowerCase())
            const ex = existing || await createExercise({ name, targetMuscle: 'Other' })
            return { ...we, exercise: ex }
          }
          return we
        })
      )
      const valid = resolvedExercises.filter(Boolean)

      const brokenPRs = []
      valid.forEach((we) => {
        const exId = we.exercise.id
        const oldPR = oldPRs.find(pr => pr.exerciseId === exId)
        
        let bestSet = null
        we.sets.forEach(set => {
          if (set.weight != null && set.reps != null) {
            if (!bestSet) bestSet = set
            else if (set.weight > bestSet.weight) bestSet = set
            else if (set.weight === bestSet.weight && set.reps > bestSet.reps) bestSet = set
          }
        })

        if (bestSet) {
          // If we had an old PR from BEFORE this workout's date, we compare
          // Note: If they edit an old workout, this logic is a bit naive but works for standard flow.
          if (!oldPR) {
            brokenPRs.push({ name: we.exercise.name, weight: bestSet.weight, reps: bestSet.reps })
          } else {
            if (bestSet.weight > oldPR.maxWeight || (bestSet.weight === oldPR.maxWeight && bestSet.reps > oldPR.repsAtMaxWeight)) {
              brokenPRs.push({ name: we.exercise.name, weight: bestSet.weight, reps: bestSet.reps })
            }
          }
        }
      })

      await saveWorkout({
        date: format(selectedDate, 'yyyy-MM-dd'),
        title: title || null,
        notes: notes || null,
        workoutExercises: valid.map((we, i) => ({
          exerciseId: we.exercise.id,
          orderIndex: i,
          sets: we.sets.map((s, si) => ({ ...s, setNumber: si + 1 })),
        })),
      })
      toast('Workout saved!', 'success')
      setHasExistingWorkout(true)
      setRefreshKey(k => k + 1)

      brokenPRs.forEach((pr, idx) => {
        setTimeout(() => {
          toast(`PR for ${pr.name}: ${pr.weight}kg x ${pr.reps}`, 'pr', 8000)
        }, 400 + (idx * 500))
      })
    } catch (e) {
      toast('Failed to save workout', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteWorkoutByDate(format(selectedDate, 'yyyy-MM-dd'))
      setTitle('')
      setNotes('')
      setExercises([])
      setHasExistingWorkout(false)
      setShowDeleteModal(false)
      setRefreshKey(k => k + 1)
      toast('Workout deleted', 'success')
    } catch {
      toast('Failed to delete workout', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const updateExerciseSets = useCallback((index, newSets) => {
    setExercises(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], sets: newSets }
      return updated
    })
  }, [])

  const updateExerciseName = useCallback((index, name) => {
    setExercises(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        exercise: { ...updated[index].exercise, name }
      }
      return updated
    })
  }, [])

  const deleteExercise = useCallback((index) => {
    setExercises(prev => prev.filter((_, i) => i !== index))
  }, [])

  const resolveExercise = useCallback((index, ex, prefillSets) => {
    setExercises(prev => {
      const updated = [...prev]
      updated[index] = {
        exercise: ex,
        sets: prefillSets || [newSet({ setNumber: 1 })],
      }
      return updated
    })
  }, [])

  const dateLabel = format(selectedDate, 'EEEE, MMMM d yyyy')

  return (
    <div className="page-container">
      <div className="workouts-layout">
        <div className="mobile-top-bar">
          <button className="mobile-top-btn" onClick={() => setMobileModal('calendar')}>
            <Calendar size={14} />
            {format(selectedDate, 'MMM d, yyyy')}
          </button>
          <button className="mobile-top-btn" onClick={() => setMobileModal('summary')}>
            <Activity size={14} />
          </button>
        </div>

        <div 
          className={`calendar-panel-wrapper ${mobileModal ? `show-modal show-${mobileModal}` : ''}`} 
          onClick={() => setMobileModal(null)}
        >
          <div className="calendar-panel-inner" onClick={e => e.stopPropagation()}>
            <CalendarPanel 
              selectedDate={selectedDate} 
              onSelectDate={(d) => {
                setSelectedDate(d);
                setMobileModal(null);
              }} 
              refreshKey={refreshKey} 
            />
          </div>
        </div>

        <div className="workout-editor">
          {/* Fixed top: date + title + notes */}
          <div className="workout-editor-fixed">
            <div className="workout-editor-header">
              <div>
                <h2 className="workout-date-title">{dateLabel}</h2>
                {exercises.length > 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} &nbsp;·&nbsp; {exercises.reduce((acc, we) => acc + we.sets.length, 0)} sets
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <LoadPreviousDropdown onLoad={handleLoadPrevious} />
                {hasExistingWorkout && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowDeleteModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                    title="Delete workout"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="workout-fields">
              <TitleAutocomplete
                value={title}
                onChange={setTitle}
                onLoadWorkout={handleLoadFromTitle}
              />
              <textarea
                className="input"
                placeholder="Session notes (optional)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Scrollable exercises area */}
          <div className="workout-editor-scrollable" ref={scrollableRef}>
            {loading ? (
              <div className="empty-state">
                <div className="spinner" />
              </div>
            ) : exercises.length === 0 ? (
              <div className="empty-state">
                No exercises logged yet. Click &quot;+ Add Exercise&quot; to begin.
              </div>
            ) : (
              <div className="exercises-list">
                {exercises.map((we, i) => (
                  <ExerciseCard
                    key={`${we.exercise.id}-${i}`}
                    exercise={we.exercise}
                    sets={we.sets}
                    onSetsChange={(newSets) => updateExerciseSets(i, newSets)}
                    onSetsChangeAndScroll={(newSets) => { updateExerciseSets(i, newSets); scrollToBottomIfNearBottom() }}
                    onNameChange={we.exercise._isNew ? (name) => updateExerciseName(i, name) : null}
                    onExerciseResolved={we.exercise._isNew ? (ex, prefillSets) => resolveExercise(i, ex, prefillSets) : null}
                    onDelete={() => deleteExercise(i)}
                    orderIndex={i}
                  />
                ))}
                <div ref={exercisesEndRef} />
              </div>
            )}
          </div>

          {/* Fixed footer */}
          <div className="workout-footer">
            <button className="btn btn-primary" onClick={handleAddExercise}>
              <Plus size={15} /> Add Exercise
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={15} />}
              Save Workout
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteConfirmModal
          date={selectedDate}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          deleting={deleting}
        />
      )}
    </div>
  )
}
