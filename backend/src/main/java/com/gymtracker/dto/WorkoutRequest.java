package com.gymtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

// Request DTOs (for saving workouts)

public class WorkoutRequest {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveWorkout {
        private LocalDate date;
        private String title;
        private String notes;
        private List<WorkoutExerciseRequest> workoutExercises;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkoutExerciseRequest {
        private Long exerciseId;
        private Integer orderIndex;
        private List<SetRequest> sets;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SetRequest {
        private Integer setNumber;
        private Double weight;
        private Integer reps;
        private Double rpe;
        private Boolean isDropSet;
    }
}
