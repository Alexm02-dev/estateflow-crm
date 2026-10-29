package com.estatecrm.repository;

import com.estatecrm.entity.Booking;
import com.estatecrm.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    Optional<Booking> findByBookingReference(String bookingReference);

    boolean existsByUnitIdAndStatus(Long unitId, BookingStatus status);

    boolean existsByLeadIdAndStatus(Long leadId, BookingStatus status);

    long countByStatus(BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookedBy.id = :userId AND b.status = :status")
    long countByBookedByIdAndStatus(@Param("userId") Long userId, @Param("status") BookingStatus status);

    @Query("SELECT COALESCE(SUM(b.agreedPrice), 0) FROM Booking b WHERE b.status = 'CONFIRMED'")
    BigDecimal calculateTotalConfirmedRevenue();

    @Query("SELECT COALESCE(SUM(b.agreedPrice), 0) FROM Booking b WHERE b.bookedBy.id = :userId AND b.status = 'CONFIRMED'")
    BigDecimal calculateUserConfirmedRevenue(@Param("userId") Long userId);

    @Query("SELECT FUNCTION('DATE_FORMAT', b.bookingDate, '%Y-%m') as month, COUNT(b) as count, SUM(b.agreedPrice) as revenue FROM Booking b WHERE b.status = 'CONFIRMED' GROUP BY FUNCTION('DATE_FORMAT', b.bookingDate, '%Y-%m') ORDER BY month ASC")
    List<Object[]> getMonthlyBookingStats();

    Page<Booking> findByBookedById(Long bookedById, Pageable pageable);
}
