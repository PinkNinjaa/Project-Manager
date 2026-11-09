-- seed.sql - TigerTurf demo data (New Zealand / Auckland / NZD)
-- Run after schema.sql and views.sql. All IDs are readable text keys (UUID-compatible TEXT column).
-- Order matters: parents before children (FK constraints).
-- NOTE: Calc and Rollup fields (subtotal, total, estimated_cost, etc.) are omitted
--       because they are computed by views, not stored in base tables.

PRAGMA foreign_keys = ON;

-- ============================================
-- 1. department (4)
-- ============================================
INSERT INTO department (id, name, code, is_active, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('dep_sales', 'Sales', 'SLS', 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'sys_seed', NULL, 0),
  ('dep_production', 'Production', 'PRO', 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'sys_seed', NULL, 0),
  ('dep_operations', 'Operations', 'OPS', 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'sys_seed', NULL, 0),
  ('dep_admin', 'Admin', 'ADM', 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'sys_seed', NULL, 0);

-- ============================================
-- 2. user (7)
-- ============================================
INSERT INTO user (id, full_name, email, phone, department_id, role, is_active, external_id, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('usr_ava', 'Ava Patel', 'ava.patel@tigerturf.co.nz', '+64 21 123 4567', 'dep_sales', 'Admin', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'sys_seed', NULL, 0),
  ('usr_liam', 'Liam Wilson', 'liam.wilson@tigerturf.co.nz', '+64 21 234 5678', 'dep_sales', 'Sales rep', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('usr_sarah', 'Sarah Chen', 'sarah.chen@tigerturf.co.nz', '+64 21 345 6789', 'dep_production', 'Production', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('usr_mike', 'Mike Thompson', 'mike.thompson@tigerturf.co.nz', '+64 21 456 7890', 'dep_operations', 'Operations', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('usr_emma', 'Emma McLeod', 'emma.mcleod@tigerturf.co.nz', '+64 21 567 8901', 'dep_production', 'Manager', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('usr_dan', 'Daniel Brown', 'daniel.brown@tigerturf.co.nz', '+64 21 678 9012', 'dep_sales', 'Read-only', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('usr_sofia', 'Sofia Davies', 'sofia.davies@tigerturf.co.nz', '+64 21 789 0123', 'dep_admin', 'Manager', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0);

-- ============================================
-- 3. account (8)
-- ============================================
INSERT INTO account (id, account_number, name, account_type, email, phone, billing_street, billing_suburb, billing_city, billing_postcode, tax_number, source, owner_user_id, is_active, notes, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('acc_northshore', 'ACC-00001', 'North Shore Primary School', 'School / childcare', 'office@northshore.school.nz', '+64 9 123 4567', '5 Evans Road', 'Glenfield', 'Auckland', '0627', NULL, 'Referral', 'usr_liam', 1, 'Quarterly grounds contract', datetime('2025-02-01 09:00:00'), datetime('2025-02-01 09:00:00'), 'usr_ava', NULL, 0),
  ('acc_aucklandcouncil', 'ACC-00002', 'Auckland Council Parks', 'Council / government', 'parks@aucklandcouncil.govt.nz', '+64 9 234 5678', '135 Albert Street', 'Auckland Central', 'Auckland', '1010', '123-456-789', 'Repeat customer', 'usr_liam', 1, 'Multiple sports field contracts', datetime('2025-02-15 09:00:00'), datetime('2025-02-15 09:00:00'), 'usr_ava', NULL, 0),
  ('acc_fletcher', 'ACC-00003', 'Fletcher Building Developments', 'Builder / developer', 'projects@fletcherbuild.co.nz', '+64 9 345 6789', '81 Great South Road', 'Epsom', 'Auckland', '1051', '98-765-432', 'Website', 'usr_liam', 1, 'New subdivision turf packages', datetime('2025-03-01 09:00:00'), datetime('2025-03-01 09:00:00'), 'usr_ava', NULL, 0),
  ('acc_harbourcity', 'ACC-00004', 'Harbour City Sports Club', 'Commercial', 'manager@harbourcity.co.nz', '+64 9 456 7890', '12 Seaside Boulevard', 'Takapuna', 'Auckland', '0622', NULL, 'Builder / trade', 'usr_liam', 1, 'Bowling green and cricket pitch', datetime('2025-03-10 09:00:00'), datetime('2025-03-10 09:00:00'), 'usr_ava', NULL, 0),
  ('acc_wilson', 'ACC-00005', 'Wilson Family Residence', 'Residential', 'sarah.wilson@gmail.com', '+64 21 567 8901', '24 Rimu Street', 'Remuera', 'Auckland', '1050', NULL, 'Walk-in', 'usr_liam', 1, 'Front lawn and backyard', datetime('2025-03-20 09:00:00'), datetime('2025-03-20 09:00:00'), 'usr_ava', NULL, 0),
  ('acc_greenvalley', 'ACC-00006', 'Green Valley Childcare', 'School / childcare', 'director@greenvalley.school.nz', '+64 9 567 8901', '100 Dominion Road', 'Mount Eden', 'Auckland', '1024', NULL, 'Referral', 'usr_liam', 1, 'Soft fall safety surface', datetime('2025-04-01 09:00:00'), datetime('2025-04-01 09:00:00'), 'usr_ava', NULL, 0),
  ('acc_manukau', 'ACC-00007', 'Manukau Commercial Properties', 'Commercial', 'leasing@manukaucp.co.nz', '+64 9 678 9012', '500 Great South Road', 'Manukau', 'Auckland', '2104', '11-222-333', 'Other', 'usr_liam', 1, 'Landscaping for new office park', datetime('2025-04-15 09:00:00'), datetime('2025-04-15 09:00:00'), 'usr_ava', NULL, 0),
  ('acc_waiheke', 'ACC-00008', 'Waiheke Island Estate', 'Residential', 'estate@waiheke.co.nz', '+64 21 789 0123', '1 Onetangi Beach Road', 'Onetangi', 'Waiheke Island', '1081', NULL, 'Referral', 'usr_liam', 1, 'Holiday home lawn renovation', datetime('2025-05-01 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_ava', NULL, 0);

-- ============================================
-- 4. contact (12)
-- ============================================
INSERT INTO contact (id, account_id, first_name, last_name, email, mobile, phone, job_title, is_primary, preferred_contact, notes, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('con_principal', 'acc_northshore', 'Joanne', 'Williams', 'jo.williams@northshore.school.nz', '+64 21 111 2222', '+64 9 123 4567', 'Principal', 1, 'Email', 'Primary contact for grounds contract', datetime('2025-02-01 09:30:00'), datetime('2025-02-01 09:30:00'), 'usr_liam', NULL, 0),
  ('con_caretaker', 'acc_northshore', 'Mark', 'Thompson', 'mark.t@northshore.school.nz', '+64 21 222 3333', NULL, 'Grounds Caretaker', 0, 'Mobile', 'On-site contact for access', datetime('2025-02-01 09:30:00'), datetime('2025-02-01 09:30:00'), 'usr_liam', NULL, 0),
  ('con_council', 'acc_aucklandcouncil', 'Rachel', 'Nichols', 'rachel.nichols@aucklandcouncil.govt.nz', '+64 21 333 4444', '+64 9 234 5678', 'Parks Portfolio Manager', 1, 'Email', 'Manages sports field renewals', datetime('2025-02-15 09:30:00'), datetime('2025-02-15 09:30:00'), 'usr_liam', NULL, 0),
  ('con_fletcher', 'acc_fletcher', 'Chris', 'Martin', 'chris.martin@fletcherbuild.co.nz', '+64 21 444 5555', '+64 9 345 6789', 'Project Manager', 1, 'Mobile', 'New subdivision builds', datetime('2025-03-01 09:30:00'), datetime('2025-03-01 09:30:00'), 'usr_liam', NULL, 0),
  ('con_sportsclub', 'acc_harbourcity', 'Tony', 'Bennett', 'tony.b@harbourcity.co.nz', '+64 21 555 6666', '+64 9 456 7890', 'Club Manager', 1, 'Mobile', 'Bowling green specialist', datetime('2025-03-10 09:30:00'), datetime('2025-03-10 09:30:00'), 'usr_liam', NULL, 0),
  ('con_wilson', 'acc_wilson', 'Sarah', 'Wilson', 'sarah.wilson@gmail.com', '+64 21 567 8901', NULL, 'Homeowner', 1, 'Mobile', 'Front lawn renovation', datetime('2025-03-20 09:30:00'), datetime('2025-03-20 09:30:00'), 'usr_liam', NULL, 0),
  ('con_childcare', 'acc_greenvalley', 'Lisa', 'Roberts', 'lisa.roberts@greenvalley.school.nz', '+64 21 666 7777', '+64 9 567 8901', 'Centre Director', 1, 'Email', 'Safety surface requirement', datetime('2025-04-01 09:30:00'), datetime('2025-04-01 09:30:00'), 'usr_liam', NULL, 0),
  ('con_manukau', 'acc_manukau', 'David', 'Lee', 'david.lee@manukaucp.co.nz', '+64 21 777 8888', '+64 9 678 9012', 'Leasing Manager', 1, 'Email', 'Office park landscaping', datetime('2025-04-15 09:30:00'), datetime('2025-04-15 09:30:00'), 'usr_liam', NULL, 0),
  ('con_waiheke', 'acc_waiheke', 'Michael', 'Clark', 'michael.clark@waiheke.co.nz', '+64 21 888 9999', NULL, 'Property Owner', 1, 'Mobile', 'Holiday home, ferry access only', datetime('2025-05-01 09:30:00'), datetime('2025-05-01 09:30:00'), 'usr_liam', NULL, 0),
  ('con_council2', 'acc_aucklandcouncil', 'Andrew', 'Smith', 'andrew.smith@aucklandcouncil.govt.nz', '+64 21 999 0000', NULL, 'Senior Parks Officer', 0, 'Mobile', 'Secondary council contact', datetime('2025-02-15 10:00:00'), datetime('2025-02-15 10:00:00'), 'usr_liam', NULL, 0),
  ('con_wilson2', 'acc_wilson', 'James', 'Wilson', 'james.wilson@gmail.com', '+64 21 000 1111', NULL, 'Homeowner', 0, 'Mobile', 'Second contact', datetime('2025-03-20 09:30:00'), datetime('2025-03-20 09:30:00'), 'usr_liam', NULL, 0),
  ('con_fletcher2', 'acc_fletcher', 'Anna', 'Kowalski', 'anna.k@fletcherbuild.co.nz', '+64 21 111 2222', NULL, 'Site Engineer', 0, 'Email', 'Subdivision site engineer', datetime('2025-03-01 10:00:00'), datetime('2025-03-01 10:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 5. site_address (10)
-- ============================================
INSERT INTO site_address (id, account_id, label, street, suburb, city, postcode, latitude, longitude, access_notes, site_contact_id, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('site_ns_field1', 'acc_northshore', 'Main playing field', '5 Evans Road', 'Glenfield', 'Auckland', '0627', -36.785, 174.730, 'Gate code 1234, water tap near shed', 'con_caretaker', datetime('2025-02-01 10:00:00'), datetime('2025-02-01 10:00:00'), 'usr_liam', NULL, 0),
  ('site_ns_field2', 'acc_northshore', 'Junior playing field', '5 Evans Road', 'Glenfield', 'Auckland', '0627', -36.786, 174.731, 'Access via rear gate only', 'con_caretaker', datetime('2025-02-01 10:00:00'), datetime('2025-02-01 10:00:00'), 'usr_liam', NULL, 0),
  ('site_council_allyard', 'acc_aucklandcouncil', 'Albert Park sports ground', '135 Albert Street', 'Auckland Central', 'Auckland', '1010', -36.848, 174.768, 'Loading zone on Princes Street', 'con_council', datetime('2025-02-15 10:00:00'), datetime('2025-02-15 10:00:00'), 'usr_liam', NULL, 0),
  ('site_fletcher_subdivision', 'acc_fletcher', 'Lot 14 - front lawn', '81 Great South Road', 'Epsom', 'Auckland', '1051', -36.876, 174.772, 'Site office at entrance, call ahead', 'con_fletcher', datetime('2025-03-01 10:00:00'), datetime('2025-03-01 10:00:00'), 'usr_liam', NULL, 0),
  ('site_harbour_bowling', 'acc_harbourcity', 'Bowling green', '12 Seaside Boulevard', 'Takapuna', 'Auckland', '0622', -36.781, 174.768, 'Early morning access only (before 8am)', 'con_sportsclub', datetime('2025-03-10 10:00:00'), datetime('2025-03-10 10:00:00'), 'usr_liam', NULL, 0),
  ('site_wilson_front', 'acc_wilson', 'Front lawn', '24 Rimu Street', 'Remuera', 'Auckland', '1050', -36.869, 174.784, 'Dog on premises, keep gates closed', 'con_wilson', datetime('2025-03-20 10:00:00'), datetime('2025-03-20 10:00:00'), 'usr_liam', NULL, 0),
  ('site_childcare_play', 'acc_greenvalley', 'Playground soft fall area', '100 Dominion Road', 'Mount Eden', 'Auckland', '1024', -36.867, 174.760, 'No access during drop-off/pick-up', 'con_childcare', datetime('2025-04-01 10:00:00'), datetime('2025-04-01 10:00:00'), 'usr_liam', NULL, 0),
  ('site_manukau_lawn', 'acc_manukau', 'Office park central lawn', '500 Great South Road', 'Manukau', 'Auckland', '2104', -36.988, 174.897, 'Security booth at gate', 'con_manukau', datetime('2025-04-15 10:00:00'), datetime('2025-04-15 10:00:00'), 'usr_liam', NULL, 0),
  ('site_waiheke_lawn', 'acc_waiheke', 'Front lawn', '1 Onetangi Beach Road', 'Onetangi', 'Waiheke Island', '1081', -36.790, 175.100, 'Ferry delivery only, 7am-3pm', 'con_waiheke', datetime('2025-05-01 10:00:00'), datetime('2025-05-01 10:00:00'), 'usr_liam', NULL, 0),
  ('site_ns_admin', 'acc_northshore', 'Admin building surrounds', '5 Evans Road', 'Glenfield', 'Auckland', '0627', -36.784, 174.729, 'Avoid drop-off zone 8am-9am', 'con_principal', datetime('2025-02-01 10:00:00'), datetime('2025-02-01 10:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 6. lead (8)
-- ============================================
INSERT INTO lead (id, lead_number, account_id, contact_id, contact_name, contact_email, contact_phone, site_address_text, source, status, enquiry_notes, owner_user_id, received_at, qualified_at, disqualified_reason, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('lead_001', 'LEAD-0001', NULL, NULL, 'Tina Murphy', 'tina.murphy@gmail.com', '+64 21 111 3333', '32 Kowhai Street, Mt Albert', 'Website', 'Converted', 'Wants turf for small front yard', 'usr_liam', datetime('2025-05-01 10:00:00'), datetime('2025-05-05 14:00:00'), NULL, datetime('2025-05-01 10:00:00'), datetime('2025-05-05 14:00:00'), 'usr_liam', NULL, 0),
  ('lead_002', 'LEAD-0002', NULL, NULL, 'Bob Richards', 'bob.richards@tradie.co.nz', '+64 21 222 4444', 'Subdivision lot 22, Drury', 'Referral', 'Qualified', 'New build, 400m2 turf needed', 'usr_liam', datetime('2025-05-03 11:00:00'), NULL, NULL, datetime('2025-05-03 11:00:00'), datetime('2025-05-03 11:00:00'), 'usr_liam', NULL, 0),
  ('lead_003', 'LEAD-0003', NULL, NULL, 'Linda Cooper', 'linda.cooper@xtra.co.nz', '+64 21 333 5555', '15 Seacliff Road, St Heliers', 'Phone', 'Disqualified', 'Customer decided to go with artificial instead', 'usr_liam', datetime('2025-05-05 09:00:00'), NULL, 'Not a fit - wants synthetic turf', datetime('2025-05-05 09:00:00'), datetime('2025-05-05 09:00:00'), 'usr_liam', NULL, 0),
  ('lead_004', 'LEAD-0004', NULL, NULL, 'Steve Wong', 'steve.wong@buildco.co.nz', '+64 21 444 6666', '108 Oteha Valley Road, Albany', 'Builder / trade', 'Converted', 'Show home landscaping package', 'usr_liam', datetime('2025-05-06 10:00:00'), datetime('2025-05-08 16:00:00'), NULL, datetime('2025-05-06 10:00:00'), datetime('2025-05-08 16:00:00'), 'usr_liam', NULL, 0),
  ('lead_005', 'LEAD-0005', NULL, NULL, 'Karen Sim', 'karen.sim@gmail.com', '+64 21 555 7777', '44 PÅhutukawa Avenue, Howick', 'Social media', 'New', 'Small backyard renovation inquiry', 'usr_liam', datetime('2025-05-08 11:00:00'), NULL, NULL, datetime('2025-05-08 11:00:00'), datetime('2025-05-08 11:00:00'), 'usr_liam', NULL, 0),
  ('lead_006', 'LEAD-0006', 'acc_waiheke', 'con_waiheke', NULL, NULL, NULL, NULL, 'Referral', 'Converted', 'Holiday estate lawn renovation', 'usr_liam', datetime('2025-04-20 09:00:00'), datetime('2025-04-25 11:00:00'), NULL, datetime('2025-04-20 09:00:00'), datetime('2025-04-25 11:00:00'), 'usr_liam', NULL, 0),
  ('lead_007', 'LEAD-0007', NULL, NULL, 'Priya Sharma', 'priya.sharma@gmail.com', '+64 21 666 8888', '18 Totara Street, Mt Eden', 'Walk-in', 'Contacted', 'Front and back lawn quote requested', 'usr_liam', datetime('2025-05-10 10:00:00'), NULL, NULL, datetime('2025-05-10 10:00:00'), datetime('2025-05-10 10:00:00'), 'usr_liam', NULL, 0),
  ('lead_008', 'LEAD-0008', NULL, NULL, 'Mark Spencer', 'mark.spencer@council.govt.nz', '+64 21 777 9999', 'Council reserve, Papakura', 'Website', 'New', 'Community park turf replacement', 'usr_liam', datetime('2025-05-12 09:00:00'), NULL, NULL, datetime('2025-05-12 09:00:00'), datetime('2025-05-12 09:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 7. opportunity (8)
-- ============================================
INSERT INTO opportunity (id, opportunity_number, name, account_id, primary_contact_id, site_address_id, lead_id, sale_type, status, current_stage_id, estimated_value, probability_pct, expected_close_date, lost_reason, source, owner_user_id, opened_at, closed_at, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('opp_001', 'OPP-0001', 'North School Field Renovation', 'acc_northshore', 'con_principal', 'site_ns_field1', 'lead_001', 'Project', 'Won', NULL, 85000.00, 1.0, '2025-06-15', NULL, 'Website', 'usr_liam', datetime('2025-05-05 14:00:00'), datetime('2025-06-20 10:00:00'), datetime('2025-05-05 14:00:00'), datetime('2025-06-20 10:00:00'), 'usr_liam', NULL, 0),
  ('opp_002', 'OPP-0002', 'Council Sports Ground Renewal', 'acc_aucklandcouncil', 'con_council', 'site_council_allyard', NULL, 'Project', 'Open', NULL, 120000.00, 0.6, '2025-08-30', NULL, 'Repeat customer', 'usr_liam', datetime('2025-05-10 09:00:00'), NULL, datetime('2025-05-10 09:00:00'), datetime('2025-05-10 09:00:00'), 'usr_liam', NULL, 0),
  ('opp_003', 'OPP-0003', 'Fletcher Subdivision Lot 14', 'acc_fletcher', 'con_fletcher', 'site_fletcher_subdivision', 'lead_002', 'Cash', 'Open', NULL, 18000.00, 0.8, '2025-06-30', NULL, 'Referral', 'usr_liam', datetime('2025-05-03 11:00:00'), NULL, datetime('2025-05-03 11:00:00'), datetime('2025-05-03 11:00:00'), 'usr_liam', NULL, 0),
  ('opp_004', 'OPP-0004', 'Harbour City Bowling Green', 'acc_harbourcity', 'con_sportsclub', 'site_harbour_bowling', NULL, 'Project', 'On hold', NULL, 45000.00, 0.4, '2025-09-15', 'Budget freeze', 'Builder / trade', 'usr_liam', datetime('2025-03-10 09:00:00'), NULL, datetime('2025-03-10 09:00:00'), datetime('2025-03-10 09:00:00'), 'usr_liam', NULL, 0),
  ('opp_005', 'OPP-0005', 'Wilson Front Lawn', 'acc_wilson', 'con_wilson', 'site_wilson_front', NULL, 'Cash', 'Won', NULL, 12500.00, 1.0, '2025-04-10', NULL, 'Walk-in', 'usr_liam', datetime('2025-03-20 09:00:00'), datetime('2025-04-15 11:00:00'), datetime('2025-03-20 09:00:00'), datetime('2025-04-15 11:00:00'), 'usr_liam', NULL, 0),
  ('opp_006', 'OPP-0006', 'Green Valley Soft Fall', 'acc_greenvalley', 'con_childcare', 'site_childcare_play', NULL, 'Project', 'Open', NULL, 32000.00, 0.5, '2025-07-15', NULL, 'Referral', 'usr_liam', datetime('2025-04-01 09:00:00'), NULL, datetime('2025-04-01 09:00:00'), datetime('2025-04-01 09:00:00'), 'usr_liam', NULL, 0),
  ('opp_007', 'OPP-0007', 'Waiheke Estate Lawn', 'acc_waiheke', 'con_waiheke', 'site_waiheke_lawn', 'lead_006', 'Project', 'Won', NULL, 68000.00, 1.0, '2025-05-30', NULL, 'Referral', 'usr_liam', datetime('2025-04-25 11:00:00'), datetime('2025-06-10 09:00:00'), datetime('2025-04-25 11:00:00'), datetime('2025-06-10 09:00:00'), 'usr_liam', NULL, 0),
  ('opp_008', 'OPP-0008', 'Manukau Office Park Lawn', 'acc_manukau', 'con_manukau', 'site_manukau_lawn', NULL, 'Cash', 'Open', NULL, 25000.00, 0.3, '2025-07-31', NULL, 'Other', 'usr_liam', datetime('2025-04-15 09:00:00'), NULL, datetime('2025-04-15 09:00:00'), datetime('2025-04-15 09:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 8. product (12)
-- ============================================
INSERT INTO product (id, sku, name, category, description, unit, default_unit_price, default_unit_cost, pile_height_mm, colour, supplier, is_active, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('prod_elite', 'TT-ELITE-25', 'Elite 25mm Landscape Turf', 'Turf', 'Premium 25mm pile height landscape turf for residential lawns', 'm2', 38.00, 18.00, 25, 'Emerald green', 'TigerTurf NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_landscape', 'TT-LAND-35', 'Landscape 35mm Turf', 'Turf', '35mm pile height, dense wear-resistant turf for high-traffic areas', 'm2', 45.00, 22.00, 35, 'Emerald green', 'TigerTurf NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_sport', 'TT-SPORT-40', 'Sport 40mm Turf', 'Turf', '40mm pile height sports turf for schools and clubs', 'm2', 52.00, 26.00, 40, 'Emerald green', 'TigerTurf NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_putting', 'TT-PUTT-12', 'Putting Green 12mm', 'Turf', '12mm putting green turf for golf practice areas', 'm2', 65.00, 32.00, 12, 'Champion green', 'TigerTurf NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_play', 'TT-PLAY-20', 'Play Safe 20mm', 'Turf', '20mm soft fall playground turf with shockpad', 'm2', 58.00, 29.00, 20, 'Emerald green', 'TigerTurf NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_base', 'BASE-MOTYPE', 'MOTYPE Base Course', 'Base / aggregate', 'MOTYPE base course aggregate for under-turf preparation', 'm2', 12.00, 6.00, NULL, NULL, 'Aggregate Supply Ltd', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_infill', 'INFILL-SILICA', 'Silica Sand Infill', 'Infill', 'Dried silica sand infill for turf stabilization', 'm2', 8.00, 3.00, NULL, NULL, 'Silica NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_edging', 'EDGING-ALU', 'Aluminium Edging', 'Edging', '40mm aluminium edging for turf borders', 'lm', 25.00, 10.00, NULL, NULL, 'Edging Systems NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_membrane', 'MEMB-WEED', 'Weed Membrane', 'Weed membrane', 'Geotextile weed suppression membrane', 'm2', 5.00, 1.50, NULL, NULL, 'GeoFabrics NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_adhesive', 'ADH-TURF', 'Turf Adhesive', 'Adhesive / fixings', 'Two-part polyurethane turf adhesive', 'each', 45.00, 20.00, NULL, NULL, 'Adhesive Co NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_labour', 'LAB-INSTALL', 'Installation Labour', 'Labour', 'Professional turf installation crew per hour', 'hour', 85.00, 45.00, NULL, NULL, 'TigerTurf NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0),
  ('prod_freight', 'FREIGHT-AKL', 'Auckland Freight', 'Freight', 'Delivery within Auckland region', 'each', 150.00, 75.00, NULL, NULL, 'TigerTurf NZ', 1, datetime('2025-01-15 09:00:00'), datetime('2025-01-15 09:00:00'), 'usr_ava', NULL, 0);

-- ============================================
-- 9. quote (12) -- subtotal/tax_amount/total omitted (Calc fields)
-- ============================================
INSERT INTO quote (id, quote_number, opportunity_id, version, status, issue_date, valid_until, discount_amount, tax_rate, terms, prepared_by_user_id, sent_at, accepted_at, accepted_by_contact_id, rejection_reason, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('q_001', 'Q-0001-v1', 'opp_001', 1, 'Accepted', '2025-05-10', '2025-06-10', 0.00, 0.15, 'Standard terms: 50% deposit on acceptance', 'usr_liam', datetime('2025-05-10 16:00:00'), datetime('2025-06-20 10:00:00'), 'con_principal', NULL, datetime('2025-05-10 16:00:00'), datetime('2025-06-20 10:00:00'), 'usr_liam', NULL, 0),
  ('q_002', 'Q-0002-v1', 'opp_002', 1, 'Sent', '2025-05-20', '2025-06-20', 0.00, 0.15, 'Council framework agreement terms', 'usr_liam', datetime('2025-05-20 14:00:00'), NULL, NULL, NULL, datetime('2025-05-20 14:00:00'), datetime('2025-05-20 14:00:00'), 'usr_liam', NULL, 0),
  ('q_003', 'Q-0003-v1', 'opp_003', 1, 'Accepted', '2025-05-15', '2025-06-15', 0.00, 0.15, 'Cash sale - payment on completion', 'usr_liam', datetime('2025-05-15 10:00:00'), datetime('2025-05-20 11:00:00'), 'con_fletcher', NULL, datetime('2025-05-15 10:00:00'), datetime('2025-05-20 11:00:00'), 'usr_liam', NULL, 0),
  ('q_004', 'Q-0004-v1', 'opp_004', 1, 'Sent', '2025-03-15', '2025-04-15', 0.00, 0.15, 'Bowling green renovation', 'usr_liam', datetime('2025-03-15 11:00:00'), NULL, NULL, NULL, datetime('2025-03-15 11:00:00'), datetime('2025-03-15 11:00:00'), 'usr_liam', NULL, 0),
  ('q_005', 'Q-0005-v1', 'opp_005', 1, 'Accepted', '2025-03-25', '2025-04-25', 0.00, 0.15, 'Cash sale', 'usr_liam', datetime('2025-03-25 10:00:00'), datetime('2025-04-15 11:00:00'), 'con_wilson', NULL, datetime('2025-03-25 10:00:00'), datetime('2025-04-15 11:00:00'), 'usr_liam', NULL, 0),
  ('q_006', 'Q-0006-v1', 'opp_006', 1, 'Draft', '2025-04-10', '2025-05-10', 0.00, 0.15, 'Soft fall playground surfacing', 'usr_liam', NULL, NULL, NULL, NULL, datetime('2025-04-10 09:00:00'), datetime('2025-04-10 09:00:00'), 'usr_liam', NULL, 0),
  ('q_007', 'Q-0007-v1', 'opp_007', 1, 'Accepted', '2025-05-01', '2025-06-01', 0.00, 0.15, 'Waiheke estate - ferry delivery included', 'usr_liam', datetime('2025-05-01 09:00:00'), datetime('2025-06-10 09:00:00'), 'con_waiheke', NULL, datetime('2025-05-01 09:00:00'), datetime('2025-06-10 09:00:00'), 'usr_liam', NULL, 0),
  ('q_008', 'Q-0008-v1', 'opp_008', 1, 'Sent', '2025-05-20', '2025-06-20', 0.00, 0.15, 'Office park lawn installation', 'usr_liam', datetime('2025-05-20 14:00:00'), NULL, NULL, NULL, datetime('2025-05-20 14:00:00'), datetime('2025-05-20 14:00:00'), 'usr_liam', NULL, 0),
  ('q_009', 'Q-0001-v2', 'opp_001', 2, 'Superseded', '2025-05-15', '2025-06-15', 0.00, 0.15, 'Original quote before revision', 'usr_liam', datetime('2025-05-15 10:00:00'), NULL, NULL, NULL, datetime('2025-05-15 10:00:00'), datetime('2025-06-20 10:00:00'), 'usr_liam', NULL, 0),
  ('q_010', 'Q-0010-v1', 'opp_005', 1, 'Accepted', '2025-03-28', '2025-04-28', 500.00, 0.15, 'With $500 loyalty discount', 'usr_liam', datetime('2025-03-28 10:00:00'), datetime('2025-04-15 11:00:00'), 'con_wilson', NULL, datetime('2025-03-28 10:00:00'), datetime('2025-04-15 11:00:00'), 'usr_liam', NULL, 0),
  ('q_011', 'Q-0011-v1', 'opp_002', 1, 'Rejected', '2025-06-01', '2025-07-01', 0.00, 0.15, 'Alternative supplier chosen', 'usr_liam', datetime('2025-06-01 10:00:00'), NULL, NULL, 'Price too high', datetime('2025-06-01 10:00:00'), datetime('2025-06-15 14:00:00'), 'usr_liam', NULL, 0),
  ('q_012', 'Q-0012-v1', 'opp_003', 1, 'Draft', '2025-05-25', '2025-06-25', 0.00, 0.15, 'Cash sale backup quote', 'usr_liam', NULL, NULL, NULL, NULL, datetime('2025-05-25 09:00:00'), datetime('2025-05-25 09:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 10. quote_line (~30) -- line_total omitted (Calc field)
-- ============================================
INSERT INTO quote_line (id, quote_id, product_id, description, area_label, quantity, unit, unit_price, discount_pct, sort_order, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('ql_001', 'q_001', 'prod_sport', 'Sport 40mm turf supply and install', 'Main playing field', 1200.00, 'm2', 52.00, 0.00, 1, datetime('2025-05-10 16:00:00'), datetime('2025-05-10 16:00:00'), 'usr_liam', NULL, 0),
  ('ql_002', 'q_001', 'prod_base', 'MOTYPE base course', 'Main playing field', 1200.00, 'm2', 12.00, 0.00, 2, datetime('2025-05-10 16:00:00'), datetime('2025-05-10 16:00:00'), 'usr_liam', NULL, 0),
  ('ql_003', 'q_001', 'prod_infill', 'Silica sand infill', 'Main playing field', 1200.00, 'm2', 8.00, 0.00, 3, datetime('2025-05-10 16:00:00'), datetime('2025-05-10 16:00:00'), 'usr_liam', NULL, 0),
  ('ql_004', 'q_001', 'prod_labour', 'Installation crew', 'Main playing field', 160.00, 'hour', 85.00, 0.00, 4, datetime('2025-05-10 16:00:00'), datetime('2025-05-10 16:00:00'), 'usr_liam', NULL, 0),
  ('ql_005', 'q_002', 'prod_sport', 'Sport 40mm turf', 'Albert Park sports ground', 2000.00, 'm2', 52.00, 0.00, 1, datetime('2025-05-20 14:00:00'), datetime('2025-05-20 14:00:00'), 'usr_liam', NULL, 0),
  ('ql_006', 'q_002', 'prod_base', 'MOTYPE base course', 'Albert Park sports ground', 2000.00, 'm2', 12.00, 0.00, 2, datetime('2025-05-20 14:00:00'), datetime('2025-05-20 14:00:00'), 'usr_liam', NULL, 0),
  ('ql_007', 'q_002', 'prod_labour', 'Installation crew', 'Albert Park sports ground', 240.00, 'hour', 85.00, 0.00, 3, datetime('2025-05-20 14:00:00'), datetime('2025-05-20 14:00:00'), 'usr_liam', NULL, 0),
  ('ql_008', 'q_003', 'prod_landscape', 'Landscape 35mm turf', 'Lot 14 front lawn', 400.00, 'm2', 45.00, 0.00, 1, datetime('2025-05-15 10:00:00'), datetime('2025-05-15 10:00:00'), 'usr_liam', NULL, 0),
  ('ql_009', 'q_004', 'prod_elite', 'Elite 25mm turf', 'Bowling green', 800.00, 'm2', 38.00, 0.00, 1, datetime('2025-03-15 11:00:00'), datetime('2025-03-15 11:00:00'), 'usr_liam', NULL, 0),
  ('ql_010', 'q_004', 'prod_labour', 'Installation crew', 'Bowling green', 120.00, 'hour', 85.00, 0.00, 2, datetime('2025-03-15 11:00:00'), datetime('2025-03-15 11:00:00'), 'usr_liam', NULL, 0),
  ('ql_011', 'q_005', 'prod_elite', 'Elite 25mm turf', 'Front lawn', 250.00, 'm2', 38.00, 0.00, 1, datetime('2025-03-25 10:00:00'), datetime('2025-03-25 10:00:00'), 'usr_liam', NULL, 0),
  ('ql_012', 'q_005', 'prod_base', 'MOTYPE base course', 'Front lawn', 250.00, 'm2', 12.00, 0.00, 2, datetime('2025-03-25 10:00:00'), datetime('2025-03-25 10:00:00'), 'usr_liam', NULL, 0),
  ('ql_013', 'q_006', 'prod_play', 'Play Safe 20mm', 'Playground soft fall', 400.00, 'm2', 58.00, 0.00, 1, datetime('2025-04-10 09:00:00'), datetime('2025-04-10 09:00:00'), 'usr_liam', NULL, 0),
  ('ql_014', 'q_006', 'prod_base', 'MOTYPE base course', 'Playground soft fall', 400.00, 'm2', 12.00, 0.00, 2, datetime('2025-04-10 09:00:00'), datetime('2025-04-10 09:00:00'), 'usr_liam', NULL, 0),
  ('ql_015', 'q_006', 'prod_labour', 'Installation crew', 'Playground soft fall', 60.00, 'hour', 85.00, 0.00, 3, datetime('2025-04-10 09:00:00'), datetime('2025-04-10 09:00:00'), 'usr_liam', NULL, 0),
  ('ql_016', 'q_007', 'prod_elite', 'Elite 25mm turf', 'Front lawn', 1200.00, 'm2', 38.00, 0.00, 1, datetime('2025-05-01 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_liam', NULL, 0),
  ('ql_017', 'q_007', 'prod_base', 'MOTYPE base course', 'Front lawn', 1200.00, 'm2', 12.00, 0.00, 2, datetime('2025-05-01 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_liam', NULL, 0),
  ('ql_018', 'q_007', 'prod_freight', 'Waiheke ferry delivery', 'Front lawn', 1.00, 'each', 150.00, 0.00, 3, datetime('2025-05-01 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_liam', NULL, 0),
  ('ql_019', 'q_007', 'prod_labour', 'Installation crew', 'Front lawn', 80.00, 'hour', 85.00, 0.00, 4, datetime('2025-05-01 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_liam', NULL, 0),
  ('ql_020', 'q_008', 'prod_landscape', 'Landscape 35mm turf', 'Central lawn', 500.00, 'm2', 45.00, 0.00, 1, datetime('2025-05-20 14:00:00'), datetime('2025-05-20 14:00:00'), 'usr_liam', NULL, 0),
  ('ql_021', 'q_008', 'prod_labour', 'Installation crew', 'Central lawn', 60.00, 'hour', 85.00, 0.00, 2, datetime('2025-05-20 14:00:00'), datetime('2025-05-20 14:00:00'), 'usr_liam', NULL, 0),
  ('ql_022', 'q_009', 'prod_sport', 'Sport 40mm turf', 'Main playing field', 1200.00, 'm2', 52.00, 0.00, 1, datetime('2025-05-15 10:00:00'), datetime('2025-05-15 10:00:00'), 'usr_liam', NULL, 0),
  ('ql_023', 'q_009', 'prod_labour', 'Installation crew', 'Main playing field', 160.00, 'hour', 85.00, 0.00, 2, datetime('2025-05-15 10:00:00'), datetime('2025-05-15 10:00:00'), 'usr_liam', NULL, 0),
  ('ql_024', 'q_010', 'prod_elite', 'Elite 25mm turf', 'Front lawn', 250.00, 'm2', 38.00, 0.00, 1, datetime('2025-03-28 10:00:00'), datetime('2025-03-28 10:00:00'), 'usr_liam', NULL, 0),
  ('ql_025', 'q_010', 'prod_base', 'MOTYPE base course', 'Front lawn', 250.00, 'm2', 12.00, 0.00, 2, datetime('2025-03-28 10:00:00'), datetime('2025-03-28 10:00:00'), 'usr_liam', NULL, 0),
  ('ql_026', 'q_011', 'prod_sport', 'Sport 40mm turf', 'Albert Park sports ground', 2000.00, 'm2', 52.00, 0.00, 1, datetime('2025-06-01 10:00:00'), datetime('2025-06-01 10:00:00'), 'usr_liam', NULL, 0),
  ('ql_027', 'q_011', 'prod_labour', 'Installation crew', 'Albert Park sports ground', 240.00, 'hour', 85.00, 0.00, 2, datetime('2025-06-01 10:00:00'), datetime('2025-06-01 10:00:00'), 'usr_liam', NULL, 0),
  ('ql_028', 'q_012', 'prod_landscape', 'Landscape 35mm turf', 'Lot 22 front lawn', 400.00, 'm2', 45.00, 0.00, 1, datetime('2025-05-25 09:00:00'), datetime('2025-05-25 09:00:00'), 'usr_liam', NULL, 0),
  ('ql_029', 'q_012', 'prod_base', 'MOTYPE base course', 'Lot 22 front lawn', 400.00, 'm2', 12.00, 0.00, 2, datetime('2025-05-25 09:00:00'), datetime('2025-05-25 09:00:00'), 'usr_liam', NULL, 0),
  ('ql_030', 'q_012', 'prod_labour', 'Installation crew', 'Lot 22 front lawn', 60.00, 'hour', 85.00, 0.00, 3, datetime('2025-05-25 09:00:00'), datetime('2025-05-25 09:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 11. sale (4)
-- ============================================
INSERT INTO sale (id, sale_number, opportunity_id, quote_id, account_id, sale_type, sale_date, total_value, status, contract_sent_date, contract_signed_date, deposit_required_amount, deposit_due_date, notes, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('sale_001', 'SALE-0001', 'opp_001', 'q_001', 'acc_northshore', 'Project', '2025-06-20', 97750.00, 'Open', '2025-06-22', '2025-07-05', 25000.00, '2025-07-20', 'Project sale - deposit required', datetime('2025-06-20 10:00:00'), datetime('2025-07-05 14:00:00'), 'usr_liam', NULL, 0),
  ('sale_002', 'SALE-0002', 'opp_003', 'q_003', 'acc_fletcher', 'Cash', '2025-05-20', 20700.00, 'Completed', NULL, NULL, NULL, NULL, 'Cash sale - no project', datetime('2025-05-20 11:00:00'), datetime('2025-05-20 11:00:00'), 'usr_liam', NULL, 0),
  ('sale_003', 'SALE-0003', 'opp_005', 'q_010', 'acc_wilson', 'Cash', '2025-04-15', 13800.00, 'Completed', NULL, NULL, NULL, NULL, 'Cash sale - with discount', datetime('2025-04-15 11:00:00'), datetime('2025-04-15 11:00:00'), 'usr_liam', NULL, 0),
  ('sale_004', 'SALE-0004', 'opp_007', 'q_007', 'acc_waiheke', 'Project', '2025-06-10', 78200.00, 'Open', '2025-06-12', NULL, 15000.00, '2025-07-10', 'Project sale - Waiheke ferry delivery', datetime('2025-06-10 09:00:00'), datetime('2025-06-12 11:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 12. project (4) -- Rollup/Calc columns omitted
-- ============================================
INSERT INTO project (id, project_number, name, sale_id, opportunity_id, account_id, site_address_id, status, current_stage_id, project_manager_user_id, planned_start, planned_end, actual_start, actual_end, handover_date, practical_completion_date, hold_reason, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('proj_001', 'PROJ-0001', 'North Shore Primary School Field', 'sale_001', 'opp_001', 'acc_northshore', 'site_ns_field1', 'In progress', NULL, 'usr_sarah', '2025-07-01', '2025-09-30', '2025-07-07', NULL, NULL, NULL, NULL, datetime('2025-07-01 08:00:00'), datetime('2025-07-07 08:00:00'), 'usr_ava', NULL, 0),
  ('proj_002', 'PROJ-0002', 'Waiheke Estate Lawn', 'sale_004', 'opp_007', 'acc_waiheke', 'site_waiheke_lawn', 'Awaiting deposit', NULL, 'usr_sarah', '2025-07-15', '2025-08-15', NULL, NULL, NULL, NULL, NULL, datetime('2025-07-01 08:00:00'), datetime('2025-07-01 08:00:00'), 'usr_ava', NULL, 0),
  ('proj_003', 'PROJ-0003', 'Harbour City Bowling Green', NULL, 'opp_004', 'acc_harbourcity', 'site_harbour_bowling', 'On hold', NULL, 'usr_sarah', '2025-09-01', '2025-10-15', NULL, NULL, NULL, NULL, 'Budget freeze', datetime('2025-09-01 08:00:00'), datetime('2025-09-01 08:00:00'), 'usr_ava', NULL, 0),
  ('proj_004', 'PROJ-0004', 'Green Valley Soft Fall', NULL, 'opp_006', 'acc_greenvalley', 'site_childcare_play', 'Scope confirmation', NULL, 'usr_sarah', '2025-07-15', '2025-08-15', NULL, NULL, NULL, NULL, NULL, datetime('2025-07-01 08:00:00'), datetime('2025-07-01 08:00:00'), 'usr_ava', NULL, 0);

-- ============================================
-- 13. project_product (~8)
-- ============================================
INSERT INTO project_product (id, project_id, product_id, quote_line_id, area_label, quantity, measured_quantity, unit, notes, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('pp_001', 'proj_001', 'prod_sport', 'ql_001', 'Main playing field', 1200.00, 1200.00, 'm2', 'As quoted', datetime('2025-07-07 09:00:00'), datetime('2025-07-07 09:00:00'), 'usr_sarah', NULL, 0),
  ('pp_002', 'proj_001', 'prod_base', 'ql_002', 'Main playing field', 1200.00, 1200.00, 'm2', 'As quoted', datetime('2025-07-07 09:00:00'), datetime('2025-07-07 09:00:00'), 'usr_sarah', NULL, 0),
  ('pp_003', 'proj_001', 'prod_infill', 'ql_003', 'Main playing field', 1200.00, 1250.00, 'm2', 'Measured 50m2 extra infill', datetime('2025-07-07 09:00:00'), datetime('2025-07-07 09:00:00'), 'usr_sarah', NULL, 0),
  ('pp_004', 'proj_001', 'prod_labour', 'ql_004', 'Main playing field', 160.00, NULL, 'hour', 'As quoted', datetime('2025-07-07 09:00:00'), datetime('2025-07-07 09:00:00'), 'usr_sarah', NULL, 0),
  ('pp_005', 'proj_002', 'prod_elite', 'ql_016', 'Front lawn', 1200.00, NULL, 'm2', 'Pending deposit', datetime('2025-07-01 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_sarah', NULL, 0),
  ('pp_006', 'proj_002', 'prod_base', 'ql_017', 'Front lawn', 1200.00, NULL, 'm2', 'Pending deposit', datetime('2025-07-01 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_sarah', NULL, 0),
  ('pp_007', 'proj_004', 'prod_play', 'ql_013', 'Playground soft fall', 400.00, NULL, 'm2', 'Awaiting scope sign-off', datetime('2025-07-01 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_sarah', NULL, 0),
  ('pp_008', 'proj_004', 'prod_base', 'ql_014', 'Playground soft fall', 400.00, NULL, 'm2', 'Awaiting scope sign-off', datetime('2025-07-01 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_sarah', NULL, 0);

-- ============================================
-- 14. cost_estimate (4) -- estimated_cost omitted (Calc field)
-- ============================================
INSERT INTO cost_estimate (id, project_id, category, description, quantity, unit, unit_cost, supplier, status, version, approved_by_user_id, approved_at, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('ce_001', 'proj_001', 'Materials', 'Sport turf material', 1200.00, 'm2', 26.00, 'TigerTurf NZ', 'Approved', 1, 'usr_emma', datetime('2025-07-10 10:00:00'), datetime('2025-07-07 09:00:00'), datetime('2025-07-10 10:00:00'), 'usr_sarah', NULL, 0),
  ('ce_002', 'proj_001', 'Labour', 'Installation crew', 160.00, 'hour', 45.00, 'TigerTurf NZ', 'Approved', 1, 'usr_emma', datetime('2025-07-10 10:00:00'), datetime('2025-07-10 10:00:00'), datetime('2025-07-10 10:00:00'), 'usr_sarah', NULL, 0),
  ('ce_003', 'proj_002', 'Materials', 'Elite turf material (draft)', 1200.00, 'm2', 18.00, 'TigerTurf NZ', 'Draft', 1, NULL, NULL, datetime('2025-07-01 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_sarah', NULL, 0),
  ('ce_004', 'proj_004', 'Materials', 'Play turf material', 400.00, 'm2', 29.00, 'TigerTurf NZ', 'Draft', 1, NULL, NULL, datetime('2025-07-01 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_sarah', NULL, 0);

-- ============================================
-- 15. scope_variation (3)
-- ============================================
INSERT INTO scope_variation (id, variation_number, project_id, title, description, reason, price_impact, cost_impact, schedule_impact_days, status, requested_by_user_id, requested_at, customer_approver_contact_id, customer_approved_at, internal_approver_user_id, internal_approved_at, decision_notes, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('sv_001', 'V-001', 'proj_001', 'Extra infill measured on site', 'Site measure showed 50m2 additional infill required', 'Measure difference', 400.00, 150.00, 2, 'Approved', 'usr_sarah', datetime('2025-07-20 09:00:00'), 'con_principal', datetime('2025-07-22 10:00:00'), 'usr_emma', datetime('2025-07-22 11:00:00'), 'Customer approved extra infill cost', datetime('2025-07-20 09:00:00'), datetime('2025-07-22 11:00:00'), 'usr_sarah', NULL, 0),
  ('sv_002', 'V-002', 'proj_002', 'Ferry surcharge increase', 'Waiheke ferry rates increased after quote issued', 'Site condition', -500.00, -200.00, 0, 'Submitted', 'usr_sarah', datetime('2025-07-10 09:00:00'), 'con_waiheke', NULL, NULL, NULL, 'Awaiting customer approval', datetime('2025-07-10 09:00:00'), datetime('2025-07-10 09:00:00'), 'usr_sarah', NULL, 0),
  ('sv_003', 'V-003', 'proj_004', 'Design change - additional play area', 'Customer requested additional 50m2 soft fall area', 'Design change', 2900.00, 1450.00, 3, 'Draft', 'usr_sarah', datetime('2025-07-05 09:00:00'), NULL, NULL, NULL, NULL, 'Draft variation for review', datetime('2025-07-05 09:00:00'), datetime('2025-07-05 09:00:00'), 'usr_sarah', NULL, 0);

-- ============================================
-- 16. schedule_entry (8)
-- ============================================
INSERT INTO schedule_entry (id, project_id, opportunity_id, title, entry_type, start_at, end_at, assigned_user_id, department_id, status, location_note, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('sch_001', 'proj_001', NULL, 'Pre-construction site measure', 'Site measure', '2025-06-25 09:00:00', '2025-06-25 11:00:00', 'usr_liam', 'dep_sales', 'Done', 'Meet at gate with caretaker', datetime('2025-06-20 09:00:00'), datetime('2025-06-25 11:00:00'), 'usr_liam', NULL, 0),
  ('sch_002', 'proj_001', NULL, 'Base course delivery', 'Delivery', '2025-07-07 07:00:00', '2025-07-07 08:00:00', 'usr_mike', 'dep_operations', 'Done', 'Drop at rear gate', datetime('2025-07-01 09:00:00'), datetime('2025-07-07 08:00:00'), 'usr_mike', NULL, 0),
  ('sch_003', 'proj_001', NULL, 'Turf installation', 'Install', '2025-07-08 07:00:00', '2025-07-25 15:00:00', 'usr_sarah', 'dep_production', 'Done', 'Crew of 4 on site', datetime('2025-07-01 09:00:00'), datetime('2025-07-25 15:00:00'), 'usr_sarah', NULL, 0),
  ('sch_004', 'proj_001', NULL, 'Handover walkthrough', 'Handover', '2025-07-28 10:00:00', '2025-07-28 11:00:00', 'usr_sarah', 'dep_production', 'Planned', 'Principal to attend', datetime('2025-07-20 09:00:00'), datetime('2025-07-20 09:00:00'), 'usr_sarah', NULL, 0),
  ('sch_005', NULL, 'opp_002', 'Pre-sale site measure', 'Site measure', '2025-05-15 10:00:00', '2025-05-15 12:00:00', 'usr_liam', 'dep_sales', 'Done', 'Council officer to escort', datetime('2025-05-10 09:00:00'), datetime('2025-05-15 12:00:00'), 'usr_liam', NULL, 0),
  ('sch_006', NULL, 'opp_007', 'Waiheke site measure', 'Site measure', '2025-04-28 08:00:00', '2025-04-28 11:00:00', 'usr_liam', 'dep_sales', 'Done', '7am ferry from Downtown', datetime('2025-04-25 09:00:00'), datetime('2025-04-28 11:00:00'), 'usr_liam', NULL, 0),
  ('sch_007', 'proj_004', NULL, 'Scope confirmation site visit', 'Site measure', '2025-06-20 10:00:00', '2025-06-20 12:00:00', 'usr_liam', 'dep_sales', 'Done', 'Meet centre director', datetime('2025-06-15 09:00:00'), datetime('2025-06-20 12:00:00'), 'usr_liam', NULL, 0),
  ('sch_008', 'proj_002', NULL, 'Waiheke delivery scheduling', 'Delivery', '2025-07-20 07:00:00', '2025-07-20 15:00:00', 'usr_mike', 'dep_operations', 'Planned', 'Deposits must be paid first', datetime('2025-07-01 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_mike', NULL, 0);

-- ============================================
-- 17. site_visit (6)
-- ============================================
INSERT INTO site_visit (id, project_id, opportunity_id, visit_type, visited_at, visited_by_user_id, summary, weather, issues_found, next_actions, schedule_entry_id, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('sv_visit_001', NULL, 'opp_001', 'Measure', '2025-06-25 10:00:00', 'usr_liam', 'Measured main playing field 1200m2. Soil condition good. Drainage adequate.', 'Sunny', 0, 'Prepare quote for 1200m2 sport turf', 'sch_001', datetime('2025-06-25 11:00:00'), datetime('2025-06-25 11:00:00'), 'usr_liam', NULL, 0),
  ('sv_visit_002', 'proj_001', NULL, 'Progress', '2025-07-15 10:00:00', 'usr_sarah', 'Base course laid and compacted. Turf delivery scheduled for tomorrow.', 'Cloudy', 0, 'Proceed with turf installation', NULL, datetime('2025-07-15 11:00:00'), datetime('2025-07-15 11:00:00'), 'usr_sarah', NULL, 0),
  ('sv_visit_003', 'proj_001', NULL, 'Progress', '2025-07-22 10:00:00', 'usr_sarah', 'Turf installation 80% complete. Infill measurement shows 50m2 additional needed.', 'Sunny', 1, 'Issue variation for additional infill', NULL, datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), 'usr_sarah', NULL, 0),
  ('sv_visit_004', NULL, 'opp_007', 'Measure', '2025-04-28 09:00:00', 'usr_liam', 'Waiheke estate lawn measured 1200m2. Ferry access confirmed for delivery.', 'Windy', 0, 'Prepare quote including ferry freight', 'sch_006', datetime('2025-04-28 11:00:00'), datetime('2025-04-28 11:00:00'), 'usr_liam', NULL, 0),
  ('sv_visit_005', NULL, 'opp_006', 'Measure', '2025-06-20 11:00:00', 'usr_liam', 'Playground area measured 400m2. Soft fall safety surface required for childcare.', 'Overcast', 0, 'Prepare scope confirmation documents', 'sch_007', datetime('2025-06-20 12:00:00'), datetime('2025-06-20 12:00:00'), 'usr_liam', NULL, 0),
  ('sv_visit_006', 'proj_001', NULL, 'Handover', '2025-07-28 10:30:00', 'usr_sarah', 'Handover walkthrough completed with principal. All works signed off.', 'Sunny', 0, 'File handover pack documents', 'sch_004', datetime('2025-07-28 11:00:00'), datetime('2025-07-28 11:00:00'), 'usr_sarah', NULL, 0);

-- ============================================
-- 18. site_visit_photo (4)
-- ============================================
INSERT INTO site_visit_photo (id, site_visit_id, file_ref, caption, taken_at, sort_order, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('svp_001', 'sv_visit_001', 'photos/ns_field_before_01.jpg', 'Main field before work - bare soil', datetime('2025-06-25 10:30:00'), 1, datetime('2025-06-25 11:00:00'), datetime('2025-06-25 11:00:00'), 'usr_liam', NULL, 0),
  ('svp_002', 'sv_visit_003', 'photos/ns_field_infill_01.jpg', 'Infill measurement - additional area marked', datetime('2025-07-22 10:30:00'), 1, datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), 'usr_sarah', NULL, 0),
  ('svp_003', 'sv_visit_006', 'photos/ns_field_handover_01.jpg', 'Completed field at handover', datetime('2025-07-28 10:45:00'), 1, datetime('2025-07-28 11:00:00'), datetime('2025-07-28 11:00:00'), 'usr_sarah', NULL, 0),
  ('svp_004', 'sv_visit_004', 'photos/waiheke_lawn_01.jpg', 'Waiheke estate lawn before renovation', datetime('2025-04-28 09:30:00'), 1, datetime('2025-04-28 11:00:00'), datetime('2025-04-28 11:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 19. task (8 with sub-tasks)
-- ============================================
INSERT INTO task (id, title, description, project_id, opportunity_id, parent_task_id, stage_id, assigned_user_id, department_id, status, priority, due_date, completed_at, estimate_hours, sort_order, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('task_001', 'Prepare base course', 'Excavate and lay MOTYPE base for school field', 'proj_001', NULL, NULL, NULL, 'usr_sarah', 'dep_production', 'Done', 'High', '2025-07-07', datetime('2025-07-07 08:00:00'), 24.0, 1, datetime('2025-07-01 08:00:00'), datetime('2025-07-07 08:00:00'), 'usr_sarah', NULL, 0),
  ('task_002', 'Lay sport turf', 'Install 40mm sport turf on prepared base', 'proj_001', NULL, NULL, NULL, 'usr_sarah', 'dep_production', 'Done', 'High', '2025-07-25', datetime('2025-07-25 15:00:00'), 40.0, 2, datetime('2025-07-01 08:00:00'), datetime('2025-07-25 15:00:00'), 'usr_sarah', NULL, 0),
  ('task_003', 'Apply infill', 'Brush in silica sand infill', 'proj_001', NULL, 'task_002', NULL, 'usr_sarah', 'dep_production', 'Done', 'Normal', '2025-07-25', datetime('2025-07-25 14:00:00'), 8.0, 3, datetime('2025-07-01 08:00:00'), datetime('2025-07-25 14:00:00'), 'usr_sarah', NULL, 0),
  ('task_004', 'Handover documentation', 'Prepare handover pack and completion certificate', 'proj_001', NULL, NULL, NULL, 'usr_sarah', 'dep_production', 'Not started', 'Normal', '2025-07-31', NULL, 4.0, 4, datetime('2025-07-01 08:00:00'), datetime('2025-07-01 08:00:00'), 'usr_sarah', NULL, 0),
  ('task_005', 'Prepare Waiheke quote', 'Prepare final quote for Waiheke estate lawn', NULL, 'opp_007', NULL, NULL, 'usr_liam', 'dep_sales', 'Done', 'High', '2025-05-01', datetime('2025-05-01 09:00:00'), 2.0, 1, datetime('2025-04-28 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_liam', NULL, 0),
  ('task_006', 'Follow up council quote', 'Follow up on sports ground renewal quote', NULL, 'opp_002', NULL, NULL, 'usr_liam', 'dep_sales', 'In progress', 'Normal', '2025-06-15', NULL, 1.0, 1, datetime('2025-05-20 09:00:00'), datetime('2025-05-20 09:00:00'), 'usr_liam', NULL, 0),
  ('task_007', 'Green Valley scope docs', 'Prepare scope confirmation documents for childcare', 'proj_004', NULL, NULL, NULL, 'usr_liam', 'dep_sales', 'Not started', 'Normal', '2025-07-10', NULL, 2.0, 1, datetime('2025-07-01 08:00:00'), datetime('2025-07-01 08:00:00'), 'usr_liam', NULL, 0),
  ('task_008', 'Example sub-task', 'Example sub-task under task_001', 'proj_001', NULL, 'task_001', NULL, 'usr_sarah', 'dep_production', 'Done', 'Low', '2025-07-07', datetime('2025-07-07 08:00:00'), 1.0, 1, datetime('2025-07-07 08:00:00'), datetime('2025-07-07 08:00:00'), 'usr_sarah', NULL, 0);

-- ============================================
-- 20. document (8)
-- ============================================
INSERT INTO document (id, name, doc_type, storage_ref, mime_type, size_bytes, version, satisfies_stage_id, requires_signature, signed_at, signed_by, uploaded_by_user_id, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('doc_001', 'North School Contract.pdf', 'Contract', 'sharepoint/contracts/ns_contract.pdf', 'application/pdf', 245760, 1, NULL, 1, datetime('2025-07-05 14:00:00'), 'Joanne Williams', 'usr_liam', datetime('2025-07-05 14:00:00'), datetime('2025-07-05 14:00:00'), 'usr_liam', NULL, 0),
  ('doc_002', 'Waiheke Quote PDF.pdf', 'Quote PDF', 'sharepoint/quotes/q_007.pdf', 'application/pdf', 189450, 1, NULL, 0, NULL, NULL, 'usr_liam', datetime('2025-05-01 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_liam', NULL, 0),
  ('doc_003', 'Handover Pack.pdf', 'Handover pack', 'sharepoint/handover/ns_handover.pdf', 'application/pdf', 312000, 1, NULL, 0, NULL, NULL, 'usr_sarah', datetime('2025-07-28 11:00:00'), datetime('2025-07-28 11:00:00'), 'usr_sarah', NULL, 0),
  ('doc_004', 'Site Plan.dwg', 'Drawing / plan', 'sharepoint/drawings/ns_site_plan.dwg', 'application/acad', 1024000, 2, NULL, 0, NULL, NULL, 'usr_liam', datetime('2025-05-10 09:00:00'), datetime('2025-06-01 10:00:00'), 'usr_liam', NULL, 0),
  ('doc_005', 'Council Variation Form.pdf', 'Variation form', 'sharepoint/variations/sv_001.pdf', 'application/pdf', 95600, 1, NULL, 1, datetime('2025-07-22 11:00:00'), 'Joanne Williams', 'usr_sarah', datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), 'usr_sarah', NULL, 0),
  ('doc_006', 'Practical Completion Certificate.pdf', 'Practical completion certificate', 'sharepoint/certs/pc_001.pdf', 'application/pdf', 156800, 1, NULL, 1, NULL, NULL, 'usr_sarah', datetime('2025-07-28 11:00:00'), datetime('2025-07-28 11:00:00'), 'usr_sarah', NULL, 0),
  ('doc_007', 'Wilson Quote PDF.pdf', 'Quote PDF', 'sharepoint/quotes/q_010.pdf', 'application/pdf', 156400, 1, NULL, 0, NULL, NULL, 'usr_liam', datetime('2025-03-28 10:00:00'), datetime('2025-03-28 10:00:00'), 'usr_liam', NULL, 0),
  ('doc_008', 'Warranty Card.pdf', 'Warranty', 'sharepoint/warranty/ns_warranty.pdf', 'application/pdf', 87600, 1, NULL, 0, NULL, NULL, 'usr_sarah', datetime('2025-07-28 11:00:00'), datetime('2025-07-28 11:00:00'), 'usr_sarah', NULL, 0);

-- ============================================
-- 21. document_link (8)
-- ============================================
INSERT INTO document_link (id, document_id, entity_type, entity_id, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('dl_001', 'doc_001', 'sale', 'sale_001', datetime('2025-07-05 14:00:00'), datetime('2025-07-05 14:00:00'), 'usr_liam', NULL, 0),
  ('dl_002', 'doc_002', 'quote', 'q_007', datetime('2025-05-01 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_liam', NULL, 0),
  ('dl_003', 'doc_003', 'project', 'proj_001', datetime('2025-07-28 11:00:00'), datetime('2025-07-28 11:00:00'), 'usr_sarah', NULL, 0),
  ('dl_004', 'doc_004', 'project', 'proj_001', datetime('2025-05-10 09:00:00'), datetime('2025-06-01 10:00:00'), 'usr_liam', NULL, 0),
  ('dl_005', 'doc_005', 'scope_variation', 'sv_001', datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), 'usr_sarah', NULL, 0),
  ('dl_006', 'doc_006', 'project', 'proj_001', datetime('2025-07-28 11:00:00'), datetime('2025-07-28 11:00:00'), 'usr_sarah', NULL, 0),
  ('dl_007', 'doc_007', 'quote', 'q_010', datetime('2025-03-28 10:00:00'), datetime('2025-03-28 10:00:00'), 'usr_liam', NULL, 0),
  ('dl_008', 'doc_008', 'project', 'proj_001', datetime('2025-07-28 11:00:00'), datetime('2025-07-28 11:00:00'), 'usr_sarah', NULL, 0);

-- ============================================
-- 22. meeting (4)
-- ============================================
INSERT INTO meeting (id, title, project_id, opportunity_id, start_at, end_at, location, agenda, summary, decisions, organiser_user_id, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('mtg_001', 'North School kickoff', 'proj_001', NULL, '2025-07-02 10:00:00', '2025-07-02 11:00:00', 'Site office, North Shore Primary', 'Introduce crew, confirm access, review timeline', 'Kickoff meeting held. Site access confirmed via rear gate. Work to start Monday.', 'Crew start date: 7 July. Principal to be on site for handover.', 'usr_sarah', datetime('2025-07-02 11:00:00'), datetime('2025-07-02 11:00:00'), 'usr_sarah', NULL, 0),
  ('mtg_002', 'Waiheke quote review', NULL, 'opp_007', '2025-04-30 14:00:00', '2025-04-30 15:00:00', 'Phone', 'Review quote including ferry delivery', 'Customer accepts quote with ferry surcharge.', 'Quote accepted. Sale created.', 'usr_liam', datetime('2025-04-30 15:00:00'), datetime('2025-04-30 15:00:00'), 'usr_liam', NULL, 0),
  ('mtg_003', 'Council follow-up', NULL, 'opp_002', '2025-06-05 11:00:00', '2025-06-05 12:00:00', 'Council chambers', 'Discuss quote and timeline', 'Council needs budget approval before proceeding.', 'Quote on hold pending council budget.', 'usr_liam', datetime('2025-06-05 12:00:00'), datetime('2025-06-05 12:00:00'), 'usr_liam', NULL, 0),
  ('mtg_004', 'Green Valley scope meeting', 'proj_004', NULL, '2025-07-08 14:00:00', '2025-07-08 15:00:00', 'Green Valley Childcare centre', 'Review scope and safety requirements', 'Scope confirmed. Customer to sign off by end of week.', 'Scope sign-off expected Friday.', 'usr_liam', datetime('2025-07-08 15:00:00'), datetime('2025-07-08 15:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 23. meeting_attendee (8)
-- ============================================
INSERT INTO meeting_attendee (id, meeting_id, user_id, contact_id, attendance, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('ma_001', 'mtg_001', 'usr_sarah', NULL, 'Attended', datetime('2025-07-02 11:00:00'), datetime('2025-07-02 11:00:00'), 'usr_sarah', NULL, 0),
  ('ma_002', 'mtg_001', NULL, 'con_principal', 'Attended', datetime('2025-07-02 11:00:00'), datetime('2025-07-02 11:00:00'), 'usr_sarah', NULL, 0),
  ('ma_003', 'mtg_001', NULL, 'con_caretaker', 'Apologies', datetime('2025-07-02 11:00:00'), datetime('2025-07-02 11:00:00'), 'usr_sarah', NULL, 0),
  ('ma_004', 'mtg_002', 'usr_liam', NULL, 'Attended', datetime('2025-04-30 15:00:00'), datetime('2025-04-30 15:00:00'), 'usr_liam', NULL, 0),
  ('ma_005', 'mtg_002', NULL, 'con_waiheke', 'Attended', datetime('2025-04-30 15:00:00'), datetime('2025-04-30 15:00:00'), 'usr_liam', NULL, 0),
  ('ma_006', 'mtg_003', 'usr_liam', NULL, 'Attended', datetime('2025-06-05 12:00:00'), datetime('2025-06-05 12:00:00'), 'usr_liam', NULL, 0),
  ('ma_007', 'mtg_004', 'usr_liam', NULL, 'Attended', datetime('2025-07-08 15:00:00'), datetime('2025-07-08 15:00:00'), 'usr_liam', NULL, 0),
  ('ma_008', 'mtg_004', NULL, 'con_childcare', 'Attended', datetime('2025-07-08 15:00:00'), datetime('2025-07-08 15:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 24. invoice (8) -- subtotal/tax_amount/total/paid_amount/balance omitted (Calc/Rollup)
-- ============================================
INSERT INTO invoice (id, invoice_number, sale_id, project_id, account_id, invoice_type, issue_date, due_date, status, external_ref, sent_at, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('inv_001', 'INV-0001', 'sale_001', 'proj_001', 'acc_northshore', 'Deposit', '2025-07-05', '2025-07-20', 'Paid', 'XERO-1001', datetime('2025-07-05 14:00:00'), datetime('2025-07-05 14:00:00'), datetime('2025-07-05 14:00:00'), 'usr_liam', NULL, 0),
  ('inv_002', 'INV-0002', 'sale_001', 'proj_001', 'acc_northshore', 'Progress', '2025-08-01', '2025-08-15', 'Sent', 'XERO-1002', datetime('2025-08-01 09:00:00'), datetime('2025-08-01 09:00:00'), datetime('2025-08-01 09:00:00'), 'usr_liam', NULL, 0),
  ('inv_003', 'INV-0003', 'sale_001', 'proj_001', 'acc_northshore', 'Final', NULL, NULL, 'Draft', NULL, NULL, datetime('2025-08-01 09:00:00'), datetime('2025-08-01 09:00:00'), 'usr_liam', NULL, 0),
  ('inv_004', 'INV-0004', 'sale_002', NULL, 'acc_fletcher', 'Cash sale', '2025-05-20', '2025-05-20', 'Paid', 'XERO-1003', datetime('2025-05-20 11:00:00'), datetime('2025-05-20 11:00:00'), datetime('2025-05-20 11:00:00'), 'usr_liam', NULL, 0),
  ('inv_005', 'INV-0005', 'sale_003', NULL, 'acc_wilson', 'Cash sale', '2025-04-15', '2025-04-15', 'Paid', 'XERO-1004', datetime('2025-04-15 11:00:00'), datetime('2025-04-15 11:00:00'), datetime('2025-04-15 11:00:00'), 'usr_liam', NULL, 0),
  ('inv_006', 'INV-0006', 'sale_004', 'proj_002', 'acc_waiheke', 'Deposit', '2025-06-12', '2025-07-10', 'Sent', 'XERO-1005', datetime('2025-06-12 11:00:00'), datetime('2025-06-12 11:00:00'), datetime('2025-06-12 11:00:00'), 'usr_liam', NULL, 0),
  ('inv_007', 'INV-0007', 'sale_001', 'proj_001', 'acc_northshore', 'Variation', '2025-07-22', '2025-08-05', 'Sent', 'XERO-1006', datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), 'usr_sarah', NULL, 0),
  ('inv_008', 'INV-0008', 'sale_004', 'proj_002', 'acc_waiheke', 'Progress', NULL, NULL, 'Draft', NULL, NULL, datetime('2025-07-01 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 25. invoice_line (~8) -- line_total omitted (Calc field)
-- ============================================
INSERT INTO invoice_line (id, invoice_id, product_id, description, quantity, unit_price, sort_order, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('il_001', 'inv_001', 'prod_elite', 'Deposit - turf materials', 1.00, 25000.00, 1, datetime('2025-07-05 14:00:00'), datetime('2025-07-05 14:00:00'), 'usr_liam', NULL, 0),
  ('il_002', 'inv_002', 'prod_landscape', 'Progress invoice - turf install', 1.00, 50000.00, 1, datetime('2025-08-01 09:00:00'), datetime('2025-08-01 09:00:00'), 'usr_liam', NULL, 0),
  ('il_003', 'inv_003', 'prod_elite', 'Final invoice - project completion', 1.00, 20000.00, 1, datetime('2025-08-01 09:00:00'), datetime('2025-08-01 09:00:00'), 'usr_liam', NULL, 0),
  ('il_004', 'inv_004', 'prod_landscape', 'Cash sale - full amount', 1.00, 20700.00, 1, datetime('2025-05-20 11:00:00'), datetime('2025-05-20 11:00:00'), 'usr_liam', NULL, 0),
  ('il_005', 'inv_005', 'prod_elite', 'Cash sale - with discount', 1.00, 13800.00, 1, datetime('2025-04-15 11:00:00'), datetime('2025-04-15 11:00:00'), 'usr_liam', NULL, 0),
  ('il_006', 'inv_006', 'prod_elite', 'Waiheke deposit', 1.00, 15000.00, 1, datetime('2025-06-12 11:00:00'), datetime('2025-06-12 11:00:00'), 'usr_liam', NULL, 0),
  ('il_007', 'inv_007', 'prod_infill', 'Variation - extra infill', 1.00, 400.00, 1, datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), 'usr_sarah', NULL, 0),
  ('il_008', 'inv_008', 'prod_landscape', 'Waiheke progress (draft)', 1.00, 50000.00, 1, datetime('2025-07-01 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 26. payment (6)
-- ============================================
INSERT INTO payment (id, invoice_id, amount, paid_on, method, reference, received_by_user_id, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('pay_001', 'inv_001', 25000.00, '2025-07-15', 'Bank transfer', 'INV-0001 deposit', 'usr_liam', datetime('2025-07-15 10:00:00'), datetime('2025-07-15 10:00:00'), 'usr_liam', NULL, 0),
  ('pay_002', 'inv_004', 20700.00, '2025-05-20', 'Bank transfer', 'Cash sale payment', 'usr_liam', datetime('2025-05-20 11:00:00'), datetime('2025-05-20 11:00:00'), 'usr_liam', NULL, 0),
  ('pay_003', 'inv_005', 13800.00, '2025-04-15', 'Bank transfer', 'Wilson cash sale', 'usr_liam', datetime('2025-04-15 11:00:00'), datetime('2025-04-15 11:00:00'), 'usr_liam', NULL, 0),
  ('pay_004', 'inv_001', 0.00, '2025-07-15', 'Bank transfer', 'Duplicate - voided', 'usr_liam', datetime('2025-07-15 10:00:00'), datetime('2025-07-15 10:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 27. activity (10)
-- ============================================
INSERT INTO activity (id, activity_type, subject, body, direction, occurred_at, contact_id, from_address, to_addresses, external_message_id, meeting_id, site_visit_id, task_id, is_decision, logged_by_user_id, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('act_001', 'Email', 'Quote accepted - North School', 'Customer has accepted quote Q-0001-v1. Deposit invoice to be issued.', 'Inbound', '2025-06-20 10:30:00', 'con_principal', 'jo.williams@northshore.school.nz', 'liam.wilson@tigerturf.co.nz', 'MSG-0001', NULL, NULL, NULL, 0, 'usr_liam', datetime('2025-06-20 10:30:00'), datetime('2025-06-20 10:30:00'), 'usr_liam', NULL, 0),
  ('act_002', 'Call', 'Follow up council quote', 'Spoke with Rachel Nichols. Council needs budget approval.', 'Outbound', '2025-06-05 10:00:00', 'con_council', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'usr_liam', datetime('2025-06-05 10:00:00'), datetime('2025-06-05 10:00:00'), 'usr_liam', NULL, 0),
  ('act_003', 'Site note', 'School field measure complete', '1200m2 measured. Ready to quote.', 'Internal', '2025-06-25 11:00:00', NULL, NULL, NULL, NULL, NULL, 'sv_visit_001', NULL, 0, 'usr_liam', datetime('2025-06-25 11:00:00'), datetime('2025-06-25 11:00:00'), 'usr_liam', NULL, 0),
  ('act_004', 'Decision', 'Deposit amount agreed', 'Customer agreed to $25,000 deposit for school project.', 'Internal', '2025-07-05 14:00:00', 'con_principal', NULL, NULL, NULL, 'mtg_001', NULL, NULL, 1, 'usr_sarah', datetime('2025-07-05 14:00:00'), datetime('2025-07-05 14:00:00'), 'usr_sarah', NULL, 0),
  ('act_005', 'Email', 'Waiheke quote sent', 'Quote Q-0007-v1 sent including ferry delivery.', 'Outbound', '2025-05-01 09:00:00', 'con_waiheke', 'liam.wilson@tigerturf.co.nz', 'michael.clark@waiheke.co.nz', 'MSG-0002', NULL, NULL, NULL, 0, 'usr_liam', datetime('2025-05-01 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_liam', NULL, 0),
  ('act_006', 'Teams message', 'Crew update', 'School field installation complete. Ready for handover.', 'Internal', '2025-07-25 15:30:00', NULL, NULL, NULL, 'TEAMS-0001', NULL, NULL, NULL, 0, 'usr_sarah', datetime('2025-07-25 15:30:00'), datetime('2025-07-25 15:30:00'), 'usr_sarah', NULL, 0),
  ('act_007', 'Call', 'Green Valley follow-up', 'Left message with centre director about scope docs.', 'Outbound', '2025-07-10 09:00:00', 'con_childcare', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'usr_liam', datetime('2025-07-10 09:00:00'), datetime('2025-07-10 09:00:00'), 'usr_liam', NULL, 0),
  ('act_008', 'Site note', 'Extra infill identified', '50m2 additional infill needed after measurement.', 'Internal', '2025-07-22 11:00:00', NULL, NULL, NULL, NULL, NULL, 'sv_visit_003', NULL, 0, 'usr_sarah', datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), 'usr_sarah', NULL, 0),
  ('act_009', 'Email', 'Quote rejected - council', 'Council chose alternative supplier.', 'Inbound', '2025-06-15 14:00:00', 'con_council', 'rachel.nichols@aucklandcouncil.govt.nz', 'liam.wilson@tigerturf.co.nz', 'MSG-0003', NULL, NULL, NULL, 0, 'usr_liam', datetime('2025-06-15 14:00:00'), datetime('2025-06-15 14:00:00'), 'usr_liam', NULL, 0),
  ('act_010', 'Meeting note', 'Waiheke quote review', 'Customer accepted quote with ferry surcharge.', 'Internal', '2025-04-30 15:00:00', NULL, NULL, NULL, NULL, 'mtg_002', NULL, NULL, 0, 'usr_liam', datetime('2025-04-30 15:00:00'), datetime('2025-04-30 15:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 28. activity_link (10)
-- ============================================
INSERT INTO activity_link (id, activity_id, entity_type, entity_id, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('al_001', 'act_001', 'opportunity', 'opp_001', datetime('2025-06-20 10:30:00'), datetime('2025-06-20 10:30:00'), 'usr_liam', NULL, 0),
  ('al_002', 'act_001', 'sale', 'sale_001', datetime('2025-06-20 10:30:00'), datetime('2025-06-20 10:30:00'), 'usr_liam', NULL, 0),
  ('al_003', 'act_002', 'opportunity', 'opp_002', datetime('2025-06-05 10:00:00'), datetime('2025-06-05 10:00:00'), 'usr_liam', NULL, 0),
  ('al_004', 'act_003', 'opportunity', 'opp_001', datetime('2025-06-25 11:00:00'), datetime('2025-06-25 11:00:00'), 'usr_liam', NULL, 0),
  ('al_005', 'act_004', 'sale', 'sale_001', datetime('2025-07-05 14:00:00'), datetime('2025-07-05 14:00:00'), 'usr_sarah', NULL, 0),
  ('al_006', 'act_005', 'opportunity', 'opp_007', datetime('2025-05-01 09:00:00'), datetime('2025-05-01 09:00:00'), 'usr_liam', NULL, 0),
  ('al_007', 'act_006', 'project', 'proj_001', datetime('2025-07-25 15:30:00'), datetime('2025-07-25 15:30:00'), 'usr_sarah', NULL, 0),
  ('al_008', 'act_007', 'opportunity', 'opp_006', datetime('2025-07-10 09:00:00'), datetime('2025-07-10 09:00:00'), 'usr_liam', NULL, 0),
  ('al_009', 'act_008', 'project', 'proj_001', datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), 'usr_sarah', NULL, 0),
  ('al_010', 'act_010', 'opportunity', 'opp_007', datetime('2025-04-30 15:00:00'), datetime('2025-04-30 15:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 29. stage_definition (7)
-- ============================================
INSERT INTO stage_definition (id, code, name, sequence, owner_department_id, applies_to, exit_gate, sla_days, parallel_group, is_active, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('sd_1', 'INQUIRY', 'Inquiry', 1, 'dep_sales', 'Both sale types', 'Lead qualified and converted to an opportunity with a site address and primary contact.', 5, 1, 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sd_2', 'QUOTING', 'Quoting', 2, 'dep_sales', 'Both sale types', 'Quote sent and accepted by the customer. Acceptance creates the sale, and for Project sales the project.', 10, 1, 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sd_3', 'SCOPE', 'Scope confirmation', 3, 'dep_sales', 'Project sales only', 'Site measure done, cost estimate approved, scope signed off by the customer.', 10, 1, 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sd_4', 'CONTRACT', 'Contract', 4, 'dep_sales', 'Project sales only', 'Contract document signed and filed.', 5, 1, 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sd_5', 'DEPOSIT', 'Deposit', 5, 'dep_operations', 'Project sales only', 'Deposit invoice issued and paid in full.', 10, 1, 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sd_6', 'HANDOVER', 'Handover', 6, 'dep_production', 'Project sales only', 'Install complete, handover walkthrough done, handover pack filed.', 5, 1, 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sd_7', 'COMPLETION', 'Practical completion', 7, 'dep_production', 'Project sales only', 'Defects closed, completion certificate signed, final invoice issued.', 10, 1, 1, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0);

-- ============================================
-- 30. stage_requirement (~10)
-- ============================================
INSERT INTO stage_requirement (id, stage_id, requirement_type, doc_type, description, is_blocking, rule_key, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('sr_1', 'sd_1', 'Task', NULL, 'Lead qualified and converted', 1, 'lead_converted', datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sr_2', 'sd_2', 'Document', 'Quote PDF', 'Quote accepted by customer', 1, 'quote_accepted', datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sr_3', 'sd_3', 'Site visit', NULL, 'Site measure completed', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sr_4', 'sd_3', 'Approval', NULL, 'Cost estimate approved', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sr_5', 'sd_4', 'Document', 'Contract', 'Contract document signed', 1, 'contract_signed', datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sr_6', 'sd_5', 'Payment', NULL, 'Deposit invoice paid in full', 1, 'deposit_paid', datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sr_7', 'sd_6', 'Site visit', NULL, 'Handover walkthrough completed', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sr_8', 'sd_6', 'Document', 'Handover pack', 'Handover pack document uploaded', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sr_9', 'sd_7', 'Document', 'Practical completion certificate', 'Completion certificate signed', 1, 'pc_signed', datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0),
  ('sr_10', 'sd_7', 'Task', NULL, 'No open defect tasks', 1, NULL, datetime('2025-01-01 08:00:00'), datetime('2025-01-01 08:00:00'), 'usr_ava', NULL, 0);

-- ============================================
-- 31. stage_instance (~14)
-- ============================================
INSERT INTO stage_instance (id, opportunity_id, project_id, stage_id, status, entered_at, completed_at, completed_by_user_id, hold_reason, override_reason, notes, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('si_001', 'opp_001', 'proj_001', 'sd_1', 'Complete', '2025-05-05 14:00:00', '2025-05-05 14:00:00', 'usr_liam', NULL, NULL, 'Lead converted to opportunity', datetime('2025-05-05 14:00:00'), datetime('2025-05-05 14:00:00'), 'usr_liam', NULL, 0),
  ('si_002', 'opp_001', 'proj_001', 'sd_2', 'Complete', '2025-05-05 14:00:00', '2025-06-20 10:00:00', 'usr_liam', NULL, NULL, 'Quote accepted', datetime('2025-05-05 14:00:00'), datetime('2025-06-20 10:00:00'), 'usr_liam', NULL, 0),
  ('si_003', 'opp_001', 'proj_001', 'sd_3', 'Complete', '2025-06-20 10:00:00', '2025-07-02 10:00:00', 'usr_sarah', NULL, NULL, 'Scope confirmed at kickoff', datetime('2025-06-20 10:00:00'), datetime('2025-07-02 10:00:00'), 'usr_sarah', NULL, 0),
  ('si_004', 'opp_001', 'proj_001', 'sd_4', 'Complete', '2025-07-02 10:00:00', '2025-07-05 14:00:00', 'usr_sarah', NULL, NULL, 'Contract signed', datetime('2025-07-02 10:00:00'), datetime('2025-07-05 14:00:00'), 'usr_sarah', NULL, 0),
  ('si_005', 'opp_001', 'proj_001', 'sd_5', 'Complete', '2025-07-05 14:00:00', '2025-07-15 10:00:00', 'usr_liam', NULL, NULL, 'Deposit paid', datetime('2025-07-05 14:00:00'), datetime('2025-07-15 10:00:00'), 'usr_liam', NULL, 0),
  ('si_006', 'opp_001', 'proj_001', 'sd_6', 'Complete', '2025-07-15 10:00:00', '2025-07-28 10:30:00', 'usr_sarah', NULL, NULL, 'Handover done', datetime('2025-07-15 10:00:00'), datetime('2025-07-28 10:30:00'), 'usr_sarah', NULL, 0),
  ('si_007', 'opp_001', 'proj_001', 'sd_7', 'Active', '2025-07-28 10:30:00', NULL, NULL, NULL, NULL, 'Practical completion in progress', datetime('2025-07-28 10:30:00'), datetime('2025-07-28 10:30:00'), 'usr_sarah', NULL, 0),
  ('si_008', 'opp_007', 'proj_002', 'sd_1', 'Complete', '2025-04-25 11:00:00', '2025-04-25 11:00:00', 'usr_liam', NULL, NULL, 'Lead converted', datetime('2025-04-25 11:00:00'), datetime('2025-04-25 11:00:00'), 'usr_liam', NULL, 0),
  ('si_009', 'opp_007', 'proj_002', 'sd_2', 'Complete', '2025-04-25 11:00:00', '2025-06-10 09:00:00', 'usr_liam', NULL, NULL, 'Quote accepted', datetime('2025-04-25 11:00:00'), datetime('2025-06-10 09:00:00'), 'usr_liam', NULL, 0),
  ('si_010', 'opp_007', 'proj_002', 'sd_3', 'Complete', '2025-06-10 09:00:00', '2025-07-01 09:00:00', 'usr_sarah', NULL, NULL, 'Scope confirmed', datetime('2025-06-10 09:00:00'), datetime('2025-07-01 09:00:00'), 'usr_sarah', NULL, 0),
  ('si_011', 'opp_007', 'proj_002', 'sd_4', 'Complete', '2025-07-01 09:00:00', '2025-06-12 11:00:00', 'usr_sarah', NULL, NULL, 'Contract signed', datetime('2025-07-01 09:00:00'), datetime('2025-06-12 11:00:00'), 'usr_sarah', NULL, 0),
  ('si_012', 'opp_007', 'proj_002', 'sd_5', 'Active', '2025-06-12 11:00:00', NULL, NULL, NULL, NULL, 'Awaiting deposit payment', datetime('2025-06-12 11:00:00'), datetime('2025-06-12 11:00:00'), 'usr_sarah', NULL, 0),
  ('si_013', 'opp_004', 'proj_003', 'sd_1', 'Complete', '2025-03-10 09:00:00', '2025-03-10 09:00:00', 'usr_liam', NULL, NULL, 'Lead converted', datetime('2025-03-10 09:00:00'), datetime('2025-03-10 09:00:00'), 'usr_liam', NULL, 0),
  ('si_014', 'opp_004', 'proj_003', 'sd_2', 'On hold', '2025-03-15 11:00:00', NULL, NULL, 'Budget freeze', NULL, 'Quote sent, on hold', datetime('2025-03-15 11:00:00'), datetime('2025-03-15 11:00:00'), 'usr_liam', NULL, 0);

-- ============================================
-- 32. audit_log (~10)
-- ============================================
INSERT INTO audit_log (id, entity_type, entity_id, action, field_name, old_value, new_value, user_id, at, reason, created_at, updated_at, created_by, deleted_at, row_version) VALUES
  ('audit_001', 'opportunity', 'opp_001', 'Stage change', 'current_stage_id', NULL, 'sd_7', 'usr_sarah', datetime('2025-07-28 10:30:00'), NULL, datetime('2025-07-28 10:30:00'), datetime('2025-07-28 10:30:00'), 'usr_sarah', NULL, 0),
  ('audit_002', 'sale', 'sale_001', 'Update', 'status', 'Open', 'Completed', 'usr_liam', datetime('2025-07-28 11:00:00'), NULL, datetime('2025-07-28 11:00:00'), datetime('2025-07-28 11:00:00'), 'usr_sarah', NULL, 0),
  ('audit_003', 'quote', 'q_002', 'Update', 'status', 'Draft', 'Sent', 'usr_liam', datetime('2025-05-20 14:00:00'), NULL, datetime('2025-05-20 14:00:00'), datetime('2025-05-20 14:00:00'), 'usr_liam', NULL, 0),
  ('audit_004', 'invoice', 'inv_001', 'Update', 'status', 'Draft', 'Sent', 'usr_liam', datetime('2025-07-05 14:00:00'), NULL, datetime('2025-07-05 14:00:00'), datetime('2025-07-05 14:00:00'), 'usr_liam', NULL, 0),
  ('audit_005', 'scope_variation', 'sv_001', 'Update', 'status', 'Draft', 'Approved', 'usr_emma', datetime('2025-07-22 11:00:00'), NULL, datetime('2025-07-22 11:00:00'), datetime('2025-07-22 11:00:00'), 'usr_emma', NULL, 0),
  ('audit_006', 'project', 'proj_003', 'Update', 'status', 'Open', 'On hold', 'usr_liam', datetime('2025-03-15 11:00:00'), NULL, datetime('2025-03-15 11:00:00'), datetime('2025-03-15 11:00:00'), 'usr_liam', NULL, 0),
  ('audit_007', 'stage_instance', 'si_005', 'Update', 'status', 'Active', 'Complete', 'usr_liam', datetime('2025-07-15 10:00:00'), NULL, datetime('2025-07-15 10:00:00'), datetime('2025-07-15 10:00:00'), 'usr_liam', NULL, 0),
  ('audit_008', 'task', 'task_002', 'Update', 'status', 'Not started', 'Done', 'usr_sarah', datetime('2025-07-25 15:00:00'), NULL, datetime('2025-07-25 15:00:00'), datetime('2025-07-25 15:00:00'), 'usr_sarah', NULL, 0),
  ('audit_009', 'lead', 'lead_001', 'Stage change', 'status', 'New', 'Converted', 'usr_liam', datetime('2025-05-05 14:00:00'), NULL, datetime('2025-05-05 14:00:00'), datetime('2025-05-05 14:00:00'), 'usr_liam', NULL, 0),
  ('audit_010', 'user', 'usr_dan', 'Update', 'role', 'Sales rep', 'Read-only', 'usr_ava', datetime('2025-01-15 08:00:00'), NULL, datetime('2025-01-15 08:00:00'), datetime('2025-01-15 08:00:00'), 'usr_ava', NULL, 0);

-- End of seed.sql


