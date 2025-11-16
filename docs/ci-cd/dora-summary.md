# DORA Metrics Report

| Metric | Formula | Your Result | Category* |
|---------|----------|:-----------:|------------|
| Deployment Frequency | #successful deployments / week | 2 deploys/week | **Low** |
| Lead Time for Changes | mean(merge → deploy time) | 46s (0.8min) | **Elite** |
| Change Failure Rate | failed / total deployments × 100 % | 16.67% | **High** |
| Time to Restore | mean(time to fix failed build) | 26s (0.4min) | **Elite** |


### Release Success Rate (Pie Chart)


```mermaid
pie
    title Release Success Rate (CFR = 16.67%)
    "Successful Deployments (83.03%)" : 83.03
    "Failed Deployments (16.67%)" : 16.67
```

```mermaid
flowchart LR
    A["Deployment Frequency<br/> 2 per week<br/> Low"] 
    B["Lead Time<br/>46 sec<br/> Elite"]
    C["Change Failure Rate<br/>16.67%<br/> High"]
    D["Time to Restore<br/>26 sec<br/> Elite"]
    
    A --> B
    B --> C
    C --> D
    
    style A fill:#dc2626,stroke:#dc2626,color:#fff
    style B fill:#10b981,stroke:#059669,color:#fff
    style C fill:#f59e0b,stroke:#d97706,color:#fff
    style D fill:#10b981,stroke:#059669,color:#fff
```
