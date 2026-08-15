package com.example.oauthdemo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class OuthController {

    @GetMapping("/api/health")
    public Map sayIamAlive() {
        return Map.of(
                "status", "ok",
                "service", "auth-service");
    }
}
