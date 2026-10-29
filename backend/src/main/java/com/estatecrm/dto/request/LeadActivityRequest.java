package com.estatecrm.dto.request;

import com.estatecrm.entity.ActivityType;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class LeadActivityRequest {

    @NotNull(message = "Activity type is required")
    private ActivityType type = ActivityType.NOTE;

    @NotBlank(message = "Description cannot be blank")
    private String description;

    public LeadActivityRequest() {}

    public LeadActivityRequest(ActivityType type, String description) {
        this.type = type;
        this.description = description;
    }

    public ActivityType getType() { return type; }
    public void setType(ActivityType type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
