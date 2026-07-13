package com.gymtracker.repository;

import com.gymtracker.dto.PRProjection;
import com.gymtracker.entity.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    Optional<Exercise> findByIdAndUserId(Long id, String userId);

    @Query("SELECT e FROM Exercise e WHERE e.id = :id AND (e.userId = :userId OR e.userId IS NULL)")
    Optional<Exercise> findByIdAndUserIdOrSystem(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("userId") String userId);

    @Query("SELECT e FROM Exercise e WHERE e.userId = :userId OR e.userId IS NULL")
    List<Exercise> findAllByUserIdOrSystem(@org.springframework.data.repository.query.Param("userId") String userId);

    @Query("SELECT e FROM Exercise e WHERE (e.userId = :userId OR e.userId IS NULL) AND e.name ILIKE %:name%")
    List<Exercise> searchByUserIdOrSystem(@org.springframework.data.repository.query.Param("userId") String userId, @org.springframework.data.repository.query.Param("name") String name);

    @Query("SELECT e FROM Exercise e WHERE (e.userId = :userId OR e.userId IS NULL) AND e.targetMuscle ILIKE :targetMuscle")
    List<Exercise> findByMuscleAndUserIdOrSystem(@org.springframework.data.repository.query.Param("userId") String userId, @org.springframework.data.repository.query.Param("targetMuscle") String targetMuscle);

    @Query("SELECT e FROM Exercise e WHERE (e.userId = :userId OR e.userId IS NULL) AND e.name ILIKE :name")
    Optional<Exercise> findExactByUserIdOrSystem(@org.springframework.data.repository.query.Param("userId") String userId, @org.springframework.data.repository.query.Param("name") String name);

    boolean existsByUserIdIsNullAndNameIgnoreCase(String name);

    @Query(value = """
        SELECT 
            e.id AS "exerciseId",
            e.name AS "exerciseName",
            e.target_muscle AS "targetMuscle",
            best_set.weight AS "maxWeight",
            best_set.reps AS "repsAtMaxWeight",
            best_set.workout_date AS "dateSet",
            last_done.max_date AS "lastDoneDate"
        FROM exercises e
        JOIN (
            SELECT DISTINCT ON (we.exercise_id) 
                we.exercise_id,
                s.weight,
                s.reps,
                w.date AS workout_date
            FROM exercise_sets s
            JOIN workout_exercises we ON s.workout_exercise_id = we.id
            JOIN workouts w ON we.workout_id = w.id
            WHERE w.user_id = :userId
            ORDER BY we.exercise_id, s.weight DESC, s.reps DESC
        ) best_set ON e.id = best_set.exercise_id
        JOIN (
            SELECT we.exercise_id, MAX(w.date) AS max_date
            FROM workout_exercises we
            JOIN workouts w ON we.workout_id = w.id
            WHERE w.user_id = :userId
            GROUP BY we.exercise_id
        ) last_done ON e.id = last_done.exercise_id
        """, nativeQuery = true)
    List<PRProjection> findPRsByUserId(@org.springframework.data.repository.query.Param("userId") String userId);
}
