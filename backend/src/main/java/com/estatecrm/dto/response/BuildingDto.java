package com.estatecrm.dto.response;

import com.estatecrm.entity.Building;

public class BuildingDto {
    private Long id;
    private Long projectId;
    private String projectName;
    private String name;
    private int floors;
    private int totalUnits;
    private int availableUnits;

    public BuildingDto() {}

    public BuildingDto(Building building) {
        if (building != null) {
            this.id = building.getId();
            if (building.getProject() != null) {
                this.projectId = building.getProject().getId();
                this.projectName = building.getProject().getName();
            }
            this.name = building.getName();
            this.floors = building.getFloors();
            if (building.getUnits() != null) {
                this.totalUnits = building.getUnits().size();
                this.availableUnits = (int) building.getUnits().stream()
                        .filter(u -> u.getStatus().name().equals("AVAILABLE"))
                        .count();
            }
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getFloors() { return floors; }
    public void setFloors(int floors) { this.floors = floors; }

    public int getTotalUnits() { return totalUnits; }
    public void setTotalUnits(int totalUnits) { this.totalUnits = totalUnits; }

    public int getAvailableUnits() { return availableUnits; }
    public void setAvailableUnits(int availableUnits) { this.availableUnits = availableUnits; }
}
