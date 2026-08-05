import { useState, useCallback, useEffect, useRef } from "react";
import { Trash2, Copy, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { getAllExercises, getLastSets } from "../api/client";

// Stable UID for set rows — avoids React key collisions on deletion
let _uidSeq = 0;
const mkUid = () => `u${++_uidSeq}`;


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

// ── Set row with swipe-to-DS (right) / swipe-to-delete (left) ────────────────
function SetRow({ setData, index, onUpdate, onDelete, isFirst, isLast, onMoveUp, onMoveDown }) {
  const [offsetX, setOffsetX] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const touchRef = useRef(null);      // { x, y } at touchstart
  const swipingRef = useRef(false);   // true once committed to horizontal swipe
  // We need to read offsetX inside handleTouchEnd without stale closure
  const offsetXRef = useRef(0);

  const handleChange = (field, value) => {
    onUpdate(index, { ...setData, [field]: value });
  };

  const setOffset = (val) => {
    offsetXRef.current = val;
    setOffsetX(val);
  };

  const handleTouchStart = (e) => {
    // Stop propagation so the page-level swipe (App.jsx) doesn't record this touch
    e.stopPropagation();
    const t = e.targetTouches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
    swipingRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!touchRef.current) return;
    const t = e.targetTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    if (!swipingRef.current) {
      // Wait until movement is large enough to determine direction
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      // If primarily vertical → let it scroll, abort
      if (Math.abs(dy) > Math.abs(dx) * 0.7) {
        touchRef.current = null;
        return;
      }
      swipingRef.current = true;
    }

    // Committed to horizontal swipe — stop page swipe from also firing
    e.stopPropagation();
    // First set cannot swipe right (DS not allowed on set 1)
    const maxRight = isFirst ? 0 : 90;
    const clamped = Math.max(-90, Math.min(maxRight, dx));
    setOffset(clamped);
  };

  const handleTouchEnd = (e) => {
    if (!swipingRef.current) {
      touchRef.current = null;
      return;
    }
    touchRef.current = null;
    swipingRef.current = false;
    e.stopPropagation();

    const cur = offsetXRef.current;
    if (cur > 60 && !isFirst) {
      // Toggle drop set
      onUpdate(index, { ...setData, isDropSet: !setData.isDropSet });
      setOffset(0);
    } else if (cur < -60) {
      // Collapse the whole wrapper then delete — prevents the reveal ghost
      setDeleting(true);
      setTimeout(() => onDelete(index), 280);
    } else {
      // Snap back
      setOffset(0);
    }
  };

  const dsOpacity = Math.min(1, Math.max(0, offsetXRef.current / 60));
  const delOpacity = Math.min(1, Math.max(0, -offsetXRef.current / 60));

  return (
    <div
      className="set-row-wrapper"
      style={deleting ? { maxHeight: 0, opacity: 0, marginBottom: 0, overflow: 'hidden', transition: 'max-height 250ms ease, opacity 200ms ease, margin-bottom 250ms ease' } : { maxHeight: 80, transition: 'max-height 250ms ease, opacity 200ms ease, margin-bottom 250ms ease' }}
    >
      {/* Left reveal — DS (green) */}
      <div className="swipe-reveal swipe-reveal-left" style={{ opacity: dsOpacity }}>
        <span>DS</span>
      </div>
      {/* Right reveal — Delete (red) */}
      <div className="swipe-reveal swipe-reveal-right" style={{ opacity: delOpacity }}>
        <Trash2 size={14} />
      </div>

      <div
        className={`set-row${setData.isDropSet ? " set-row-dropset" : ""}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swipingRef.current ? 'none' : 'transform 200ms ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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

        {/* Up / Down side-by-side pill */}
        <div className="set-move-pill">
          <button
            className="set-move-btn"
            onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
            disabled={isFirst}
            title="Move up"
          >
            <ChevronUp size={13} />
          </button>
          <button
            className="set-move-btn"
            onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
            disabled={isLast}
            title="Move down"
          >
            <ChevronDown size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exercise card ─────────────────────────────────────────────────────────────
export default function ExerciseCard({
  exercise,
  sets,
  onSetsChange,
  onSetsChangeAndScroll,  // (newSets, cardEl) — WorkoutsPage decides whether to scroll
  onNameChange,           // only set for new (temp) exercises
  onExerciseResolved,     // called when user picks from autocomplete: (exercise, prefillSets)
  onDelete,
  orderIndex,
  onMoveExercise,         // (fromIndex, toIndex) — for drag reorder
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);
  const gripRef = useRef(null);

  // ── Touch-drag reorder (mobile) ──────────────────────────────────────────
  useEffect(() => {
    const grip = gripRef.current;
    if (!grip || !onMoveExercise) return;

    let isDraggingTouch = false;
    let longPressTimer = null;

    const onTouchMoveActive = (e) => {
      if (!isDraggingTouch) return;
      e.preventDefault(); // prevent scroll while dragging
      const touch = e.targetTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetCard = el?.closest('[data-exercise-index]');
      // Update drag-over highlight
      document.querySelectorAll('[data-exercise-index]').forEach(c => c.classList.remove('drag-over'));
      if (targetCard) targetCard.classList.add('drag-over');
    };

    const onTouchStart = (e) => {
      e.stopPropagation();
      longPressTimer = setTimeout(() => {
        isDraggingTouch = true;
        cardRef.current?.classList.add('is-dragging');
        document.addEventListener('touchmove', onTouchMoveActive, { passive: false });
      }, 320);
    };

    const onTouchEnd = (e) => {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      document.removeEventListener('touchmove', onTouchMoveActive);

      if (isDraggingTouch) {
        isDraggingTouch = false;
        const touch = e.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCard = el?.closest('[data-exercise-index]');
        // Clean up visual state
        document.querySelectorAll('[data-exercise-index]').forEach(c => {
          c.classList.remove('is-dragging');
          c.classList.remove('drag-over');
        });
        if (targetCard) {
          const toIndex = parseInt(targetCard.getAttribute('data-exercise-index'), 10);
          if (!isNaN(toIndex) && toIndex !== orderIndex) {
            onMoveExercise(orderIndex, toIndex);
          }
        }
      }
    };

    grip.addEventListener('touchstart', onTouchStart, { passive: true });
    grip.addEventListener('touchend', onTouchEnd);
    grip.addEventListener('touchcancel', onTouchEnd);

    return () => {
      grip.removeEventListener('touchstart', onTouchStart);
      grip.removeEventListener('touchend', onTouchEnd);
      grip.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener('touchmove', onTouchMoveActive);
      clearTimeout(longPressTimer);
    };
  }, [orderIndex, onMoveExercise]);

  // ── Set operations ───────────────────────────────────────────────────────
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
      { setNumber: sets.length + 1, weight: null, reps: null, rpe: null, isDropSet: false, _uid: mkUid() },
    ];
    if (onSetsChangeAndScroll) onSetsChangeAndScroll(newSets, cardRef.current);
    else onSetsChange(newSets);
  };

  const handleDuplicate = () => {
    const last = sets[sets.length - 1];
    if (!last) return handleAddSet();
    const newSets = [...sets, { ...last, id: undefined, _uid: mkUid(), isDropSet: false, setNumber: sets.length + 1 }];
    if (onSetsChangeAndScroll) onSetsChangeAndScroll(newSets, cardRef.current);
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

  // ── HTML5 Drag & Drop (desktop) ──────────────────────────────────────────
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(orderIndex));
    // Slight delay so drag image renders before opacity change
    requestAnimationFrame(() => setIsDragging(true));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.relatedTarget || !cardRef.current?.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex) && fromIndex !== orderIndex && onMoveExercise) {
      onMoveExercise(fromIndex, orderIndex);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
  };

  return (
    <div
      ref={cardRef}
      className={`exercise-card${isDragging ? ' is-dragging' : ''}${isDragOver ? ' is-drag-over' : ''}`}
      data-exercise-index={orderIndex}
      onDragOver={onMoveExercise ? handleDragOver : undefined}
      onDragLeave={onMoveExercise ? handleDragLeave : undefined}
      onDrop={onMoveExercise ? handleDrop : undefined}
    >
      <div className="exercise-card-header" onClick={() => setCollapsed((c) => !c)}>
        {/* Drag handle — only rendered when reorder is supported */}
        {onMoveExercise && (
          <div
            ref={gripRef}
            className="drag-handle"
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </div>
        )}

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
            <span></span>
          </div>

          {sets.map((set, idx) => (
            <SetRow
              key={set.id ?? set._uid ?? idx}
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
