package com.estatecrm.dto.response;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DashboardAnalyticsDto {
    private Map<String, Long> leadsByStage;
    private Map<String, Long> leadsBySource;
    private List<MonthlyBookingItem> monthlyBookings = new ArrayList<>();
    private List<LeadDto> recentLeads = new ArrayList<>();
    private List<FollowUpDto> upcomingFollowUps = new ArrayList<>();
    private List<BookingDto> recentBookings = new ArrayList<>();
    private List<EmployeePerformanceItem> employeePerformance = new ArrayList<>();

    public static class MonthlyBookingItem {
        private String month;
        private long count;
        private BigDecimal revenue;

        public MonthlyBookingItem() {}
        public MonthlyBookingItem(String month, long count, BigDecimal revenue) {
            this.month = month;
            this.count = count;
            this.revenue = revenue;
        }
        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
        public BigDecimal getRevenue() { return revenue; }
        public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
    }

    public static class EmployeePerformanceItem {
        private Long employeeId;
        private String name;
        private String email;
        private long assignedLeads;
        private long bookedCount;
        private BigDecimal totalRevenue;

        public EmployeePerformanceItem() {}
        public EmployeePerformanceItem(Long employeeId, String name, String email, long assignedLeads, long bookedCount, BigDecimal totalRevenue) {
            this.employeeId = employeeId;
            this.name = name;
            this.email = email;
            this.assignedLeads = assignedLeads;
            this.bookedCount = bookedCount;
            this.totalRevenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        }
        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public long getAssignedLeads() { return assignedLeads; }
        public void setAssignedLeads(long assignedLeads) { this.assignedLeads = assignedLeads; }
        public long getBookedCount() { return bookedCount; }
        public void setBookedCount(long bookedCount) { this.bookedCount = bookedCount; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
    }

    public DashboardAnalyticsDto() {}

    public Map<String, Long> getLeadsByStage() { return leadsByStage; }
    public void setLeadsByStage(Map<String, Long> leadsByStage) { this.leadsByStage = leadsByStage; }

    public Map<String, Long> getLeadsBySource() { return leadsBySource; }
    public void setLeadsBySource(Map<String, Long> leadsBySource) { this.leadsBySource = leadsBySource; }

    public List<MonthlyBookingItem> getMonthlyBookings() { return monthlyBookings; }
    public void setMonthlyBookings(List<MonthlyBookingItem> monthlyBookings) { this.monthlyBookings = monthlyBookings; }

    public List<LeadDto> getRecentLeads() { return recentLeads; }
    public void setRecentLeads(List<LeadDto> recentLeads) { this.recentLeads = recentLeads; }

    public List<FollowUpDto> getUpcomingFollowUps() { return upcomingFollowUps; }
    public void setUpcomingFollowUps(List<FollowUpDto> upcomingFollowUps) { this.upcomingFollowUps = upcomingFollowUps; }

    public List<BookingDto> getRecentBookings() { return recentBookings; }
    public void setRecentBookings(List<BookingDto> recentBookings) { this.recentBookings = recentBookings; }

    public List<EmployeePerformanceItem> getEmployeePerformance() { return employeePerformance; }
    public void setEmployeePerformance(List<EmployeePerformanceItem> employeePerformance) { this.employeePerformance = employeePerformance; }
}
