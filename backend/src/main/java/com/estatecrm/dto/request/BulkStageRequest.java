package com.estatecrm.dto.request;

import com.estatecrm.entity.LeadStage;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

public class BulkStageRequest {

    @NotEmpty(message = "At least one lead ID must be provided")
    private List<Long> leadIds;

    @NotNull(message = "Target stage is required")
    private LeadStage stage;

    public BulkStageRequest() {}

    public BulkStageRequest(List<Long> leadIds, LeadStage stage) {
        this.leadIds = leadIds;
        this.stage = stage;
    }

    public List<Long> getLeadIds() { return leadIds; }
    public void setLeadIds(List<Long> leadIds) { this.leadIds = leadIds; }

    public LeadStage getStage() { return stage; }
    public void setStage(LeadStage stage) { this.stage = stage; }
}
