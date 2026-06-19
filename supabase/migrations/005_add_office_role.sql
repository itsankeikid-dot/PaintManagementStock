-- Add 'office' role to user_role enum
-- Office users can only access the dashboard for monitoring and reports
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'office';
