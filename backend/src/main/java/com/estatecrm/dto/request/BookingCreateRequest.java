package com.estatecrm.dto.request;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

public class BookingCreateRequest {

    @NotNull(message = "Lead ID is required")
    private Long leadId;

    @NotNull(message = "Unit ID is required")
    private Long unitId;

    @NotNull(message = "Agreed price is required")
    @DecimalMin(value = "1.0", message = "Agreed price must be greater than zero")
    private BigDecimal agreedPrice;

    @NotNull(message = "Booking amount is required")
    @DecimalMin(value = "0.0", message = "Booking amount cannot be negative")
    private BigDecimal bookingAmount;

    private String paymentMethod;
    private String notes;

    public BookingCreateRequest() {}

    public BookingCreateRequest(Long leadId, Long unitId, BigDecimal agreedPrice, BigDecimal bookingAmount, String paymentMethod, String notes) {
        this.leadId = leadId;
        this.unitId = unitId;
        this.agreedPrice = agreedPrice;
        this.bookingAmount = bookingAmount;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
    }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public Long getUnitId() { return unitId; }
    public void setUnitId(Long unitId) { this.unitId = unitId; }

    public BigDecimal getAgreedPrice() { return agreedPrice; }
    public void setAgreedPrice(BigDecimal agreedPrice) { this.agreedPrice = agreedPrice; }

    public BigDecimal getBookingAmount() { return bookingAmount; }
    public void setBookingAmount(BigDecimal bookingAmount) { this.bookingAmount = bookingAmount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
