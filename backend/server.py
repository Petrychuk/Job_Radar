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

    semaphore = asyncio.Semaphore(5)
    tasks = [scrape_single_site(site, keywords, semaphore) for site in JOB_SITES if site.get('active')]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    scan_results = []
    for r in results:
        if isinstance(r, Exception):
            continue
        scan_results.append(r)

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
            links.append({"site_id": site['id'], "site_name": site['name'], "site_url": site['url'], "search_url": search_url})
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

    headers = ["#", "Date Posted", "Company", "Source", "Position", "Salary", "Location", "Technology", "Status", "Link", "Contact", "Notes"]
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
        ws.cell(row=idx+1, column=10, value=job.get('link', '') or job.get('site_url', ''))
        ws.cell(row=idx+1, column=11, value=job.get('contact', ''))
        ws.cell(row=idx+1, column=12, value=job.get('notes', ''))

        sc = job.get('status', '')
        if sc in status_colors:
            ws.cell(row=idx+1, column=9).font = Font(color=status_colors[sc], bold=True)

    widths = {'A': 5, 'B': 14, 'C': 25, 'D': 18, 'E': 35, 'F': 15, 'G': 20, 'H': 30, 'I': 12, 'J': 45, 'K': 25, 'L': 30}
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
    return JOB_SITES

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
