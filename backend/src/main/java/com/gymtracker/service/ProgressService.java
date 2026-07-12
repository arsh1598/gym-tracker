package com.gymtracker.service;

import com.gymtracker.dto.PRDto;
import com.gymtracker.dto.ProgressDataPoint;
import com.gymtracker.entity.Exercise;
import com.gymtracker.entity.ExerciseSet;
import com.gymtracker.repository.ExerciseRepository;
import com.gymtracker.repository.ExerciseSetRepository;
import com.gymtracker.repository.WorkoutExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import com.gymtracker.util.SecurityUtils;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseSetRepository exerciseSetRepository;
    private final WorkoutExerciseRepository workoutExerciseRepository;

    /**
     * Get Personal Record for a specific exercise.
     */
    @Transactional(readOnly = true)
    public Optional<PRDto> getPRForExercise(Long exerciseId) {
        Exercise exercise = exerciseRepository.findByIdAndUserId(exerciseId, SecurityUtils.getCurrentUserId()).orElse(null);
        if (exercise == null) return Optional.empty();

        List<ExerciseSet> sets = exerciseSetRepository.findAllByExerciseIdOrderByWeightDesc(exerciseId);
        if (sets.isEmpty()) return Optional.empty();

        ExerciseSet bestSet = sets.get(0);

        // Find the last performed date
        LocalDate lastDoneDate = sets.stream()
                .map(s -> s.getWorkoutExercise().getWorkout().getDate())
                .max(Comparator.naturalOrder())
                .orElse(null);

        LocalDate dateSet = bestSet.getWorkoutExercise().getWorkout().getDate();

        // Estimate 1RM using Epley formula: weight * (1 + reps/30)
        double e1rm = 0;
        if (bestSet.getWeight() != null && bestSet.getReps() != null) {
            e1rm = bestSet.getWeight() * (1 + bestSet.getReps() / 30.0);
        }

        return Optional.of(PRDto.builder()
                .exerciseId(exercise.getId())
                .exerciseName(exercise.getName())
                .targetMuscle(exercise.getTargetMuscle())
                .maxWeight(bestSet.getWeight())
                .repsAtMaxWeight(bestSet.getReps())
                .dateSet(dateSet)
                .lastDoneDate(lastDoneDate)
                .estimatedOneRepMax(Math.round(e1rm * 10.0) / 10.0)
                .build());
    }

    /**
     * Get all PRs (one per exercise that has been performed).
     */
    @Transactional(readOnly = true)
    public List<PRDto> getAllPRs() {
        List<Exercise> exercises = exerciseRepository.findAllByUserIdOrSystem(SecurityUtils.getCurrentUserId());
        List<PRDto> prs = new ArrayList<>();

        for (Exercise ex : exercises) {
            getPRForExercise(ex.getId()).ifPresent(prs::add);
        }

        // Sort by most recently set
        prs.sort(Comparator.comparing(PRDto::getDateSet, Comparator.nullsLast(Comparator.reverseOrder())));
        return prs;
    }

    /**
     * Get progress data for charting.
     */
    @Transactional(readOnly = true)
    public List<ProgressDataPoint> getProgressData(Long exerciseId, LocalDate startDate, LocalDate endDate) {
        List<ExerciseSet> sets = exerciseSetRepository.findByExerciseAndDateRange(exerciseId, startDate, endDate);

        // Group sets by workout date
        Map<LocalDate, List<ExerciseSet>> byDate = sets.stream()
                .collect(Collectors.groupingBy(s -> s.getWorkoutExercise().getWorkout().getDate()));

        return byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    List<ExerciseSet> daySets = entry.getValue();

                    double maxWeight = 0;
                    int maxWeightReps = 0;
                    for (ExerciseSet s : daySets) {
                        if (s.getWeight() != null) {
                            if (s.getWeight() > maxWeight) {
                                maxWeight = s.getWeight();
                                maxWeightReps = s.getReps() != null ? s.getReps() : 0;
                            } else if (s.getWeight() == maxWeight) {
                                int reps = s.getReps() != null ? s.getReps() : 0;
                                if (reps > maxWeightReps) {
                                    maxWeightReps = reps;
                                }
                            }
                        }
                    }

                    double totalVolume = daySets.stream()
                            .filter(s -> s.getWeight() != null && s.getReps() != null)
                            .mapToDouble(s -> s.getWeight() * s.getReps())
                            .sum();

                    double bestSetVol = 0;
                    double bestSetWeight = 0;
                    int bestSetReps = 0;
                    for (ExerciseSet s : daySets) {
                        if (s.getWeight() != null && s.getReps() != null) {
                            double vol = s.getWeight() * s.getReps();
                            if (vol > bestSetVol) {
                                bestSetVol = vol;
                                bestSetWeight = s.getWeight();
                                bestSetReps = s.getReps();
                            }
                        }
                    }

                    int totalReps = daySets.stream()
                            .filter(s -> s.getReps() != null)
                            .mapToInt(ExerciseSet::getReps)
                            .sum();

                    // Best set 1RM estimate
                    double est1rm = daySets.stream()
                            .filter(s -> s.getWeight() != null && s.getReps() != null)
                            .mapToDouble(s -> s.getWeight() * (1 + s.getReps() / 30.0))
                            .max().orElse(0);

                    return ProgressDataPoint.builder()
                            .date(date)
                            .maxWeight(maxWeight)
                            .maxWeightReps(maxWeightReps)
                            .totalVolume(Math.round(totalVolume * 10.0) / 10.0)
                            .bestSetVolume(Math.round(bestSetVol * 10.0) / 10.0)
                            .bestSetWeight(bestSetWeight)
                            .bestSetReps(bestSetReps)
                            .estimatedOneRepMax(Math.round(est1rm * 10.0) / 10.0)
                            .totalReps(totalReps)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Get progress grouped by muscle volume per workout date.
     */
    @Transactional(readOnly = true)
    public Map<String, List<ProgressDataPoint>> getMuscleVolumeProgress(LocalDate startDate, LocalDate endDate) {
        List<Exercise> exercises = exerciseRepository.findAllByUserIdOrSystem(SecurityUtils.getCurrentUserId());
        Map<String, List<ProgressDataPoint>> result = new LinkedHashMap<>();

        // Group exercises by target muscle to process them together
        Map<String, List<Exercise>> exercisesByMuscle = exercises.stream()
                .filter(ex -> ex.getTargetMuscle() != null && !ex.getTargetMuscle().isBlank())
                .collect(Collectors.groupingBy(Exercise::getTargetMuscle));

        for (Map.Entry<String, List<Exercise>> entry : exercisesByMuscle.entrySet()) {
            String muscle = entry.getKey();
            List<Exercise> muscleExercises = entry.getValue();

            // Collect and sum volume by date for all exercises in this muscle group
            Map<LocalDate, Double> volumeByDate = new TreeMap<>();
            for (Exercise ex : muscleExercises) {
                List<ProgressDataPoint> data = getProgressData(ex.getId(), startDate, endDate);
                for (ProgressDataPoint pt : data) {
                    volumeByDate.merge(pt.getDate(), pt.getTotalVolume(), Double::sum);
                }
            }

            // Map back to a list of sorted aggregated ProgressDataPoints
            List<ProgressDataPoint> aggregatedPoints = volumeByDate.entrySet().stream()
                    .map(e -> ProgressDataPoint.builder()
                            .date(e.getKey())
                            .totalVolume(Math.round(e.getValue() * 10.0) / 10.0)
                            .build())
                    .collect(Collectors.toList());

            if (!aggregatedPoints.isEmpty()) {
                result.put(muscle, aggregatedPoints);
            }
        }

        return result;
    }
}
