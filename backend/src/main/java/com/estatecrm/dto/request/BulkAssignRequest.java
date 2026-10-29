package com.estatecrm.dto.request;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

public class BulkAssignRequest {

    @NotEmpty(message = "At least one lead ID must be provided")
    private List<Long> leadIds;

    @NotNull(message = "Assigned user ID is required")
    private Long assignedToId;

    public BulkAssignRequest() {}

    public BulkAssignRequest(List<Long> leadIds, Long assignedToId) {
        this.leadIds = leadIds;
        this.assignedToId = assignedToId;
    }

    public List<Long> getLeadIds() { return leadIds; }
    public void setLeadIds(List<Long> leadIds) { this.leadIds = leadIds; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }
}
