package com.estatecrm.service;

import com.estatecrm.dto.request.BulkUnitStatusRequest;
import com.estatecrm.dto.request.UnitCreateRequest;
import com.estatecrm.dto.response.PropertyUnitDto;
import com.estatecrm.entity.Building;
import com.estatecrm.entity.PropertyUnit;
import com.estatecrm.entity.UnitStatus;
import com.estatecrm.entity.UnitType;
import com.estatecrm.exception.BadRequestException;
import com.estatecrm.exception.ConflictException;
import com.estatecrm.exception.ResourceNotFoundException;
import com.estatecrm.repository.BookingRepository;
import com.estatecrm.repository.BuildingRepository;
import com.estatecrm.repository.PropertyUnitRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PropertyUnitService {

    private final PropertyUnitRepository unitRepository;
    private final BuildingRepository buildingRepository;
    private final BookingRepository bookingRepository;

    public PropertyUnitService(PropertyUnitRepository unitRepository,
                               BuildingRepository buildingRepository,
                               BookingRepository bookingRepository) {
        this.unitRepository = unitRepository;
        this.buildingRepository = buildingRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<PropertyUnitDto> searchUnits(Long projectId, Long buildingId, UnitType unitType, UnitStatus status, BigDecimal minPrice, BigDecimal maxPrice) {
        Specification<PropertyUnit> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (buildingId != null) {
                predicates.add(cb.equal(root.get("building").get("id"), buildingId));
            } else if (projectId != null) {
                predicates.add(cb.equal(root.get("building").get("project").get("id"), projectId));
            }

            if (unitType != null) {
                predicates.add(cb.equal(root.get("unitType"), unitType));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return unitRepository.findAll(spec).stream()
                .map(PropertyUnitDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PropertyUnitDto getUnitById(Long id) {
        PropertyUnit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found with ID: " + id));
        return new PropertyUnitDto(unit);
    }

    @Transactional
    public PropertyUnitDto createUnit(UnitCreateRequest request) {
        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with ID: " + request.getBuildingId()));

        if (unitRepository.existsByBuildingIdAndUnitNumberIgnoreCase(request.getBuildingId(), request.getUnitNumber().trim())) {
            throw new ConflictException("Unit '" + request.getUnitNumber() + "' already exists in building '" + building.getName() + "'");
        }

        PropertyUnit unit = new PropertyUnit();
        unit.setBuilding(building);
        unit.setUnitNumber(request.getUnitNumber().trim().toUpperCase());
        unit.setUnitType(request.getUnitType());
        unit.setFloor(request.getFloor());
        unit.setAreaSqft(request.getAreaSqft());
        unit.setPrice(request.getPrice());
        unit.setStatus(request.getStatus() != null ? request.getStatus() : UnitStatus.AVAILABLE);

        PropertyUnit saved = unitRepository.save(unit);
        return new PropertyUnitDto(saved);
    }

    @Transactional
    public PropertyUnitDto updateUnit(Long id, UnitCreateRequest request) {
        PropertyUnit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found with ID: " + id));

        unit.setUnitType(request.getUnitType());
        unit.setFloor(request.getFloor());
        unit.setAreaSqft(request.getAreaSqft());
        unit.setPrice(request.getPrice());
        if (request.getStatus() != null) {
            unit.setStatus(request.getStatus());
        }

        PropertyUnit saved = unitRepository.save(unit);
        return new PropertyUnitDto(saved);
    }

    @Transactional
    public int bulkUpdateStatus(BulkUnitStatusRequest request) {
        List<PropertyUnit> units = unitRepository.findAllById(request.getUnitIds());
        int updatedCount = 0;
        for (PropertyUnit unit : units) {
            if (unit.getStatus() == UnitStatus.BOOKED && request.getStatus() != UnitStatus.BOOKED) {
                continue;
            }
            unit.setStatus(request.getStatus());
            updatedCount++;
        }
        unitRepository.saveAll(units);
        return updatedCount;
    }

    @Transactional
    public void deleteUnit(Long id) {
        PropertyUnit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found with ID: " + id));

        if (bookingRepository.existsByUnitIdAndStatus(id, com.estatecrm.entity.BookingStatus.CONFIRMED)) {
            throw new ConflictException("Cannot delete unit that is associated with an active booking.");
        }

        unitRepository.delete(unit);
    }
}
