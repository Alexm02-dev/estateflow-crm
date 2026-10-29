package com.estatecrm.controller;

import com.estatecrm.dto.request.BulkUnitStatusRequest;
import com.estatecrm.dto.request.UnitCreateRequest;
import com.estatecrm.dto.response.ApiResponse;
import com.estatecrm.dto.response.PropertyUnitDto;
import com.estatecrm.entity.UnitStatus;
import com.estatecrm.entity.UnitType;
import com.estatecrm.service.PropertyUnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/units")
@Tag(name = "Units", description = "Endpoints for managing property unit inventory")
public class UnitController {

    private final PropertyUnitService unitService;

    public UnitController(PropertyUnitService unitService) {
        this.unitService = unitService;
    }

    @GetMapping
    @Operation(summary = "Search and filter property units")
    public ResponseEntity<ApiResponse<List<PropertyUnitDto>>> getUnits(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) UnitType unitType,
            @RequestParam(required = false) UnitStatus status,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {

        List<PropertyUnitDto> units = unitService.searchUnits(projectId, buildingId, unitType, status, minPrice, maxPrice);
        return ResponseEntity.ok(ApiResponse.success(units));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get property unit details by ID")
    public ResponseEntity<ApiResponse<PropertyUnitDto>> getUnitById(@PathVariable Long id) {
        PropertyUnitDto unit = unitService.getUnitById(id);
        return ResponseEntity.ok(ApiResponse.success(unit));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new unit in inventory (Admin only)")
    public ResponseEntity<ApiResponse<PropertyUnitDto>> createUnit(@Valid @RequestBody UnitCreateRequest request) {
        PropertyUnitDto created = unitService.createUnit(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Unit created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update unit details (Admin only)")
    public ResponseEntity<ApiResponse<PropertyUnitDto>> updateUnit(@PathVariable Long id, @Valid @RequestBody UnitCreateRequest request) {
        PropertyUnitDto updated = unitService.updateUnit(id, request);
        return ResponseEntity.ok(ApiResponse.success("Unit updated successfully", updated));
    }

    @PostMapping("/bulk-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bulk update unit status (Admin only)")
    public ResponseEntity<ApiResponse<Integer>> bulkUpdateStatus(@Valid @RequestBody BulkUnitStatusRequest request) {
        int updated = unitService.bulkUpdateStatus(request);
        return ResponseEntity.ok(ApiResponse.success("Updated " + updated + " unit(s) successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete unit from inventory (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteUnit(@PathVariable Long id) {
        unitService.deleteUnit(id);
        return ResponseEntity.ok(ApiResponse.success("Unit deleted successfully", null));
    }
}
