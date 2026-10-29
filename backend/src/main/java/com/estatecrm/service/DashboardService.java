package com.estatecrm.service;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.response.*;
import com.estatecrm.entity.*;
import com.estatecrm.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final LeadRepository leadRepository;
    private final BookingRepository bookingRepository;
    private final FollowUpRepository followUpRepository;
    private final PropertyUnitRepository unitRepository;
    private final UserRepository userRepository;

    public DashboardService(LeadRepository leadRepository,
                            BookingRepository bookingRepository,
                            FollowUpRepository followUpRepository,
                            PropertyUnitRepository unitRepository,
                            UserRepository userRepository) {
        this.leadRepository = leadRepository;
        this.bookingRepository = bookingRepository;
        this.followUpRepository = followUpRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary(UserPrincipal currentUser) {
        DashboardSummaryDto summary = new DashboardSummaryDto();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        LocalDateTime now = LocalDateTime.now();

        if (currentUser.getRole() == Role.ADMIN) {
            summary.setTotalLeads(leadRepository.count());
            summary.setNewLeads(leadRepository.countByStage(LeadStage.NEW));
            summary.setContactedLeads(leadRepository.countByStage(LeadStage.CONTACTED));
            summary.setSiteVisitsScheduled(leadRepository.countByStage(LeadStage.SITE_VISIT));
            summary.setNegotiationLeads(leadRepository.countByStage(LeadStage.NEGOTIATION));
            summary.setSuccessfulBookings(bookingRepository.countByStatus(BookingStatus.CONFIRMED));
            summary.setLostLeads(leadRepository.countByStage(LeadStage.LOST));

            summary.setFollowUpsDueToday(followUpRepository.countDueToday(startOfDay, endOfDay));
            summary.setOverdueFollowUps(followUpRepository.countOverdue(now));
            summary.setTotalAvailableUnits(unitRepository.countByStatus(UnitStatus.AVAILABLE));
            summary.setTotalBookingRevenue(bookingRepository.calculateTotalConfirmedRevenue());
        } else {
            Long userId = currentUser.getId();
            summary.setTotalLeads(leadRepository.countByAssignedToIdAndStage(userId, LeadStage.NEW) +
                    leadRepository.countByAssignedToIdAndStage(userId, LeadStage.CONTACTED) +
                    leadRepository.countByAssignedToIdAndStage(userId, LeadStage.SITE_VISIT) +
                    leadRepository.countByAssignedToIdAndStage(userId, LeadStage.INTERESTED) +
                    leadRepository.countByAssignedToIdAndStage(userId, LeadStage.NEGOTIATION) +
                    leadRepository.countByAssignedToIdAndStage(userId, LeadStage.BOOKED) +
                    leadRepository.countByAssignedToIdAndStage(userId, LeadStage.LOST));

            summary.setNewLeads(leadRepository.countByAssignedToIdAndStage(userId, LeadStage.NEW));
            summary.setContactedLeads(leadRepository.countByAssignedToIdAndStage(userId, LeadStage.CONTACTED));
            summary.setSiteVisitsScheduled(leadRepository.countByAssignedToIdAndStage(userId, LeadStage.SITE_VISIT));
            summary.setNegotiationLeads(leadRepository.countByAssignedToIdAndStage(userId, LeadStage.NEGOTIATION));
            summary.setSuccessfulBookings(bookingRepository.countByBookedByIdAndStatus(userId, BookingStatus.CONFIRMED));
            summary.setLostLeads(leadRepository.countByAssignedToIdAndStage(userId, LeadStage.LOST));

            summary.setFollowUpsDueToday(followUpRepository.countUserDueToday(userId, startOfDay, endOfDay));
            summary.setOverdueFollowUps(followUpRepository.countUserOverdue(userId, now));
            summary.setTotalAvailableUnits(unitRepository.countByStatus(UnitStatus.AVAILABLE));
            summary.setTotalBookingRevenue(bookingRepository.calculateUserConfirmedRevenue(userId));
        }

        return summary;
    }

    @Transactional(readOnly = true)
    public DashboardAnalyticsDto getAnalytics(UserPrincipal currentUser) {
        DashboardAnalyticsDto analytics = new DashboardAnalyticsDto();

        // 1. Leads by Stage
        Map<String, Long> stageMap = new LinkedHashMap<>();
        for (LeadStage stage : LeadStage.values()) {
            stageMap.put(stage.name(), 0L);
        }
        for (Object[] row : leadRepository.countLeadsByStage()) {
            LeadStage stage = (LeadStage) row[0];
            Long count = (Long) row[1];
            stageMap.put(stage.name(), count);
        }
        analytics.setLeadsByStage(stageMap);

        // 2. Leads by Source
        Map<String, Long> sourceMap = new LinkedHashMap<>();
        for (LeadSource source : LeadSource.values()) {
            sourceMap.put(source.name(), 0L);
        }
        for (Object[] row : leadRepository.countLeadsBySource()) {
            LeadSource source = (LeadSource) row[0];
            Long count = (Long) row[1];
            sourceMap.put(source.name(), count);
        }
        analytics.setLeadsBySource(sourceMap);

        // 3. Monthly Bookings & Revenue
        List<DashboardAnalyticsDto.MonthlyBookingItem> monthlyItems = new ArrayList<>();
        List<Object[]> monthlyRows = bookingRepository.getMonthlyBookingStats();
        for (Object[] row : monthlyRows) {
            String month = (String) row[0];
            long count = ((Number) row[1]).longValue();
            BigDecimal revenue = (BigDecimal) row[2];
            monthlyItems.add(new DashboardAnalyticsDto.MonthlyBookingItem(month, count, revenue));
        }
        analytics.setMonthlyBookings(monthlyItems);

        // 4. Recent Leads (top 5)
        analytics.setRecentLeads(
                leadRepository.findAll(PageRequest.of(0, 5, Sort.by("createdAt").descending()))
                        .getContent().stream()
                        .map(LeadDto::new)
                        .collect(Collectors.toList())
        );

        // 5. Upcoming Follow-ups (top 5 pending)
        analytics.setUpcomingFollowUps(
                followUpRepository.findAll(
                        (root, query, cb) -> cb.equal(root.get("status"), FollowUpStatus.PENDING),
                        PageRequest.of(0, 5, Sort.by("scheduledAt").ascending())
                ).getContent().stream()
                        .map(FollowUpDto::new)
                        .collect(Collectors.toList())
        );

        // 6. Recent Bookings (top 5)
        analytics.setRecentBookings(
                bookingRepository.findAll(PageRequest.of(0, 5, Sort.by("bookingDate").descending()))
                        .getContent().stream()
                        .map(BookingDto::new)
                        .collect(Collectors.toList())
        );

        // 7. Sales Employee Performance Breakdown
        List<User> employees = userRepository.findByRole(Role.SALES_EMPLOYEE);
        List<DashboardAnalyticsDto.EmployeePerformanceItem> perfList = new ArrayList<>();
        for (User emp : employees) {
            long assigned = leadRepository.countByAssignedToIdAndStage(emp.getId(), LeadStage.NEW) +
                    leadRepository.countByAssignedToIdAndStage(emp.getId(), LeadStage.CONTACTED) +
                    leadRepository.countByAssignedToIdAndStage(emp.getId(), LeadStage.SITE_VISIT) +
                    leadRepository.countByAssignedToIdAndStage(emp.getId(), LeadStage.INTERESTED) +
                    leadRepository.countByAssignedToIdAndStage(emp.getId(), LeadStage.NEGOTIATION) +
                    leadRepository.countByAssignedToIdAndStage(emp.getId(), LeadStage.BOOKED) +
                    leadRepository.countByAssignedToIdAndStage(emp.getId(), LeadStage.LOST);
            long bookedCount = bookingRepository.countByBookedByIdAndStatus(emp.getId(), BookingStatus.CONFIRMED);
            BigDecimal revenue = bookingRepository.calculateUserConfirmedRevenue(emp.getId());
            perfList.add(new DashboardAnalyticsDto.EmployeePerformanceItem(emp.getId(), emp.getName(), emp.getEmail(), assigned, bookedCount, revenue));
        }
        analytics.setEmployeePerformance(perfList);

        return analytics;
    }
}
