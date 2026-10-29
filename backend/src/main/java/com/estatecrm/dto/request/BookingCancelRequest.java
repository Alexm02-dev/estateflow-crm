package com.estatecrm.dto.request;

import javax.validation.constraints.NotBlank;

public class BookingCancelRequest {

    @NotBlank(message = "Cancellation reason is required")
    private String reason;

    public BookingCancelRequest() {}

    public BookingCancelRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
