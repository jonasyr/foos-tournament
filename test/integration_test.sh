#!/bin/bash
# Integration Test Suite for Quick Match Feature
# Tests end-to-end flow: create match → fetch match → verify structure

set -e  # Exit on error

API_KEY='change-me-supersecret'
BASE_URL='http://192.168.178.165:4567'

echo "========================================="
echo "Quick Match Integration Test Suite"
echo "========================================="
echo ""

# Test 1: Singles Quick Match
echo "Test 1: Singles Quick Match (target_score=5)"
echo "---------------------------------------------"
MATCH_ID=$(curl -s -X POST ${BASE_URL}/api/create_quick_match \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"division_id": 1, "player_ids": [1,3], "mode": "singles", "target_score": 5}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['match']['id'])")

echo "✅ Created singles match ID: ${MATCH_ID}"

SUBMATCH_COUNT=$(curl -s ${BASE_URL}/api/get_open_matches \
  | python3 -c "import sys, json; data = json.load(sys.stdin); match = next((m for div in data for m in div['matches'] if m.get('id') == ${MATCH_ID}), None); print(len(match['submatches']))")

if [ "$SUBMATCH_COUNT" == "1" ]; then
  echo "✅ Singles match has 1 submatch"
else
  echo "❌ Expected 1 submatch, got ${SUBMATCH_COUNT}"
  exit 1
fi

SUBMATCH_STRUCTURE=$(curl -s ${BASE_URL}/api/get_open_matches \
  | python3 -c "import sys, json; data = json.load(sys.stdin); match = next((m for div in data for m in div['matches'] if m.get('id') == ${MATCH_ID}), None); s = match['submatches'][0]; print(f'{len(s[0])},{len(s[1])}')")

if [ "$SUBMATCH_STRUCTURE" == "1,1" ]; then
  echo "✅ Submatch structure is [[p1], [p2]]"
else
  echo "❌ Expected [[p1], [p2]], got different structure"
  exit 1
fi

echo ""

# Test 2: Doubles Quick Match
echo "Test 2: Doubles Quick Match (target_score=10)"
echo "----------------------------------------------"
MATCH_ID=$(curl -s -X POST ${BASE_URL}/api/create_quick_match \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"division_id": 1, "player_ids": [1,2,3,4], "mode": "doubles", "target_score": 10}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['match']['id'])")

echo "✅ Created doubles match ID: ${MATCH_ID}"

SUBMATCH_COUNT=$(curl -s ${BASE_URL}/api/get_open_matches \
  | python3 -c "import sys, json; data = json.load(sys.stdin); match = next((m for div in data for m in div['matches'] if m.get('id') == ${MATCH_ID}), None); print(len(match['submatches']))")

if [ "$SUBMATCH_COUNT" == "1" ]; then
  echo "✅ Doubles match has 1 submatch"
else
  echo "❌ Expected 1 submatch, got ${SUBMATCH_COUNT}"
  exit 1
fi

SUBMATCH_STRUCTURE=$(curl -s ${BASE_URL}/api/get_open_matches \
  | python3 -c "import sys, json; data = json.load(sys.stdin); match = next((m for div in data for m in div['matches'] if m.get('id') == ${MATCH_ID}), None); s = match['submatches'][0]; print(f'{len(s[0])},{len(s[1])}')")

if [ "$SUBMATCH_STRUCTURE" == "2,2" ]; then
  echo "✅ Submatch structure is [[p1,p2], [p3,p4]]"
else
  echo "❌ Expected [[p1,p2], [p3,p4]], got different structure"
  exit 1
fi

echo ""

# Test 3: Best-of-3 Singles
echo "Test 3: Best-of-3 Singles Match (target_score=3)"
echo "-------------------------------------------------"
MATCH_ID=$(curl -s -X POST ${BASE_URL}/api/create_quick_match \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"division_id": 1, "player_ids": [1,3], "mode": "singles", "win_condition": "best_of", "target_score": 3}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['match']['id'])")

echo "✅ Created best-of-3 singles match ID: ${MATCH_ID}"

SUBMATCH_COUNT=$(curl -s ${BASE_URL}/api/get_open_matches \
  | python3 -c "import sys, json; data = json.load(sys.stdin); match = next((m for div in data for m in div['matches'] if m.get('id') == ${MATCH_ID}), None); print(len(match['submatches']))")

if [ "$SUBMATCH_COUNT" == "3" ]; then
  echo "✅ Best-of-3 match has 3 submatches"
else
  echo "❌ Expected 3 submatches, got ${SUBMATCH_COUNT}"
  exit 1
fi

ALL_IDENTICAL=$(curl -s ${BASE_URL}/api/get_open_matches \
  | python3 -c "import sys, json; data = json.load(sys.stdin); match = next((m for div in data for m in div['matches'] if m.get('id') == ${MATCH_ID}), None); s = match['submatches']; print('true' if s[0] == s[1] == s[2] else 'false')")

if [ "$ALL_IDENTICAL" == "true" ]; then
  echo "✅ All 3 submatches are identical"
else
  echo "❌ Expected all submatches to be identical"
  exit 1
fi

echo ""

# Test 4: Best-of-3 Doubles
echo "Test 4: Best-of-3 Doubles Match (target_score=5)"
echo "-------------------------------------------------"
MATCH_ID=$(curl -s -X POST ${BASE_URL}/api/create_quick_match \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"division_id": 1, "player_ids": [1,2,3,4], "mode": "doubles", "win_condition": "best_of", "target_score": 5}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['match']['id'])")

echo "✅ Created best-of-3 doubles match ID: ${MATCH_ID}"

SUBMATCH_COUNT=$(curl -s ${BASE_URL}/api/get_open_matches \
  | python3 -c "import sys, json; data = json.load(sys.stdin); match = next((m for div in data for m in div['matches'] if m.get('id') == ${MATCH_ID}), None); print(len(match['submatches']))")

if [ "$SUBMATCH_COUNT" == "3" ]; then
  echo "✅ Best-of-3 doubles has 3 submatches"
else
  echo "❌ Expected 3 submatches, got ${SUBMATCH_COUNT}"
  exit 1
fi

SUBMATCH_STRUCTURE=$(curl -s ${BASE_URL}/api/get_open_matches \
  | python3 -c "import sys, json; data = json.load(sys.stdin); match = next((m for div in data for m in div['matches'] if m.get('id') == ${MATCH_ID}), None); s = match['submatches'][0]; print(f'{len(s[0])},{len(s[1])}')")

if [ "$SUBMATCH_STRUCTURE" == "2,2" ]; then
  echo "✅ Each submatch has structure [[p1,p2], [p3,p4]]"
else
  echo "❌ Expected [[p1,p2], [p3,p4]] structure"
  exit 1
fi

echo ""
echo "========================================="
echo "✅ All Integration Tests PASSED!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Singles quick match: ✅"
echo "- Doubles quick match: ✅"
echo "- Best-of-3 singles: ✅"
echo "- Best-of-3 doubles: ✅"
echo ""
echo "The quick match feature is working correctly!"
echo "Server properly generates submatches for all match types."
