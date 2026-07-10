package com.gymtracker.controller;

import com.gymtracker.dto.ExerciseDto;
import com.gymtracker.service.ExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping
    public ResponseEntity<List<ExerciseDto>> getAllExercises(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String muscle) {

        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(exerciseService.searchExercises(search));
        } else if (muscle != null && !muscle.isBlank()) {
            return ResponseEntity.ok(exerciseService.getByMuscle(muscle));
        }
        return ResponseEntity.ok(exerciseService.getAllExercises());
    }

    @PostMapping
    public ResponseEntity<ExerciseDto> createExercise(@RequestBody ExerciseDto dto) {
        return ResponseEntity.ok(exerciseService.createExercise(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExerciseDto> updateExercise(@PathVariable Long id, @RequestBody ExerciseDto dto) {
        return ResponseEntity.ok(exerciseService.updateExercise(id, dto));
    }
}
