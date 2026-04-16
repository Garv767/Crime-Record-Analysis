-- Crime Record and Pattern Analysis (CRPA)
-- Schema Definition

CREATE TABLE public.audit_logs (
  log_id SERIAL PRIMARY KEY,
  officer_name character varying NOT NULL,
  action character varying NOT NULL,
  target character varying NOT NULL,
  timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ip_address character varying
);

CREATE TABLE public.crime_offender (
  crime_id integer NOT NULL,
  offender_id integer NOT NULL,
  role_in_crime character varying,
  PRIMARY KEY (crime_id, offender_id),
  FOREIGN KEY (crime_id) REFERENCES public.crimes(crime_id),
  FOREIGN KEY (offender_id) REFERENCES public.offenders(offender_id)
);

CREATE TABLE public.crimes (
  crime_id SERIAL PRIMARY KEY,
  crime_type character varying NOT NULL,
  occurrence_timestamp timestamp without time zone NOT NULL,
  description text,
  location_id integer REFERENCES public.locations(location_id),
  victim_id integer REFERENCES public.victims(victim_id)
);

CREATE TABLE public.evidence (
  evidence_id SERIAL PRIMARY KEY,
  crime_id integer NOT NULL REFERENCES public.crimes(crime_id),
  description text NOT NULL,
  collected_by integer REFERENCES public.police_officers(officer_id),
  collection_date date DEFAULT CURRENT_DATE,
  status character varying CHECK (status IN ('Logged', 'In Lab', 'Processed', 'Archived'))
);

CREATE TABLE public.fir_records (
  fir_id SERIAL PRIMARY KEY,
  crime_id integer UNIQUE REFERENCES public.crimes(crime_id),
  officer_id integer REFERENCES public.police_officers(officer_id),
  fir_date date DEFAULT CURRENT_DATE,
  status character varying CHECK (status IN ('Open', 'Closed', 'Under Investigation'))
);

CREATE TABLE public.locations (
  location_id SERIAL PRIMARY KEY,
  area_name character varying NOT NULL,
  city character varying NOT NULL,
  zone character varying,
  risk_level integer CHECK (risk_level >= 1 AND risk_level <= 10),
  latitude numeric,
  longitude numeric
);

CREATE TABLE public.offenders (
  offender_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  age integer CHECK (age > 0),
  address text,
  previous_crimes_count integer DEFAULT 0,
  fingerprint_hash text
);

CREATE TABLE public.police_officers (
  officer_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  badge_number integer NOT NULL UNIQUE,
  rank character varying,
  station character varying
);

CREATE TABLE public.victims (
  victim_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  age integer,
  contact_no character varying,
  address text
);
