package com.estatecrm;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.request.BookingCreateRequest;
import com.estatecrm.dto.response.BookingDto;
import com.estatecrm.entity.*;
import com.estatecrm.exception.ConflictException;
import com.estatecrm.repository.*;
import com.estatecrm.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class BookingConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PropertyUnitRepository unitRepository;

    @Autowired
    private BuildingRepository buildingRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private User agent;
    private PropertyUnit targetUnit;
    private Lead lead1;
    private Lead lead2;

    @BeforeEach
    public void setup() {
        bookingRepository.deleteAll();
        leadRepository.deleteAll();
        unitRepository.deleteAll();
        buildingRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        agent = new User("John Sales", "john.test@estatecrm.com", "pass", "+1 555-0199", Role.SALES_EMPLOYEE);
        agent = userRepository.save(agent);

        Project project = new Project();
        project.setCode("PRJ-TEST");
        project.setName("Test Project");
        project.setAddress("123 Test St");
        project.setCity("Austin");
        project = projectRepository.save(project);

        Building building = new Building();
        building.setProject(project);
        building.setName("Tower Alpha");
        building.setFloors(10);
        building = buildingRepository.save(building);

        targetUnit = new PropertyUnit();
        targetUnit.setBuilding(building);
        targetUnit.setUnitNumber("A-505");
        targetUnit.setFloor(5);
        targetUnit.setAreaSqft(BigDecimal.valueOf(1200));
        targetUnit.setPrice(BigDecimal.valueOf(500000));
        targetUnit.setStatus(UnitStatus.AVAILABLE);
        targetUnit = unitRepository.save(targetUnit);

        lead1 = new Lead();
        lead1.setLeadCode("LD-TEST-001");
        lead1.setFullName("Customer One");
        lead1.setPhone("+1 555-1111");
        lead1.setLeadSource(LeadSource.WEBSITE);
        lead1.setStage(LeadStage.NEGOTIATION);
        lead1.setAssignedTo(agent);
        lead1 = leadRepository.save(lead1);

        lead2 = new Lead();
        lead2.setLeadCode("LD-TEST-002");
        lead2.setFullName("Customer Two");
        lead2.setPhone("+1 555-2222");
        lead2.setLeadSource(LeadSource.REFERRAL);
        lead2.setStage(LeadStage.NEGOTIATION);
        lead2.setAssignedTo(agent);
        lead2 = leadRepository.save(lead2);
    }

    @Test
    @DisplayName("Critical Test: Concurrent simultaneous booking attempts on same unit must result in exactly 1 success and 1 ConflictException (HTTP 409)")
    public void testConcurrentBookingConflict() throws InterruptedException {
        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());

        UserPrincipal principal = UserPrincipal.create(agent);

        BookingCreateRequest req1 = new BookingCreateRequest(
                lead1.getId(), targetUnit.getId(), BigDecimal.valueOf(500000), BigDecimal.valueOf(50000), "WIRE", "Req 1"
        );
        BookingCreateRequest req2 = new BookingCreateRequest(
                lead2.getId(), targetUnit.getId(), BigDecimal.valueOf(500000), BigDecimal.valueOf(50000), "CHEQUE", "Req 2"
        );

        BookingCreateRequest[] requests = new BookingCreateRequest[]{req1, req2};

        for (int i = 0; i < numberOfThreads; i++) {
            final int index = i;
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Release all threads at the exact same millisecond
                    bookingService.createBooking(requests[index], principal);
                    successCount.incrementAndGet();
                } catch (ConflictException ex) {
                    conflictCount.incrementAndGet();
                } catch (Throwable t) {
                    errors.add(t);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Fire simultaneous requests
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Verification of concurrency invariants
        assertEquals(1, successCount.get(), "Exactly one concurrent booking request must succeed");
        assertEquals(1, conflictCount.get(), "The other concurrent request must be rejected with ConflictException");
        assertTrue(errors.isEmpty(), "No unexpected errors should occur: " + errors);

        // Verify database state: unit is BOOKED and exactly 1 booking record exists
        PropertyUnit updatedUnit = unitRepository.findById(targetUnit.getId()).orElseThrow();
        assertEquals(UnitStatus.BOOKED, updatedUnit.getStatus());
        assertEquals(1, bookingRepository.count());
    }

    @Test
    @DisplayName("Validation: Booking an already unavailable unit throws ConflictException immediately")
    public void testBookingUnavailableUnitFails() {
        targetUnit.setStatus(UnitStatus.BOOKED);
        unitRepository.save(targetUnit);

        UserPrincipal principal = UserPrincipal.create(agent);
        BookingCreateRequest req = new BookingCreateRequest(
                lead1.getId(), targetUnit.getId(), BigDecimal.valueOf(500000), BigDecimal.valueOf(50000), "WIRE", "Fail test"
        );

        assertThrows(ConflictException.class, () -> bookingService.createBooking(req, principal));
    }
}
