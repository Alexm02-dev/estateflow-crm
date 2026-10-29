package com.estatecrm.dto.response;

import com.estatecrm.entity.Project;
import com.estatecrm.entity.ProjectStatus;
import com.estatecrm.entity.PropertyType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ProjectDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String address;
    private String city;
    private ProjectStatus status;
    private PropertyType propertyType;
    private LocalDate startDate;
    private LocalDate completionDate;
    private List<BuildingDto> buildings = new ArrayList<>();
    private int totalUnits;
    private int availableUnits;
    private LocalDateTime createdAt;

    public ProjectDto() {}

    public ProjectDto(Project project) {
        if (project != null) {
            this.id = project.getId();
            this.code = project.getCode();
            this.name = project.getName();
            this.description = project.getDescription();
            this.address = project.getAddress();
            this.city = project.getCity();
            this.status = project.getStatus();
            this.propertyType = project.getPropertyType();
            this.startDate = project.getStartDate();
            this.completionDate = project.getCompletionDate();
            this.createdAt = project.getCreatedAt();

            if (project.getBuildings() != null) {
                this.buildings = project.getBuildings().stream()
                        .map(BuildingDto::new)
                        .collect(Collectors.toList());
                this.totalUnits = this.buildings.stream().mapToInt(BuildingDto::getTotalUnits).sum();
                this.availableUnits = this.buildings.stream().mapToInt(BuildingDto::getAvailableUnits).sum();
            }
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public ProjectStatus getStatus() { return status; }
    public void setStatus(ProjectStatus status) { this.status = status; }

    public PropertyType getPropertyType() { return propertyType; }
    public void setPropertyType(PropertyType propertyType) { this.propertyType = propertyType; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getCompletionDate() { return completionDate; }
    public void setCompletionDate(LocalDate completionDate) { this.completionDate = completionDate; }

    public List<BuildingDto> getBuildings() { return buildings; }
    public void setBuildings(List<BuildingDto> buildings) { this.buildings = buildings; }

    public int getTotalUnits() { return totalUnits; }
    public void setTotalUnits(int totalUnits) { this.totalUnits = totalUnits; }

    public int getAvailableUnits() { return availableUnits; }
    public void setAvailableUnits(int availableUnits) { this.availableUnits = availableUnits; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
