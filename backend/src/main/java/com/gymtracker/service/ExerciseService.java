package com.gymtracker.service;

import com.gymtracker.dto.ExerciseDto;
import com.gymtracker.entity.Exercise;
import com.gymtracker.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;

    public List<ExerciseDto> getAllExercises() {
        return exerciseRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ExerciseDto> searchExercises(String query) {
        return exerciseRepository.findByNameContainingIgnoreCase(query).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ExerciseDto> getByMuscle(String muscle) {
        return exerciseRepository.findByTargetMuscleIgnoreCase(muscle).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExerciseDto createExercise(ExerciseDto dto) {
        if (dto.getName() != null) {
            String trimmedName = dto.getName().trim();
            Optional<Exercise> existing = exerciseRepository.findByNameIgnoreCase(trimmedName);
            if (existing.isPresent()) {
                return toDto(existing.get());
            }
        }
        Exercise exercise = Exercise.builder()
                .name(dto.getName() != null ? dto.getName().trim() : null)
                .targetMuscle(dto.getTargetMuscle())
                .build();
        return toDto(exerciseRepository.save(exercise));
    }

    @Transactional
    public ExerciseDto updateExercise(Long id, ExerciseDto dto) {
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found: " + id));
        exercise.setName(dto.getName());
        exercise.setTargetMuscle(dto.getTargetMuscle());
        return toDto(exerciseRepository.save(exercise));
    }

    public ExerciseDto toDto(Exercise exercise) {
        return ExerciseDto.builder()
                .id(exercise.getId())
                .name(exercise.getName())
                .targetMuscle(exercise.getTargetMuscle())
                .build();
    }
}
