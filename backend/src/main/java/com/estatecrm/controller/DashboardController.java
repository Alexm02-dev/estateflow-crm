package com.estatecrm.controller;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.response.ApiResponse;
import com.estatecrm.dto.response.DashboardAnalyticsDto;
import com.estatecrm.dto.response.DashboardSummaryDto;
import com.estatecrm.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Endpoints for summary metrics and analytics")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get high-level summary KPIs calculated from live system state")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getSummary(@AuthenticationPrincipal UserPrincipal currentUser) {
        DashboardSummaryDto summary = dashboardService.getSummary(currentUser);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get charts, breakdown tables, and employee performance statistics")
    public ResponseEntity<ApiResponse<DashboardAnalyticsDto>> getAnalytics(@AuthenticationPrincipal UserPrincipal currentUser) {
        DashboardAnalyticsDto analytics = dashboardService.getAnalytics(currentUser);
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
}
