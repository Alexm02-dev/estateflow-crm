package com.estatecrm.controller;

import com.estatecrm.dto.request.BulkEmployeeStatusRequest;
import com.estatecrm.dto.request.EmployeeCreateRequest;
import com.estatecrm.dto.request.EmployeeUpdateRequest;
import com.estatecrm.dto.response.ApiResponse;
import com.estatecrm.dto.response.UserDto;
import com.estatecrm.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
@Tag(name = "Employees", description = "Endpoints for employee and user administration (Admin only)")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all employees (Admin only)")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllEmployees() {
        List<UserDto> employees = employeeService.getAllEmployees();
        return ResponseEntity.ok(ApiResponse.success(employees));
    }

    @GetMapping("/sales")
    @Operation(summary = "Get list of active sales agents for assignment dropdowns")
    public ResponseEntity<ApiResponse<List<UserDto>>> getSalesEmployees() {
        List<UserDto> employees = employeeService.getActiveSalesEmployees();
        return ResponseEntity.ok(ApiResponse.success(employees));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get employee details by ID (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> getEmployeeById(@PathVariable Long id) {
        UserDto employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new employee user (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> createEmployee(@Valid @RequestBody EmployeeCreateRequest request) {
        UserDto created = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update employee details, role, or active status (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeUpdateRequest request) {
        UserDto updated = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.success("Employee updated successfully", updated));
    }

    @PostMapping("/bulk-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bulk activate or deactivate employees (Admin only)")
    public ResponseEntity<ApiResponse<Integer>> bulkUpdateStatus(@Valid @RequestBody BulkEmployeeStatusRequest request) {
        int updated = employeeService.bulkUpdateStatus(request);
        return ResponseEntity.ok(ApiResponse.success("Updated status for " + updated + " employee(s) successfully", updated));
    }
}
