package com.gymtracker.controller;

import com.gymtracker.dto.ExerciseDto;
import com.gymtracker.dto.WorkoutDto;
import com.gymtracker.dto.WorkoutExerciseDto;
import com.gymtracker.dto.WorkoutRequest;
import com.gymtracker.service.WorkoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;

    /**
     * Get workout for a specific date.
     * GET /api/workouts/date/2026-07-10
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<WorkoutDto> getWorkoutByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return workoutService.getWorkoutByDate(date)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * Save (create or replace) a workout.
     * POST /api/workouts
     */
    @PostMapping
    public ResponseEntity<WorkoutDto> saveWorkout(@RequestBody WorkoutRequest.SaveWorkout request) {
        return ResponseEntity.ok(workoutService.saveWorkout(request));
    }

    /**
     * Get dates that have workouts for a given month.
     * GET /api/workouts/calendar?year=2026&month=7
     */
    @GetMapping("/calendar")
    public ResponseEntity<List<LocalDate>> getCalendarDates(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(workoutService.getWorkoutDatesForMonth(year, month));
    }

    /**
     * Get recent workouts for "Load previous" dropdown.
     * GET /api/workouts/recent?limit=5
     */
    @GetMapping("/recent")
    public ResponseEntity<List<WorkoutDto>> getRecentWorkouts(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(workoutService.getRecentWorkouts(limit));
    }

    /**
     * Get recently logged distinct exercises (for Progress dropdown).
     * GET /api/workouts/recent-exercises?limit=10
     */
    @GetMapping("/recent-exercises")
    public ResponseEntity<List<ExerciseDto>> getRecentlyLoggedExercises(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(workoutService.getRecentlyLoggedExercises(limit));
    }

    /**
     * Get a workout by ID.
     * GET /api/workouts/1
     */
    @GetMapping("/{id}")
    public ResponseEntity<WorkoutDto> getWorkoutById(@PathVariable Long id) {
        return workoutService.getWorkoutById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get last performed sets for smart pre-fill.
     * GET /api/workouts/exercises/5/last-sets
     */
    @GetMapping("/exercises/{exerciseId}/last-sets")
    public ResponseEntity<WorkoutExerciseDto> getLastSets(@PathVariable Long exerciseId) {
        return workoutService.getLastPerformedSets(exerciseId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * Get monthly summary (workout count + consistency).
     * GET /api/workouts/summary?year=2026&month=7
     */
    @GetMapping("/summary")
    public ResponseEntity<WorkoutService.MonthlySummaryDto> getMonthlySummary(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(workoutService.getMonthlySummary(year, month));
    }

    /**
     * Delete workout for a date.
     * DELETE /api/workouts/date/2026-07-10
     */
    @DeleteMapping("/date/{date}")
    public ResponseEntity<Void> deleteWorkoutByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        workoutService.deleteWorkoutByDate(date);
        return ResponseEntity.noContent().build();
    }
}
