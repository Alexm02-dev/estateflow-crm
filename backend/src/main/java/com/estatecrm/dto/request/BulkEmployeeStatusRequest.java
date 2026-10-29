package com.estatecrm.dto.request;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

public class BulkEmployeeStatusRequest {

    @NotEmpty(message = "At least one employee ID must be provided")
    private List<Long> employeeIds;

    @NotNull(message = "Active status is required")
    private Boolean active;

    public BulkEmployeeStatusRequest() {}

    public BulkEmployeeStatusRequest(List<Long> employeeIds, Boolean active) {
        this.employeeIds = employeeIds;
        this.active = active;
    }

    public List<Long> getEmployeeIds() { return employeeIds; }
    public void setEmployeeIds(List<Long> employeeIds) { this.employeeIds = employeeIds; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
