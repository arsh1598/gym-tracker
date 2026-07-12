import { useState, useEffect } from 'react'
import { Trophy, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import { getAllPRs, getAllExercises, getPRForExercise } from '../api/client'
import { MUSCLE_COLORS } from '../utils/muscleColors'

function PRCard({ pr, highlight = false }) {
  const color = MUSCLE_COLORS[pr.targetMuscle] || MUSCLE_COLORS.Other
  return (
    <div className={`pr-card ${highlight ? 'pr-card-highlight' : ''}`}>
      <div className="pr-card-header">
        <span className="pr-card-name">{pr.exerciseName}</span>
        <Trophy size={16} className="pr-trophy" />
      </div>
      <div className="pr-weight">
        {pr.maxWeight}<span className="pr-weight-unit"> kg</span>
      </div>
      <div className="pr-reps">× {pr.repsAtMaxWeight} reps</div>
      <div className="pr-label">MAX WEIGHT</div>
      <div className="pr-dates">
        <div>Set: {pr.dateSet ? format(new Date(pr.dateSet + 'T00:00:00'), 'MMM d, yyyy') : '—'}</div>
        <div>Last: {pr.lastDoneDate ? format(new Date(pr.lastDoneDate + 'T00:00:00'), 'MMM d, yyyy') : '—'}</div>
        {pr.estimatedOneRepMax > 0 && (
          <div style={{ color: 'var(--text-accent)', marginTop: 2 }}>
            Est. 1RM: {pr.estimatedOneRepMax} kg
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: highlight ? 'var(--gold)' : color,
          borderRadius: '0 0 14px 14px', opacity: highlight ? 0.9 : 0.5
        }}
      />
    </div>
  )
}

export default function PRsPage() {
  const [allPRs, setAllPRs] = useState([])
  const [exercises, setExercises] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    Promise.all([getAllPRs(), getAllExercises()])
      .then(([prs, exs]) => {
        setAllPRs(prs)
        setExercises(exs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearch = async (ex) => {
    setSearchQuery(ex.name)
    setShowSuggestions(false)
    setSearching(true)
    try {
      const pr = await getPRForExercise(ex.id)
      setSearchResult(pr ? { ...pr, exerciseName: ex.name, targetMuscle: ex.targetMuscle } : null)
    } catch {
      setSearchResult(null)
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResult(null)
    setShowSuggestions(false)
  }

  // PRs to display in the grid: search result at top, then up to 20 from allPRs (exclude if already shown)
  const displayPRs = (() => {
    if (searchResult) {
      const rest = allPRs.filter(pr => pr.exerciseName !== searchResult.exerciseName).slice(0, 20)
      return [{ ...searchResult, _isSearchResult: true }, ...rest]
    }
    return allPRs.slice(0, 20)
  })()

  return (
    <div className="page-container">
      <div className="prs-page">
        <div className="prs-header">
          <Trophy size={22} color={`var(--gold)`} />
          <h1 className="prs-title">Personal Records</h1>
        </div>
        <p className="prs-subtitle">Your all-time bests across every lift</p>

        {/* Search bar */}
        <div className="prs-search-bar-wrapper">
          <div style={{ position: 'relative' }}>
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                className="input"
                placeholder="Search a lift — e.g. Bench Press..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setSearchResult(null)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', padding: 0
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            {showSuggestions && searchQuery && !searchResult && (
              <div className="card" style={{ position: 'absolute', zIndex: 10, width: '100%', maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
                {filteredExercises.length === 0 ? (
                  <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No exercises found</div>
                ) : filteredExercises.slice(0, 8).map(ex => (
                  <div key={ex.id} className="exercise-list-item" onMouseDown={() => handleSearch(ex)}>
                    <span className="exercise-list-item-name">{ex.name}</span>
                    <span className="exercise-list-item-muscle">{ex.targetMuscle}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {searching && <div className="spinner" style={{ marginLeft: 12 }} />}
          {searchResult === null && searchQuery && !searching && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>
              No PR found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="recent-lifts-heading">
          {searchResult
            ? `Showing result for "${searchResult.exerciseName}" + recent PRs`
            : `Recent Personal Records (${Math.min(allPRs.length, 20)} of ${allPRs.length})`}
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : allPRs.length === 0 && !searchResult ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: '0.875rem' }}>
            No PRs yet — start logging workouts!
          </div>
        ) : (
          <div className="prs-grid-scroll">
            <div className="prs-grid">
              {displayPRs.map((pr, i) => (
                <PRCard key={pr.exerciseId ?? pr.exerciseName ?? i} pr={pr} highlight={!!pr._isSearchResult} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
