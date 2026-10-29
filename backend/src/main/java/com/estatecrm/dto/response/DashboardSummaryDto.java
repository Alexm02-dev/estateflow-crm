package com.estatecrm.dto.response;

import java.math.BigDecimal;

public class DashboardSummaryDto {
    private long totalLeads;
    private long newLeads;
    private long contactedLeads;
    private long siteVisitsScheduled;
    private long negotiationLeads;
    private long successfulBookings;
    private long lostLeads;
    private long followUpsDueToday;
    private long overdueFollowUps;
    private long totalAvailableUnits;
    private BigDecimal totalBookingRevenue;

    public DashboardSummaryDto() {
        this.totalBookingRevenue = BigDecimal.ZERO;
    }

    public long getTotalLeads() { return totalLeads; }
    public void setTotalLeads(long totalLeads) { this.totalLeads = totalLeads; }

    public long getNewLeads() { return newLeads; }
    public void setNewLeads(long newLeads) { this.newLeads = newLeads; }

    public long getContactedLeads() { return contactedLeads; }
    public void setContactedLeads(long contactedLeads) { this.contactedLeads = contactedLeads; }

    public long getSiteVisitsScheduled() { return siteVisitsScheduled; }
    public void setSiteVisitsScheduled(long siteVisitsScheduled) { this.siteVisitsScheduled = siteVisitsScheduled; }

    public long getNegotiationLeads() { return negotiationLeads; }
    public void setNegotiationLeads(long negotiationLeads) { this.negotiationLeads = negotiationLeads; }

    public long getSuccessfulBookings() { return successfulBookings; }
    public void setSuccessfulBookings(long successfulBookings) { this.successfulBookings = successfulBookings; }

    public long getLostLeads() { return lostLeads; }
    public void setLostLeads(long lostLeads) { this.lostLeads = lostLeads; }

    public long getFollowUpsDueToday() { return followUpsDueToday; }
    public void setFollowUpsDueToday(long followUpsDueToday) { this.followUpsDueToday = followUpsDueToday; }

    public long getOverdueFollowUps() { return overdueFollowUps; }
    public void setOverdueFollowUps(long overdueFollowUps) { this.overdueFollowUps = overdueFollowUps; }

    public long getTotalAvailableUnits() { return totalAvailableUnits; }
    public void setTotalAvailableUnits(long totalAvailableUnits) { this.totalAvailableUnits = totalAvailableUnits; }

    public BigDecimal getTotalBookingRevenue() { return totalBookingRevenue; }
    public void setTotalBookingRevenue(BigDecimal totalBookingRevenue) { this.totalBookingRevenue = totalBookingRevenue; }
}
