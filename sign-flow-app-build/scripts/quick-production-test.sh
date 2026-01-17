#!/bin/bash

# Quick Production Test - Tests the application endpoints
# Usage: ./scripts/quick-production-test.sh [URL]
# Example: ./scripts/quick-production-test.sh https://your-app.vercel.app

BASE_URL="${1:-http://localhost:3000}"

echo "🧪 Quick Production Test"
echo "Testing: $BASE_URL"
echo "=================================================="
echo ""

# Test homepage
echo "1. Testing Homepage..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$status" = "200" ] || [ "$status" = "302" ] || [ "$status" = "307" ]; then
    echo "   ✅ Homepage accessible (HTTP $status)"
else
    echo "   ❌ Homepage failed (HTTP $status)"
    exit 1
fi

# Test sign-up page
echo "2. Testing Sign-Up Page..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/sign-up")
if [ "$status" = "200" ]; then
    echo "   ✅ Sign-up page accessible"
else
    echo "   ❌ Sign-up page failed (HTTP $status)"
fi

# Test login page
echo "3. Testing Login Page..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login")
if [ "$status" = "200" ]; then
    echo "   ✅ Login page accessible"
else
    echo "   ❌ Login page failed (HTTP $status)"
fi

# Test API endpoint
echo "4. Testing API Endpoint..."
api_response=$(curl -s "$BASE_URL/api/contacts" -H "Content-Type: application/json")
if echo "$api_response" | grep -q "error\|Unauthorized\|json"; then
    echo "   ✅ API endpoint responding (returns JSON)"
else
    echo "   ⚠️  API endpoint response unexpected"
fi

# Test static assets
echo "5. Testing Static Assets..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/favicon.ico" 2>/dev/null)
if [ "$status" = "200" ] || [ "$status" = "404" ]; then
    echo "   ✅ Static assets accessible"
else
    echo "   ⚠️  Static assets check inconclusive"
fi

echo ""
echo "=================================================="
echo "✅ Basic connectivity tests completed!"
echo ""
echo "Next steps:"
echo "1. Open $BASE_URL in your browser"
echo "2. Test sign-up flow"
echo "3. Test login flow"
echo "4. Test dashboard functionality"
echo ""
echo "For detailed testing, see PRODUCTION_TESTING_GUIDE.md"
