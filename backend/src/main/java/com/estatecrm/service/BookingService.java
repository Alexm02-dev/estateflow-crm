package com.estatecrm.service;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.request.BookingCancelRequest;
import com.estatecrm.dto.request.BookingCreateRequest;
import com.estatecrm.dto.response.BookingDto;
import com.estatecrm.dto.response.PagedResponse;
import com.estatecrm.entity.*;
import com.estatecrm.exception.BadRequestException;
import com.estatecrm.exception.ConflictException;
import com.estatecrm.exception.ForbiddenException;
import com.estatecrm.exception.ResourceNotFoundException;
import com.estatecrm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PropertyUnitRepository unitRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final LeadActivityRepository activityRepository;

    public BookingService(BookingRepository bookingRepository,
                          PropertyUnitRepository unitRepository,
                          LeadRepository leadRepository,
                          UserRepository userRepository,
                          LeadActivityRepository activityRepository) {
        this.bookingRepository = bookingRepository;
        this.unitRepository = unitRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.activityRepository = activityRepository;
    }

    /**
     * CONCURRENCY-SAFE ATOMIC BOOKING WORKFLOW
     *
     * 1. Uses Isolation.READ_COMMITTED inside a strict database transaction.
     * 2. Acquires a PESSIMISTIC_WRITE lock on the target PropertyUnit (SELECT ... FOR UPDATE).
     *    Any concurrent thread attempting to book the exact same unit will block until the lock releases.
     * 3. Validates that the unit is strictly in AVAILABLE status. If already RESERVED or BOOKED,
     *    immediately aborts with HTTP 409 Conflict.
     * 4. Validates lead eligibility (not already booked, valid price, valid amounts).
     * 5. Atomically creates Booking record, marks Unit as BOOKED, marks Lead as BOOKED,
     *    and records audit activity.
     * 6. If any step fails, entire transaction is automatically rolled back.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingDto createBooking(BookingCreateRequest request, UserPrincipal currentUser) {
        // 1. Acquire pessimistic write lock on the PropertyUnit
        PropertyUnit unit = unitRepository.findWithPessimisticLockById(request.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with ID: " + request.getUnitId()));

        // 2. Strict concurrency check: Is the unit available?
        if (unit.getStatus() != UnitStatus.AVAILABLE) {
            throw new ConflictException("Unit '" + unit.getUnitNumber() + "' is currently " +
                    unit.getStatus() + " and cannot be booked. Another user may have just completed a booking for this unit.");
        }

        // 3. Double-check no active confirmed booking exists for this unit in the bookings table
        if (bookingRepository.existsByUnitIdAndStatus(unit.getId(), BookingStatus.CONFIRMED)) {
            throw new ConflictException("An active confirmed booking already exists for unit '" + unit.getUnitNumber() + "'");
        }

        // 4. Fetch and validate lead eligibility
        Lead lead = leadRepository.findById(request.getLeadId())
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + request.getLeadId()));

        if (lead.getStage() == LeadStage.LOST) {
            throw new BadRequestException("Cannot create a booking for a lost lead. Please reactivate the lead first.");
        }

        if (bookingRepository.existsByLeadIdAndStatus(lead.getId(), BookingStatus.CONFIRMED)) {
            throw new ConflictException("Lead '" + lead.getFullName() + "' already has an active confirmed booking.");
        }

        // 5. Validate pricing integrity
        if (request.getAgreedPrice() == null || request.getAgreedPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Agreed price must be greater than zero.");
        }
        if (request.getBookingAmount() == null || request.getBookingAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Booking amount cannot be negative.");
        }
        if (request.getBookingAmount().compareTo(request.getAgreedPrice()) > 0) {
            throw new BadRequestException("Booking amount cannot exceed the total agreed price.");
        }

        // 6. Fetch booked-by user
        User bookedBy = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        // 7. Generate unique booking reference: BK-YEAR-XXXXXX
        String bookingRef = "BK-" + LocalDateTime.now().getYear() + "-" +
                UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        // 8. Create booking record
        Booking booking = new Booking();
        booking.setBookingReference(bookingRef);
        booking.setLead(lead);
        booking.setUnit(unit);
        booking.setBookedBy(bookedBy);
        booking.setBookingDate(LocalDateTime.now());
        booking.setAgreedPrice(request.getAgreedPrice());
        booking.setBookingAmount(request.getBookingAmount());
        booking.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "BANK_WIRE");
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setNotes(request.getNotes());

        Booking savedBooking = bookingRepository.save(booking);

        // 9. Update unit status to BOOKED
        unit.setStatus(UnitStatus.BOOKED);
        unitRepository.save(unit);

        // 10. Update lead stage to BOOKED
        lead.setStage(LeadStage.BOOKED);
        leadRepository.save(lead);

        // 11. Record immutable audit activity log
        LeadActivity activity = new LeadActivity(lead, bookedBy, ActivityType.BOOKING,
                "Unit " + unit.getUnitNumber() + " successfully booked. Reference: " + bookingRef +
                        ", Agreed Price: $" + request.getAgreedPrice() + ", Deposit: $" + request.getBookingAmount());
        activityRepository.save(activity);

        return new BookingDto(savedBooking);
    }

    @Transactional(readOnly = true)
    public PagedResponse<BookingDto> getBookings(UserPrincipal currentUser,
                                                 BookingStatus status,
                                                 Long projectId,
                                                 int page,
                                                 int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("bookingDate").descending());

        Specification<Booking> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (currentUser.getRole() == Role.SALES_EMPLOYEE) {
                predicates.add(cb.equal(root.get("bookedBy").get("id"), currentUser.getId()));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (projectId != null) {
                predicates.add(cb.equal(root.get("unit").get("building").get("project").get("id"), projectId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Booking> bookingPage = bookingRepository.findAll(spec, pageable);
        List<BookingDto> dtoList = bookingPage.getContent().stream()
                .map(BookingDto::new)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                dtoList,
                bookingPage.getNumber(),
                bookingPage.getSize(),
                bookingPage.getTotalElements(),
                bookingPage.getTotalPages(),
                bookingPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public BookingDto getBookingById(Long id, UserPrincipal currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        if (currentUser.getRole() == Role.SALES_EMPLOYEE && !booking.getBookedBy().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You do not have permission to view this booking");
        }

        return new BookingDto(booking);
    }

    /**
     * Concurrency-Safe Cancellation Workflow
     * Cancels booking, releases the unit back to AVAILABLE, and returns lead stage to NEGOTIATION.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingDto cancelBooking(Long id, BookingCancelRequest request, UserPrincipal currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        if (currentUser.getRole() != Role.ADMIN && !booking.getBookedBy().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only administrators or the booking agent may cancel this booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled.");
        }

        User canceller = userRepository.findById(currentUser.getId()).orElse(null);

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(request.getReason().trim());
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancelledBy(canceller);

        // Lock unit and release back to AVAILABLE
        PropertyUnit unit = unitRepository.findWithPessimisticLockById(booking.getUnit().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found"));
        unit.setStatus(UnitStatus.AVAILABLE);
        unitRepository.save(unit);

        // Reset lead stage back to NEGOTIATION
        Lead lead = booking.getLead();
        lead.setStage(LeadStage.NEGOTIATION);
        leadRepository.save(lead);

        Booking saved = bookingRepository.save(booking);

        // Audit log
        activityRepository.save(new LeadActivity(lead, canceller, ActivityType.STATUS_CHANGE,
                "Booking " + booking.getBookingReference() + " was cancelled. Reason: " + request.getReason().trim() + ". Unit " + unit.getUnitNumber() + " returned to inventory."));

        return new BookingDto(saved);
    }
}
