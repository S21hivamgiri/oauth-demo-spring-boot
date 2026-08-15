package com.example.oauthdemo;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.util.Map;

@RestController
public class OuthController {

    @GetMapping("/api/health")
    public Map sayIamAlive() {
        return Map.of(
                "status", "ok",
                "service", "auth-service");
    }

    @GetMapping("/api/me")
    public Object me(@AuthenticationPrincipal Jwt jwt) {

        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("userId", jwt.getSubject());
        claims.put("email", jwt.getClaimAsString("email"));
        claims.put("roles", jwt.getClaimAsStringList("https://yourapp.com/roles"));
        return claims;
    }

    @GetMapping("/api/admin/dashboard")
    public String adminOnly() {
        return "If you can see this, your token had ROLE_ADMIN.";
    }
}
