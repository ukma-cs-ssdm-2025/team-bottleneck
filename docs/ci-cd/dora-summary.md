# DORA Metrics Summary\

| Metric | Formula | Your Result | Category* |
|---------|----------|:-----------:|------------|
| Deployment Frequency | #successful deployments / week | 3 / 2 ≈ **1 per week** | Medium |
| Lead Time for Changes | mean(merge → deploy time) | (13 + 47 + 51 + 42 + 47 + 47 + 10) / 7 = 257 / 7 ≈ **36.7 sec**  | Elite |
| Change Failure Rate | failed / total deployments × 100 % | (3 / 10) × 100% = **30%** | High |
| Time to Restore | mean(time to fix failed build) | 12 + 0,5 / 2 = **6,25 min** | High  |
