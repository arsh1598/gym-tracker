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
public class ProgressDataPoint {
    private LocalDate date;
    private Double maxWeight;
    private Double totalVolume;    // sum of weight * reps for all sets
    private Double bestSetVolume;  // best single set weight * reps
    private Double bestSetWeight;
    private Integer bestSetReps;
    private Double estimatedOneRepMax;
    private Integer totalReps;
}
