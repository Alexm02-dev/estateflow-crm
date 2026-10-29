package com.estatecrm.dto.request;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class FollowUpCreateRequest {

    @NotNull(message = "Lead ID is required")
    private Long leadId;

    private Long assignedToId;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledAt;

    private String notes;

    public FollowUpCreateRequest() {}

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
