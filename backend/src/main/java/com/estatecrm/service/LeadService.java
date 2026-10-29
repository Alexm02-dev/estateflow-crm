package com.estatecrm.service;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.request.BulkAssignRequest;
import com.estatecrm.dto.request.BulkIdsRequest;
import com.estatecrm.dto.request.BulkStageRequest;
import com.estatecrm.dto.request.LeadActivityRequest;
import com.estatecrm.dto.request.LeadCreateRequest;
import com.estatecrm.dto.request.LeadUpdateRequest;
import com.estatecrm.dto.response.LeadActivityDto;
import com.estatecrm.dto.response.LeadDto;
import com.estatecrm.dto.response.PagedResponse;
import com.estatecrm.entity.*;
import com.estatecrm.exception.BadRequestException;
import com.estatecrm.exception.ForbiddenException;
import com.estatecrm.exception.ResourceNotFoundException;
import com.estatecrm.repository.LeadActivityRepository;
import com.estatecrm.repository.LeadRepository;
import com.estatecrm.repository.ProjectRepository;
import com.estatecrm.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadActivityRepository activityRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public LeadService(LeadRepository leadRepository,
                       LeadActivityRepository activityRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository) {
        this.leadRepository = leadRepository;
        this.activityRepository = activityRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<LeadDto> getLeads(UserPrincipal currentUser,
                                           String search,
                                           LeadStage stage,
                                           LeadSource source,
                                           Long assignedToId,
                                           Long projectId,
                                           int page,
                                           int size,
                                           String sortBy,
                                           String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Lead> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Role-based visibility: Sales employees can only view leads assigned to them or created by them
            if (currentUser.getRole() == Role.SALES_EMPLOYEE) {
                Predicate assigned = cb.equal(root.get("assignedTo").get("id"), currentUser.getId());
                Predicate created = cb.equal(root.get("createdBy").get("id"), currentUser.getId());
                predicates.add(cb.or(assigned, created));
            } else if (assignedToId != null) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), assignedToId));
            }

            if (StringUtils.hasText(search)) {
                String likePattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("fullName")), likePattern);
                Predicate phoneMatch = cb.like(root.get("phone"), likePattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), likePattern);
                Predicate codeMatch = cb.like(cb.lower(root.get("leadCode")), likePattern);
                predicates.add(cb.or(nameMatch, phoneMatch, emailMatch, codeMatch));
            }

            if (stage != null) {
                predicates.add(cb.equal(root.get("stage"), stage));
            }

            if (source != null) {
                predicates.add(cb.equal(root.get("leadSource"), source));
            }

            if (projectId != null) {
                predicates.add(cb.equal(root.get("interestedProject").get("id"), projectId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Lead> leadPage = leadRepository.findAll(spec, pageable);
        List<LeadDto> dtoList = leadPage.getContent().stream()
                .map(LeadDto::new)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                dtoList,
                leadPage.getNumber(),
                leadPage.getSize(),
                leadPage.getTotalElements(),
                leadPage.getTotalPages(),
                leadPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public LeadDto getLeadById(Long id, UserPrincipal currentUser) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        verifyLeadAccess(lead, currentUser);
        return new LeadDto(lead);
    }

    @Transactional
    public LeadDto createLead(LeadCreateRequest request, UserPrincipal currentUser) {
        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        Lead lead = new Lead();
        // Generate unique readable lead code: LD-YEAR-XXXXX
        lead.setLeadCode("LD-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase());
        lead.setFullName(request.getFullName().trim());
        lead.setPhone(request.getPhone().trim());
        lead.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
        lead.setLeadSource(request.getLeadSource());
        lead.setBudget(request.getBudget());
        lead.setStage(request.getStage() != null ? request.getStage() : LeadStage.NEW);
        lead.setNextFollowUpDate(request.getNextFollowUpDate());
        lead.setNotes(request.getNotes());
        lead.setCreatedBy(creator);

        if (request.getInterestedProjectId() != null) {
            Project project = projectRepository.findById(request.getInterestedProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.getInterestedProjectId()));
            lead.setInterestedProject(project);
        }

        if (request.getAssignedToId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with ID: " + request.getAssignedToId()));
            lead.setAssignedTo(assignedUser);
        } else if (currentUser.getRole() == Role.SALES_EMPLOYEE) {
            // Default assign to creating sales employee
            lead.setAssignedTo(creator);
        }

        Lead saved = leadRepository.save(lead);

        // Record creation activity
        LeadActivity activity = new LeadActivity(saved, creator, ActivityType.NOTE,
                "Lead created via " + saved.getLeadSource() + " by " + creator.getName());
        activityRepository.save(activity);

        return new LeadDto(saved);
    }

    @Transactional
    public LeadDto updateLead(Long id, LeadUpdateRequest request, UserPrincipal currentUser) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        verifyLeadAccess(lead, currentUser);

        User actingUser = userRepository.findById(currentUser.getId()).orElse(null);

        // Check if stage changed
        LeadStage oldStage = lead.getStage();
        if (oldStage != request.getStage()) {
            if (request.getStage() == LeadStage.BOOKED && lead.getStage() != LeadStage.BOOKED) {
                // Rule: Lead stage can only become BOOKED through the authoritative booking flow
                throw new BadRequestException("Lead stage cannot be changed to BOOKED manually. Please use the booking workflow.");
            }
            lead.setStage(request.getStage());
            activityRepository.save(new LeadActivity(lead, actingUser, ActivityType.STATUS_CHANGE,
                    "Lead stage changed from " + oldStage + " to " + request.getStage()));
        }

        // Check if assignment changed
        if (request.getAssignedToId() != null) {
            if (currentUser.getRole() != Role.ADMIN && (lead.getAssignedTo() == null || !lead.getAssignedTo().getId().equals(request.getAssignedToId()))) {
                throw new ForbiddenException("Only administrators can reassign leads to other employees");
            }
            if (lead.getAssignedTo() == null || !lead.getAssignedTo().getId().equals(request.getAssignedToId())) {
                User newAssignee = userRepository.findById(request.getAssignedToId())
                        .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
                lead.setAssignedTo(newAssignee);
                activityRepository.save(new LeadActivity(lead, actingUser, ActivityType.ASSIGNMENT,
                        "Lead assigned to " + newAssignee.getName()));
            }
        }

        lead.setFullName(request.getFullName().trim());
        lead.setPhone(request.getPhone().trim());
        lead.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
        lead.setLeadSource(request.getLeadSource());
        lead.setBudget(request.getBudget());
        lead.setNextFollowUpDate(request.getNextFollowUpDate());
        lead.setNotes(request.getNotes());

        if (request.getInterestedProjectId() != null) {
            Project project = projectRepository.findById(request.getInterestedProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
            lead.setInterestedProject(project);
        } else {
            lead.setInterestedProject(null);
        }

        Lead saved = leadRepository.save(lead);
        return new LeadDto(saved);
    }

    @Transactional
    public void deleteLead(Long id, UserPrincipal currentUser) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only administrators are permitted to delete leads");
        }

        if (lead.getStage() == LeadStage.BOOKED) {
            throw new BadRequestException("Cannot delete a lead that has an active booking. Please cancel or archive instead.");
        }

        leadRepository.delete(lead);
    }

    @Transactional(readOnly = true)
    public List<LeadActivityDto> getLeadActivities(Long leadId, UserPrincipal currentUser) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + leadId));
        verifyLeadAccess(lead, currentUser);

        return activityRepository.findByLeadIdOrderByCreatedAtDesc(leadId).stream()
                .map(LeadActivityDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeadActivityDto addActivity(Long leadId, LeadActivityRequest request, UserPrincipal currentUser) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + leadId));
        verifyLeadAccess(lead, currentUser);

        User user = userRepository.findById(currentUser.getId()).orElse(null);

        LeadActivity activity = new LeadActivity(lead, user, request.getType(), request.getDescription().trim());
        LeadActivity saved = activityRepository.save(activity);

        return new LeadActivityDto(saved);
    }

    @Transactional
    public int bulkAssignLeads(BulkAssignRequest request, UserPrincipal currentUser) {
        User newAssignee = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
        User actingUser = userRepository.findById(currentUser.getId()).orElse(null);

        List<Lead> leads = leadRepository.findAllById(request.getLeadIds());
        int updatedCount = 0;
        for (Lead lead : leads) {
            verifyLeadAccess(lead, currentUser);
            lead.setAssignedTo(newAssignee);
            activityRepository.save(new LeadActivity(lead, actingUser, ActivityType.ASSIGNMENT,
                    "Bulk assigned to " + newAssignee.getName()));
            updatedCount++;
        }
        leadRepository.saveAll(leads);
        return updatedCount;
    }

    @Transactional
    public int bulkUpdateStage(BulkStageRequest request, UserPrincipal currentUser) {
        User actingUser = userRepository.findById(currentUser.getId()).orElse(null);
        List<Lead> leads = leadRepository.findAllById(request.getLeadIds());
        int updatedCount = 0;
        for (Lead lead : leads) {
            verifyLeadAccess(lead, currentUser);
            LeadStage oldStage = lead.getStage();
            if (oldStage != request.getStage()) {
                lead.setStage(request.getStage());
                activityRepository.save(new LeadActivity(lead, actingUser, ActivityType.STATUS_CHANGE,
                        "Bulk stage changed from " + oldStage.name() + " to " + request.getStage().name()));
                updatedCount++;
            }
        }
        leadRepository.saveAll(leads);
        return updatedCount;
    }

    @Transactional
    public int bulkDeleteLeads(BulkIdsRequest request, UserPrincipal currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only administrators are permitted to delete leads");
        }
        List<Lead> leads = leadRepository.findAllById(request.getIds());
        int deletedCount = 0;
        for (Lead lead : leads) {
            if (lead.getStage() == LeadStage.BOOKED) {
                continue; // Preserve leads with active bookings
            }
            leadRepository.delete(lead);
            deletedCount++;
        }
        return deletedCount;
    }

    private void verifyLeadAccess(Lead lead, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        boolean isAssigned = lead.getAssignedTo() != null && lead.getAssignedTo().getId().equals(currentUser.getId());
        boolean isCreator = lead.getCreatedBy() != null && lead.getCreatedBy().getId().equals(currentUser.getId());
        if (!isAssigned && !isCreator) {
            throw new ForbiddenException("You do not have permission to view or modify this lead");
        }
    }
}
