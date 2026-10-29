package com.estatecrm.dto.request;

import com.estatecrm.entity.UnitStatus;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

public class BulkUnitStatusRequest {

    @NotEmpty(message = "At least one unit ID must be provided")
    private List<Long> unitIds;

    @NotNull(message = "Unit status is required")
    private UnitStatus status;

    public BulkUnitStatusRequest() {}

    public BulkUnitStatusRequest(List<Long> unitIds, UnitStatus status) {
        this.unitIds = unitIds;
        this.status = status;
    }

    public List<Long> getUnitIds() { return unitIds; }
    public void setUnitIds(List<Long> unitIds) { this.unitIds = unitIds; }

    public UnitStatus getStatus() { return status; }
    public void setStatus(UnitStatus status) { this.status = status; }
}
