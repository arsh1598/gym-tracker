package com.gymtracker.config;

import com.gymtracker.entity.Exercise;
import com.gymtracker.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ExerciseRepository exerciseRepository;

    @Override
    public void run(String... args) {
        log.info("Checking exercise seed data...");
        List<Exercise> candidates = List.of(
                // Legs
                Exercise.builder().name("Barbell Back Squat").targetMuscle("Legs").build(),
                Exercise.builder().name("Zercher Squat").targetMuscle("Legs").build(),
                Exercise.builder().name("Front Squat").targetMuscle("Legs").build(),
                Exercise.builder().name("Goblet Squat").targetMuscle("Legs").build(),
                Exercise.builder().name("Leg Press").targetMuscle("Legs").build(),
                Exercise.builder().name("Hack Squat").targetMuscle("Legs").build(),
                Exercise.builder().name("Bulgarian Split Squat").targetMuscle("Legs").build(),
                Exercise.builder().name("Romanian Deadlift").targetMuscle("Legs").build(),
                Exercise.builder().name("Sumo Deadlift").targetMuscle("Legs").build(),
                Exercise.builder().name("Trap Bar Deadlift").targetMuscle("Legs").build(),
                Exercise.builder().name("Standing Calf Raises").targetMuscle("Legs").build(),
                Exercise.builder().name("Seated Calf Raises").targetMuscle("Legs").build(),
                Exercise.builder().name("Leg Curl").targetMuscle("Legs").build(),
                Exercise.builder().name("Leg Extension").targetMuscle("Legs").build(),
                // Back
                Exercise.builder().name("Deadlift").targetMuscle("Back").build(),
                Exercise.builder().name("Paused Deadlift").targetMuscle("Back").build(),
                Exercise.builder().name("Barbell Row").targetMuscle("Back").build(),
                Exercise.builder().name("Pendlay Row").targetMuscle("Back").build(),
                Exercise.builder().name("Dumbbell Row").targetMuscle("Back").build(),
                Exercise.builder().name("Cable Row").targetMuscle("Back").build(),
                Exercise.builder().name("Machine row").targetMuscle("Back").build(),
                Exercise.builder().name("Lat pull down").targetMuscle("Back").build(),
                Exercise.builder().name("Pull Up").targetMuscle("Back").build(),
                Exercise.builder().name("Chin Up").targetMuscle("Back").build(),
                // Chest
                Exercise.builder().name("Bench Press").targetMuscle("Chest").build(),
                Exercise.builder().name("Incline Bench Press").targetMuscle("Chest").build(),
                Exercise.builder().name("Decline Bench Press").targetMuscle("Chest").build(),
                Exercise.builder().name("Dumbbell Bench Press").targetMuscle("Chest").build(),
                Exercise.builder().name("Incline Dumbbell Press").targetMuscle("Chest").build(),
                Exercise.builder().name("Incline Dumbbell Flys").targetMuscle("Chest").build(),
                Exercise.builder().name("Cable Fly").targetMuscle("Chest").build(),
                Exercise.builder().name("Machine flys").targetMuscle("Chest").build(),
                Exercise.builder().name("Dips").targetMuscle("Chest").build(),
                Exercise.builder().name("Push Ups").targetMuscle("Chest").build(),
                // Shoulders
                Exercise.builder().name("Face Pull").targetMuscle("Shoulders").build(),
                Exercise.builder().name("Overhead Press").targetMuscle("Shoulders").build(),
                Exercise.builder().name("Dumbbell Shoulder Press").targetMuscle("Shoulders").build(),
                Exercise.builder().name("Arnold Press").targetMuscle("Shoulders").build(),
                Exercise.builder().name("Lateral Raises").targetMuscle("Shoulders").build(),
                Exercise.builder().name("Side Lateral").targetMuscle("Shoulders").build(),
                Exercise.builder().name("Front Raise").targetMuscle("Shoulders").build(),
                Exercise.builder().name("Rear Delt Fly").targetMuscle("Shoulders").build(),
                // Biceps
                Exercise.builder().name("Barbell Curl").targetMuscle("Biceps").build(),
                Exercise.builder().name("Bicep Curls").targetMuscle("Biceps").build(),
                Exercise.builder().name("Hammer Curls").targetMuscle("Biceps").build(),
                Exercise.builder().name("Incline Dumbbell Curls").targetMuscle("Biceps").build(),
                Exercise.builder().name("Forearms Curls").targetMuscle("Biceps").build(),
                Exercise.builder().name("Cable Curl").targetMuscle("Biceps").build(),
                Exercise.builder().name("Preacher Curl").targetMuscle("Biceps").build(),
                // Triceps
                Exercise.builder().name("Tricep Pushdown").targetMuscle("Triceps").build(),
                Exercise.builder().name("Skull Crushers").targetMuscle("Triceps").build(),
                Exercise.builder().name("Close Grip Bench Press").targetMuscle("Triceps").build(),
                Exercise.builder().name("Overhead Tricep Extension").targetMuscle("Triceps").build(),
                Exercise.builder().name("Tricep Kickback").targetMuscle("Triceps").build(),
                // Core
                Exercise.builder().name("Plank").targetMuscle("Core").build(),
                Exercise.builder().name("Ab Wheel Rollout").targetMuscle("Core").build(),
                Exercise.builder().name("Cable Crunch").targetMuscle("Core").build(),
                Exercise.builder().name("Hanging Leg Raise").targetMuscle("Core").build()
        );

        // Idempotent: only insert exercises that don't already exist by name for system (null user_id)
        int seeded = 0;
        for (Exercise candidate : candidates) {
            candidate.setUserId(null); // Explicitly null for system
            if (!exerciseRepository.existsByUserIdIsNullAndNameIgnoreCase(candidate.getName())) {
                exerciseRepository.save(candidate);
                seeded++;
            }
        }

        if (seeded > 0) {
            log.info("Seeded {} new exercises.", seeded);
        } else {
            log.info("All exercises already present — skipping seed.");
        }
    }
}
