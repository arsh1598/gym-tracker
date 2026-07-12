package com.gymtracker.service;

import com.gymtracker.dto.*;
import com.gymtracker.entity.*;
import com.gymtracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import com.gymtracker.util.SecurityUtils;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutRepository workoutRepository;
    private final ExerciseRepository exerciseRepository;
    private final WorkoutExerciseRepository workoutExerciseRepository;

    /**
     * Get or create a workout for a specific date.
     */
    @Transactional(readOnly = true)
    public Optional<WorkoutDto> getWorkoutByDate(LocalDate date) {
        return workoutRepository.findByDateAndUserId(date, SecurityUtils.getCurrentUserId()).map(this::toDto);
    }

    /**
     * Save (create or update) a workout for a given date.
     */
    @Transactional
    public WorkoutDto saveWorkout(WorkoutRequest.SaveWorkout request) {
        String userId = SecurityUtils.getCurrentUserId();
        // Find existing or create new
        Workout workout = workoutRepository.findByDateAndUserId(request.getDate(), userId)
                .orElse(Workout.builder()
                        .userId(userId)
                        .date(request.getDate())
                        .workoutExercises(new ArrayList<>())
                        .build());

        workout.setTitle(request.getTitle());
        workout.setNotes(request.getNotes());

        // Clear existing exercises and rebuild
        workout.getWorkoutExercises().clear();

        if (request.getWorkoutExercises() != null) {
            for (WorkoutRequest.WorkoutExerciseRequest weReq : request.getWorkoutExercises()) {
                Exercise exercise = exerciseRepository.findByIdAndUserId(weReq.getExerciseId(), userId)
                        .orElseThrow(() -> new RuntimeException("Exercise not found: " + weReq.getExerciseId()));

                WorkoutExercise we = WorkoutExercise.builder()
                        .workout(workout)
                        .exercise(exercise)
                        .orderIndex(weReq.getOrderIndex())
                        .sets(new ArrayList<>())
                        .build();

                if (weReq.getSets() != null) {
                    int setNum = 1;
                    for (WorkoutRequest.SetRequest setReq : weReq.getSets()) {
                        ExerciseSet set = ExerciseSet.builder()
                                .workoutExercise(we)
                                .setNumber(setReq.getSetNumber() != null ? setReq.getSetNumber() : setNum)
                                .weight(setReq.getWeight())
                                .reps(setReq.getReps())
                                .rpe(setReq.getRpe())
                                .isDropSet(setReq.getIsDropSet() != null ? setReq.getIsDropSet() : false)
                                .build();
                        we.getSets().add(set);
                        setNum++;
                    }
                }

                workout.getWorkoutExercises().add(we);
            }
        }

        return toDto(workoutRepository.save(workout));
    }

    /**
     * Get workouts for a specific month (for calendar dots).
     */
    @Transactional(readOnly = true)
    public List<LocalDate> getWorkoutDatesForMonth(int year, int month) {
        return workoutRepository.findByUserIdAndYearAndMonth(SecurityUtils.getCurrentUserId(), year, month)
                .stream()
                .map(Workout::getDate)
                .collect(Collectors.toList());
    }

    /**
     * Get recent workouts (for "Load previous" dropdown).
     */
    @Transactional(readOnly = true)
    public List<WorkoutDto> getRecentWorkouts(int limit) {
        return workoutRepository.findAllByUserIdOrderByDateDesc(SecurityUtils.getCurrentUserId(), PageRequest.of(0, limit))
                .stream()
                .map(w -> WorkoutDto.builder()
                        .id(w.getId())
                        .date(w.getDate())
                        .title(w.getTitle())
                        .notes(w.getNotes())
                        .workoutExercises(new ArrayList<>()) // lightweight for dropdown
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get the 10 most recently logged distinct exercises (for Progress dropdown).
     */
    @Transactional(readOnly = true)
    public List<ExerciseDto> getRecentlyLoggedExercises(int limit) {
        // Fetch a larger batch ordered by date desc, then deduplicate by exercise id
        List<WorkoutExercise> recent = workoutExerciseRepository
                .findAllOrderByWorkoutDateDesc(PageRequest.of(0, limit * 10));
        LinkedHashMap<Long, ExerciseDto> seen = new LinkedHashMap<>();
        for (WorkoutExercise we : recent) {
            if (seen.size() >= limit) break;
            Long exId = we.getExercise().getId();
            if (!seen.containsKey(exId)) {
                seen.put(exId, ExerciseDto.builder()
                        .id(we.getExercise().getId())
                        .name(we.getExercise().getName())
                        .targetMuscle(we.getExercise().getTargetMuscle())
                        .build());
            }
        }
        return new ArrayList<>(seen.values());
    }

    /**
     * Get a workout by ID.
     */
    @Transactional(readOnly = true)
    public Optional<WorkoutDto> getWorkoutById(Long id) {
        return workoutRepository.findByIdAndUserId(id, SecurityUtils.getCurrentUserId()).map(this::toDto);
    }

    /**
     * Get the last performed sets for a given exercise (smart pre-fill).
     */
    @Transactional(readOnly = true)
    public Optional<WorkoutExerciseDto> getLastPerformedSets(Long exerciseId) {
        List<WorkoutExercise> results = workoutExerciseRepository.findLatestByExerciseId(exerciseId);
        if (results.isEmpty()) return Optional.empty();

        // Take the most recent one
        WorkoutExercise we = results.get(0);
        return Optional.of(toWorkoutExerciseDto(we));
    }

    /**
     * Get monthly workout summary (count + consistency %).
     */
    @Transactional(readOnly = true)
    public MonthlySummaryDto getMonthlySummary(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        long count = workoutRepository.countByUserIdAndDateBetween(SecurityUtils.getCurrentUserId(), start, end);
        int daysInMonth = start.lengthOfMonth();
        double consistency = (double) count / daysInMonth * 100;
        return new MonthlySummaryDto(count, Math.round(consistency));
    }

    /**
     * Delete a workout by date.
     */
    @Transactional
    public void deleteWorkoutByDate(LocalDate date) {
        workoutRepository.findByDateAndUserId(date, SecurityUtils.getCurrentUserId()).ifPresent(workoutRepository::delete);
    }

    // ---- Mappers ----

    public WorkoutDto toDto(Workout w) {
        return WorkoutDto.builder()
                .id(w.getId())
                .date(w.getDate())
                .title(w.getTitle())
                .notes(w.getNotes())
                .workoutExercises(w.getWorkoutExercises().stream()
                        .map(this::toWorkoutExerciseDto)
                        .collect(Collectors.toList()))
                .build();
    }

    public WorkoutExerciseDto toWorkoutExerciseDto(WorkoutExercise we) {
        return WorkoutExerciseDto.builder()
                .id(we.getId())
                .exercise(ExerciseDto.builder()
                        .id(we.getExercise().getId())
                        .name(we.getExercise().getName())
                        .targetMuscle(we.getExercise().getTargetMuscle())
                        .build())
                .orderIndex(we.getOrderIndex())
                .sets(we.getSets().stream()
                        .map(s -> SetDto.builder()
                                .id(s.getId())
                                .setNumber(s.getSetNumber())
                                .weight(s.getWeight())
                                .reps(s.getReps())
                                .rpe(s.getRpe())
                                .isDropSet(s.getIsDropSet())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    // Inner summary DTO
    public record MonthlySummaryDto(long workoutCount, long consistencyPercent) {}
}
