package com.gymtracker.repository;

import com.gymtracker.entity.Workout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutRepository extends JpaRepository<Workout, Long> {
    Optional<Workout> findByIdAndUserId(Long id, String userId);
    Optional<Workout> findByDateAndUserId(LocalDate date, String userId);
    List<Workout> findAllByUserIdOrderByDateDesc(String userId);
    List<Workout> findAllByUserIdOrderByDateDesc(String userId, Pageable pageable);

    @Query("SELECT COUNT(w) FROM Workout w WHERE w.userId = :userId AND w.date BETWEEN :start AND :end")
    long countByUserIdAndDateBetween(@Param("userId") String userId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT w FROM Workout w WHERE w.userId = :userId AND YEAR(w.date) = :year AND MONTH(w.date) = :month ORDER BY w.date DESC")
    List<Workout> findByUserIdAndYearAndMonth(@Param("userId") String userId, @Param("year") int year, @Param("month") int month);
}
