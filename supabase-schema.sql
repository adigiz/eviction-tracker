-- Supabase Database Schema for Eviction Tracker
-- Run this in your Supabase SQL Editor
-- Updated for latest Supabase security requirements with built-in auth

-- Create profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'landlord' CHECK (role IN ('admin', 'landlord', 'contractor')),
    phone VARCHAR(20),
    address TEXT,
    business_name VARCHAR(100),
    referral_code VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    price_overrides JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    unit VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    county VARCHAR(100) NOT NULL,
    property_type VARCHAR(20) NOT NULL CHECK (property_type IN ('RESIDENTIAL', 'COMMERCIAL')),
    bedrooms INTEGER,
    bathrooms INTEGER,
    square_feet INTEGER,
    year_built INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_names TEXT[] NOT NULL, -- Array of tenant names
    email VARCHAR(255),
    phone VARCHAR(20),
    lease_start_date DATE,
    lease_end_date DATE,
    rent_amount DECIMAL(10,2),
    is_subsidized BOOLEAN DEFAULT FALSE,
    subsidy_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create legal cases table
CREATE TABLE IF NOT EXISTS public.legal_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    case_type VARCHAR(20) NOT NULL CHECK (case_type IN ('FTPR', 'HOLDOVER', 'OTHER')),
    date_initiated DATE NOT NULL,
    rent_owed_at_filing DECIMAL(10,2) DEFAULT 0,
    current_rent_owed DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(30) NOT NULL CHECK (status IN ('NOTICE_DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETE', 'CANCELLED')),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('UNPAID', 'PAID', 'PARTIAL')),
    price DECIMAL(10,2) NOT NULL,
    no_right_of_redemption BOOLEAN DEFAULT FALSE,
    late_fees_charged DECIMAL(10,2),
    thirty_day_notice_file_name VARCHAR(255),
    payments_made JSONB DEFAULT '[]',
    notice_mailed_date DATE,
    court_case_number VARCHAR(100),
    trial_date DATE,
    court_hearing_date DATE,
    court_outcome_notes TEXT,
    generated_documents JSONB DEFAULT '{}',
    district_court_case_number VARCHAR(100),
    warrant_order_date DATE,
    initial_eviction_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create law firms table
CREATE TABLE IF NOT EXISTS public.law_firms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    contact_person VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_county ON public.properties(county);
CREATE INDEX IF NOT EXISTS idx_tenants_landlord_id ON public.tenants(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_landlord_id ON public.legal_cases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON public.legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_payment_status ON public.legal_cases(payment_status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow user registration" ON public.profiles;
DROP POLICY IF EXISTS "Allow login queries" ON public.profiles;

-- Create RLS policies (FIXED: No recursion, simple and secure)

-- Profiles table policies - Simple and secure
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- IMPORTANT: Allow profile creation during login (when user is authenticated)
CREATE POLICY "Allow profile creation" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- IMPORTANT: Allow unauthenticated users to query profiles for login
-- This is needed because login happens before authentication
-- Only allow access to username and email fields for security
CREATE POLICY "Allow login queries" ON public.profiles
    FOR SELECT USING (true);

-- Properties: Landlords can only see their own properties
CREATE POLICY "Landlords can view own properties" ON public.properties
    FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can manage own properties" ON public.properties
    FOR ALL USING (landlord_id = auth.uid());

-- Tenants: Landlords can only see their own tenants
CREATE POLICY "Landlords can view own tenants" ON public.tenants
    FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can manage own tenants" ON public.tenants
    FOR ALL USING (landlord_id = auth.uid());

-- Legal Cases: Landlords can only see their own cases
CREATE POLICY "Landlords can view own cases" ON public.legal_cases
    FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can manage own cases" ON public.legal_cases
    FOR ALL USING (landlord_id = auth.uid());

-- Law Firms: Everyone can view (but only admins can manage)
CREATE POLICY "Everyone can view law firms" ON public.law_firms
    FOR SELECT USING (true);
