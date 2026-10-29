-- V3: Real Estate CRM Comprehensive Business Dataset
-- Idempotent seed data for rich testing across pagination, filtering, charts, and reservations

-- 1. Additional Property Units
INSERT INTO property_units (id, building_id, unit_number, unit_type, floor, area_sqft, price, status, version, created_at, updated_at) VALUES
-- Azure Heights Tower A
(14, 1, 'A-201', 'TWO_BHK', 2, 1260.00, 455000.00, 'AVAILABLE', 0, NOW(), NOW()),
(15, 1, 'A-301', 'TWO_BHK', 3, 1270.00, 458000.00, 'AVAILABLE', 0, NOW(), NOW()),
(16, 1, 'A-702', 'THREE_BHK', 7, 1890.00, 745000.00, 'AVAILABLE', 0, NOW(), NOW()),
(17, 1, 'A-1501', 'THREE_BHK', 15, 1980.00, 820000.00, 'AVAILABLE', 0, NOW(), NOW()),
(18, 1, 'A-PH02', 'PENTHOUSE', 24, 3600.00, 1750000.00, 'AVAILABLE', 0, NOW(), NOW()),
-- Azure Heights Tower B
(19, 2, 'B-301', 'ONE_BHK', 3, 760.00, 295000.00, 'AVAILABLE', 0, NOW(), NOW()),
(20, 2, 'B-502', 'TWO_BHK', 5, 1310.00, 490000.00, 'RESERVED', 0, NOW(), NOW()),
(21, 2, 'B-902', 'THREE_BHK', 9, 1960.00, 825000.00, 'AVAILABLE', 0, NOW(), NOW()),
(22, 2, 'B-1101', 'THREE_BHK', 11, 2010.00, 860000.00, 'BOOKED', 0, NOW(), NOW()),
-- Pinnacle Business Park
(23, 3, 'C-201', 'COMMERCIAL_SPACE', 2, 4100.00, 1680000.00, 'AVAILABLE', 0, NOW(), NOW()),
(24, 3, 'C-401', 'COMMERCIAL_SPACE', 4, 6200.00, 2550000.00, 'AVAILABLE', 0, NOW(), NOW()),
-- Emerald Greens Villas
(25, 4, 'VILLA-03', 'FOUR_BHK', 2, 4300.00, 1920000.00, 'AVAILABLE', 0, NOW(), NOW()),
(26, 4, 'VILLA-04', 'FOUR_BHK', 2, 4500.00, 2050000.00, 'AVAILABLE', 0, NOW(), NOW()),
(27, 5, 'VILLA-12', 'FOUR_BHK', 2, 4450.00, 1990000.00, 'RESERVED', 0, NOW(), NOW()),
(28, 5, 'VILLA-14', 'FOUR_BHK', 2, 4600.00, 2150000.00, 'AVAILABLE', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE unit_number=VALUES(unit_number), status=VALUES(status);

-- 2. Expanded Leads
INSERT INTO leads (id, lead_code, full_name, phone, email, lead_source, interested_project_id, budget, assigned_to_id, stage, next_follow_up_date, notes, created_by_id, created_at, updated_at) VALUES
(9, 'LD-2026-0009', 'Liam Gallagher', '+1 555-7711', 'liam.g@acoustics.co.uk', 'WEBSITE', 1, 460000.00, 2, 'NEW', DATE_ADD(NOW(), INTERVAL 2 DAY), 'Submitted web inquiry regarding Tower A 2BHK units.', 2, NOW(), NOW()),
(10, 'LD-2026-0010', 'Camila Rodriguez', '+1 555-8822', 'camila.r@solardesign.es', 'SOCIAL_MEDIA', 3, 2100000.00, 3, 'INTERESTED', DATE_ADD(NOW(), INTERVAL 1 DAY), 'Architect looking for solar villa in Phase 1.', 3, NOW(), NOW()),
(11, 'LD-2026-0011', 'Jonathan Sterling', '+1 555-9933', 'j.sterling@heritagefunds.com', 'BROKER', 2, 3200000.00, 2, 'NEGOTIATION', DATE_ADD(NOW(), INTERVAL 1 DAY), 'Broker brought high net worth buyer for Pinnacle Park floor.', 2, NOW(), NOW()),
(12, 'LD-2026-0012', 'Nadia Al-Mansoor', '+1 555-4455', 'nadia.m@gulfventures.ae', 'WALK_IN', 1, 1800000.00, 3, 'SITE_VISIT', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Visited gallery. Interested in Penthouse PH02.', 3, NOW(), NOW()),
(13, 'LD-2026-0013', 'Victor Chen', '+1 555-5566', 'victor.chen@synapse.ai', 'REFERRAL', 1, 850000.00, 2, 'BOOKED', NULL, 'Purchased unit B-1101 through employee referral program.', 2, NOW(), NOW()),
(14, 'LD-2026-0014', 'Hannah Abbott', '+1 555-6677', 'hannah.abbott@botanics.org', 'CAMPAIGN', 3, 1950000.00, 3, 'CONTACTED', DATE_ADD(NOW(), INTERVAL -2 DAY), 'Downloaded digital villa catalog. Follow-up phone call overdue.', 3, NOW(), NOW()),
(15, 'LD-2026-0015', 'Tariq Washington', '+1 555-3344', 'tariq.w@capitalnexus.com', 'CALL_IN', 2, 1750000.00, 2, 'NEW', DATE_ADD(NOW(), INTERVAL 4 DAY), 'Inquired via phone hotline about commercial flex spaces.', 2, NOW(), NOW()),
(16, 'LD-2026-0016', 'Zoe Kravitz-Bell', '+1 555-2233', 'zoe.bell@metropolis.design', 'SOCIAL_MEDIA', 1, 750000.00, 3, 'INTERESTED', DATE_ADD(NOW(), INTERVAL 1 DAY), 'Liked Instagram tour video. Requesting high-floor layout.', 3, NOW(), NOW()),
(17, 'LD-2026-0017', 'Gabriel Morales', '+1 555-1122', 'gabriel.m@logix.com', 'WEBSITE', 1, 500000.00, 2, 'CONTACTED', NOW(), 'Completed virtual walkthrough. Wants in-person viewing.', 2, NOW(), NOW()),
(18, 'LD-2026-0018', 'Isabella Fontana', '+1 555-9988', 'isabella.f@milano.it', 'WALK_IN', 3, 2200000.00, 3, 'SITE_VISIT', DATE_ADD(NOW(), INTERVAL 2 DAY), 'Visited site on Sunday. Returning with architect spouse.', 3, NOW(), NOW()),
(19, 'LD-2026-0019', 'Ethan Hawke-Smith', '+1 555-8877', 'ethan.hs@quantum.org', 'BROKER', 1, 470000.00, 2, 'LOST', NULL, 'Opted for downtown development with immediate handover.', 2, NOW(), NOW()),
(20, 'LD-2026-0020', 'Maya Angelou Davis', '+1 555-7766', 'maya.davis@lawfirm.com', 'REFERRAL', 1, 830000.00, 3, 'NEGOTIATION', DATE_ADD(NOW(), INTERVAL 1 DAY), 'Discussing installment payment milestones for unit A-1501.', 3, NOW(), NOW()),
(21, 'LD-2026-0021', 'Kavita Patel', '+1 555-6655', 'kavita.patel@biopharma.in', 'CAMPAIGN', 2, 2600000.00, 2, 'SITE_VISIT', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Needs R&D approved floor layout. Meeting booked.', 2, NOW(), NOW()),
(22, 'LD-2026-0022', 'Alexander Wright', '+1 555-5544', 'a.wright@wrightarch.co', 'WEBSITE', 3, 2050000.00, 3, 'CONTACTED', DATE_ADD(NOW(), INTERVAL -1 DAY), 'Sent custom finishes request form. Overdue review.', 3, NOW(), NOW()),
(23, 'LD-2026-0023', 'Chloe Bennett', '+1 555-4433', 'chloe.b@digitalstream.tv', 'SOCIAL_MEDIA', 1, 310000.00, 2, 'NEW', DATE_ADD(NOW(), INTERVAL 2 DAY), 'Young professional seeking 1BHK starter home.', 2, NOW(), NOW()),
(24, 'LD-2026-0024', 'Oliver Queen', '+1 555-3322', 'oliver.q@starling.ind', 'WALK_IN', 2, 1900000.00, 3, 'INTERESTED', DATE_ADD(NOW(), INTERVAL 2 DAY), 'Looking for private office suite with dedicated elevator.', 3, NOW(), NOW()),
(25, 'LD-2026-0025', 'Priya Sharma', '+1 555-2211', 'priya.s@fintechglobal.com', 'REFERRAL', 1, 800000.00, 2, 'BOOKED', NULL, 'Confirmed unit A-702 booking with initial escrow deposit.', 2, NOW(), NOW())
ON DUPLICATE KEY UPDATE lead_code=VALUES(lead_code), full_name=VALUES(full_name), stage=VALUES(stage);

-- 3. Additional Bookings
INSERT INTO bookings (id, booking_reference, lead_id, unit_id, booked_by_id, booking_date, agreed_price, booking_amount, payment_method, status, cancellation_reason, cancelled_at, cancelled_by_id, notes, created_at, updated_at) VALUES
(3, 'BK-2026-0003', 13, 22, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 860000.00, 86000.00, 'BANK_WIRE', 'CONFIRMED', NULL, NULL, NULL, 'Standard 10% token deposit transferred. Registration scheduled next week.', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 'BK-2026-0004', 25, 16, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), 745000.00, 111750.00, 'CHEQUE', 'CONFIRMED', NULL, NULL, NULL, '15% down payment cleared. Buyer requested customized kitchen fittings.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 'BK-2026-0005', 1, 20, 2, DATE_SUB(NOW(), INTERVAL 6 DAY), 490000.00, 49000.00, 'CREDIT_CARD', 'CONFIRMED', NULL, NULL, NULL, 'Token deposit collected for Unit B-502. Final mortgage documents pending.', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY))
ON DUPLICATE KEY UPDATE booking_reference=VALUES(booking_reference);

-- 4. Additional Follow-ups
INSERT INTO follow_ups (id, lead_id, assigned_to_id, scheduled_at, status, notes, completion_notes, completed_at, created_at, updated_at) VALUES
(7, 9, 2, DATE_ADD(NOW(), INTERVAL 2 DAY), 'PENDING', 'Send detailed pricing sheet and 2BHK floor plans for Tower A.', NULL, NULL, NOW(), NOW()),
(8, 10, 3, DATE_ADD(NOW(), INTERVAL 1 DAY), 'PENDING', 'Discuss custom solar specs and sustainability brochure for Villa 03.', NULL, NULL, NOW(), NOW()),
(9, 11, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), 'PENDING', 'Meeting with Jonathan Sterling and broker regarding Pinnacle Park C-401.', NULL, NULL, NOW(), NOW()),
(10, 12, 3, DATE_ADD(NOW(), INTERVAL 3 DAY), 'PENDING', 'Prepare VIP presentation and champagne for Nadia Al-Mansoor penthouse viewing.', NULL, NULL, NOW(), NOW()),
(11, 14, 3, DATE_SUB(NOW(), INTERVAL 2 DAY), 'PENDING', 'Call Hannah Abbott to review digital catalog and answer queries.', NULL, NULL, NOW(), NOW()),
(12, 17, 2, NOW(), 'PENDING', 'Contact Gabriel Morales for in-person viewing confirmation today.', NULL, NULL, NOW(), NOW()),
(13, 18, 3, DATE_ADD(NOW(), INTERVAL 2 DAY), 'PENDING', 'Coordinate site visit with architectural engineering team for Isabella Fontana.', NULL, NULL, NOW(), NOW()),
(14, 20, 3, DATE_ADD(NOW(), INTERVAL 1 DAY), 'PENDING', 'Deliver revised payment schedule after sales head sign-off for Maya Davis.', NULL, NULL, NOW(), NOW()),
(15, 21, 2, DATE_ADD(NOW(), INTERVAL 3 DAY), 'PENDING', 'Confirm commercial floor plan with Kavita Patel technical reps.', NULL, NULL, NOW(), NOW()),
(16, 22, 3, DATE_SUB(NOW(), INTERVAL 1 DAY), 'PENDING', 'Review custom finishes request form with Alexander Wright.', NULL, NULL, NOW(), NOW()),
(17, 13, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'COMPLETED', 'Collect and verify signed booking contract for Victor Chen.', 'Contract signed, deposit cleared via wire.', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NOW()),
(18, 25, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), 'COMPLETED', 'Send official reservation receipt and unit allocation letter to Priya Sharma.', 'Receipt dispatched by email.', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW())
ON DUPLICATE KEY UPDATE notes=VALUES(notes);

-- 5. Additional Lead Activities
INSERT INTO lead_activities (id, lead_id, user_id, type, description, created_at) VALUES
(9, 9, 2, 'CALL', 'Spoke with Liam Gallagher about Tower A 2BHK availability and pricing.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(10, 10, 3, 'NOTE', 'Client is keen on eco-friendly features and solar energy generation stats.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(11, 11, 2, 'MEETING', 'Held executive conference call with broker and Jonathan Sterling.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(12, 12, 3, 'SITE_VISIT', 'Walked Nadia Al-Mansoor through Azure Heights display suite.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(13, 13, 2, 'BOOKING', 'Unit B-1101 officially confirmed with booking ref BK-2026-0003.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(14, 14, 3, 'EMAIL', 'Sent digital villa brochure and high-resolution layout renders.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(15, 17, 2, 'NOTE', 'Virtual walkthrough completed. Customer requested 2:00 PM slot today.', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(16, 18, 3, 'SITE_VISIT', 'Conducted Phase 1 villa inspection with Isabella Fontana.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(17, 20, 3, 'CALL', 'Negotiated installment terms for Unit A-1501 with Maya Davis.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(18, 21, 2, 'EMAIL', 'Forwarded commercial floor specifications for Pinnacle Business Park.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(19, 25, 2, 'BOOKING', 'Unit A-702 booked under booking ref BK-2026-0004.', DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE description=VALUES(description);
