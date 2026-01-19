# Testing Login Fix

## Test Cases

### 1. Test Case Sensitivity
If you registered with collegeId: "TestUser123"

Try logging in with:
- "testuser123" (lowercase)
- "TESTUSER123" (uppercase)
- "TestUser123" (original case)
- "TeStUsEr123" (mixed case)

All should work now!

### 2. Test Whitespace
If you registered with collegeId: "TestUser123"

Try logging in with:
- " TestUser123" (leading space)
- "TestUser123 " (trailing space)
- " TestUser123 " (both)
- "TestUser123" (no spaces)

All should work now!

### 3. Test via API (curl)

```bash
# Test login with different case
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"collegeId": "testuser123", "password": "yourpassword"}'

# Test login with whitespace
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"collegeId": " TestUser123 ", "password": "yourpassword"}'
```

### 4. Check Database (if needed)

If using Docker:
```bash
docker exec -it chillmate-api sh
sqlite3 chillmate.db
SELECT collegeId FROM users;
```

If running locally:
```bash
cd server
sqlite3 chillmate.db
SELECT collegeId FROM users;
```

## Expected Results

✅ Login should work regardless of:
- Case (uppercase, lowercase, mixed)
- Leading/trailing whitespace

✅ New registrations will store collegeId in lowercase (normalized)

✅ Old data (mixed case) will still work due to case-insensitive query

