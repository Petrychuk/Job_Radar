-- Job Radar PostgreSQL Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (with authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) DEFAULT '',
    notification_email VARCHAR(255),
    cron_email_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Resumes table (uploaded CV with AI analysis)
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    analysis JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);

-- Job scans table (search results)
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    keywords TEXT[] DEFAULT '{}',
    results JSONB DEFAULT '[]',
    total_jobs_found INTEGER DEFAULT 0,
    sites_scanned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);

-- Tracked jobs table (job applications tracking)
CREATE TABLE IF NOT EXISTS tracked_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_posted VARCHAR(50) DEFAULT '',
    company VARCHAR(255) DEFAULT '',
    site_url TEXT DEFAULT '',
    position VARCHAR(500) DEFAULT '',
    salary VARCHAR(255) DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    technology TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'New',
    source VARCHAR(255) DEFAULT '',
    link TEXT DEFAULT '',
    contact TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    work_mode VARCHAR(100) DEFAULT '',
    contract_type VARCHAR(100) DEFAULT '',
    visa_sponsorship VARCHAR(100) DEFAULT '',
    date_applied VARCHAR(50) DEFAULT '',
    response_date VARCHAR(50) DEFAULT '',
    interview_stages TEXT DEFAULT '',
    rejection_reason TEXT DEFAULT '',
    recruiter_name VARCHAR(255) DEFAULT '',
    follow_up_date VARCHAR(50) DEFAULT '',
    linkedin_connection VARCHAR(255) DEFAULT '',
    cv_profile_used VARCHAR(255) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracked_jobs_user_id ON tracked_jobs(user_id);
CREATE INDEX idx_tracked_jobs_status ON tracked_jobs(status);
CREATE INDEX idx_tracked_jobs_created_at ON tracked_jobs(created_at DESC);

-- Wishlist table (saved job recommendations)
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    company_type VARCHAR(255) DEFAULT '',
    match_score INTEGER DEFAULT 0,
    salary_range VARCHAR(255) DEFAULT '',
    why_match TEXT DEFAULT '',
    search_keywords TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'saved',
    generated_resume TEXT,
    generated_cover_letter TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_status ON wishlist(status);

-- Custom sites table (user-added job sites)
CREATE TABLE IF NOT EXISTS custom_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    careers_url TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'company',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_sites_user_id ON custom_sites(user_id);

-- Cron searches table (automated job searches)
CREATE TABLE IF NOT EXISTS cron_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    location VARCHAR(255) DEFAULT 'Australia',
    active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMPTZ,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cron_searches_user_id ON cron_searches(user_id);
CREATE INDEX idx_cron_searches_active ON cron_searches(active);

-- Cron results table (results from automated searches)
CREATE TABLE IF NOT EXISTS cron_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cron_id UUID REFERENCES cron_searches(id) ON DELETE CASCADE,
    keywords TEXT[] DEFAULT '{}',
    results JSONB DEFAULT '[]',
    total_jobs_found INTEGER DEFAULT 0,
    run_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cron_results_cron_id ON cron_results(cron_id);
CREATE INDEX idx_cron_results_run_at ON cron_results(run_at DESC);

-- CV profiles table (multiple resume versions)
CREATE TABLE IF NOT EXISTS cv_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    profile_type VARCHAR(100) DEFAULT 'General',
    filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    analysis JSONB DEFAULT '{}',
    companies_sent_to JSONB DEFAULT '[]',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cv_profiles_user_id ON cv_profiles(user_id);

-- Generated documents table (AI-generated resumes and cover letters)
CREATE TABLE IF NOT EXISTS generated_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(500) NOT NULL,
    doc_type VARCHAR(50) DEFAULT 'both',
    resume TEXT,
    cover_letter TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_documents_user_id ON generated_documents(user_id);

-- ATS checks table (ATS optimization analysis)
CREATE TABLE IF NOT EXISTS ats_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(500) NOT NULL,
    ats_score INTEGER DEFAULT 0,
    keyword_match TEXT[] DEFAULT '{}',
    missing_keywords TEXT[] DEFAULT '{}',
    format_issues TEXT[] DEFAULT '{}',
    suggestions TEXT[] DEFAULT '{}',
    keyword_density_ok BOOLEAN DEFAULT TRUE,
    overall_verdict VARCHAR(50) DEFAULT 'Good',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ats_checks_user_id ON ats_checks(user_id);

-- Hidden recommendations table (dismissed job recommendations)
CREATE TABLE IF NOT EXISTS hidden_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    hidden_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hidden_recommendations_user_id ON hidden_recommendations(user_id);

-- Update trigger for tracked_jobs.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tracked_jobs_updated_at BEFORE UPDATE ON tracked_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
