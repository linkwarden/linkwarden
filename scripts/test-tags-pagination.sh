#!/bin/bash

# Test script for tags pagination
# Usage: LINKWARDEN_BASE_URL=https://... LINKWARDEN_TOKEN=... ./test-tags-pagination.sh

if [ -z "$LINKWARDEN_BASE_URL" ] || [ -z "$LINKWARDEN_TOKEN" ]; then
    echo "Error: Please set LINKWARDEN_BASE_URL and LINKWARDEN_TOKEN environment variables"
    exit 1
fi

echo "=== Testing Tags Pagination ==="
echo ""

# Test 1: Basic pagination - first page
echo "Test 1: Get first page of tags (limit=10)"
curl -s -X GET "${LINKWARDEN_BASE_URL}/api/v1/tags?limit=10" \
  -H "Authorization: Bearer ${LINKWARDEN_TOKEN}" \
  -H "Content-Type: application/json" | jq '{
    success: .success,
    itemCount: (.response.items | length),
    nextCursor: .response.nextCursor,
    hasMore: .response.hasMore,
    firstTag: .response.items[0].name
  }'
echo ""

# Test 2: Get second page
echo "Test 2: Get second page of tags (using cursor from page 1)"
CURSOR=$(curl -s -X GET "${LINKWARDEN_BASE_URL}/api/v1/tags?limit=10" \
  -H "Authorization: Bearer ${LINKWARDEN_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.response.nextCursor')

if [ "$CURSOR" != "null" ]; then
    curl -s -X GET "${LINKWARDEN_BASE_URL}/api/v1/tags?limit=10&cursor=$CURSOR" \
      -H "Authorization: Bearer ${LINKWARDEN_TOKEN}" \
      -H "Content-Type: application/json" | jq '{
        success: .success,
        itemCount: (.response.items | length),
        nextCursor: .response.nextCursor,
        hasMore: .response.hasMore,
        firstTag: .response.items[0].name
      }'
else
    echo "No second page (less than 10 tags total)"
fi
echo ""

# Test 3: Sort by name ascending
echo "Test 3: Sort by name ascending"
curl -s -X GET "${LINKWARDEN_BASE_URL}/api/v1/tags?sort=name&dir=asc&limit=5" \
  -H "Authorization: Bearer ${LINKWARDEN_TOKEN}" \
  -H "Content-Type: application/json" | jq '{
    success: .success,
    tags: [.response.items[] | .name]
  }'
echo ""

# Test 4: Sort by name descending
echo "Test 4: Sort by name descending"
curl -s -X GET "${LINKWARDEN_BASE_URL}/api/v1/tags?sort=name&dir=desc&limit=5" \
  -H "Authorization: Bearer ${LINKWARDEN_TOKEN}" \
  -H "Content-Type: application/json" | jq '{
    success: .success,
    tags: [.response.items[] | .name]
  }'
echo ""

# Test 5: Search for tags
echo "Test 5: Search for tags containing 'react'"
curl -s -X GET "${LINKWARDEN_BASE_URL}/api/v1/tags?search=react&limit=10" \
  -H "Authorization: Bearer ${LINKWARDEN_TOKEN}" \
  -H "Content-Type: application/json" | jq '{
    success: .success,
    itemCount: (.response.items | length),
    tags: [.response.items[] | .name]
  }'
echo ""

# Test 6: Multi-column sort
echo "Test 6: Multi-column sort (name asc, id desc)"
curl -s -X GET "${LINKWARDEN_BASE_URL}/api/v1/tags?sort=name,id&dir=asc,desc&limit=5" \
  -H "Authorization: Bearer ${LINKWARDEN_TOKEN}" \
  -H "Content-Type: application/json" | jq '{
    success: .success,
    tags: [.response.items[] | {name: .name, id: .id}]
  }'
echo ""

# Test 7: Custom limit
echo "Test 7: Custom limit (limit=3)"
curl -s -X GET "${LINKWARDEN_BASE_URL}/api/v1/tags?limit=3" \
  -H "Authorization: Bearer ${LINKWARDEN_TOKEN}" \
  -H "Content-Type: application/json" | jq '{
    success: .success,
    itemCount: (.response.items | length),
    nextCursor: .response.nextCursor
  }'
echo ""

# Test 8: Complete pagination loop (first 3 pages)
echo "Test 8: Complete pagination loop (first 3 pages, limit=10)"
cursor=0
page=1
while [ "$cursor" != "null" ] && [ $page -le 3 ]; do
    response=$(curl -s -X GET "${LINKWARDEN_BASE_URL}/api/v1/tags?limit=10$([ "$cursor" != "0" ] && echo "&cursor=$cursor")" \
      -H "Authorization: Bearer ${LINKWARDEN_TOKEN}" \
      -H "Content-Type: application/json")

    echo "Page $page:" $(echo "$response" | jq -c '{itemCount: (.response.items | length), nextCursor: .response.nextCursor}')

    cursor=$(echo "$response" | jq -r '.response.nextCursor')
    page=$((page + 1))

    if [ "$cursor" = "null" ]; then
        echo "Reached end of results"
        break
    fi
done
echo ""

echo "=== All Tests Complete ==="
