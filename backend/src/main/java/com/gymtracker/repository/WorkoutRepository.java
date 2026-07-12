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
    Optional<Workout> findByDate(LocalDate date);
    List<Workout> findByDateBetweenOrderByDateDesc(LocalDate start, LocalDate end);
    List<Workout> findAllByOrderByDateDesc();
    List<Workout> findAllByOrderByDateDesc(Pageable pageable);

    @Query("SELECT COUNT(w) FROM Workout w WHERE w.date BETWEEN :start AND :end")
    long countByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT w FROM Workout w WHERE YEAR(w.date) = :year AND MONTH(w.date) = :month ORDER BY w.date DESC")
    List<Workout> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    List<Workout> findTop5ByOrderByDateDesc();
}
