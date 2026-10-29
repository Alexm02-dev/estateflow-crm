package com.estatecrm.dto.response;

import com.estatecrm.entity.Booking;
import com.estatecrm.entity.BookingStatus;
import com.estatecrm.entity.UnitType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BookingDto {
    private Long id;
    private String bookingReference;
    private Long leadId;
    private String leadCode;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private Long unitId;
    private String unitNumber;
    private UnitType unitType;
    private Long buildingId;
    private String buildingName;
    private Long projectId;
    private String projectName;
    private Long bookedById;
    private String bookedByName;
    private LocalDateTime bookingDate;
    private BigDecimal agreedPrice;
    private BigDecimal bookingAmount;
    private String paymentMethod;
    private BookingStatus status;
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private String cancelledByName;
    private String notes;
    private LocalDateTime createdAt;

    public BookingDto() {}

    public BookingDto(Booking booking) {
        if (booking != null) {
            this.id = booking.getId();
            this.bookingReference = booking.getBookingReference();
            if (booking.getLead() != null) {
                this.leadId = booking.getLead().getId();
                this.leadCode = booking.getLead().getLeadCode();
                this.customerName = booking.getLead().getFullName();
                this.customerPhone = booking.getLead().getPhone();
                this.customerEmail = booking.getLead().getEmail();
            }
            if (booking.getUnit() != null) {
                this.unitId = booking.getUnit().getId();
                this.unitNumber = booking.getUnit().getUnitNumber();
                this.unitType = booking.getUnit().getUnitType();
                if (booking.getUnit().getBuilding() != null) {
                    this.buildingId = booking.getUnit().getBuilding().getId();
                    this.buildingName = booking.getUnit().getBuilding().getName();
                    if (booking.getUnit().getBuilding().getProject() != null) {
                        this.projectId = booking.getUnit().getBuilding().getProject().getId();
                        this.projectName = booking.getUnit().getBuilding().getProject().getName();
                    }
                }
            }
            if (booking.getBookedBy() != null) {
                this.bookedById = booking.getBookedBy().getId();
                this.bookedByName = booking.getBookedBy().getName();
            }
            this.bookingDate = booking.getBookingDate();
            this.agreedPrice = booking.getAgreedPrice();
            this.bookingAmount = booking.getBookingAmount();
            this.paymentMethod = booking.getPaymentMethod();
            this.status = booking.getStatus();
            this.cancellationReason = booking.getCancellationReason();
            this.cancelledAt = booking.getCancelledAt();
            if (booking.getCancelledBy() != null) {
                this.cancelledByName = booking.getCancelledBy().getName();
            }
            this.notes = booking.getNotes();
            this.createdAt = booking.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getLeadCode() { return leadCode; }
    public void setLeadCode(String leadCode) { this.leadCode = leadCode; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public Long getUnitId() { return unitId; }
    public void setUnitId(Long unitId) { this.unitId = unitId; }

    public String getUnitNumber() { return unitNumber; }
    public void setUnitNumber(String unitNumber) { this.unitNumber = unitNumber; }

    public UnitType getUnitType() { return unitType; }
    public void setUnitType(UnitType unitType) { this.unitType = unitType; }

    public Long getBuildingId() { return buildingId; }
    public void setBuildingId(Long buildingId) { this.buildingId = buildingId; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public Long getBookedById() { return bookedById; }
    public void setBookedById(Long bookedById) { this.bookedById = bookedById; }

    public String getBookedByName() { return bookedByName; }
    public void setBookedByName(String bookedByName) { this.bookedByName = bookedByName; }

    public LocalDateTime getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDateTime bookingDate) { this.bookingDate = bookingDate; }

    public BigDecimal getAgreedPrice() { return agreedPrice; }
    public void setAgreedPrice(BigDecimal agreedPrice) { this.agreedPrice = agreedPrice; }

    public BigDecimal getBookingAmount() { return bookingAmount; }
    public void setBookingAmount(BigDecimal bookingAmount) { this.bookingAmount = bookingAmount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancelledByName() { return cancelledByName; }
    public void setCancelledByName(String cancelledByName) { this.cancelledByName = cancelledByName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
