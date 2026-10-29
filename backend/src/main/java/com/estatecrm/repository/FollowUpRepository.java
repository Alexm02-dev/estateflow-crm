package com.estatecrm.repository;

import com.estatecrm.entity.FollowUp;
import com.estatecrm.entity.FollowUpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long>, JpaSpecificationExecutor<FollowUp> {

    List<FollowUp> findByLeadIdOrderByScheduledAtDesc(Long leadId);

    long countByStatus(FollowUpStatus status);

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE f.status = 'PENDING' AND f.scheduledAt BETWEEN :startOfDay AND :endOfDay")
    long countDueToday(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE f.status = 'PENDING' AND f.scheduledAt < :now")
    long countOverdue(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE f.assignedTo.id = :userId AND f.status = 'PENDING' AND f.scheduledAt BETWEEN :startOfDay AND :endOfDay")
    long countUserDueToday(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE f.assignedTo.id = :userId AND f.status = 'PENDING' AND f.scheduledAt < :now")
    long countUserOverdue(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    Page<FollowUp> findByAssignedToId(Long assignedToId, Pageable pageable);
}
