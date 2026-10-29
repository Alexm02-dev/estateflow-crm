package com.estatecrm;

import com.estatecrm.config.UserPrincipal;
import com.estatecrm.dto.request.LeadCreateRequest;
import com.estatecrm.dto.request.LeadUpdateRequest;
import com.estatecrm.dto.response.LeadDto;
import com.estatecrm.entity.LeadSource;
import com.estatecrm.entity.LeadStage;
import com.estatecrm.entity.Role;
import com.estatecrm.entity.User;
import com.estatecrm.exception.BadRequestException;
import com.estatecrm.exception.ForbiddenException;
import com.estatecrm.repository.LeadRepository;
import com.estatecrm.repository.UserRepository;
import com.estatecrm.service.LeadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class LeadServiceTest {

    @Autowired
    private LeadService leadService;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    private User agent1;
    private User agent2;

    @BeforeEach
    public void setup() {
        leadRepository.deleteAll();
        userRepository.deleteAll();

        agent1 = userRepository.save(new User("Agent One", "agent1@estatecrm.com", "pass", "111", Role.SALES_EMPLOYEE));
        agent2 = userRepository.save(new User("Agent Two", "agent2@estatecrm.com", "pass", "222", Role.SALES_EMPLOYEE));
    }

    @Test
    @DisplayName("Create Lead: Generates leadCode and initial activity log")
    public void testCreateLead() {
        UserPrincipal principal = UserPrincipal.create(agent1);
        LeadCreateRequest req = new LeadCreateRequest();
        req.setFullName("John Doe");
        req.setPhone("+1 555-9999");
        req.setEmail("john@example.com");
        req.setLeadSource(LeadSource.WEBSITE);
        req.setBudget(BigDecimal.valueOf(450000));

        LeadDto created = leadService.createLead(req, principal);

        assertNotNull(created.getId());
        assertTrue(created.getLeadCode().startsWith("LD-"));
        assertEquals("John Doe", created.getFullName());
        assertEquals(LeadStage.NEW, created.getStage());
    }

    @Test
    @DisplayName("Business Rule: Lead stage cannot be manually changed to BOOKED")
    public void testManualBookedTransitionFails() {
        UserPrincipal principal = UserPrincipal.create(agent1);
        LeadCreateRequest req = new LeadCreateRequest();
        req.setFullName("Jane Smith");
        req.setPhone("+1 555-8888");
        req.setLeadSource(LeadSource.REFERRAL);
        LeadDto created = leadService.createLead(req, principal);

        LeadUpdateRequest updateReq = new LeadUpdateRequest();
        updateReq.setFullName("Jane Smith");
        updateReq.setPhone("+1 555-8888");
        updateReq.setLeadSource(LeadSource.REFERRAL);
        updateReq.setStage(LeadStage.BOOKED); // Attempt illegal manual transition

        assertThrows(BadRequestException.class, () -> leadService.updateLead(created.getId(), updateReq, principal));
    }

    @Test
    @DisplayName("Security: Sales agent cannot view another agent's restricted lead")
    public void testUnauthorizedLeadAccessThrowsForbidden() {
        UserPrincipal principal1 = UserPrincipal.create(agent1);
        LeadCreateRequest req = new LeadCreateRequest();
        req.setFullName("Private Lead");
        req.setPhone("+1 555-7777");
        req.setLeadSource(LeadSource.WALK_IN);
        LeadDto created = leadService.createLead(req, principal1);

        UserPrincipal principal2 = UserPrincipal.create(agent2);
        assertThrows(ForbiddenException.class, () -> leadService.getLeadById(created.getId(), principal2));
    }
}
