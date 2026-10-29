package com.estatecrm.dto.request;

import com.estatecrm.entity.LeadSource;
import com.estatecrm.entity.LeadStage;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LeadUpdateRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone cannot exceed 20 characters")
    private String phone;

    private String email;

    @NotNull(message = "Lead source is required")
    private LeadSource leadSource;

    private Long interestedProjectId;

    @DecimalMin(value = "0.0", message = "Budget cannot be negative")
    private BigDecimal budget;

    private Long assignedToId;

    @NotNull(message = "Stage is required")
    private LeadStage stage;

    private LocalDateTime nextFollowUpDate;

    private String notes;

    public LeadUpdateRequest() {}

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

    public BigDecimal getBudget() { return budget; }
    public void setBudget(BigDecimal budget) { this.budget = budget; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public LeadStage getStage() { return stage; }
    public void setStage(LeadStage stage) { this.stage = stage; }

    public LocalDateTime getNextFollowUpDate() { return nextFollowUpDate; }
    public void setNextFollowUpDate(LocalDateTime nextFollowUpDate) { this.nextFollowUpDate = nextFollowUpDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
