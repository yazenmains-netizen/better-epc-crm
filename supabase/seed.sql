-- Your Home Specialist CRM — Seed Data
-- Run AFTER schema.sql to populate with existing Excel data
-- All historical jobs from YHS_Business_CRM.xlsx

-- ─── CLIENTS ───────────────────────────────────────────────
insert into clients (name, type, active, how_found, notes) values
  ('Haart Harborne',       'Estate Agent',        true, 'Estate Agent', 'Main contract. Primary source of EPC referrals.'),
  ('Haart Wolverhampton',  'Estate Agent',        true, 'Estate Agent', null),
  ('Fahim',                'Landlord',             true, 'Referral',     'Multiple properties. Repeat client.'),
  ('EPC Gas Specialist Ltd','Contractor',          true, 'Referral',     'Business partner. Refers jobs.'),
  ('Burchell Edwards',     'Estate Agent',        true, 'Referral',     'Referral source.');

-- ─── EXPENSES ──────────────────────────────────────────────
insert into expenses (description, date, category, supplier, amount, payment_method, has_receipt, tax_deductible) values
  ('Website subscription', '2024-01-01', 'Software/Subscriptions', 'IR Automations', 325.00, 'Bank Transfer', true, true),
  ('Branded jacket',        '2024-01-01', 'Uniform/PPE',             null,             75.00,  'Business Card',  false, true);

-- Note: Jobs will need to be entered manually via the UI or updated with real dates/refs from the Excel file.
-- The 16 existing jobs can be added through the Jobs board once the app is running.
