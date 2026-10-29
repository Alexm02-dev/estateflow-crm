package com.estatecrm.dto.response;

import com.estatecrm.entity.Lead;
import com.estatecrm.entity.LeadSource;
import com.estatecrm.entity.LeadStage;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LeadDto {
    private Long id;
    private String leadCode;
    private String fullName;
    private String phone;
    private String email;
    private LeadSource leadSource;
    private Long interestedProjectId;
    private String interestedProjectName;
    private BigDecimal budget;
    private Long assignedToId;
    private String assignedToName;
    private LeadStage stage;
    private LocalDateTime nextFollowUpDate;
    private String notes;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LeadDto() {}

    public LeadDto(Lead lead) {
        if (lead != null) {
            this.id = lead.getId();
            this.leadCode = lead.getLeadCode();
            this.fullName = lead.getFullName();
            this.phone = lead.getPhone();
            this.email = lead.getEmail();
            this.leadSource = lead.getLeadSource();
            if (lead.getInterestedProject() != null) {
                this.interestedProjectId = lead.getInterestedProject().getId();
                this.interestedProjectName = lead.getInterestedProject().getName();
            }
            this.budget = lead.getBudget();
            if (lead.getAssignedTo() != null) {
                this.assignedToId = lead.getAssignedTo().getId();
                this.assignedToName = lead.getAssignedTo().getName();
            }
            this.stage = lead.getStage();
            this.nextFollowUpDate = lead.getNextFollowUpDate();
            this.notes = lead.getNotes();
            if (lead.getCreatedBy() != null) {
                this.createdById = lead.getCreatedBy().getId();
                this.createdByName = lead.getCreatedBy().getName();
            }
            this.createdAt = lead.getCreatedAt();
            this.updatedAt = lead.getUpdatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLeadCode() { return leadCode; }
    public void setLeadCode(String leadCode) { this.leadCode = leadCode; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LeadSource getLeadSource() { return leadSource; }
    public void setLeadSource(LeadSource leadSource) { this.leadSource = leadSource; }

    public Long getInterestedProjectId() { return interestedProjectId; }
    public void setInterestedProjectId(Long interestedProjectId) { this.interestedProjectId = interestedProjectId; }

    public String getInterestedProjectName() { return interestedProjectName; }
    public void setInterestedProjectName(String interestedProjectName) { this.interestedProjectName = interestedProjectName; }

    public BigDecimal getBudget() { return budget; }
    public void setBudget(BigDecimal budget) { this.budget = budget; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }

    public LeadStage getStage() { return stage; }
    public void setStage(LeadStage stage) { this.stage = stage; }

    public LocalDateTime getNextFollowUpDate() { return nextFollowUpDate; }
    public void setNextFollowUpDate(LocalDateTime nextFollowUpDate) { this.nextFollowUpDate = nextFollowUpDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
