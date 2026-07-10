package com.gymtracker.repository;

import com.gymtracker.entity.WorkoutExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutExerciseRepository extends JpaRepository<WorkoutExercise, Long> {

    /**
     * Find the most recent WorkoutExercise for a given exercise (across all workouts),
     * used for smart pre-fill feature.
     */
    @Query("""
            SELECT we FROM WorkoutExercise we
            JOIN FETCH we.workout w
            JOIN FETCH we.sets s
            WHERE we.exercise.id = :exerciseId
            ORDER BY w.date DESC
            """)
    List<WorkoutExercise> findLatestByExerciseId(@Param("exerciseId") Long exerciseId);

    /**
     * Find recently logged exercises, ordered by most recent workout date (for dropdown).
     */
    @Query("""
            SELECT we FROM WorkoutExercise we
            JOIN FETCH we.exercise e
            JOIN we.workout w
            ORDER BY w.date DESC
            """)
    List<WorkoutExercise> findAllOrderByWorkoutDateDesc(org.springframework.data.domain.Pageable pageable);
}
