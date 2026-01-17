#!/bin/bash

# Production Testing Script for Deployed Applications
# Tests a deployed SignFlow instance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get URL from argument or use default
BASE_URL="${1:-http://localhost:3000}"

echo "🧪 Testing Production Deployment"
echo "URL: $BASE_URL"
echo "=================================================="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>&1)
    
    if [ "$response" = "$expected_status" ] || [ "$response" = "302" ] || [ "$response" = "307" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $response, expected $expected_status)"
        ((FAILED++))
        return 1
    fi
}

test_content() {
    local name=$1
    local endpoint=$2
    local search_term=$3
    
    echo -n "Testing $name... "
    
    content=$(curl -s "$BASE_URL$endpoint" 2>&1)
    
    if echo "$content" | grep -q "$search_term"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Content not found)"
        ((FAILED++))
        return 1
    fi
}

# Test homepage (should redirect)
echo "📄 Testing Pages:"
test_endpoint "Homepage" "/" "302"

# Test auth pages
test_endpoint "Sign Up Page" "/auth/sign-up" "200"
test_endpoint "Login Page" "/auth/login" "200"

# Test API endpoints (should return JSON errors, not HTML)
echo ""
echo "🔌 Testing API Endpoints:"
api_response=$(curl -s "$BASE_URL/api/contacts" -H "Content-Type: application/json")
if echo "$api_response" | grep -q "error\|Unauthorized\|json"; then
    echo -e "Testing Contacts API... ${GREEN}✅ PASS${NC} (Returns JSON)"
    ((PASSED++))
else
    echo -e "Testing Contacts API... ${YELLOW}⚠️  WARN${NC} (Unexpected response)"
    ((WARNINGS++))
fi

# Test static assets
echo ""
echo "📦 Testing Static Assets:"
test_endpoint "Favicon" "/favicon.ico" "200"

# Summary
echo ""
echo "=================================================="
echo "📊 Summary:"
echo -e "   ${GREEN}✅ Passed: $PASSED${NC}"
echo -e "   ${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "   ${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Production tests PASSED${NC}"
    echo "Your application is working correctly!"
    exit 0
else
    echo -e "${RED}❌ Production tests FAILED${NC}"
    echo "Please check the errors above."
    exit 1
fi
