package com.gymtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PRDto {
    private Long exerciseId;
    private String exerciseName;
    private String targetMuscle;
    private Double maxWeight;
    private Integer repsAtMaxWeight;
    private LocalDate dateSet;
    private LocalDate lastDoneDate;
    private Double estimatedOneRepMax;
}
