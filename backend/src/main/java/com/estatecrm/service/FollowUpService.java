package com.estatecrm.service;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.request.FollowUpCompleteRequest;
import com.estatecrm.dto.request.FollowUpCreateRequest;
import com.estatecrm.dto.response.FollowUpDto;
import com.estatecrm.dto.response.PagedResponse;
import com.estatecrm.entity.*;
import com.estatecrm.exception.BadRequestException;
import com.estatecrm.exception.ForbiddenException;
import com.estatecrm.exception.ResourceNotFoundException;
import com.estatecrm.repository.FollowUpRepository;
import com.estatecrm.repository.LeadActivityRepository;
import com.estatecrm.repository.LeadRepository;
import com.estatecrm.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final LeadActivityRepository activityRepository;

    public FollowUpService(FollowUpRepository followUpRepository,
                           LeadRepository leadRepository,
                           UserRepository userRepository,
                           LeadActivityRepository activityRepository) {
        this.followUpRepository = followUpRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.activityRepository = activityRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<FollowUpDto> getFollowUps(UserPrincipal currentUser,
                                                   FollowUpStatus status,
                                                   Long assignedToId,
                                                   Boolean overdueOnly,
                                                   int page,
                                                   int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("scheduledAt").ascending());

        Specification<FollowUp> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (currentUser.getRole() == Role.SALES_EMPLOYEE) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), currentUser.getId()));
            } else if (assignedToId != null) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), assignedToId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (Boolean.TRUE.equals(overdueOnly)) {
                predicates.add(cb.equal(root.get("status"), FollowUpStatus.PENDING));
                predicates.add(cb.lessThan(root.get("scheduledAt"), LocalDateTime.now()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<FollowUp> followUpPage = followUpRepository.findAll(spec, pageable);
        List<FollowUpDto> dtoList = followUpPage.getContent().stream()
                .map(FollowUpDto::new)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                dtoList,
                followUpPage.getNumber(),
                followUpPage.getSize(),
                followUpPage.getTotalElements(),
                followUpPage.getTotalPages(),
                followUpPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public List<FollowUpDto> getFollowUpsForLead(Long leadId, UserPrincipal currentUser) {
        return followUpRepository.findByLeadIdOrderByScheduledAtDesc(leadId).stream()
                .map(FollowUpDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public FollowUpDto createFollowUp(FollowUpCreateRequest request, UserPrincipal currentUser) {
        Lead lead = leadRepository.findById(request.getLeadId())
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + request.getLeadId()));

        User assignedTo;
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
        } else if (lead.getAssignedTo() != null) {
            assignedTo = lead.getAssignedTo();
        } else {
            assignedTo = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        FollowUp followUp = new FollowUp();
        followUp.setLead(lead);
        followUp.setAssignedTo(assignedTo);
        followUp.setScheduledAt(request.getScheduledAt());
        followUp.setStatus(FollowUpStatus.PENDING);
        followUp.setNotes(request.getNotes());

        FollowUp saved = followUpRepository.save(followUp);

        // Update lead's next follow-up date
        lead.setNextFollowUpDate(request.getScheduledAt());
        leadRepository.save(lead);

        // Log activity
        User actingUser = userRepository.findById(currentUser.getId()).orElse(null);
        activityRepository.save(new LeadActivity(lead, actingUser, ActivityType.NOTE,
                "Follow-up scheduled for " + request.getScheduledAt().toString().replace("T", " ") + ": " + (request.getNotes() != null ? request.getNotes() : "")));

        return new FollowUpDto(saved);
    }

    @Transactional
    public FollowUpDto completeFollowUp(Long id, FollowUpCompleteRequest request, UserPrincipal currentUser) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found with ID: " + id));

        verifyFollowUpAccess(followUp, currentUser);

        if (followUp.getStatus() != FollowUpStatus.PENDING) {
            throw new BadRequestException("Follow-up is already " + followUp.getStatus());
        }

        followUp.setStatus(FollowUpStatus.COMPLETED);
        followUp.setCompletionNotes(request.getCompletionNotes());
        followUp.setCompletedAt(LocalDateTime.now());

        FollowUp saved = followUpRepository.save(followUp);

        // Log completion in lead activities
        User actingUser = userRepository.findById(currentUser.getId()).orElse(null);
        activityRepository.save(new LeadActivity(followUp.getLead(), actingUser, ActivityType.NOTE,
                "Follow-up completed: " + request.getCompletionNotes()));

        return new FollowUpDto(saved);
    }

    private void verifyFollowUpAccess(FollowUp followUp, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        if (!followUp.getAssignedTo().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You are not authorized to manage this follow-up");
        }
    }
}
