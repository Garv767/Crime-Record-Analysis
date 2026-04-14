-- Audit Logs table for tracking system interactions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    log_id SERIAL PRIMARY KEY,
    officer_name VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    target VARCHAR NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR
);

-- Seed some initial logs
INSERT INTO public.audit_logs (officer_name, action, target, ip_address) VALUES
('Inspector Raghavan', 'ACCESS_RECORD', 'FIR#7721', '192.168.1.42'),
('SI Anbu', 'CREATE_RECORD', 'FIR#7725', '192.168.1.15'),
('System', 'DB_BACKUP_SUCCESS', 'Production_Main', 'Internal'),
('Inspector Raghavan', 'DELETE_EVIDENCE', 'EV-991 (EXPIRED)', '192.168.1.42');
