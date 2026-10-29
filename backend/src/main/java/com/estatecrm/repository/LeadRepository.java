package com.estatecrm.repository;

import com.estatecrm.entity.Lead;
import com.estatecrm.entity.LeadStage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long>, JpaSpecificationExecutor<Lead> {

    Optional<Lead> findByLeadCode(String leadCode);

    long countByStage(LeadStage stage);

    @Query("SELECT COUNT(l) FROM Lead l WHERE l.assignedTo.id = :userId AND l.stage = :stage")
    long countByAssignedToIdAndStage(@Param("userId") Long userId, @Param("stage") LeadStage stage);

    @Query("SELECT l.stage, COUNT(l) FROM Lead l GROUP BY l.stage")
    List<Object[]> countLeadsByStage();

    @Query("SELECT l.leadSource, COUNT(l) FROM Lead l GROUP BY l.leadSource")
    List<Object[]> countLeadsBySource();

    Page<Lead> findByAssignedToId(Long assignedToId, Pageable pageable);
}
