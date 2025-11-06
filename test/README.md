# Unit Tests for foos-tournament

This directory contains unit tests for the `serialize_open_match()` function in `web_router.rb`.

## Test Files

### 1. test_serialize_open_match_singles.rb
Tests that singles quick matches generate correct submatch structure:
- Creates a singles match (1v1)
- Verifies submatches == `[[[p1], [p2]]]`
- Validates mode, target_score, and quick_match flags

### 2. test_serialize_open_match_doubles.rb
Tests that doubles quick matches generate correct submatch structure:
- Creates a doubles match (2v2)
- Verifies submatches == `[[[p1,p2], [p3,p4]]]`
- Validates player ordering and metadata

### 3. test_serialize_open_match_best_of.rb
Tests that best-of-3 matches generate 3 identical submatches:
- Tests both singles and doubles in best-of-3 format
- Verifies submatches.length == 3
- Ensures all 3 submatches are identical

## Running Tests

### Prerequisites
Make sure you have the required gems installed:
```bash
cd /home/pi/foos-project/foos-tournament
bundle install
```

### Run All Tests
```bash
rake test
```

### Run Individual Test Files
```bash
# Singles tests
rake test_singles
# or
ruby test/test_serialize_open_match_singles.rb

# Doubles tests
rake test_doubles
# or
ruby test/test_serialize_open_match_doubles.rb

# Best-of-3 tests
rake test_best_of
# or
ruby test/test_serialize_open_match_best_of.rb
```

### Run Tests Directly with Ruby
```bash
ruby test/test_serialize_open_match_singles.rb
ruby test/test_serialize_open_match_doubles.rb
ruby test/test_serialize_open_match_best_of.rb
```

## Test Framework

These tests use **Minitest**, Ruby's built-in testing framework. No additional gems need to be installed.

## Expected Output

When all tests pass, you should see output like:
```
Run options: --seed 12345

# Running:

........

Finished in 0.123456s, 64.9351 runs/s, 64.9351 assertions/s.

8 runs, 8 assertions, 0 failures, 0 errors, 0 skips
```

## Troubleshooting

### Database Connection Issues
If you encounter database connection issues, make sure:
- The tournament.db file exists
- Database schema is up to date
- You have write permissions to the database directory

### Player Creation Failures
The tests create temporary players in the database. If tests fail due to player creation:
- Check that the Player model is properly configured
- Verify DataMapper is initialized correctly
- Ensure the database schema includes the players table

## Integration with CI/CD

These tests can be integrated into a CI/CD pipeline:
```bash
# Exit with non-zero status if any test fails
rake test || exit 1
```

## Coverage

These tests verify the critical Phase 1 fix from INTEGRATION_ANALYSIS.md:
- ✅ Gap 1: Missing 'submatches' field for quick matches
- ✅ Singles mode submatch generation
- ✅ Doubles mode submatch generation
- ✅ Best-of-3 submatch replication

## Next Steps

After these tests pass:
1. Deploy the changes to production
2. Test with real hardware (Raspberry Pi + foosball table)
3. Verify league.json structure matches expected format
4. Run integration tests with foos/ Python client
