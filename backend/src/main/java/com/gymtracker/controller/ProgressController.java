package com.gymtracker.controller;

import com.gymtracker.dto.PRDto;
import com.gymtracker.dto.ProgressDataPoint;
import com.gymtracker.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    /**
     * Get PR for a specific exercise.
     * GET /api/progress/prs/5
     */
    @GetMapping("/prs/{exerciseId}")
    public ResponseEntity<PRDto> getPRForExercise(@PathVariable Long exerciseId) {
        return progressService.getPRForExercise(exerciseId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all PRs (for the PRs page grid).
     * GET /api/progress/prs
     */
    @GetMapping("/prs")
    public ResponseEntity<List<PRDto>> getAllPRs() {
        return ResponseEntity.ok(progressService.getAllPRs());
    }

    /**
     * Get progress data for charting.
     * GET /api/progress/exercise/5?startDate=2026-04-01&endDate=2026-07-10
     */
    @GetMapping("/exercise/{exerciseId}")
    public ResponseEntity<List<ProgressDataPoint>> getExerciseProgress(
            @PathVariable Long exerciseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(progressService.getProgressData(exerciseId, startDate, endDate));
    }

    /**
     * Get muscle volume progress.
     * GET /api/progress/muscle-volume?startDate=2026-04-01&endDate=2026-07-10
     */
    @GetMapping("/muscle-volume")
    public ResponseEntity<Map<String, List<ProgressDataPoint>>> getMuscleVolume(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(progressService.getMuscleVolumeProgress(startDate, endDate));
    }
}
