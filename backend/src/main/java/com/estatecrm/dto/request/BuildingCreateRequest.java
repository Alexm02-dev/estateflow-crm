package com.estatecrm.dto.request;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class BuildingCreateRequest {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Building name is required")
    @Size(max = 100, message = "Building name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Floors count is required")
    @Min(value = 1, message = "Floors must be at least 1")
    private Integer floors;

    public BuildingCreateRequest() {}

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getFloors() { return floors; }
    public void setFloors(Integer floors) { this.floors = floors; }
}
