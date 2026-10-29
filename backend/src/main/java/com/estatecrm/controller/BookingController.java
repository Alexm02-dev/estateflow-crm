package com.estatecrm.controller;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.request.BookingCancelRequest;
import com.estatecrm.dto.request.BookingCreateRequest;
import com.estatecrm.dto.response.ApiResponse;
import com.estatecrm.dto.response.BookingDto;
import com.estatecrm.dto.response.PagedResponse;
import com.estatecrm.entity.BookingStatus;
import com.estatecrm.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/v1/bookings")
@Tag(name = "Bookings", description = "Endpoints for concurrency-safe property unit booking and reservation management")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    @Operation(summary = "Get paginated bookings with role-based visibility")
    public ResponseEntity<ApiResponse<PagedResponse<BookingDto>>> getBookings(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PagedResponse<BookingDto> response = bookingService.getBookings(currentUser, status, projectId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get booking details by ID")
    public ResponseEntity<ApiResponse<BookingDto>> getBookingById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        BookingDto booking = bookingService.getBookingById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(booking));
    }

    @PostMapping
    @Operation(summary = "Execute concurrency-safe atomic unit booking")
    public ResponseEntity<ApiResponse<BookingDto>> createBooking(
            @Valid @RequestBody BookingCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        BookingDto created = bookingService.createBooking(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking completed successfully", created));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an existing booking and release unit back to inventory")
    public ResponseEntity<ApiResponse<BookingDto>> cancelBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingCancelRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        BookingDto cancelled = bookingService.cancelBooking(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled and unit inventory released", cancelled));
    }
}
