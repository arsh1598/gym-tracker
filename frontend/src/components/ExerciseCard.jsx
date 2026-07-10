import { useState, useCallback, useEffect, useRef } from "react";
import { Trash2, Copy, ChevronUp, ChevronDown } from "lucide-react";
import { getAllExercises, getLastSets } from "../api/client";

// ── Exercise name autocomplete ────────────────────────────────────────────────
function ExerciseNameInput({ value, onChange, onSelectExercise }) {
  const [allExercises, setAllExercises] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    getAllExercises().then(data => {
      setAllExercises([...data].sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!value.trim()) { setSuggestions([]); return; }
    const q = value.toLowerCase();
    setSuggestions(allExercises.filter(e => e.name.toLowerCase().includes(q)).slice(0, 7));
    setShowDropdown(true);
  }, [value, allExercises]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (ex) => {
    setShowDropdown(false);
    onChange(ex.name);
    // Prefill last sets for this exercise
    try {
      const lastWE = await getLastSets(ex.id);
      if (lastWE && lastWE.sets && lastWE.sets.length > 0) {
        const prefill = lastWE.sets.map((s, i) => ({
          setNumber: i + 1,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          isDropSet: false,
        }));
        onSelectExercise(ex, prefill);
      } else {
        onSelectExercise(ex, null);
      }
    } catch {
      onSelectExercise(ex, null);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1 }}>
      <input
        className="exercise-name-input"
        placeholder="Exercise name..."
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowDropdown(true); }}
        onClick={(e) => { e.stopPropagation(); if (suggestions.length > 0) setShowDropdown(true); }}
        autoFocus
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="title-autocomplete-dropdown">
          {suggestions.map(ex => (
            <div
              key={ex.id}
              className="title-autocomplete-item"
              onMouseDown={() => handleSelect(ex)}
            >
              <span className="title-autocomplete-title">{ex.name}</span>
              {ex.targetMuscle && (
                <span className="title-autocomplete-date">{ex.targetMuscle}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Set row ───────────────────────────────────────────────────────────────────
function SetRow({ setData, index, onUpdate, onDelete, isFirst, isLast, onMoveUp, onMoveDown }) {
  const handleChange = (field, value) => {
    onUpdate(index, { ...setData, [field]: value });
  };

  const toggleDropSet = () => {
    onUpdate(index, { ...setData, isDropSet: !setData.isDropSet });
  };

  return (
    <div className={`set-row${setData.isDropSet ? " set-row-dropset" : ""}`}>
      <span className="set-number">{index + 1}</span>
      <input
        type="number"
        className="input input-sm"
        placeholder="—"
        value={setData.weight ?? ""}
        onChange={(e) => handleChange("weight", e.target.value === "" ? null : parseFloat(e.target.value))}
        min="0"
        step="0.5"
      />
      <input
        type="number"
        className="input input-sm"
        placeholder="—"
        value={setData.reps ?? ""}
        onChange={(e) => handleChange("reps", e.target.value === "" ? null : parseInt(e.target.value))}
        min="0"
      />
      <input
        type="number"
        className="input input-sm"
        placeholder="—"
        value={setData.rpe ?? ""}
        onChange={(e) => handleChange("rpe", e.target.value === "" ? null : parseFloat(e.target.value))}
        min="1" max="10" step="0.5"
      />

      {/* DS — hidden on first set */}
      {!isFirst ? (
        <button
          className={`ds-badge ${setData.isDropSet ? "active" : "inactive"}`}
          onClick={(e) => { e.stopPropagation(); toggleDropSet(); }}
          title="Toggle Drop Set"
        >
          DS
        </button>
      ) : (
        <span />
      )}

      {/* Up / Down / Delete — arrows hidden until hover via CSS .move-btn */}
      <div className="set-actions">
        <button
          className="btn btn-ghost btn-icon move-btn"
          onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
          disabled={isFirst}
          title="Move up"
          style={{ padding: "2px", color: isFirst ? "transparent" : "var(--text-muted)", pointerEvents: isFirst ? "none" : "auto" }}
        >
          <ChevronUp size={14} />
        </button>
        <button
          className="btn btn-ghost btn-icon move-btn"
          onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
          disabled={isLast}
          title="Move down"
          style={{ padding: "2px", color: isLast ? "transparent" : "var(--text-muted)", pointerEvents: isLast ? "none" : "auto" }}
        >
          <ChevronDown size={14} />
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={(e) => { e.stopPropagation(); onDelete(index); }}
          title="Delete set"
          style={{ padding: "2px", color: "var(--text-muted)" }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Exercise card ─────────────────────────────────────────────────────────────
export default function ExerciseCard({
  exercise,
  sets,
  onSetsChange,
  onSetsChangeAndScroll,
  onNameChange,       // only set for new (temp) exercises
  onExerciseResolved, // called when user picks from autocomplete: (exercise, prefillSets)
  onDelete,
  orderIndex,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const handleUpdateSet = useCallback((idx, updated) => {
    const newSets = [...sets];
    newSets[idx] = updated;
    onSetsChange(newSets);
  }, [sets, onSetsChange]);

  const handleDeleteSet = useCallback((idx) => {
    onSetsChange(sets.filter((_, i) => i !== idx));
  }, [sets, onSetsChange]);

  const handleAddSet = () => {
    const newSets = [
      ...sets,
      {
        setNumber: sets.length + 1,
        weight: null,
        reps: null,
        rpe: null,
        isDropSet: false,
      },
    ];
    if (onSetsChangeAndScroll) onSetsChangeAndScroll(newSets);
    else onSetsChange(newSets);
  };

  const handleDuplicate = () => {
    const last = sets[sets.length - 1];
    if (!last) return handleAddSet();
    const newSets = [...sets, { ...last, id: undefined, isDropSet: false, setNumber: sets.length + 1 }];
    if (onSetsChangeAndScroll) onSetsChangeAndScroll(newSets);
    else onSetsChange(newSets);
  };

  const handleMoveUp = (idx) => {
    if (idx === 0) return;
    const newSets = [...sets];
    [newSets[idx - 1], newSets[idx]] = [newSets[idx], newSets[idx - 1]];
    onSetsChange(newSets);
  };

  const handleMoveDown = (idx) => {
    if (idx === sets.length - 1) return;
    const newSets = [...sets];
    [newSets[idx], newSets[idx + 1]] = [newSets[idx + 1], newSets[idx]];
    onSetsChange(newSets);
  };

  return (
    <div className="exercise-card">
      <div className="exercise-card-header" onClick={() => setCollapsed((c) => !c)}>
        {/* Editable name with autocomplete for new exercises */}
        {onNameChange ? (
          <ExerciseNameInput
            value={exercise.name}
            onChange={onNameChange}
            onSelectExercise={(ex, prefillSets) => {
              if (onExerciseResolved) onExerciseResolved(ex, prefillSets);
            }}
          />
        ) : (
          <span className="exercise-card-name">{exercise.name}</span>
        )}

        <div className="exercise-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronUp size={16} style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "200ms" }} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onDelete}
            title="Delete exercise"
            style={{ color: "var(--text-muted)" }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="exercise-card-body">
          <div className="sets-table-header">
            <span></span>
            <span>Weight (kg)</span>
            <span>Reps</span>
            <span>RPE</span>
            <span>DS</span>
            <span></span>
          </div>

          {sets.map((set, idx) => (
            <SetRow
              key={idx}
              setData={set}
              index={idx}
              onUpdate={handleUpdateSet}
              onDelete={handleDeleteSet}
              isFirst={idx === 0}
              isLast={idx === sets.length - 1}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}

          <div className="exercise-footer">
            <button className="add-set-btn" onClick={handleAddSet}>
              + Add Set
            </button>
            <button className="duplicate-btn" onClick={handleDuplicate}>
              <Copy size={13} /> Duplicate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
