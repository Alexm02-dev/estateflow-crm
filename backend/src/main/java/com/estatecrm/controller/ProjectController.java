package com.estatecrm.controller;

import com.estatecrm.dto.request.BuildingCreateRequest;
import com.estatecrm.dto.request.ProjectCreateRequest;
import com.estatecrm.dto.response.ApiResponse;
import com.estatecrm.dto.response.BuildingDto;
import com.estatecrm.dto.response.ProjectDto;
import com.estatecrm.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@Tag(name = "Projects", description = "Endpoints for managing real estate developments and projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    @Operation(summary = "Get all projects")
    public ResponseEntity<ApiResponse<List<ProjectDto>>> getAllProjects() {
        List<ProjectDto> projects = projectService.getAllProjects();
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project details by ID")
    public ResponseEntity<ApiResponse<ProjectDto>> getProjectById(@PathVariable Long id) {
        ProjectDto project = projectService.getProjectById(id);
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new project (Admin only)")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(@Valid @RequestBody ProjectCreateRequest request) {
        ProjectDto created = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing project (Admin only)")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectCreateRequest request) {
        ProjectDto updated = projectService.updateProject(id, request);
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", updated));
    }

    @GetMapping("/{id}/buildings")
    @Operation(summary = "Get all buildings/towers in a project")
    public ResponseEntity<ApiResponse<List<BuildingDto>>> getProjectBuildings(@PathVariable Long id) {
        List<BuildingDto> buildings = projectService.getBuildingsByProject(id);
        return ResponseEntity.ok(ApiResponse.success(buildings));
    }

    @PostMapping("/{id}/buildings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a building/tower to a project (Admin only)")
    public ResponseEntity<ApiResponse<BuildingDto>> addBuilding(@PathVariable Long id, @Valid @RequestBody BuildingCreateRequest request) {
        request.setProjectId(id);
        BuildingDto building = projectService.addBuildingToProject(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Building added successfully", building));
    }
}
