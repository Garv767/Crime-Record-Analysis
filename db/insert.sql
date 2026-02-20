-- 1. Insert Locations (Including Lat/Long for your Map Visualization)
INSERT INTO public.locations (area_name, city, zone, risk_level, latitude, longitude) VALUES
('T. Nagar', 'Chennai', 'Central', 9, 13.0418, 80.2341),
('Adyar', 'Chennai', 'South', 3, 13.0012, 80.2565),
('Velachery', 'Chennai', 'South', 6, 12.9791, 80.2185),
('Anna Nagar', 'Chennai', 'North', 4, 13.0850, 80.2101),
('Mylapore', 'Chennai', 'Central', 5, 13.0333, 80.2667),
('Tambaram', 'Chennai', 'South', 8, 12.9229, 80.1275),
('Guindy', 'Chennai', 'South', 7, 13.0067, 80.2206),
('Nungambakkam', 'Chennai', 'Central', 4, 13.0583, 80.2389),
('Besant Nagar', 'Chennai', 'South', 2, 13.0003, 80.2667),
('Sowcarpet', 'Chennai', 'North', 8, 13.0975, 80.2801);

-- 2. Insert Offenders (For Repeat Offender Analysis)
INSERT INTO public.offenders (name, age, address, previous_crimes_count, fingerprint_hash) VALUES
('Vicky Dhanush', 24, 'Royapettah', 4, 'hash_v001'),
('Senthil Kumar', 31, 'Saidapet', 1, 'hash_s002'),
('Madan Gowri', 29, 'Unknown', 0, 'hash_m003'),
('Rajesh Koothrappali', 35, 'Triplicane', 2, 'hash_r004'),
('Karthik Subbaraj', 27, 'Kodambakkam', 0, 'hash_k005'),
('Vijay Sethu', 38, 'Perungudi', 5, 'hash_v006'),
('Simbu Mani', 22, 'Chetpet', 1, 'hash_s007'),
('Ajith Kumar', 42, 'Thiruvanmiyur', 0, 'hash_a008'),
('Surya Sivakumar', 33, 'Ekkattuthangal', 3, 'hash_s009'),
('Dhanush Kasthuri', 26, 'Aminjikarai', 1, 'hash_d010');

-- 3. Insert Victims
INSERT INTO public.victims (name, age, contact_no, address) VALUES
('Ramesh Babu', 45, '9840011223', 'T. Nagar'),
('Suresh Raina', 34, '9840044556', 'Adyar'),
('Priya Mani', 28, '9840077889', 'Velachery'),
('Anjali Devi', 22, '9840011122', 'Anna Nagar'),
('Babu Anthony', 55, '9840033344', 'Mylapore'),
('Chitra Visweswaran', 62, '9840055566', 'Tambaram'),
('Dinesh Karthik', 36, '9840077788', 'Guindy'),
('Esha Deol', 40, '9840099900', 'Nungambakkam'),
('Farhan Akhtar', 48, '9840022233', 'Besant Nagar'),
('Gautam Gambhir', 41, '9840044455', 'Sowcarpet');

-- 4. Insert Crimes (Pattern Data: Thefts in evening, Assaults in late night)
INSERT INTO public.crimes (crime_type, occurrence_timestamp, description, location_id, victim_id) VALUES
('Theft', '2026-02-10 18:30:00', 'Gold chain snatching', 1, 1),
('Assault', '2026-02-11 23:45:00', 'Physical brawl in market', 10, 10),
('Cybercrime', '2026-02-12 10:15:00', 'OTP fraud incident', 4, 4),
('Robbery', '2026-02-13 21:00:00', 'Armed robbery at grocery store', 6, 6),
('Vandalism', '2026-02-14 02:20:00', 'Public property damaged', 2, 2),
('Theft', '2026-02-15 19:10:00', 'Laptop stolen from car', 8, 8),
('Assault', '2026-02-16 22:00:00', 'Street fight outside pub', 3, 3),
('Theft', '2026-02-17 17:45:00', 'Mobile phone pickpocketing', 1, 1), -- Second crime in T.Nagar
('Burglary', '2026-02-18 03:00:00', 'House break-in', 5, 5),
('Fraud', '2026-02-19 14:30:00', 'Fake document verification', 7, 7);

-- 5. Insert Police Officers
INSERT INTO public.police_officers (name, badge_number, rank, station) VALUES
('Inspector Raghavan', 1001, 'Inspector', 'T. Nagar Police Station'),
('Sub-Inspector Anbu', 1002, 'Sub-Inspector', 'Adyar Police Station'),
('Inspector Vikram', 1003, 'Inspector', 'Velachery Police Station'),
('Constable Mani', 1004, 'Constable', 'Anna Nagar Police Station'),
('SI Vedha', 1005, 'Sub-Inspector', 'Mylapore Police Station'),
('Inspector Durai', 1006, 'Inspector', 'Tambaram Police Station'),
('Inspector Singam', 1007, 'Inspector', 'Guindy Police Station'),
('SI Arul', 1008, 'Sub-Inspector', 'Nungambakkam Police Station'),
('Constable Selvam', 1009, 'Constable', 'Besant Nagar Police Station'),
('Inspector Sethupathi', 1010, 'Inspector', 'Sowcarpet Police Station');

-- 6. Insert Crime-Offender Mapping (Vicky involved in two crimes)
INSERT INTO public.crime_offender (crime_id, offender_id, role_in_crime) VALUES
(1, 1, 'Primary'),
(2, 6, 'Primary'),
(3, 3, 'Accomplice'),
(4, 10, 'Primary'),
(5, 7, 'Primary'),
(6, 2, 'Primary'),
(7, 9, 'Primary'),
(8, 1, 'Primary'), -- Vicky Snatching again
(9, 4, 'Primary'),
(10, 5, 'Primary');

-- 7. Insert FIR Records
INSERT INTO public.fir_records (crime_id, officer_id, fir_date, status) VALUES
(1, 1, '2026-02-10', 'Under Investigation'),
(2, 10, '2026-02-11', 'Open'),
(3, 4, '2026-02-12', 'Closed'),
(4, 6, '2026-02-13', 'Under Investigation'),
(5, 2, '2026-02-14', 'Closed'),
(6, 8, '2026-02-15', 'Open'),
(7, 3, '2026-02-16', 'Under Investigation'),
(8, 1, '2026-02-17', 'Open'),
(9, 5, '2026-02-18', 'Under Investigation'),
(10, 7, '2026-02-19', 'Closed');