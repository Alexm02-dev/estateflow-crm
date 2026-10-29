package com.estatecrm.repository;

import com.estatecrm.entity.PropertyUnit;
import com.estatecrm.entity.UnitStatus;
import com.estatecrm.entity.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyUnitRepository extends JpaRepository<PropertyUnit, Long>, JpaSpecificationExecutor<PropertyUnit> {

    List<PropertyUnit> findByBuildingId(Long buildingId);

    List<PropertyUnit> findByBuildingProjectId(Long projectId);

    long countByStatus(UnitStatus status);

    boolean existsByBuildingIdAndUnitNumberIgnoreCase(Long buildingId, String unitNumber);

    /**
     * Pessimistic Write Lock (SELECT ... FOR UPDATE)
     * Crucial concurrency safeguard ensuring atomic booking operations and preventing race conditions
     * between simultaneous booking requests for the same unit.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM PropertyUnit u WHERE u.id = :id")
    Optional<PropertyUnit> findWithPessimisticLockById(@Param("id") Long id);
}
