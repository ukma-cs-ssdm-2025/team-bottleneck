

# Error Report: Edge Case in Time Validation
### 1. Symptom
Description: The test test_zero_duration_raises_error failed. The validator incorrectly accepted a booking where the start time equals the end time (start == end), instead of raising the expected serializers.ValidationError.

###  2. Root Cause
Problem: Logical error in checking time boundary conditions in the booking validation logic.

Details: In the file src/api/validators.py, the comparison operator used to enforce that the end time must strictly occur after the start time was incorrectly set. It was:

Python

if start > end:  
####  ❌ Error: The case start == end was incorrectly allowed.
    raise serializers.ValidationError("Booking end time must be after start time.")
By using > instead of the necessary >=, the critical edge case where the duration is zero (start == end) was missed, as the condition start > end evaluates to False.

###  3. Fix
Action: The comparison operator was corrected to >=.

Corrected code:

Python

if start >= end:  
#### ✅ Fixed: Now correctly prohibits both start > end and start == end.
    raise serializers.ValidationError("Booking end time must be after start time.")
Verification: After applying the fix and rerunning pytest, all tests successfully passed (PASSED).

###  4. Conclusion
Criticality of Edge Cases: This incident highlighted that changing only one character (> vs. >=) completely broke the validation logic for zero duration bookings. This emphasizes the vital importance of strictly testing boundary and edge conditions (like zero or maximum duration) in time-based logic.
