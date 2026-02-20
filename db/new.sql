-- 1. DROP EXISTING TABLES (Reverse Order of Dependencies)
DROP TABLE IF EXISTS public.fir_records CASCADE;
DROP TABLE IF EXISTS public.crime_offender CASCADE;
DROP TABLE IF EXISTS public.crimes CASCADE;
DROP TABLE IF EXISTS public.victims CASCADE;
DROP TABLE IF EXISTS public.offenders CASCADE;
DROP TABLE IF EXISTS public.police_officers CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

-- 2. CREATE TABLES
CREATE TABLE public.locations (
    location_id SERIAL PRIMARY KEY,
    area_name VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    zone VARCHAR,
    risk_level INTEGER CHECK (risk_level >= 1 AND risk_level <= 10),
    latitude DECIMAL(9,6), -- Added for map visualization
    longitude DECIMAL(9,6) -- Added for map visualization
);

CREATE TABLE public.offenders (
    offender_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    age INTEGER CHECK (age > 0),
    address TEXT,
    previous_crimes_count INTEGER DEFAULT 0,
    fingerprint_hash TEXT
);

CREATE TABLE public.victims (
    victim_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    age INTEGER,
    contact_no VARCHAR,
    address TEXT
);

CREATE TABLE public.crimes (
    crime_id SERIAL PRIMARY KEY,
    crime_type VARCHAR NOT NULL,
    occurrence_timestamp TIMESTAMP NOT NULL,
    description TEXT,
    location_id INTEGER REFERENCES public.locations(location_id) ON DELETE SET NULL,
    victim_id INTEGER REFERENCES public.victims(victim_id) ON DELETE SET NULL
);

CREATE TABLE public.crime_offender (
    crime_id INTEGER REFERENCES public.crimes(crime_id) ON DELETE CASCADE,
    offender_id INTEGER REFERENCES public.offenders(offender_id) ON DELETE CASCADE,
    role_in_crime VARCHAR,
    PRIMARY KEY (crime_id, offender_id)
);

CREATE TABLE public.police_officers (
    officer_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    badge_number INTEGER UNIQUE NOT NULL,
    rank VARCHAR,
    station VARCHAR
);

CREATE TABLE public.fir_records (
    fir_id SERIAL PRIMARY KEY,
    crime_id INTEGER UNIQUE REFERENCES public.crimes(crime_id),
    officer_id INTEGER REFERENCES public.police_officers(officer_id),
    fir_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR CHECK (status IN ('Open', 'Closed', 'Under Investigation'))
);