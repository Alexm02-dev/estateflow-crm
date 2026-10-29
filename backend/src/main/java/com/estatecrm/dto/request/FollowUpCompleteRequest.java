package com.estatecrm.dto.request;

import javax.validation.constraints.NotBlank;

public class FollowUpCompleteRequest {

    @NotBlank(message = "Completion notes cannot be blank")
    private String completionNotes;

    public FollowUpCompleteRequest() {}

    public FollowUpCompleteRequest(String completionNotes) {
        this.completionNotes = completionNotes;
    }

    public String getCompletionNotes() { return completionNotes; }
    public void setCompletionNotes(String completionNotes) { this.completionNotes = completionNotes; }
}
