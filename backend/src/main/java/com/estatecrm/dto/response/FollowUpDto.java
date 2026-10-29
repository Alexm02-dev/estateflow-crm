package com.estatecrm.dto.response;

import com.estatecrm.entity.FollowUp;
import com.estatecrm.entity.FollowUpStatus;

import java.time.LocalDateTime;

public class FollowUpDto {
    private Long id;
    private Long leadId;
    private String leadCode;
    private String leadName;
    private String leadPhone;
    private Long assignedToId;
    private String assignedToName;
    private LocalDateTime scheduledAt;
    private FollowUpStatus status;
    private String notes;
    private String completionNotes;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private boolean isOverdue;

    public FollowUpDto() {}

    public FollowUpDto(FollowUp followUp) {
        if (followUp != null) {
            this.id = followUp.getId();
            if (followUp.getLead() != null) {
                this.leadId = followUp.getLead().getId();
                this.leadCode = followUp.getLead().getLeadCode();
                this.leadName = followUp.getLead().getFullName();
                this.leadPhone = followUp.getLead().getPhone();
            }
            if (followUp.getAssignedTo() != null) {
                this.assignedToId = followUp.getAssignedTo().getId();
                this.assignedToName = followUp.getAssignedTo().getName();
            }
            this.scheduledAt = followUp.getScheduledAt();
            this.status = followUp.getStatus();
            this.notes = followUp.getNotes();
            this.completionNotes = followUp.getCompletionNotes();
            this.completedAt = followUp.getCompletedAt();
            this.createdAt = followUp.getCreatedAt();
            this.isOverdue = followUp.getStatus() == FollowUpStatus.PENDING &&
                    followUp.getScheduledAt() != null &&
                    followUp.getScheduledAt().isBefore(LocalDateTime.now());
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getLeadCode() { return leadCode; }
    public void setLeadCode(String leadCode) { this.leadCode = leadCode; }

    public String getLeadName() { return leadName; }
    public void setLeadName(String leadName) { this.leadName = leadName; }

    public String getLeadPhone() { return leadPhone; }
    public void setLeadPhone(String leadPhone) { this.leadPhone = leadPhone; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public FollowUpStatus getStatus() { return status; }
    public void setStatus(FollowUpStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCompletionNotes() { return completionNotes; }
    public void setCompletionNotes(String completionNotes) { this.completionNotes = completionNotes; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isOverdue() { return isOverdue; }
    public void setOverdue(boolean overdue) { isOverdue = overdue; }
}
