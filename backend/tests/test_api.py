"""
Backend API Tests for Job Radar Application
Tests: Market Intelligence, CV Profiles, ATS Check, Wishlist, Statistics, and core APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealth:
    """Basic health checks"""
    
    def test_api_health(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/resume")
        # Should return 200 even if no resume
        assert response.status_code == 200


class TestMarketIntelligence:
    """Market Intelligence API tests"""
    
    def test_market_intelligence_endpoint(self):
        """Test /api/market/intelligence returns valid data"""
        response = requests.get(f"{BASE_URL}/api/market/intelligence")
        assert response.status_code == 200
        
        data = response.json()
        # Verify expected structure
        assert "total_applications" in data
        assert "tech_trends" in data
        assert "location_analysis" in data
        assert "funnel" in data
        print(f"Market Intelligence: {data['total_applications']} applications tracked")
    
    def test_market_intelligence_has_charts_data(self):
        """Verify market intelligence returns chart-compatible data"""
        response = requests.get(f"{BASE_URL}/api/market/intelligence")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify tech_trends structure (for Tech Demand chart)
        if data.get("tech_trends"):
            for trend in data["tech_trends"]:
                assert "name" in trend
                assert "count" in trend
        
        # Verify location_analysis structure (for Jobs by Location chart)
        if data.get("location_analysis"):
            for loc in data["location_analysis"]:
                assert "name" in loc
                assert "count" in loc
        
        # Verify funnel structure (for Application Funnel)
        assert isinstance(data.get("funnel", {}), dict)


class TestCVProfiles:
    """CV Profiles API tests"""
    
    def test_get_profiles_endpoint(self):
        """Test /api/profiles returns list of CV profiles"""
        response = requests.get(f"{BASE_URL}/api/profiles")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"CV Profiles: {len(data)} profiles found")
        
        # Verify profile structure if profiles exist
        if len(data) > 0:
            profile = data[0]
            assert "id" in profile
            assert "name" in profile
            assert "profile_type" in profile


class TestATSCheck:
    """ATS Check API tests"""
    
    def test_ats_check_endpoint_with_resume(self):
        """Test /api/ats/check returns ATS compatibility report"""
        payload = {
            "job_title": "Software Engineer",
            "job_description": "Python, FastAPI, React developer role"
        }
        response = requests.post(f"{BASE_URL}/api/ats/check", json=payload, timeout=60)
        
        # Check if resume exists
        if response.status_code == 400:
            data = response.json()
            assert "resume" in data.get("detail", "").lower()
            print("ATS Check: No resume uploaded - expected behavior")
        else:
            assert response.status_code == 200
            data = response.json()
            
            # Verify ATS report structure
            assert "ats_score" in data
            assert "keyword_match" in data
            assert "missing_keywords" in data
            assert "suggestions" in data
            assert "overall_verdict" in data
            print(f"ATS Check: Score {data.get('ats_score')}/100")


class TestWishlist:
    """Wishlist API tests"""
    
    def test_get_wishlist(self):
        """Test /api/wishlist returns saved jobs"""
        response = requests.get(f"{BASE_URL}/api/wishlist")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Wishlist: {len(data)} saved items")


class TestStatistics:
    """Statistics API tests"""
    
    def test_get_statistics(self):
        """Test /api/stats returns application statistics"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        
        data = response.json()
        # Verify stats structure
        assert "by_status" in data or "status_counts" in data or isinstance(data, dict)
        print(f"Statistics: Retrieved successfully")


class TestJobTracker:
    """Job Tracker API tests"""
    
    def test_get_tracker_jobs(self):
        """Test /api/tracker returns tracked jobs"""
        response = requests.get(f"{BASE_URL}/api/tracker")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Job Tracker: {len(data)} jobs tracked")
        
        # Verify job structure if jobs exist
        if len(data) > 0:
            job = data[0]
            assert "id" in job
            assert "company" in job
            assert "position" in job


class TestJobSearch:
    """Job Search API tests"""
    
    def test_get_search_links(self):
        """Test /api/jobs/search-links returns job site links"""
        response = requests.get(f"{BASE_URL}/api/jobs/search-links", params={"keyword": "Engineer"})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should return at least some job site links"
        
        # Verify link structure
        link = data[0]
        assert "site_name" in link
        assert "search_url" in link
        print(f"Job Search Links: {len(data)} sites returned")
    
    def test_get_sites(self):
        """Test /api/sites returns configured job sites"""
        response = requests.get(f"{BASE_URL}/api/sites")
        assert response.status_code == 200
        
        data = response.json()
        # API returns object with built_in and custom lists
        assert isinstance(data, dict)
        assert "built_in" in data
        assert "custom" in data
        assert isinstance(data["built_in"], list)
        print(f"Job Sites: {len(data['built_in'])} built-in + {len(data['custom'])} custom sites")


class TestResume:
    """Resume API tests"""
    
    def test_get_resume(self):
        """Test /api/resume returns resume data"""
        response = requests.get(f"{BASE_URL}/api/resume")
        assert response.status_code == 200
        
        data = response.json()
        # Returns null if no resume or resume object
        if data:
            assert "analysis" in data or "filename" in data
            print("Resume: Found uploaded resume")
        else:
            print("Resume: No resume uploaded")


class TestCronJobs:
    """Cron Jobs API tests"""
    
    def test_get_cron_jobs(self):
        """Test /api/cron/jobs returns scheduled jobs"""
        response = requests.get(f"{BASE_URL}/api/cron/jobs")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Cron Jobs: {len(data)} scheduled jobs")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
