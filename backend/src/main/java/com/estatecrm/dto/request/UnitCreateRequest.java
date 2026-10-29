package com.estatecrm.dto.request;

import com.estatecrm.entity.UnitStatus;
import com.estatecrm.entity.UnitType;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.math.BigDecimal;

public class UnitCreateRequest {

    @NotNull(message = "Building ID is required")
    private Long buildingId;

    @NotBlank(message = "Unit number is required")
    @Size(max = 50, message = "Unit number must not exceed 50 characters")
    private String unitNumber;

    @NotNull(message = "Unit type is required")
    private UnitType unitType = UnitType.TWO_BHK;

    @NotNull(message = "Floor is required")
    private Integer floor;

    @NotNull(message = "Area is required")
    @DecimalMin(value = "1.0", message = "Area must be positive")
    private BigDecimal areaSqft;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price cannot be negative")
    private BigDecimal price;

    private UnitStatus status = UnitStatus.AVAILABLE;

    public UnitCreateRequest() {}

    public Long getBuildingId() { return buildingId; }
    public void setBuildingId(Long buildingId) { this.buildingId = buildingId; }

    public String getUnitNumber() { return unitNumber; }
    public void setUnitNumber(String unitNumber) { this.unitNumber = unitNumber; }

    public UnitType getUnitType() { return unitType; }
    public void setUnitType(UnitType unitType) { this.unitType = unitType; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public BigDecimal getAreaSqft() { return areaSqft; }
    public void setAreaSqft(BigDecimal areaSqft) { this.areaSqft = areaSqft; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public UnitStatus getStatus() { return status; }
    public void setStatus(UnitStatus status) { this.status = status; }
}
