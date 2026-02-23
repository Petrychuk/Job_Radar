from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import asyncio
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from bs4 import BeautifulSoup
import requests as http_requests
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

UPLOAD_DIR = Path("/tmp/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
EXPORT_DIR = Path("/tmp/exports")
EXPORT_DIR.mkdir(exist_ok=True)

LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Job Site Configurations ───
JOB_SITES = [
    {"id": "seek", "name": "Seek", "url": "https://www.seek.com.au", "search_template": "https://www.seek.com.au/{keyword}-jobs", "active": True},
    {"id": "indeed", "name": "Indeed AU", "url": "https://au.indeed.com", "search_template": "https://au.indeed.com/jobs?q={keyword}&l=Australia", "active": True},
    {"id": "linkedin", "name": "LinkedIn", "url": "https://www.linkedin.com", "search_template": "https://www.linkedin.com/jobs/search/?keywords={keyword}&location=Australia", "active": True},
    {"id": "adzuna", "name": "Adzuna", "url": "https://www.adzuna.com.au", "search_template": "https://www.adzuna.com.au/search?q={keyword}", "active": True},
    {"id": "careerone", "name": "CareerOne", "url": "https://www.careerone.com.au", "search_template": "https://www.careerone.com.au/jobs?search={keyword}", "active": True},
    {"id": "workforce_au", "name": "Workforce Australia", "url": "https://www.workforceaustralia.gov.au", "search_template": "https://www.workforceaustralia.gov.au/individuals/training/search?keywords={keyword}", "active": True},
    {"id": "roberthalf", "name": "Robert Half", "url": "https://www.roberthalf.com/au", "search_template": "https://www.roberthalf.com/au/en/jobs?query={keyword}", "active": True},
    {"id": "sparkrecruitment", "name": "Spark Recruitment", "url": "https://www.sparkrecruitment.com.au", "search_template": "https://www.sparkrecruitment.com.au/jobs/permanent?q={keyword}", "active": True},
    {"id": "siriuspeople", "name": "Sirius People", "url": "https://www.siriuspeople.com.au", "search_template": "https://www.siriuspeople.com.au/jobs?keyword={keyword}", "active": True},
    {"id": "launchrecruitment", "name": "Launch Recruitment", "url": "https://www.launchrecruitment.com.au", "search_template": "https://www.launchrecruitment.com.au/jobs/?search={keyword}", "active": True},
    {"id": "hatch", "name": "Hatch", "url": "https://app.hatch.team", "search_template": "https://app.hatch.team/jobs?q={keyword}", "active": True},
    {"id": "work180", "name": "WORK180", "url": "https://work180.com", "search_template": "https://work180.com/en-au/jobs?q={keyword}", "active": True},
    {"id": "clicks", "name": "Clicks IT", "url": "https://clicks.com.au", "search_template": "https://clicks.com.au/jobs/?search={keyword}", "active": True},
    {"id": "credible", "name": "Credible", "url": "https://www.credible.com.au", "search_template": "https://www.credible.com.au/jobs?q={keyword}", "active": True},
    {"id": "premiumgraduate", "name": "Premium Graduate", "url": "https://www.premiumgraduate.com.au", "search_template": "https://www.premiumgraduate.com.au/jobs?q={keyword}", "active": True},
    {"id": "careersuccessau", "name": "Career Success AU", "url": "https://careersuccessaustralia.com.au", "search_template": "https://careersuccessaustralia.com.au/jobs?q={keyword}", "active": True},
    {"id": "sofico", "name": "Sofico Global", "url": "https://sofico.global", "search_template": "https://sofico.global/careers?q={keyword}", "active": True},
    {"id": "macquarie", "name": "Macquarie Tech", "url": "https://careers.macquarietechnologygroup.com", "search_template": "https://careers.macquarietechnologygroup.com/jobs?q={keyword}", "active": True},
]

# ─── Pydantic Models ───
class TrackedJobCreate(BaseModel):
    date_posted: str = ""
    company: str = ""
    site_url: str = ""
    position: str = ""
    salary: str = ""
    location: str = ""
    technology: str = ""
    status: str = "New"
    source: str = ""
    link: str = ""
    contact: str = ""
    notes: str = ""
    work_mode: str = ""
    contract_type: str = ""
    visa_sponsorship: str = ""
    date_applied: str = ""
    response_date: str = ""
    interview_stages: str = ""
    rejection_reason: str = ""
    recruiter_name: str = ""
    follow_up_date: str = ""
    linkedin_connection: str = ""
    cv_profile_used: str = ""

class TrackedJobUpdate(BaseModel):
    date_posted: Optional[str] = None
    company: Optional[str] = None
    site_url: Optional[str] = None
    position: Optional[str] = None
    salary: Optional[str] = None
    location: Optional[str] = None
    technology: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    link: Optional[str] = None
    contact: Optional[str] = None
    notes: Optional[str] = None
    work_mode: Optional[str] = None
    contract_type: Optional[str] = None
    visa_sponsorship: Optional[str] = None
    date_applied: Optional[str] = None
    response_date: Optional[str] = None
    interview_stages: Optional[str] = None
    rejection_reason: Optional[str] = None
    recruiter_name: Optional[str] = None
    follow_up_date: Optional[str] = None
    linkedin_connection: Optional[str] = None
    cv_profile_used: Optional[str] = None

class WishlistItemCreate(BaseModel):
    title: str
    company_type: str = ""
    match_score: int = 0
    salary_range: str = ""
    why_match: str = ""
    search_keywords: List[str] = []

class DocumentGenerateRequest(BaseModel):
    job_title: str
    company_type: str = ""
    salary_range: str = ""
    why_match: str = ""
    doc_type: str = "both"  # resume, cover_letter, both

class CronJobCreate(BaseModel):
    title: str
    keywords: List[str] = []
    location: str = "Australia"
    active: bool = True

class CustomSiteCreate(BaseModel):
    name: str
    url: str
    careers_url: str
    category: str = "company"

class ATSCheckRequest(BaseModel):
    job_title: str
    job_description: str = ""
    cv_profile_id: str = ""

class SkillGapRequest(BaseModel):
    target_role: str = ""  # company / recruitment / other

# ─── AI Helper Functions ───
def parse_ai_json(response_text: str) -> dict:
    text = response_text.strip()
    if text.startswith("```"):
        text = re.sub(r'^```\w*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'[\[{].*[\]}]', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse AI response as JSON")

async def analyze_resume_with_ai(file_path: str, filename: str) -> dict:
    chat = LlmChat(
        api_key=LLM_KEY,
        session_id=f"resume-{uuid.uuid4()}",
        system_message="You are an expert resume analyzer for the Australian job market. Respond with ONLY valid JSON."
    ).with_model("gemini", "gemini-2.5-flash")

    prompt = """Analyze this resume and return JSON:
{
  "summary": "2-3 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [{"company": "name", "role": "title", "duration": "period", "highlights": "key achievements"}],
  "education": ["degree details"],
  "preferred_titles": ["10-15 matching job titles, most relevant first"],
  "keywords": ["15-20 search keywords for Australian job boards"],
  "seniority": "Junior/Mid/Senior/Lead",
  "industries": ["relevant industries"]
}"""

    if filename.lower().endswith('.pdf'):
        file_content = FileContentWithMimeType(file_path=file_path, mime_type="application/pdf")
        msg = UserMessage(text=prompt, file_contents=[file_content])
    else:
        from docx import Document
        doc = Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        msg = UserMessage(text=f"{prompt}\n\nResume text:\n{text}")

    response = await chat.send_message(msg)
    return parse_ai_json(response)

async def generate_job_recommendations(resume_data: dict) -> list:
    try:
        chat = LlmChat(
            api_key=LLM_KEY,
            session_id=f"recommend-{uuid.uuid4()}",
            system_message="You are a career advisor for the Australian IT job market. Respond with ONLY valid JSON array."
        ).with_model("gemini", "gemini-2.5-flash")

        skills = ", ".join(resume_data.get("skills", [])[:15])
        titles = ", ".join(resume_data.get("preferred_titles", [])[:5])

        prompt = f"""Profile: Skills: {skills} | Titles: {titles} | Level: {resume_data.get('seniority', 'Mid')}

Generate 12 job recommendations as JSON array:
[{{"title": "job title", "company_type": "type of company", "match_score": 85, "salary_range": "$X - $Y AUD", "why_match": "brief reason", "search_keywords": ["kw1", "kw2"]}}]

Include exact-match AND adjacent/transition roles for Australian market."""

        response = await chat.send_message(UserMessage(text=prompt))
        return parse_ai_json(response)
    except Exception as e:
        logger.error(f"Recommendations failed: {e}")
        return []

async def generate_documents_ai(resume_data: dict, job_title: str, company_type: str, salary_range: str, why_match: str, doc_type: str) -> dict:
    """Generate ATS-optimized resume and/or cover letter tailored to a specific vacancy"""
    try:
        chat = LlmChat(
            api_key=LLM_KEY,
            session_id=f"docs-{uuid.uuid4()}",
            system_message="You are an expert resume writer and career coach specializing in ATS-optimized documents for the Australian job market. You create professional, keyword-rich documents that pass ATS screening systems."
        ).with_model("gemini", "gemini-2.5-flash")

        skills = ", ".join(resume_data.get("skills", []))
        experience_text = ""
        for exp in resume_data.get("experience", []):
            experience_text += f"- {exp.get('role', '')} at {exp.get('company', '')} ({exp.get('duration', '')}): {exp.get('highlights', '')}\n"
        education = ", ".join(resume_data.get("education", []))
        summary = resume_data.get("summary", "")

        result = {}

        if doc_type in ("resume", "both"):
            resume_prompt = f"""Create an ATS-optimized resume tailored for this specific position:

TARGET POSITION: {job_title}
COMPANY TYPE: {company_type}
SALARY RANGE: {salary_range}
WHY IT'S A MATCH: {why_match}

CANDIDATE PROFILE:
Summary: {summary}
Skills: {skills}
Experience:
{experience_text}
Education: {education}

Generate a complete, professional resume in plain text format that:
1. Uses keywords from the target position throughout
2. Quantifies achievements where possible
3. Highlights relevant skills for this specific role
4. Is ATS-friendly (no tables, graphics, or special formatting)
5. Includes a tailored professional summary at the top
6. Is formatted for Australian job market standards

Return ONLY the resume text, no JSON or markdown."""

            resume_response = await chat.send_message(UserMessage(text=resume_prompt))
            result["resume"] = resume_response.strip()

        if doc_type in ("cover_letter", "both"):
            cl_chat = LlmChat(
                api_key=LLM_KEY,
                session_id=f"cl-{uuid.uuid4()}",
                system_message="You are an expert cover letter writer for the Australian job market. You create compelling, ATS-optimized cover letters."
            ).with_model("gemini", "gemini-2.5-flash")

            cl_prompt = f"""Write an ATS-optimized cover letter for this position:

TARGET POSITION: {job_title}
COMPANY TYPE: {company_type}
SALARY RANGE: {salary_range}

CANDIDATE PROFILE:
Summary: {summary}
Key Skills: {skills}
Recent Experience:
{experience_text}

Write a professional cover letter that:
1. Opens with a strong hook showing enthusiasm for the role
2. Highlights 2-3 most relevant achievements/skills
3. Shows understanding of the company type and industry
4. Uses keywords from the position throughout
5. Ends with a clear call to action
6. Is 3-4 paragraphs, professional tone
7. Australian business letter format

Return ONLY the cover letter text, no JSON or markdown."""

            cl_response = await cl_chat.send_message(UserMessage(text=cl_prompt))
            result["cover_letter"] = cl_response.strip()

        return result
    except Exception as e:
        logger.error(f"Document generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document generation failed: {str(e)}")

# ─── Scraping Functions ───
async def scrape_single_site(site: dict, keywords: list, semaphore: asyncio.Semaphore) -> dict:
    async with semaphore:
        keyword_plus = "+".join(keywords[:3])
        keyword_dash = "-".join(keywords[:3])
        search_url = site['search_template'].replace('{keyword}', keyword_plus if '+' in site['search_template'] or '?' in site['search_template'] else keyword_dash)

        result = {"site_id": site['id'], "site_name": site['name'], "search_url": search_url, "jobs": [], "status": "pending"}
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }

        try:
            response = await asyncio.to_thread(http_requests.get, search_url, headers=headers, timeout=10, allow_redirects=True)
            if response.status_code == 200 and len(response.text) > 1000:
                soup = BeautifulSoup(response.text, 'lxml')
                jobs = extract_jobs_generic(soup, site)
                result['jobs'] = jobs[:15]
                result['status'] = 'scraped' if jobs else 'no_listings_found'
            else:
                result['status'] = f'http_{response.status_code}'
        except Exception as e:
            result['status'] = 'timeout' if 'timeout' in str(e).lower() else 'error'
            logger.warning(f"Scrape {site['name']} failed: {e}")

        return result

def extract_jobs_generic(soup: BeautifulSoup, site: dict) -> list:
    jobs = []
    seen = set()
    job_keywords = ['developer', 'engineer', 'analyst', 'designer', 'manager', 'coordinator', 'administrator', 'consultant', 'specialist', 'intern', 'architect', 'lead', 'senior', 'junior', 'full stack', 'frontend', 'backend', 'devops', 'data', 'software', 'web', 'mobile', 'cloud', 'qa', 'test']

    for link in soup.find_all('a', href=True):
        text = link.get_text(strip=True)
        href = link['href']
        if 8 < len(text) < 120 and any(kw in text.lower() for kw in job_keywords):
            if text not in seen:
                seen.add(text)
                full_url = href if href.startswith('http') else f"{site['url']}{href}"
                parent = link.find_parent(['article', 'div', 'li', 'section'])
                company = ""
                location = ""
                if parent:
                    for el in parent.find_all(['span', 'div', 'p'], limit=10):
                        el_text = el.get_text(strip=True)
                        if el_text != text and 2 < len(el_text) < 60:
                            if not company and el_text != text:
                                company = el_text
                            elif not location:
                                location = el_text

                jobs.append({"title": text, "company": company, "location": location, "url": full_url, "source": site['name']})

    return jobs

# ─── Resume Routes ───
@api_router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

    file_path = UPLOAD_DIR / f"{uuid.uuid4()}_{file.filename}"
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    analysis = await analyze_resume_with_ai(str(file_path), file.filename)
    recommendations = await generate_job_recommendations(analysis)

    resume_doc = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "file_path": str(file_path),
        "analysis": analysis,
        "recommendations": recommendations,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.resumes.insert_one(resume_doc)
    resume_doc.pop('_id', None)
    return resume_doc

@api_router.get("/resume")
async def get_resume():
    resume = await db.resumes.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    if not resume:
        return None
    return resume

# ─── Job Scanning Routes ───
@api_router.post("/jobs/scan")
async def scan_jobs():
    resume = await db.resumes.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    if not resume:
        raise HTTPException(status_code=400, detail="Upload a resume first")

    keywords = resume.get('analysis', {}).get('keywords', [])[:5]
    if not keywords:
        keywords = resume.get('analysis', {}).get('preferred_titles', [])[:3]

    # Combine built-in sites with custom sites
    all_sites = [s for s in JOB_SITES if s.get('active')]
    custom_sites = await db.custom_sites.find({}, {"_id": 0}).to_list(100)
    for cs in custom_sites:
        all_sites.append({
            "id": cs["id"], "name": cs["name"], "url": cs["url"],
            "search_template": cs.get("careers_url", cs["url"]), "active": True,
            "custom": True, "category": cs.get("category", "company")
        })

    semaphore = asyncio.Semaphore(5)
    tasks = [scrape_single_site(site, keywords, semaphore) for site in all_sites]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    scan_results = [r for r in results if not isinstance(r, Exception)]

    scan_doc = {
        "id": str(uuid.uuid4()),
        "keywords": keywords,
        "results": scan_results,
        "total_jobs_found": sum(len(r.get('jobs', [])) for r in scan_results),
        "sites_scanned": len(scan_results),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.scans.insert_one(scan_doc)
    scan_doc.pop('_id', None)
    return scan_doc

@api_router.get("/jobs")
async def get_jobs():
    scan = await db.scans.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    if not scan:
        return None
    return scan

@api_router.get("/jobs/search-links")
async def get_search_links(keyword: str = "software developer"):
    links = []
    for site in JOB_SITES:
        if site.get('active'):
            kw = keyword.replace(' ', '+')
            search_url = site['search_template'].replace('{keyword}', kw)
            links.append({"site_id": site['id'], "site_name": site['name'], "site_url": site['url'], "search_url": search_url, "custom": False})
    # Add custom sites
    custom_sites = await db.custom_sites.find({}, {"_id": 0}).to_list(100)
    for cs in custom_sites:
        links.append({"site_id": cs["id"], "site_name": cs["name"], "site_url": cs["url"], "search_url": cs.get("careers_url", cs["url"]), "custom": True, "category": cs.get("category", "company")})
    return links

# ─── Tracker Routes ───
@api_router.get("/tracker")
async def get_tracked_jobs(status: Optional[str] = None):
    query = {}
    if status and status != "All":
        query["status"] = status
    jobs = await db.tracked_jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return jobs

@api_router.post("/tracker")
async def add_tracked_job(job: TrackedJobCreate):
    doc = job.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.tracked_jobs.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.put("/tracker/{job_id}")
async def update_tracked_job(job_id: str, updates: TrackedJobUpdate):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.tracked_jobs.update_one({"id": job_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    updated = await db.tracked_jobs.find_one({"id": job_id}, {"_id": 0})
    return updated

@api_router.delete("/tracker/{job_id}")
async def delete_tracked_job(job_id: str):
    result = await db.tracked_jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Deleted"}

@api_router.get("/tracker/export")
async def export_tracker():
    jobs = await db.tracked_jobs.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

    wb = Workbook()
    ws = wb.active
    ws.title = "Job Applications"

    headers = ["#", "Date Posted", "Company", "Source", "Position", "Salary", "Location", "Technology", "Status", "Work Mode", "Contract", "Visa", "Link", "Contact", "Notes"]
    hdr_fill = PatternFill(start_color="1a3a5c", end_color="1a3a5c", fill_type="solid")
    hdr_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")

    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.fill = hdr_fill
        cell.font = hdr_font
        cell.alignment = Alignment(horizontal="center")

    status_colors = {"Offer": "22c55e", "Rejected": "ef4444", "Interview": "3b82f6", "Applied": "8b5cf6", "New": "94a3b8", "Withdrawn": "f59e0b"}

    for idx, job in enumerate(jobs, 1):
        ws.cell(row=idx+1, column=1, value=idx)
        ws.cell(row=idx+1, column=2, value=job.get('date_posted', ''))
        ws.cell(row=idx+1, column=3, value=job.get('company', ''))
        ws.cell(row=idx+1, column=4, value=job.get('source', ''))
        ws.cell(row=idx+1, column=5, value=job.get('position', ''))
        ws.cell(row=idx+1, column=6, value=job.get('salary', ''))
        ws.cell(row=idx+1, column=7, value=job.get('location', ''))
        ws.cell(row=idx+1, column=8, value=job.get('technology', ''))
        ws.cell(row=idx+1, column=9, value=job.get('status', ''))
        ws.cell(row=idx+1, column=10, value=job.get('work_mode', ''))
        ws.cell(row=idx+1, column=11, value=job.get('contract_type', ''))
        ws.cell(row=idx+1, column=12, value=job.get('visa_sponsorship', ''))
        ws.cell(row=idx+1, column=13, value=job.get('link', '') or job.get('site_url', ''))
        ws.cell(row=idx+1, column=14, value=job.get('contact', ''))
        ws.cell(row=idx+1, column=15, value=job.get('notes', ''))

        sc = job.get('status', '')
        if sc in status_colors:
            ws.cell(row=idx+1, column=9).font = Font(color=status_colors[sc], bold=True)

    widths = {'A': 5, 'B': 14, 'C': 25, 'D': 18, 'E': 35, 'F': 15, 'G': 20, 'H': 30, 'I': 12, 'J': 12, 'K': 12, 'L': 12, 'M': 45, 'N': 25, 'O': 30}
    for col_letter, w in widths.items():
        ws.column_dimensions[col_letter].width = w

    fname = f"job_tracker_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    export_path = EXPORT_DIR / fname
    wb.save(str(export_path))

    return FileResponse(str(export_path), filename=fname, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

# ─── Stats Routes ───
@api_router.get("/stats")
async def get_stats():
    total = await db.tracked_jobs.count_documents({})
    if total == 0:
        return {"total": 0, "status_counts": {}, "source_counts": {}, "tech_counts": {}, "monthly_trend": [], "response_rate": 0, "rejection_rate": 0}

    status_counts = {}
    async for doc in db.tracked_jobs.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]):
        status_counts[doc['_id'] or 'Unknown'] = doc['count']

    source_counts = {}
    async for doc in db.tracked_jobs.aggregate([{"$match": {"source": {"$ne": ""}}}, {"$group": {"_id": "$source", "count": {"$sum": 1}}}]):
        source_counts[doc['_id']] = doc['count']

    tech_counts = {}
    async for doc in db.tracked_jobs.aggregate([{"$match": {"technology": {"$ne": ""}}}, {"$group": {"_id": "$technology", "count": {"$sum": 1}}}]):
        tech_counts[doc['_id']] = doc['count']

    monthly = []
    async for doc in db.tracked_jobs.aggregate([{"$group": {"_id": {"$substr": ["$created_at", 0, 7]}, "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}]):
        monthly.append({"month": doc['_id'], "count": doc['count']})

    interviews = status_counts.get('Interview', 0) + status_counts.get('Offer', 0)
    return {
        "total": total,
        "status_counts": status_counts,
        "source_counts": source_counts,
        "tech_counts": tech_counts,
        "monthly_trend": monthly,
        "response_rate": round(interviews / total * 100, 1) if total else 0,
        "rejection_rate": round(status_counts.get('Rejected', 0) / total * 100, 1) if total else 0
    }

@api_router.get("/sites")
async def get_sites():
    custom = await db.custom_sites.find({}, {"_id": 0}).to_list(100)
    return {"built_in": JOB_SITES, "custom": custom}

# ─── Custom Sites Routes ───
@api_router.get("/custom-sites")
async def get_custom_sites():
    return await db.custom_sites.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/custom-sites")
async def add_custom_site(site: CustomSiteCreate):
    doc = site.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.custom_sites.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.delete("/custom-sites/{site_id}")
async def delete_custom_site(site_id: str):
    result = await db.custom_sites.delete_one({"id": site_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Site not found")
    return {"message": "Deleted"}

# ─── Wishlist Routes ───
@api_router.get("/wishlist")
async def get_wishlist():
    items = await db.wishlist.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.post("/wishlist")
async def add_to_wishlist(item: WishlistItemCreate):
    existing = await db.wishlist.find_one({"title": item.title, "status": {"$ne": "hidden"}}, {"_id": 0})
    if existing:
        return existing
    doc = item.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "saved"
    doc["generated_resume"] = None
    doc["generated_cover_letter"] = None
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.wishlist.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.delete("/wishlist/{item_id}")
async def remove_from_wishlist(item_id: str):
    result = await db.wishlist.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Removed"}

@api_router.post("/wishlist/{item_id}/apply")
async def apply_from_wishlist(item_id: str):
    item = await db.wishlist.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    tracker_doc = {
        "id": str(uuid.uuid4()),
        "date_posted": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "company": item.get("company_type", ""),
        "site_url": "",
        "position": item.get("title", ""),
        "salary": item.get("salary_range", ""),
        "location": "Australia",
        "technology": ", ".join(item.get("search_keywords", [])),
        "status": "New",
        "source": "AI Recommendation",
        "link": "",
        "contact": "",
        "notes": f"Match: {item.get('match_score', 0)}% - {item.get('why_match', '')}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tracked_jobs.insert_one(tracker_doc)
    tracker_doc.pop('_id', None)
    await db.wishlist.update_one({"id": item_id}, {"$set": {"status": "applied"}})
    return tracker_doc

@api_router.post("/recommendations/hide")
async def hide_recommendation(title: str):
    doc = {"id": str(uuid.uuid4()), "title": title, "hidden_at": datetime.now(timezone.utc).isoformat()}
    await db.hidden_recommendations.insert_one(doc)
    return {"message": "Hidden"}

@api_router.get("/recommendations/hidden")
async def get_hidden():
    items = await db.hidden_recommendations.find({}, {"_id": 0}).to_list(1000)
    return [item["title"] for item in items]

# ─── Document Generation Routes ───
@api_router.post("/documents/generate")
async def generate_documents(req: DocumentGenerateRequest):
    resume = await db.resumes.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    if not resume:
        raise HTTPException(status_code=400, detail="Upload a resume first")
    resume_data = resume.get("analysis", {})
    result = await generate_documents_ai(resume_data, req.job_title, req.company_type, req.salary_range, req.why_match, req.doc_type)
    doc = {
        "id": str(uuid.uuid4()),
        "job_title": req.job_title,
        "doc_type": req.doc_type,
        **result,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generated_documents.insert_one(doc)
    doc.pop('_id', None)
    return doc

# ─── Cron Job Routes ───
@api_router.get("/cron/jobs")
async def get_cron_jobs():
    jobs = await db.cron_searches.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return jobs

@api_router.post("/cron/jobs")
async def create_cron_job(job: CronJobCreate):
    doc = job.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["last_run"] = None
    doc["results_count"] = 0
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.cron_searches.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.delete("/cron/jobs/{job_id}")
async def delete_cron_job(job_id: str):
    result = await db.cron_searches.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cron job not found")
    await db.cron_results.delete_many({"cron_id": job_id})
    return {"message": "Deleted"}

@api_router.put("/cron/jobs/{job_id}/toggle")
async def toggle_cron_job(job_id: str):
    job = await db.cron_searches.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Cron job not found")
    new_active = not job.get("active", True)
    await db.cron_searches.update_one({"id": job_id}, {"$set": {"active": new_active}})
    return {"active": new_active}

@api_router.post("/cron/run/{job_id}")
async def run_cron_job(job_id: str):
    job = await db.cron_searches.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Cron job not found")
    keywords = job.get("keywords", [])
    if not keywords:
        keywords = [job.get("title", "")]
    semaphore = asyncio.Semaphore(5)
    tasks = [scrape_single_site(site, keywords, semaphore) for site in JOB_SITES if site.get('active')]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    scan_results = [r for r in results if not isinstance(r, Exception)]
    total_found = sum(len(r.get('jobs', [])) for r in scan_results)
    result_doc = {
        "id": str(uuid.uuid4()),
        "cron_id": job_id,
        "keywords": keywords,
        "results": scan_results,
        "total_jobs_found": total_found,
        "run_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cron_results.insert_one(result_doc)
    result_doc.pop('_id', None)
    await db.cron_searches.update_one({"id": job_id}, {"$set": {"last_run": datetime.now(timezone.utc).isoformat(), "results_count": total_found}})
    return result_doc

@api_router.get("/cron/results/{job_id}")
async def get_cron_results(job_id: str):
    results = await db.cron_results.find({"cron_id": job_id}, {"_id": 0}).sort("run_at", -1).to_list(50)
    return results

@api_router.post("/cron/run-all")
async def run_all_cron_jobs():
    active_jobs = await db.cron_searches.find({"active": True}, {"_id": 0}).to_list(100)
    total_results = []
    for job in active_jobs:
        keywords = job.get("keywords", []) or [job.get("title", "")]
        semaphore = asyncio.Semaphore(5)
        tasks = [scrape_single_site(site, keywords, semaphore) for site in JOB_SITES if site.get('active')]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        scan_results = [r for r in results if not isinstance(r, Exception)]
        total_found = sum(len(r.get('jobs', [])) for r in scan_results)
        result_doc = {
            "id": str(uuid.uuid4()),
            "cron_id": job["id"],
            "keywords": keywords,
            "results": scan_results,
            "total_jobs_found": total_found,
            "run_at": datetime.now(timezone.utc).isoformat()
        }
        await db.cron_results.insert_one(result_doc)
        result_doc.pop('_id', None)
        await db.cron_searches.update_one({"id": job["id"]}, {"$set": {"last_run": datetime.now(timezone.utc).isoformat(), "results_count": total_found}})
        total_results.append(result_doc)
    return {"jobs_run": len(total_results), "results": total_results}

# ─── CV Profiles Routes ───
@api_router.post("/profiles/upload")
async def create_cv_profile(file: UploadFile = File(...), name: str = "Default", profile_type: str = "General"):
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files supported")
    file_path = UPLOAD_DIR / f"profile_{uuid.uuid4()}_{file.filename}"
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    analysis = await analyze_resume_with_ai(str(file_path), file.filename)
    doc = {
        "id": str(uuid.uuid4()), "name": name, "profile_type": profile_type,
        "filename": file.filename, "file_path": str(file_path), "analysis": analysis,
        "companies_sent_to": [], "usage_count": 0, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cv_profiles.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.get("/profiles")
async def list_cv_profiles():
    profiles = await db.cv_profiles.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return profiles

@api_router.delete("/profiles/{profile_id}")
async def delete_cv_profile(profile_id: str):
    result = await db.cv_profiles.delete_one({"id": profile_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Deleted"}

@api_router.post("/profiles/{profile_id}/track")
async def track_profile_usage(profile_id: str, company: str = ""):
    await db.cv_profiles.update_one(
        {"id": profile_id},
        {"$inc": {"usage_count": 1}, "$push": {"companies_sent_to": {"company": company, "date": datetime.now(timezone.utc).isoformat()}}}
    )
    return {"message": "Tracked"}

# ─── Market Intelligence Routes ───
@api_router.get("/market/intelligence")
async def get_market_intelligence():
    total = await db.tracked_jobs.count_documents({})
    # Tech trends
    tech_raw = {}
    async for doc in db.tracked_jobs.find({"technology": {"$ne": ""}}, {"technology": 1, "_id": 0}):
        for t in doc.get("technology", "").split(","):
            t = t.strip()
            if t and len(t) > 1:
                tech_raw[t] = tech_raw.get(t, 0) + 1
    tech_trends = sorted([{"name": k, "count": v} for k, v in tech_raw.items()], key=lambda x: -x["count"])[:15]

    # Location analysis
    loc_counts = {}
    async for doc in db.tracked_jobs.aggregate([{"$match": {"location": {"$ne": ""}}}, {"$group": {"_id": "$location", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 10}]):
        loc_counts[doc["_id"]] = doc["count"]

    # Company rankings
    comp_counts = {}
    async for doc in db.tracked_jobs.aggregate([{"$match": {"company": {"$ne": ""}}}, {"$group": {"_id": "$company", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 10}]):
        comp_counts[doc["_id"]] = doc["count"]

    # Salary analysis by position type
    salary_data = []
    async for doc in db.tracked_jobs.find({"salary": {"$ne": ""}}, {"position": 1, "salary": 1, "_id": 0}):
        salary_data.append({"position": doc.get("position", ""), "salary": doc.get("salary", "")})

    # Source effectiveness
    source_perf = {}
    async for doc in db.tracked_jobs.aggregate([
        {"$group": {"_id": {"source": "$source", "status": "$status"}, "count": {"$sum": 1}}}
    ]):
        src = doc["_id"].get("source", "Unknown")
        status = doc["_id"].get("status", "Unknown")
        if src not in source_perf:
            source_perf[src] = {"total": 0, "interview": 0, "offer": 0, "rejected": 0}
        source_perf[src]["total"] += doc["count"]
        if status == "Interview":
            source_perf[src]["interview"] += doc["count"]
        elif status == "Offer":
            source_perf[src]["offer"] += doc["count"]
        elif status == "Rejected":
            source_perf[src]["rejected"] += doc["count"]

    # Performance by role type
    role_perf = {}
    async for doc in db.tracked_jobs.find({}, {"position": 1, "status": 1, "_id": 0}):
        pos = doc.get("position", "Other")
        role_key = pos.split(" ")[0] if pos else "Other"  # Group by first word
        if role_key not in role_perf:
            role_perf[role_key] = {"total": 0, "interview": 0, "offer": 0}
        role_perf[role_key]["total"] += 1
        if doc.get("status") == "Interview":
            role_perf[role_key]["interview"] += 1
        elif doc.get("status") == "Offer":
            role_perf[role_key]["offer"] += 1

    # Application funnel
    funnel = {}
    async for doc in db.tracked_jobs.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]):
        funnel[doc["_id"] or "Unknown"] = doc["count"]

    return {
        "total_applications": total,
        "tech_trends": tech_trends,
        "location_analysis": [{"name": k, "count": v} for k, v in loc_counts.items()],
        "company_rankings": [{"name": k, "count": v} for k, v in comp_counts.items()],
        "salary_data": salary_data[:50],
        "source_effectiveness": source_perf,
        "role_performance": role_perf,
        "funnel": funnel
    }

@api_router.get("/market/ai-insights")
async def get_ai_insights():
    resume = await db.resumes.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    total = await db.tracked_jobs.count_documents({})
    tech_raw = {}
    async for doc in db.tracked_jobs.find({"technology": {"$ne": ""}}, {"technology": 1, "_id": 0}):
        for t in doc.get("technology", "").split(","):
            t = t.strip()
            if t:
                tech_raw[t] = tech_raw.get(t, 0) + 1
    top_tech = sorted(tech_raw.items(), key=lambda x: -x[1])[:10]
    funnel = {}
    async for doc in db.tracked_jobs.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]):
        funnel[doc["_id"] or "Unknown"] = doc["count"]
    try:
        chat = LlmChat(api_key=LLM_KEY, session_id=f"market-{uuid.uuid4()}",
            system_message="You are a career strategist for the Australian IT market. Respond with valid JSON."
        ).with_model("gemini", "gemini-2.5-flash")
        skills = ", ".join(resume.get("analysis", {}).get("skills", [])) if resume else "Unknown"
        prompt = f"""Analyze this job search data and provide strategic insights:
Candidate skills: {skills}
Total applications: {total}
Application funnel: {json.dumps(funnel)}
Top technologies in demand: {json.dumps(top_tech)}

Return JSON:
{{"market_summary": "2-3 sentence market overview",
"strategic_advice": ["5 actionable tips"],
"hot_skills": ["top 5 skills to highlight"],
"weak_spots": ["2-3 areas to improve"],
"salary_insight": "brief salary market comment",
"best_strategy": "recommended job search strategy"}}"""
        response = await chat.send_message(UserMessage(text=prompt))
        return parse_ai_json(response)
    except Exception as e:
        logger.error(f"AI insights failed: {e}")
        return {"market_summary": "Upload resume and track more applications for AI insights.", "strategic_advice": [], "hot_skills": [], "weak_spots": [], "salary_insight": "", "best_strategy": ""}

# ─── ATS Check Routes ───
@api_router.post("/ats/check")
async def ats_check(req: ATSCheckRequest):
    resume = await db.resumes.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    if req.cv_profile_id:
        profile = await db.cv_profiles.find_one({"id": req.cv_profile_id}, {"_id": 0})
        if profile:
            resume = profile
    if not resume:
        raise HTTPException(status_code=400, detail="Upload a resume first")
    analysis = resume.get("analysis", {})
    skills = ", ".join(analysis.get("skills", []))
    try:
        chat = LlmChat(api_key=LLM_KEY, session_id=f"ats-{uuid.uuid4()}",
            system_message="You are an ATS optimization expert. Respond with valid JSON only."
        ).with_model("gemini", "gemini-2.5-flash")
        prompt = f"""ATS compatibility check:
Resume skills: {skills}
Resume summary: {analysis.get('summary', '')}
Target job: {req.job_title}
Job description: {req.job_description or 'Not provided'}

Return JSON:
{{"ats_score": 75, "keyword_match": ["matched keywords"], "missing_keywords": ["keywords to add"],
"format_issues": ["formatting problems"], "suggestions": ["5 specific improvements"],
"keyword_density_ok": true, "overall_verdict": "Good/Needs Work/Poor"}}"""
        response = await chat.send_message(UserMessage(text=prompt))
        result = parse_ai_json(response)
        doc = {"id": str(uuid.uuid4()), "job_title": req.job_title, **result, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.ats_checks.insert_one(doc)
        doc.pop("_id", None)
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Skill Gap Routes ───
@api_router.post("/skills/gap-analysis")
async def skill_gap_analysis(req: SkillGapRequest):
    resume = await db.resumes.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    if not resume:
        raise HTTPException(status_code=400, detail="Upload a resume first")
    analysis = resume.get("analysis", {})
    tech_raw = {}
    async for doc in db.tracked_jobs.find({"technology": {"$ne": ""}}, {"technology": 1, "_id": 0}):
        for t in doc.get("technology", "").split(","):
            t = t.strip()
            if t:
                tech_raw[t] = tech_raw.get(t, 0) + 1
    top_market = sorted(tech_raw.items(), key=lambda x: -x[1])[:15]
    try:
        chat = LlmChat(api_key=LLM_KEY, session_id=f"skillgap-{uuid.uuid4()}",
            system_message="You are a career development advisor for Australian IT market. JSON only."
        ).with_model("gemini", "gemini-2.5-flash")
        prompt = f"""Skill gap analysis:
Current skills: {', '.join(analysis.get('skills', []))}
Target role: {req.target_role or analysis.get('preferred_titles', [''])[0]}
Market demand (from tracked jobs): {json.dumps(top_market)}
Seniority: {analysis.get('seniority', 'Mid')}

Return JSON:
{{"current_strengths": ["top 5 strengths"],
"skill_gaps": [{{"skill": "name", "importance": "Critical/High/Medium", "reason": "why needed", "learning_time": "estimated weeks"}}],
"study_plan": [{{"skill": "name", "resources": ["course/resource name"], "project_idea": "practice project"}}],
"cv_update_suggestions": ["specific CV improvements"],
"priority_order": ["skills to learn in order of ROI"]}}"""
        response = await chat.send_message(UserMessage(text=prompt))
        return parse_ai_json(response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── App Setup ───
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
