package com.estatecrm.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller forwarding non-API frontend paths to index.html for React Router SPA execution.
 */
@Controller
public class SpaForwardController {

    @GetMapping(value = {
        "/",
        "/login",
        "/reports",
        "/leads",
        "/leads/**",
        "/projects",
        "/projects/**",
        "/units",
        "/units/**",
        "/bookings",
        "/bookings/**",
        "/customers",
        "/customers/**",
        "/employees",
        "/employees/**",
        "/activities",
        "/activities/**",
        "/follow-ups",
        "/follow-ups/**",
        "/settings",
        "/settings/**",
        "/audit-logs",
        "/audit-logs/**",
        "/notifications",
        "/notifications/**"
    })
    public String forwardSpa() {
        return "forward:/index.html";
    }
}
