-- Create a dedicated DNC list table to store all DNC entries
-- This allows storing DNC entries even if they don't exist in companies or contacts tables

CREATE TABLE IF NOT EXISTS dnc_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('company', 'contact')),
    value TEXT NOT NULL, -- Domain for companies, email for contacts
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type, value) -- Prevent duplicate entries
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dnc_list_type ON dnc_list(type);
CREATE INDEX IF NOT EXISTS idx_dnc_list_value ON dnc_list(value);
CREATE INDEX IF NOT EXISTS idx_dnc_list_created_at ON dnc_list(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dnc_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dnc_list_updated_at
    BEFORE UPDATE ON dnc_list
    FOR EACH ROW
    EXECUTE FUNCTION update_dnc_list_updated_at();

-- Migrate existing DNC data from companies table
INSERT INTO dnc_list (type, value, reason, created_at)
SELECT 
    'company' as type,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(website, '^https?://', ''), '^www\.', '')) as value,
    dnc_reason as reason,
    dnc_date as created_at
FROM companies
WHERE is_dnc = true AND website IS NOT NULL
ON CONFLICT (type, value) DO NOTHING;

-- Migrate existing DNC data from contacts table
INSERT INTO dnc_list (type, value, reason, created_at)
SELECT 
    'contact' as type,
    LOWER(email) as value,
    dnc_reason as reason,
    dnc_date as created_at
FROM contacts
WHERE is_dnc = true AND email IS NOT NULL
ON CONFLICT (type, value) DO NOTHING;

COMMENT ON TABLE dnc_list IS 'Stores all Do Not Contact entries for both companies (by domain) and contacts (by email)';
COMMENT ON COLUMN dnc_list.type IS 'Type of DNC entry: company or contact';
COMMENT ON COLUMN dnc_list.value IS 'Domain for companies (e.g., example.com) or email for contacts';
COMMENT ON COLUMN dnc_list.reason IS 'Reason for adding to DNC list';
