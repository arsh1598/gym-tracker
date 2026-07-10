package com.gymtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetDto {
    private Long id;
    private Integer setNumber;
    private Double weight;
    private Integer reps;
    private Double rpe;
    private Boolean isDropSet;
}
