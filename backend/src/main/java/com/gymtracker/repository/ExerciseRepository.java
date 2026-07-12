package com.gymtracker.repository;

import com.gymtracker.entity.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    Optional<Exercise> findByIdAndUserId(Long id, String userId);
    List<Exercise> findByUserId(String userId);
    List<Exercise> findByUserIdAndNameContainingIgnoreCase(String userId, String name);
    List<Exercise> findByUserIdAndTargetMuscleIgnoreCase(String userId, String targetMuscle);
    Optional<Exercise> findByUserIdAndNameIgnoreCase(String userId, String name);
    boolean existsByUserIdAndNameIgnoreCase(String userId, String name);
}
