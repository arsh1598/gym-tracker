package com.gymtracker.dto;

import java.time.LocalDate;

public interface PRProjection {
    Long getExerciseId();
    String getExerciseName();
    String getTargetMuscle();
    Double getMaxWeight();
    Integer getRepsAtMaxWeight();
    LocalDate getDateSet();
    LocalDate getLastDoneDate();
}
