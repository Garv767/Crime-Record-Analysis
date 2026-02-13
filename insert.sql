INSERT INTO Locations (location_id, area_name, city, zone, risk_level) VALUES
(1, 'Anna Nagar', 'Chennai', 'North', 4),
(2, 'Tambaram', 'Chennai', 'South', 7);

INSERT INTO Offenders (offender_id, name, age, address, previous_crimes_count) VALUES
(201, 'Ravi Kumar', 28, 'Chennai', 2),
(202, 'Arjun Singh', 32, 'Tambaram', 1);

INSERT INTO Offenders (offender_id, name, age, address, previous_crimes_count) VALUES
(201, 'Ravi Kumar', 28, 'Chennai', 2),
(202, 'Arjun Singh', 32, 'Tambaram', 1);

INSERT INTO Crime_Offender (crime_id, offender_id, role_in_crime) VALUES
(101, 201, 'Primary'),
(102, 202, 'Primary');