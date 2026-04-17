-- Crime Record and Pattern Analysis (CRPA) - Database Schema
-- Last Updated: 2026-04-16
-- Description: Core DDL for law enforcement incident intelligence.

-- 1. DROP EXISTING TABLES (Reverse Order of Dependencies)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.fir_records CASCADE;
DROP TABLE IF EXISTS public.evidence CASCADE;
DROP TABLE IF EXISTS public.crime_offender CASCADE;
DROP TABLE IF EXISTS public.crimes CASCADE;
DROP TABLE IF EXISTS public.victims CASCADE;
DROP TABLE IF EXISTS public.offenders CASCADE;
DROP TABLE IF EXISTS public.police_officers CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

-- 2. CREATE TABLES

CREATE TABLE public.locations (
  location_id SERIAL PRIMARY KEY,
  area_name character varying NOT NULL,
  city character varying NOT NULL,
  zone character varying,
  risk_level integer CHECK (risk_level >= 1 AND risk_level <= 10),
  latitude numeric,
  longitude numeric
);

CREATE TABLE public.police_officers (
  officer_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  badge_number integer NOT NULL UNIQUE,
  rank character varying,
  station character varying
);

CREATE TABLE public.offenders (
  offender_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  age integer CHECK (age > 0),
  address text,
  previous_crimes_count integer DEFAULT 0,
  fingerprint_hash text
);

CREATE TABLE public.victims (
  victim_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  age integer,
  contact_no character varying,
  address text
);

CREATE TABLE public.crimes (
  crime_id SERIAL PRIMARY KEY,
  crime_type character varying NOT NULL,
  occurrence_timestamp timestamp without time zone NOT NULL,
  description text,
  location_id integer REFERENCES public.locations(location_id),
  victim_id integer REFERENCES public.victims(victim_id)
);

CREATE TABLE public.crime_offender (
  crime_id integer NOT NULL REFERENCES public.crimes(crime_id),
  offender_id integer NOT NULL REFERENCES public.offenders(offender_id),
  role_in_crime character varying,
  PRIMARY KEY (crime_id, offender_id)
);

CREATE TABLE public.evidence (
  evidence_id SERIAL PRIMARY KEY,
  crime_id integer NOT NULL REFERENCES public.crimes(crime_id),
  description text NOT NULL,
  collected_by integer REFERENCES public.police_officers(officer_id),
  collection_date date DEFAULT CURRENT_DATE,
  status character varying CHECK (status::text = ANY (ARRAY['Logged'::character varying, 'In Lab'::character varying, 'Processed'::character varying, 'Archived'::character varying]::text[]))
);

CREATE TABLE public.fir_records (
  fir_id SERIAL PRIMARY KEY,
  crime_id integer UNIQUE REFERENCES public.crimes(crime_id),
  officer_id integer REFERENCES public.police_officers(officer_id),
  fir_date date DEFAULT CURRENT_DATE,
  status character varying CHECK (status::text = ANY (ARRAY['Open'::character varying, 'Closed'::character varying, 'Under Investigation'::character varying]::text[]))
);

CREATE TABLE public.audit_logs (
  log_id SERIAL PRIMARY KEY,
  officer_name character varying NOT NULL,
  action character varying NOT NULL,
  target character varying NOT NULL,
  timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ip_address character varying
);
