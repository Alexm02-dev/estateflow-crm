package com.estatecrm.controller;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.request.FollowUpCompleteRequest;
import com.estatecrm.dto.request.FollowUpCreateRequest;
import com.estatecrm.dto.response.ApiResponse;
import com.estatecrm.dto.response.FollowUpDto;
import com.estatecrm.dto.response.PagedResponse;
import com.estatecrm.entity.FollowUpStatus;
import com.estatecrm.service.FollowUpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/follow-ups")
@Tag(name = "Follow-ups", description = "Endpoints for scheduling and tracking lead follow-ups")
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @GetMapping
    @Operation(summary = "Get paginated follow-ups with filters")
    public ResponseEntity<ApiResponse<PagedResponse<FollowUpDto>>> getFollowUps(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) FollowUpStatus status,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Boolean overdueOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PagedResponse<FollowUpDto> response = followUpService.getFollowUps(
                currentUser, status, assignedToId, overdueOnly, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/lead/{leadId}")
    @Operation(summary = "Get all follow-ups for a specific lead")
    public ResponseEntity<ApiResponse<List<FollowUpDto>>> getFollowUpsForLead(
            @PathVariable Long leadId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<FollowUpDto> list = followUpService.getFollowUpsForLead(leadId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @Operation(summary = "Schedule a new follow-up")
    public ResponseEntity<ApiResponse<FollowUpDto>> createFollowUp(
            @Valid @RequestBody FollowUpCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        FollowUpDto created = followUpService.createFollowUp(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Follow-up scheduled", created));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Mark follow-up as completed with notes")
    public ResponseEntity<ApiResponse<FollowUpDto>> completeFollowUp(
            @PathVariable Long id,
            @Valid @RequestBody FollowUpCompleteRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        FollowUpDto completed = followUpService.completeFollowUp(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Follow-up marked as completed", completed));
    }
}
