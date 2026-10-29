-- V2: Real Estate CRM Realistic Seed Data

-- 1. Users
-- Passwords will also be verified / initialized by DataInitializer with BCryptPasswordEncoder
-- Default test credentials: admin@estatecrm.com / admin123, john.sales@estatecrm.com / sales123, sarah.sales@estatecrm.com / sales123
INSERT INTO users (id, name, email, password, phone, role, active, created_at, updated_at) VALUES
(1, 'Alex Morgan (Admin)', 'admin@estatecrm.com', '$2a$10$w8TfGf8iU8J2rKeqU.g.2.sUvdQn1eYg2QZ6iL1.h6o9vR6l1XNeq', '+1 555-0100', 'ADMIN', true, NOW(), NOW()),
(2, 'John Miller', 'john.sales@estatecrm.com', '$2a$10$w8TfGf8iU8J2rKeqU.g.2.sUvdQn1eYg2QZ6iL1.h6o9vR6l1XNeq', '+1 555-0101', 'SALES_EMPLOYEE', true, NOW(), NOW()),
(3, 'Sarah Connor', 'sarah.sales@estatecrm.com', '$2a$10$w8TfGf8iU8J2rKeqU.g.2.sUvdQn1eYg2QZ6iL1.h6o9vR6l1XNeq', '+1 555-0102', 'SALES_EMPLOYEE', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Projects
INSERT INTO projects (id, code, name, description, address, city, status, property_type, start_date, completion_date, created_at, updated_at) VALUES
(1, 'PRJ-AZURE', 'Azure Heights Residences', 'Luxury 24-storey high-rise residential towers overlooking the bay with infinity pool and private clubhouse.', '100 Ocean View Blvd', 'San Francisco', 'READY_TO_MOVE', 'RESIDENTIAL', '2023-01-15', '2025-12-31', NOW(), NOW()),
(2, 'PRJ-PINNACLE', 'Pinnacle Business Park', 'Modern Grade-A eco-friendly commercial offices designed for tech and corporate headquarters.', '500 Tech Hub Way', 'San Jose', 'UNDER_CONSTRUCTION', 'COMMERCIAL', '2024-03-01', '2026-06-30', NOW(), NOW()),
(3, 'PRJ-EMERALD', 'Emerald Greens Villas', 'Gated community of premium 4BHK and 5BHK smart villas with solar roofs and private garden courtyards.', '88 Golf Course Road', 'Scottsdale', 'READY_TO_MOVE', 'VILLA', '2023-06-01', '2025-08-30', NOW(), NOW()),
(4, 'PRJ-HORIZON', 'Horizon Mixed Galleria', 'Integrated development combining retail high-street shops on lower levels with luxury serviced suites above.', '250 Metro Central Plaza', 'Austin', 'PLANNED', 'MIXED_USE', '2025-01-01', '2027-12-31', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Buildings
INSERT INTO buildings (id, project_id, name, floors, created_at, updated_at) VALUES
(1, 1, 'Tower A (East Wing)', 24, NOW(), NOW()),
(2, 1, 'Tower B (West Wing)', 24, NOW(), NOW()),
(3, 2, 'Building 1 (North Tower)', 12, NOW(), NOW()),
(4, 3, 'Phase 1 - Meadow Villas', 2, NOW(), NOW()),
(5, 3, 'Phase 2 - Sunset Villas', 2, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Property Units
INSERT INTO property_units (id, building_id, unit_number, unit_type, floor, area_sqft, price, status, version, created_at, updated_at) VALUES
-- Tower A Units
(1, 1, 'A-101', 'TWO_BHK', 1, 1250.00, 450000.00, 'AVAILABLE', 0, NOW(), NOW()),
(2, 1, 'A-102', 'TWO_BHK', 1, 1280.00, 460000.00, 'AVAILABLE', 0, NOW(), NOW()),
(3, 1, 'A-501', 'THREE_BHK', 5, 1850.00, 720000.00, 'AVAILABLE', 0, NOW(), NOW()),
(4, 1, 'A-1204', 'THREE_BHK', 12, 1920.00, 780000.00, 'BOOKED', 0, NOW(), NOW()),
(5, 1, 'A-PH01', 'PENTHOUSE', 24, 3400.00, 1650000.00, 'RESERVED', 0, NOW(), NOW()),
-- Tower B Units
(6, 2, 'B-201', 'ONE_BHK', 2, 750.00, 290000.00, 'AVAILABLE', 0, NOW(), NOW()),
(7, 2, 'B-402', 'TWO_BHK', 4, 1300.00, 480000.00, 'AVAILABLE', 0, NOW(), NOW()),
(8, 2, 'B-805', 'THREE_BHK', 8, 1950.00, 810000.00, 'AVAILABLE', 0, NOW(), NOW()),
-- Pinnacle Business Park Units
(9, 3, 'C-101', 'COMMERCIAL_SPACE', 1, 3500.00, 1400000.00, 'AVAILABLE', 0, NOW(), NOW()),
(10, 3, 'C-305', 'COMMERCIAL_SPACE', 3, 5200.00, 2100000.00, 'AVAILABLE', 0, NOW(), NOW()),
-- Emerald Greens Villas
(11, 4, 'VILLA-01', 'FOUR_BHK', 2, 4200.00, 1850000.00, 'BOOKED', 0, NOW(), NOW()),
(12, 4, 'VILLA-02', 'FOUR_BHK', 2, 4250.00, 1880000.00, 'AVAILABLE', 0, NOW(), NOW()),
(13, 5, 'VILLA-11', 'FOUR_BHK', 2, 4400.00, 1950000.00, 'AVAILABLE', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE unit_number=VALUES(unit_number);

-- 5. Leads
INSERT INTO leads (id, lead_code, full_name, phone, email, lead_source, interested_project_id, budget, assigned_to_id, stage, next_follow_up_date, notes, created_by_id, created_at, updated_at) VALUES
(1, 'LD-2026-0001', 'David Patterson', '+1 555-2341', 'david.patterson@gmail.com', 'WEBSITE', 1, 500000.00, 2, 'NEGOTIATION', DATE_ADD(NOW(), INTERVAL 1 DAY), 'Looking for 2BHK corner unit on higher floor. Pre-approved for mortgage.', 2, NOW(), NOW()),
(2, 'LD-2026-0002', 'Elena Rostova', '+1 555-4567', 'elena.rostova@outlook.com', 'REFERRAL', 1, 800000.00, 3, 'BOOKED', NULL, 'Completed booking for unit A-1204. Down payment received.', 3, NOW(), NOW()),
(3, 'LD-2026-0003', 'Marcus Vance', '+1 555-7890', 'marcus.v@vancecapital.com', 'WALK_IN', 2, 2500000.00, 2, 'SITE_VISIT', DATE_ADD(NOW(), INTERVAL 2 DAY), 'Corporate client seeking whole floor commercial space for tech venture.', 2, NOW(), NOW()),
(4, 'LD-2026-0004', 'Sophia Chang', '+1 555-8901', 'sophia.chang@biotech.org', 'SOCIAL_MEDIA', 3, 2000000.00, 3, 'BOOKED', NULL, 'Signed contract for Villa 01. Keys handover pending.', 3, NOW(), NOW()),
(5, 'LD-2026-0005', 'Robert Kowalski', '+1 555-3456', 'robert.k@techcorp.io', 'CAMPAIGN', 1, 480000.00, 2, 'CONTACTED', DATE_ADD(NOW(), INTERVAL -1 DAY), 'Requested floor plans and amenity brochure via email.', 2, NOW(), NOW()),
(6, 'LD-2026-0006', 'Jessica Alba Miller', '+1 555-6789', 'jessica.m@creative.com', 'CALL_IN', 1, 300000.00, 3, 'NEW', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Interested in 1BHK unit Tower B for investment/rental yield.', 3, NOW(), NOW()),
(7, 'LD-2026-0007', 'Daniel Thorne', '+1 555-9012', 'daniel.t@gmail.com', 'WEBSITE', 3, 1500000.00, 2, 'LOST', NULL, 'Budget mismatch for Emerald Greens villas; opted for suburban property.', 2, NOW(), NOW()),
(8, 'LD-2026-0008', 'Amara Okafor', '+1 555-4321', 'amara.okafor@primehealth.com', 'REFERRAL', 1, 750000.00, 3, 'INTERESTED', NOW(), 'Scheduled site visit today at 4:00 PM for unit A-501.', 3, NOW(), NOW())
ON DUPLICATE KEY UPDATE lead_code=VALUES(lead_code);

-- 6. Lead Activities
INSERT INTO lead_activities (id, lead_id, user_id, type, description, created_at) VALUES
(1, 1, 2, 'CALL', 'Called David to discuss pricing for unit A-102. Client asked for 2% discount.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 1, 2, 'NOTE', 'Negotiation in progress. Client approved loan with Chase bank.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 2, 3, 'SITE_VISIT', 'Conducted VIP site walkthrough for Elena Rostova on 12th floor.', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 2, 3, 'BOOKING', 'Unit A-1204 officially booked with booking ref BK-2026-0001.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 3, 2, 'MEETING', 'In-person meeting at sales gallery with Marcus Vance. Showed 3D architectural mockups.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 4, 3, 'BOOKING', 'Unit VILLA-01 officially booked with booking ref BK-2026-0002.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(7, 5, 2, 'EMAIL', 'Emailed digital brochure and pricing schedule for Tower B units.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(8, 8, 3, 'CALL', 'Spoke with Amara to confirm today''s afternoon site visit.', DATE_SUB(NOW(), INTERVAL 3 HOUR))
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 7. Follow-ups
INSERT INTO follow_ups (id, lead_id, assigned_to_id, scheduled_at, status, notes, completion_notes, completed_at, created_at, updated_at) VALUES
(1, 1, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), 'PENDING', 'Send revised price quote after manager approval.', NULL, NULL, NOW(), NOW()),
(2, 3, 2, DATE_ADD(NOW(), INTERVAL 2 DAY), 'PENDING', 'Follow up with board members regarding Pinnacle Park floor specs.', NULL, NULL, NOW(), NOW()),
(3, 5, 2, DATE_ADD(NOW(), INTERVAL -1 DAY), 'PENDING', 'Call Robert to review floor plans and address any questions.', NULL, NULL, NOW(), NOW()),
(4, 8, 3, NOW(), 'PENDING', 'Prepare welcome kit and keycard for Amara''s 4:00 PM site visit.', NULL, NULL, NOW(), NOW()),
(5, 6, 3, DATE_ADD(NOW(), INTERVAL 3 DAY), 'PENDING', 'Send rental yield projection sheet for 1BHK B-201.', NULL, NULL, NOW(), NOW()),
(6, 2, 3, DATE_SUB(NOW(), INTERVAL 4 DAY), 'COMPLETED', 'Finalize booking agreement documents.', 'Agreement signed by customer and deposit verified.', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW(), NOW())
ON DUPLICATE KEY UPDATE notes=VALUES(notes);

-- 8. Bookings
INSERT INTO bookings (id, booking_reference, lead_id, unit_id, booked_by_id, booking_date, agreed_price, booking_amount, payment_method, status, cancellation_reason, cancelled_at, cancelled_by_id, notes, created_at, updated_at) VALUES
(1, 'BK-2026-0001', 2, 4, 3, DATE_SUB(NOW(), INTERVAL 3 DAY), 780000.00, 78000.00, 'BANK_WIRE', 'CONFIRMED', NULL, NULL, NULL, 'Standard 10% token deposit paid. Remaining 90% at registration.', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 'BK-2026-0002', 4, 11, 3, DATE_SUB(NOW(), INTERVAL 4 DAY), 1850000.00, 185000.00, 'CHEQUE', 'CONFIRMED', NULL, NULL, NULL, 'Custom interior finish requested for master bedroom.', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE booking_reference=VALUES(booking_reference);
