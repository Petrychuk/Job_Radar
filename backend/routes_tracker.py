# Additional routes for Job Radar - Part 2
# Import and use in server.py

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import uuid, json
from datetime import datetime, timezone

# These will be imported from server.py
# api_router, db_pool, require_user, TrackedJobCreate, TrackedJobUpdate, etc.

def add_tracker_routes(router, pool, require_user_dep, models):
    """Add tracker routes to the main router"""
    
    @router.get("/tracker")
    async def get_tracked_jobs(status: Optional[str] = None, user: dict = Depends(require_user_dep)):
        async with pool.acquire() as conn:
            if status and status != "All":
                jobs = await conn.fetch(
                    "SELECT * FROM tracked_jobs WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC",
                    uuid.UUID(user['id']), status
                )
            else:
                jobs = await conn.fetch(
                    "SELECT * FROM tracked_jobs WHERE user_id = $1 ORDER BY created_at DESC",
                    uuid.UUID(user['id'])
                )
            
            return [{**dict(j), 'id': str(j['id']), 'user_id': str(j['user_id'])} for j in jobs]

    @router.post("/tracker")
    async def add_tracked_job(job: models['TrackedJobCreate'], user: dict = Depends(require_user_dep)):
        async with pool.acquire() as conn:
            job_id = uuid.uuid4()
            data = job.model_dump()
            await conn.execute(
                """INSERT INTO tracked_jobs (
                    id, user_id, date_posted, company, site_url, position, salary, location,
                    technology, status, source, link, contact, notes, work_mode, contract_type,
                    visa_sponsorship, date_applied, response_date, interview_stages, rejection_reason,
                    recruiter_name, follow_up_date, linkedin_connection, cv_profile_used, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)""",
                job_id, uuid.UUID(user['id']), data['date_posted'], data['company'], data['site_url'],
                data['position'], data['salary'], data['location'], data['technology'], data['status'],
                data['source'], data['link'], data['contact'], data['notes'], data['work_mode'],
                data['contract_type'], data['visa_sponsorship'], data['date_applied'], data['response_date'],
                data['interview_stages'], data['rejection_reason'], data['recruiter_name'], data['follow_up_date'],
                data['linkedin_connection'], data['cv_profile_used'], datetime.now(timezone.utc), datetime.now(timezone.utc)
            )
            
            result = await conn.fetchrow("SELECT * FROM tracked_jobs WHERE id = $1", job_id)
            return {**dict(result), 'id': str(result['id']), 'user_id': str(result['user_id'])}

    @router.put("/tracker/{job_id}")
    async def update_tracked_job(job_id: str, updates: models['TrackedJobUpdate'], user: dict = Depends(require_user_dep)):
        async with pool.acquire() as conn:
            update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
            if not update_data:
                raise HTTPException(status_code=400, detail="No updates provided")
            
            set_clause = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(update_data.keys())])
            set_clause += f", updated_at = ${len(update_data)+2}"
            params = [uuid.UUID(job_id)] + list(update_data.values()) + [datetime.now(timezone.utc)]
            
            result = await conn.execute(
                f"UPDATE tracked_jobs SET {set_clause} WHERE id = $1 AND user_id = ${len(update_data)+3}",
                *params, uuid.UUID(user['id'])
            )
            
            if result == "UPDATE 0":
                raise HTTPException(status_code=404, detail="Job not found")
            
            updated = await conn.fetchrow("SELECT * FROM tracked_jobs WHERE id = $1", uuid.UUID(job_id))
            return {**dict(updated), 'id': str(updated['id']), 'user_id': str(updated['user_id'])}

    @router.delete("/tracker/{job_id}")
    async def delete_tracked_job(job_id: str, user: dict = Depends(require_user_dep)):
        async with pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM tracked_jobs WHERE id = $1 AND user_id = $2",
                uuid.UUID(job_id), uuid.UUID(user['id'])
            )
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Job not found")
            return {"message": "Deleted"}

    return router
