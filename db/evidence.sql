-- CREATE TABLE
CREATE TABLE public.evidence (
    evidence_id SERIAL PRIMARY KEY,
    crime_id INTEGER NOT NULL REFERENCES public.crimes(crime_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    collected_by INTEGER REFERENCES public.police_officers(officer_id) ON DELETE SET NULL,
    collection_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR CHECK (status IN ('Logged', 'In Lab', 'Processed', 'Archived'))
);

-- SEED DATA
INSERT INTO public.evidence (crime_id, description, collected_by, collection_date, status) VALUES
(1, 'Broken gold chain clasp found at scene', 1, '2026-02-10', 'Archived'),
(2, 'Blood-stained shirt fabric', 10, '2026-02-12', 'In Lab'),
(3, 'Suspect mobile device', 4, '2026-02-13', 'Processed'),
(4, 'CCTV footage of grocery store exterior', 6, '2026-02-14', 'Logged'),
(6, 'Fingerprints from car handle', 8, '2026-02-15', 'In Lab'),
(8, 'Drop of blood from scuffle', 1, '2026-02-17', 'Processed'),
(9, 'Crowbar left near broken window', 5, '2026-02-18', 'Logged');
