package com.gymtracker.repository;

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
}
