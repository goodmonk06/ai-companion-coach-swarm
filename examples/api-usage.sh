#!/bin/bash

# Example API usage for AI Companion Coach Swarm
# Make sure the server is running on http://localhost:3000

BASE_URL="http://localhost:3000"

echo "🧪 AI Companion Coach Swarm - API Example"
echo "=========================================="
echo ""

# Health check
echo "1️⃣ Checking server health..."
curl -s "${BASE_URL}/health" | jq .
echo ""

# Get all coaches
echo "2️⃣ Fetching available coaches..."
COACHES=$(curl -s "${BASE_URL}/api/coaches")
echo "$COACHES" | jq '.[] | {name: .name, key: .key}'
echo ""

# Get demo member
echo "3️⃣ Fetching demo member..."
MEMBER=$(curl -s "${BASE_URL}/api/members/email/demo@example.com")
MEMBER_ID=$(echo "$MEMBER" | jq -r '.id')
echo "Member ID: $MEMBER_ID"
echo ""

# Get a coach (Empathetic Supporter)
echo "4️⃣ Getting Empathetic Supporter coach..."
COACH=$(echo "$COACHES" | jq -r '.[] | select(.key == "empathetic-supporter") | .id')
echo "Coach ID: $COACH"
echo ""

# Start a coaching session
echo "5️⃣ Starting a coaching session..."
SESSION=$(curl -s -X POST "${BASE_URL}/api/sessions/start" \
  -H "Content-Type: application/json" \
  -d "{\"memberId\": \"$MEMBER_ID\", \"coachPersonaId\": \"$COACH\"}")

SESSION_ID=$(echo "$SESSION" | jq -r '.sessionId')
echo "$SESSION" | jq .
echo ""

# Send a message
echo "6️⃣ Sending a message to the coach..."
MESSAGE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/sessions/${SESSION_ID}/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "I'\''ve been feeling stuck in my career lately. I want to grow but I'\''m not sure which direction to take."}')

echo "$MESSAGE_RESPONSE" | jq .
echo ""

# Send another message
echo "7️⃣ Sending a follow-up message..."
MESSAGE_RESPONSE_2=$(curl -s -X POST "${BASE_URL}/api/sessions/${SESSION_ID}/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "I think I need help figuring out what my strengths are and where I should focus my energy."}')

echo "$MESSAGE_RESPONSE_2" | jq .
echo ""

# End the session
echo "8️⃣ Ending the session and generating summary..."
END_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/sessions/${SESSION_ID}/end")
echo "$END_RESPONSE" | jq .
echo ""

# Get session details
echo "9️⃣ Fetching complete session details..."
SESSION_DETAILS=$(curl -s "${BASE_URL}/api/sessions/${SESSION_ID}")
echo "Session Summary:"
echo "$SESSION_DETAILS" | jq -r '.summaryMarkdown'
echo ""
echo "Action Items:"
echo "$SESSION_DETAILS" | jq -r '.actionItems'
echo ""

echo "✅ API example completed!"
echo ""
echo "Session ID: $SESSION_ID"
echo "You can view full details at: ${BASE_URL}/api/sessions/${SESSION_ID}"
