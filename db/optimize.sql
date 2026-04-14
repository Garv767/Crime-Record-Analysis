-- Optimization: Database Indexes for Crime Record Analysis
-- These indexes speed up the specific JOIN and GROUP BY queries used by the 
-- Dashboard, OffendersRegistry, and Hotspot Map.

-- Index for Crimes by Location (Used in Map/Hotspots and Crimes list)
CREATE INDEX IF NOT EXISTS idx_crimes_location_id ON public.crimes(location_id);

-- Index for Linking Crimes to Offenders (Used in repeat-offender analysis)
CREATE INDEX IF NOT EXISTS idx_crime_offender_offender_id ON public.crime_offender(offender_id);
CREATE INDEX IF NOT EXISTS idx_crime_offender_crime_id ON public.crime_offender(crime_id);

-- Index for Crime Type filtering (Used in Crimes list filter)
CREATE INDEX IF NOT EXISTS idx_crimes_type ON public.crimes(crime_type);

-- Index for Timestamp sorting (Used in Dashboard and Crimes list)
CREATE INDEX IF NOT EXISTS idx_crimes_timestamp ON public.crimes(occurrence_timestamp DESC);
