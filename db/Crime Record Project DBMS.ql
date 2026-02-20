-- 1. Locations: Supports "High-risk area" analysis
CREATE TABLE Locations (
    location_id SERIAL PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    zone VARCHAR(30),
    risk_level INT CHECK (risk_level BETWEEN 1 AND 10) -- Added for analytical value
);

-- 2. Offender: Supports "Repeat offender identification"
CREATE TABLE Offenders (
    offender_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT CHECK (age > 0),
    address TEXT,
    previous_crimes_count INT DEFAULT 0,
    fingerprint_hash TEXT -- More professional than raw data
);

-- 3. Crime: The central event table
CREATE TABLE Crimes (
    crime_id SERIAL PRIMARY KEY,
    crime_type VARCHAR(50) NOT NULL,
    occurrence_timestamp TIMESTAMP NOT NULL, -- Combined date/time for trend analysis
    description TEXT,
    location_id INT,
    FOREIGN KEY (location_id) REFERENCES Locations(location_id) ON DELETE SET NULL
);

-- 4. Crime_Offender: Junction table for Many-to-Many relationship
CREATE TABLE Crime_Offender_Mapping (
    crime_id INT,
    offender_id INT,
    role_in_crime VARCHAR(50), -- e.g., Primary, Accomplice
    PRIMARY KEY (crime_id, offender_id),
    FOREIGN KEY (crime_id) REFERENCES Crimes(crime_id) ON DELETE CASCADE,
    FOREIGN KEY (offender_id) REFERENCES Offenders(offender_id) ON DELETE CASCADE
);

-- 5. Police_Officer: Stores law enforcement data
CREATE TABLE Police_Officers (
    officer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    badge_number INT UNIQUE NOT NULL, -- Added unique constraint for data integrity
    rank VARCHAR(30),
    station VARCHAR(50)
);

-- 6. FIR: Links crimes to officers and tracks status
CREATE TABLE FIR_Records (
    fir_id SERIAL PRIMARY KEY,
    crime_id INT UNIQUE, -- One FIR per crime
    officer_id INT,
    fir_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) CHECK (status IN ('Open', 'Closed', 'Under Investigation')),
    FOREIGN KEY (crime_id) REFERENCES Crimes(crime_id),
    FOREIGN KEY (officer_id) REFERENCES Police_Officers(officer_id)
);
