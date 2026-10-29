package com.estatecrm.dto.response;

import com.estatecrm.entity.PropertyUnit;
import com.estatecrm.entity.UnitStatus;
import com.estatecrm.entity.UnitType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PropertyUnitDto {
    private Long id;
    private Long buildingId;
    private String buildingName;
    private Long projectId;
    private String projectName;
    private String unitNumber;
    private UnitType unitType;
    private int floor;
    private BigDecimal areaSqft;
    private BigDecimal price;
    private UnitStatus status;
    private Long version;
    private LocalDateTime createdAt;

    public PropertyUnitDto() {}

    public PropertyUnitDto(PropertyUnit unit) {
        if (unit != null) {
            this.id = unit.getId();
            if (unit.getBuilding() != null) {
                this.buildingId = unit.getBuilding().getId();
                this.buildingName = unit.getBuilding().getName();
                if (unit.getBuilding().getProject() != null) {
                    this.projectId = unit.getBuilding().getProject().getId();
                    this.projectName = unit.getBuilding().getProject().getName();
                }
            }
            this.unitNumber = unit.getUnitNumber();
            this.unitType = unit.getUnitType();
            this.floor = unit.getFloor();
            this.areaSqft = unit.getAreaSqft();
            this.price = unit.getPrice();
            this.status = unit.getStatus();
            this.version = unit.getVersion();
            this.createdAt = unit.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBuildingId() { return buildingId; }
    public void setBuildingId(Long buildingId) { this.buildingId = buildingId; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getUnitNumber() { return unitNumber; }
    public void setUnitNumber(String unitNumber) { this.unitNumber = unitNumber; }

    public UnitType getUnitType() { return unitType; }
    public void setUnitType(UnitType unitType) { this.unitType = unitType; }

    public int getFloor() { return floor; }
    public void setFloor(int floor) { this.floor = floor; }

    public BigDecimal getAreaSqft() { return areaSqft; }
    public void setAreaSqft(BigDecimal areaSqft) { this.areaSqft = areaSqft; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public UnitStatus getStatus() { return status; }
    public void setStatus(UnitStatus status) { this.status = status; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
