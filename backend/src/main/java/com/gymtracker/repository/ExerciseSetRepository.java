package com.gymtracker.repository;

import com.gymtracker.entity.ExerciseSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseSetRepository extends JpaRepository<ExerciseSet, Long> {

    /**
     * Find the PR (max weight set) for a given exercise across all workouts.
     */
    @Query("""
            SELECT s FROM ExerciseSet s
            JOIN s.workoutExercise we
            JOIN we.workout w
            WHERE we.exercise.id = :exerciseId
            AND w.userId = :userId
            ORDER BY s.weight DESC, s.reps DESC
            """)
    List<ExerciseSet> findAllByExerciseIdAndUserIdOrderByWeightDesc(
            @Param("exerciseId") Long exerciseId,
            @Param("userId") String userId
    );

    /**
     * Get all sets for an exercise within a date range (for progress chart).
     */
    @Query("""
            SELECT s FROM ExerciseSet s
            JOIN s.workoutExercise we
            JOIN we.workout w
            WHERE we.exercise.id = :exerciseId
            AND w.userId = :userId
            AND w.date BETWEEN :startDate AND :endDate
            ORDER BY w.date ASC
            """)
    List<ExerciseSet> findByExerciseIdAndUserIdAndDateRange(
            @Param("exerciseId") Long exerciseId,
            @Param("userId") String userId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate
    );
}
