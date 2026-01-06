-- Migration to add company_name column to dnc_list table
-- This allows storing the company name along with the domain/email for better identification

ALTER TABLE dnc_list 
ADD COLUMN IF NOT EXISTS company_name TEXT;

COMMENT ON COLUMN dnc_list.company_name IS 'Optional company name associated with the DNC entry';
