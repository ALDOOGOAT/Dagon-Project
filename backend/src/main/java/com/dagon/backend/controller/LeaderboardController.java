package com.dagon.backend.controller;

import com.dagon.backend.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    @Autowired
    private LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        return ResponseEntity.ok(leaderboardService.obtenerRankingGlobal());
    }

    @GetMapping("/exercises/{exerciseId}")
    public ResponseEntity<Map<String, Object>> getExerciseLeaderboard(@PathVariable Integer exerciseId) {
        return ResponseEntity.ok(leaderboardService.obtenerRankingEjercicio(exerciseId));
    }
}
