package com.estatecrm.controller;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.request.BulkAssignRequest;
import com.estatecrm.dto.request.BulkIdsRequest;
import com.estatecrm.dto.request.BulkStageRequest;
import com.estatecrm.dto.request.LeadActivityRequest;
import com.estatecrm.dto.request.LeadCreateRequest;
import com.estatecrm.dto.request.LeadUpdateRequest;
import com.estatecrm.dto.response.ApiResponse;
import com.estatecrm.dto.response.LeadActivityDto;
import com.estatecrm.dto.response.LeadDto;
import com.estatecrm.dto.response.PagedResponse;
import com.estatecrm.entity.LeadSource;
import com.estatecrm.entity.LeadStage;
import com.estatecrm.service.LeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/leads")
@Tag(name = "Leads", description = "Endpoints for managing leads and activity logs")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping
    @Operation(summary = "Get paginated leads with filtering and search")
    public ResponseEntity<ApiResponse<PagedResponse<LeadDto>>> getLeads(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LeadStage stage,
            @RequestParam(required = false) LeadSource source,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        PagedResponse<LeadDto> response = leadService.getLeads(
                currentUser, search, stage, source, assignedToId, projectId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lead by ID")
    public ResponseEntity<ApiResponse<LeadDto>> getLeadById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        LeadDto lead = leadService.getLeadById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @PostMapping
    @Operation(summary = "Create a new lead")
    public ResponseEntity<ApiResponse<LeadDto>> createLead(
            @Valid @RequestBody LeadCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        LeadDto created = leadService.createLead(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lead created successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing lead")
    public ResponseEntity<ApiResponse<LeadDto>> updateLead(
            @PathVariable Long id,
            @Valid @RequestBody LeadUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        LeadDto updated = leadService.updateLead(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Lead updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete or archive a lead (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteLead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        leadService.deleteLead(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Lead deleted successfully", null));
    }

    @GetMapping("/{id}/activities")
    @Operation(summary = "Get activity history for a lead")
    public ResponseEntity<ApiResponse<List<LeadActivityDto>>> getActivities(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<LeadActivityDto> activities = leadService.getLeadActivities(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @PostMapping("/{id}/activities")
    @Operation(summary = "Add an activity or note to a lead")
    public ResponseEntity<ApiResponse<LeadActivityDto>> addActivity(
            @PathVariable Long id,
            @Valid @RequestBody LeadActivityRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        LeadActivityDto activity = leadService.addActivity(id, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Activity recorded", activity));
    }

    @PostMapping("/bulk-assign")
    @Operation(summary = "Bulk assign leads to a sales employee")
    public ResponseEntity<ApiResponse<Integer>> bulkAssignLeads(
            @Valid @RequestBody BulkAssignRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        int updated = leadService.bulkAssignLeads(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Assigned " + updated + " lead(s) successfully", updated));
    }

    @PostMapping("/bulk-stage")
    @Operation(summary = "Bulk update lead stage")
    public ResponseEntity<ApiResponse<Integer>> bulkUpdateStage(
            @Valid @RequestBody BulkStageRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        int updated = leadService.bulkUpdateStage(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Updated stage for " + updated + " lead(s) successfully", updated));
    }

    @PostMapping("/bulk-delete")
    @Operation(summary = "Bulk delete leads (Admin only)")
    public ResponseEntity<ApiResponse<Integer>> bulkDeleteLeads(
            @Valid @RequestBody BulkIdsRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        int deleted = leadService.bulkDeleteLeads(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Deleted " + deleted + " lead(s) successfully", deleted));
    }
}
