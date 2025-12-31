-- Add is_dnc column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_dnc BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dnc_reason TEXT,
ADD COLUMN IF NOT EXISTS dnc_date TIMESTAMP WITH TIME ZONE;

-- Add is_dnc column to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS is_dnc BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dnc_reason TEXT,
ADD COLUMN IF NOT EXISTS dnc_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster DNC queries
CREATE INDEX IF NOT EXISTS idx_companies_is_dnc ON companies(is_dnc) WHERE is_dnc = TRUE;
CREATE INDEX IF NOT EXISTS idx_contacts_is_dnc ON contacts(is_dnc) WHERE is_dnc = TRUE;

-- Add comment to columns
COMMENT ON COLUMN companies.is_dnc IS 'Indicates if this company is on the Do Not Contact list';
COMMENT ON COLUMN companies.dnc_reason IS 'Reason for adding to DNC list';
COMMENT ON COLUMN companies.dnc_date IS 'Date when added to DNC list';

COMMENT ON COLUMN contacts.is_dnc IS 'Indicates if this contact is on the Do Not Contact list';
COMMENT ON COLUMN contacts.dnc_reason IS 'Reason for adding to DNC list';
COMMENT ON COLUMN contacts.dnc_date IS 'Date when added to DNC list';
