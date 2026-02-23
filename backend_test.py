#!/usr/bin/env python3
"""
Comprehensive backend API testing for Job Radar application.
Tests all backend endpoints under /api prefix.
"""

import requests
import json
import sys
from datetime import datetime
from pathlib import Path

class JobRadarAPITester:
    def __init__(self, base_url="https://job-radar-pro.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, error_msg="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            self.failed_tests.append({"test": name, "error": error_msg, "response": response_data})
            print(f"❌ {name} - FAILED: {error_msg}")

    def test_api_endpoint(self, method, endpoint, expected_status, data=None, files=None, timeout=30):
        """Generic API test method"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=timeout)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json() if response.status_code != 204 else {}
            except:
                response_data = {"raw_response": response.text[:200]}
                
            return success, response_data, response.status_code

        except Exception as e:
            return False, {"error": str(e)}, 0

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Job Radar Backend API Testing...\n")
        
        # Test 1: Sites Configuration
        print("📍 Testing Sites Configuration...")
        success, data, status_code = self.test_api_endpoint('GET', 'sites', 200)
        if success and isinstance(data, list) and len(data) >= 18:
            self.log_test("GET /api/sites - Sites list", True)
            print(f"   Found {len(data)} job sites configured")
        else:
            self.log_test("GET /api/sites - Sites list", False, f"Expected array of 18+ sites, got {type(data)} with status {status_code}")

        # Test 2: Job Search Links
        print("\n🔍 Testing Job Search...")
        success, data, status_code = self.test_api_endpoint('GET', 'jobs/search-links?keyword=software+developer', 200)
        if success and isinstance(data, list) and len(data) > 0:
            self.log_test("GET /api/jobs/search-links", True)
            print(f"   Generated {len(data)} search links")
        else:
            self.log_test("GET /api/jobs/search-links", False, f"Expected search links array, got status {status_code}")

        # Test 3: Job Tracker - Get (empty initially)
        print("\n📊 Testing Job Tracker...")
        success, data, status_code = self.test_api_endpoint('GET', 'tracker', 200)
        if success and isinstance(data, list):
            self.log_test("GET /api/tracker - Get tracked jobs", True)
            print(f"   Found {len(data)} tracked jobs")
        else:
            self.log_test("GET /api/tracker - Get tracked jobs", False, f"Expected jobs array, got status {status_code}")

        # Test 4: Job Tracker - Create new job
        test_job_data = {
            "position": "Test Software Engineer",
            "company": "Test Company Ltd",
            "date_posted": "2025-01-01",
            "salary": "$80,000 - $100,000",
            "location": "Sydney, NSW",
            "technology": "Python, React, FastAPI",
            "status": "New",
            "source": "Test Site",
            "link": "https://example.com/job/123",
            "contact": "hr@testcompany.com",
            "notes": "Test job entry for API validation"
        }

        success, data, status_code = self.test_api_endpoint('POST', 'tracker', 201, test_job_data)
        created_job_id = None
        if success and data and 'id' in data:
            created_job_id = data['id']
            self.log_test("POST /api/tracker - Create job", True)
            print(f"   Created job with ID: {created_job_id}")
        else:
            self.log_test("POST /api/tracker - Create job", False, f"Expected job creation with 201, got status {status_code}")

        # Test 5: Job Tracker - Update job (if created successfully)
        if created_job_id:
            update_data = {"status": "Applied", "notes": "Updated via API test"}
            success, data, status_code = self.test_api_endpoint('PUT', f'tracker/{created_job_id}', 200, update_data)
            if success and data and data.get('status') == 'Applied':
                self.log_test("PUT /api/tracker/{id} - Update job", True)
            else:
                self.log_test("PUT /api/tracker/{id} - Update job", False, f"Status update failed, got status {status_code}")

        # Test 6: Stats API
        print("\n📈 Testing Statistics...")
        success, data, status_code = self.test_api_endpoint('GET', 'stats', 200)
        if success and isinstance(data, dict) and 'total' in data:
            self.log_test("GET /api/stats - Statistics", True)
            print(f"   Stats: {data.get('total', 0)} total jobs")
        else:
            self.log_test("GET /api/stats - Statistics", False, f"Expected stats object, got status {status_code}")

        # Test 7: Excel Export
        print("\n📄 Testing Excel Export...")
        url = f"{self.base_url}/api/tracker/export"
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200 and response.headers.get('content-type', '').startswith('application/vnd.openxmlformats'):
                self.log_test("GET /api/tracker/export - Excel export", True)
                print(f"   Excel file size: {len(response.content)} bytes")
            else:
                self.log_test("GET /api/tracker/export - Excel export", False, f"Expected Excel file, got status {response.status_code}")
        except Exception as e:
            self.log_test("GET /api/tracker/export - Excel export", False, str(e))

        # Test 8: Resume APIs (GET without upload)
        print("\n📄 Testing Resume APIs...")
        success, data, status_code = self.test_api_endpoint('GET', 'resume', 200)
        # Note: This might return null if no resume uploaded, which is expected
        self.log_test("GET /api/resume - Get resume", True if status_code == 200 else False, 
                     f"Got status {status_code}" if status_code != 200 else "")

        # Test 9: Jobs API (GET without scan)
        success, data, status_code = self.test_api_endpoint('GET', 'jobs', 200)
        # Note: This might return null if no scan performed, which is expected
        self.log_test("GET /api/jobs - Get job scan results", True if status_code == 200 else False,
                     f"Got status {status_code}" if status_code != 200 else "")

        # Test 10: Wishlist APIs
        print("\n💝 Testing Wishlist APIs...")
        success, data, status_code = self.test_api_endpoint('GET', 'wishlist', 200)
        if success and isinstance(data, list):
            self.log_test("GET /api/wishlist - Get wishlist", True)
            print(f"   Found {len(data)} wishlist items")
        else:
            self.log_test("GET /api/wishlist - Get wishlist", False, f"Expected wishlist array, got status {status_code}")

        # Create wishlist item
        wishlist_item = {
            "title": "Test QA Engineer",
            "company_type": "Tech Startup",
            "match_score": 85,
            "salary_range": "$70k - $90k AUD",
            "why_match": "Great match for testing skills",
            "search_keywords": ["QA", "testing", "selenium"]
        }
        success, data, status_code = self.test_api_endpoint('POST', 'wishlist', 200, wishlist_item)
        wishlist_item_id = None
        if success and data and 'id' in data:
            wishlist_item_id = data['id']
            self.log_test("POST /api/wishlist - Create wishlist item", True)
            print(f"   Created wishlist item with ID: {wishlist_item_id}")
        else:
            self.log_test("POST /api/wishlist - Create wishlist item", False, f"Expected item creation, got status {status_code}")

        # Test wishlist apply and delete
        if wishlist_item_id:
            success, data, status_code = self.test_api_endpoint('POST', f'wishlist/{wishlist_item_id}/apply', 200)
            if success:
                self.log_test("POST /api/wishlist/{id}/apply - Apply from wishlist", True)
            else:
                self.log_test("POST /api/wishlist/{id}/apply - Apply from wishlist", False, f"Apply failed, got status {status_code}")

            success, data, status_code = self.test_api_endpoint('DELETE', f'wishlist/{wishlist_item_id}', 200)
            if success:
                self.log_test("DELETE /api/wishlist/{id} - Delete wishlist item", True)
            else:
                self.log_test("DELETE /api/wishlist/{id} - Delete wishlist item", False, f"Delete failed, got status {status_code}")

        # Test 11: Cron Jobs APIs
        print("\n⏰ Testing Cron Jobs APIs...")
        success, data, status_code = self.test_api_endpoint('GET', 'cron/jobs', 200)
        if success and isinstance(data, list):
            self.log_test("GET /api/cron/jobs - Get cron jobs", True)
            print(f"   Found {len(data)} cron jobs")
        else:
            self.log_test("GET /api/cron/jobs - Get cron jobs", False, f"Expected cron jobs array, got status {status_code}")

        # Create cron job
        cron_job = {
            "title": "Test Backend Developer Search",
            "keywords": ["python", "fastapi", "backend"],
            "location": "Australia",
            "active": True
        }
        success, data, status_code = self.test_api_endpoint('POST', 'cron/jobs', 200, cron_job)
        cron_job_id = None
        if success and data and 'id' in data:
            cron_job_id = data['id']
            self.log_test("POST /api/cron/jobs - Create cron job", True)
            print(f"   Created cron job with ID: {cron_job_id}")
        else:
            self.log_test("POST /api/cron/jobs - Create cron job", False, f"Expected cron job creation, got status {status_code}")

        # Test cron job operations
        if cron_job_id:
            # Run cron job (may take time)
            print("   Running cron job scan (may take 30+ seconds)...")
            success, data, status_code = self.test_api_endpoint('POST', f'cron/run/{cron_job_id}', 200, {}, None, 120)
            if success:
                self.log_test("POST /api/cron/run/{id} - Run cron job", True)
                print(f"   Scan completed, found {data.get('total_jobs_found', 0)} jobs")
            else:
                self.log_test("POST /api/cron/run/{id} - Run cron job", False, f"Cron run failed, got status {status_code}")

            success, data, status_code = self.test_api_endpoint('DELETE', f'cron/jobs/{cron_job_id}', 200)
            if success:
                self.log_test("DELETE /api/cron/jobs/{id} - Delete cron job", True)
            else:
                self.log_test("DELETE /api/cron/jobs/{id} - Delete cron job", False, f"Delete failed, got status {status_code}")

        # Test 12: Recommendations APIs
        print("\n🎯 Testing Recommendations APIs...")
        success, data, status_code = self.test_api_endpoint('POST', 'recommendations/hide?title=Test Job Title', 200)
        if success:
            self.log_test("POST /api/recommendations/hide - Hide recommendation", True)
        else:
            self.log_test("POST /api/recommendations/hide - Hide recommendation", False, f"Hide failed, got status {status_code}")

        success, data, status_code = self.test_api_endpoint('GET', 'recommendations/hidden', 200)
        if success and isinstance(data, list):
            self.log_test("GET /api/recommendations/hidden - Get hidden recommendations", True)
            print(f"   Found {len(data)} hidden recommendations")
        else:
            self.log_test("GET /api/recommendations/hidden - Get hidden recommendations", False, f"Expected hidden list, got status {status_code}")

        # Test 13: Document Generation (requires resume)
        print("\n📄 Testing Document Generation...")
        doc_request = {
            "job_title": "Senior Python Developer",
            "company_type": "Tech Startup",
            "salary_range": "$90k - $120k AUD",
            "why_match": "Perfect match for Python and FastAPI skills",
            "doc_type": "resume"
        }
        print("   Generating documents (may take 30+ seconds)...")
        success, data, status_code = self.test_api_endpoint('POST', 'documents/generate', 200, doc_request, None, 120)
        if success and data:
            self.log_test("POST /api/documents/generate - Generate documents", True)
            print(f"   Generated documents for: {doc_request['job_title']}")
        else:
            error_msg = f"Document generation failed, got status {status_code}"
            if status_code == 400:
                error_msg += " (may need resume upload first)"
            self.log_test("POST /api/documents/generate - Generate documents", False, error_msg)

        # Test 14: Job Tracker - Delete test job (cleanup)
        if created_job_id:
            success, data, status_code = self.test_api_endpoint('DELETE', f'tracker/{created_job_id}', 200)
            if success:
                self.log_test("DELETE /api/tracker/{id} - Delete job", True)
            else:
                self.log_test("DELETE /api/tracker/{id} - Delete job", False, f"Delete failed, got status {status_code}")

        # Test 15: API Error Handling - Invalid endpoints
        print("\n❌ Testing Error Handling...")
        success, data, status_code = self.test_api_endpoint('GET', 'nonexistent-endpoint', 404)
        if status_code == 404:
            self.log_test("GET /api/nonexistent-endpoint - 404 handling", True)
        else:
            self.log_test("GET /api/nonexistent-endpoint - 404 handling", False, f"Expected 404, got {status_code}")

        # Test 12: Invalid job ID
        success, data, status_code = self.test_api_endpoint('GET', 'tracker/invalid-id', 404)
        if status_code == 404:
            self.log_test("GET /api/tracker/invalid-id - Invalid ID handling", True)
        else:
            self.log_test("GET /api/tracker/invalid-id - Invalid ID handling", False, f"Expected 404, got {status_code}")

        self.print_summary()
        return self.tests_passed == self.tests_run

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print(f"🧪 BACKEND API TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        print(f"\n{'='*60}")

def main():
    print("Job Radar Backend API Tester")
    print("=" * 50)
    
    tester = JobRadarAPITester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())