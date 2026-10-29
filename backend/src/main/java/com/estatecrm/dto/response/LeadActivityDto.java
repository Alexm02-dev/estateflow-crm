package com.estatecrm.dto.response;

import com.estatecrm.entity.ActivityType;
import com.estatecrm.entity.LeadActivity;

import java.time.LocalDateTime;

public class LeadActivityDto {
    private Long id;
    private Long leadId;
    private Long userId;
    private String userName;
    private ActivityType type;
    private String description;
    private LocalDateTime createdAt;

    public LeadActivityDto() {}

    public LeadActivityDto(LeadActivity activity) {
        if (activity != null) {
            this.id = activity.getId();
            if (activity.getLead() != null) {
                this.leadId = activity.getLead().getId();
            }
            if (activity.getUser() != null) {
                this.userId = activity.getUser().getId();
                this.userName = activity.getUser().getName();
            }
            this.type = activity.getType();
            this.description = activity.getDescription();
            this.createdAt = activity.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public ActivityType getType() { return type; }
    public void setType(ActivityType type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
