# Job Radar PRD

## Problem Statement
AI-powered job search agent that scans 20+ Australian job sites, analyzes resumes, finds matching vacancies, and tracks applications. Personal tool with wishlist, document generation, and automated search capabilities.

## Architecture
- **Backend**: FastAPI + MongoDB + Gemini 2.5 Flash AI (via Emergent key)
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts + Framer Motion
- **Theme**: "Electric Command Center" - dark, data-dense, glassmorphism

## What's Implemented (Feb 23, 2026)
- Landing page with radar animation, hero, features grid, CTA
- Resume upload (PDF/DOCX) with AI analysis (skills, experience, recommendations)
- AI Job Recommendations with Save/Delete/Apply/Detail view
- Recommendation detail modal with search links across 20+ sites
- ATS Resume + Cover Letter generation per vacancy
- Wishlist tab - saved recommendations with apply-to-tracker
- Auto Search (Cron) tab - create scheduled searches, run manually, view results
- **Job Search Filters**: Visa (482/PR/Citizen), Remote/Hybrid/Onsite, Contract/Permanent/Casual, Salary range, Company size, Recruiter vs Direct, Posted date (24h-30d), Junior-friendly
- **Custom Company Monitoring**: Add IT company career pages (e.g. Atlassian, Canva) - included in all scans
- Job Tracker table with columns: Date, Company, Position, Salary, Location, Tech, Status, **Work Mode**, **Contract Type**, **Visa Sponsorship**, Source
- Status dropdown editing, filter by status, add/edit/delete
- Statistics dashboard with pie/bar/line charts
- Excel export (.xlsx) with all columns including new fields
- Web scraping engine for 18+ built-in + custom Australian job sites

## Collections
- `resumes`, `tracked_jobs`, `scans`, `wishlist`, `hidden_recommendations`, `generated_documents`, `cron_searches`, `cron_results`

## Backlog
- P0: Real cron scheduler (currently manual Run button)
- P1: Custom AI prompt for resume/cover letter generation
- P1: Import existing Excel data into tracker
- P2: Email notifications for new matching jobs
- P2: Interview calendar integration
