# Team Charter

## 1. Basic Information

* Team name: bottleneck
* Members:

  #### Dvoylenko Anastasia Ivanivna (GitHub: @anastasiaaq, NaUKMA email: [a.dvoilenko@ukma.edu.ua](mailto:a.dvoilenko@ukma.edu.ua))
  #### Dermenzhy Valentina Sergiivna (GitHub: @valuuusha, NaUKMA email: [v.dermenzhy@ukma.edu.ua](mailto:v.dermenzhy@ukma.edu.ua))
  #### Pihuliak Anton Bohdanovych (GitHub: @MaFiN1337, NaUKMA email: [a.pihuliak@ukma.edu.ua](mailto:a.pihuliak@ukma.edu.ua))
  #### Rakhmanova Victoria Ihorivna (GitHub: @Victoria7778, NaUKMA email: [v.rakhmanova@ukma.edu.ua](mailto:v.rakhmanova@ukma.edu.ua))

## 2. Roles and Responsibilities

* Repository Maintainer (Lab1), Requirements Lead (Lab2), Architecture Lead (Lab3), Backend Lead (Lab4), Quality Lead (Lab5), Test Lead (Lab6), Review Manager (Lab7), QA Engineer(Lab8): Dermenzhy Valentina Sergiivna
* CI Maintainer (Lab1), Traceability Lead (Lab2), Requirements-Architecture Mapper (Lab3), Integration Lead (Lab4), Code Reviewer (Lab5), Integration Lead (Lab6), Test Planner (Lab7), Release Manager (Lab8): Pihuliak Anton Bohdanovych
* Documentation Lead (Lab1–Lab5), Debugger (Lab6), Documentation Lead (Lab 7), Code Analyst (Lab8): Rakhmanova Victoria Ihorivna
* Task Tracker Lead (Lab1), Quality Lead (Lab2), UML Lead (Lab3), Quality Lead (Lab4), Security Analyst (Lab5), QA Planner (Lab6), QA Analyst (Lab7), Refactoring Lead (Lab8): Dvoylenko Anastasia Ivanivna

## 3. Communication Plan

* Primary channels: Discord and messenger
* Meeting schedule: once a week at an agreed time on Discord (time can be rescheduled by mutual agreement) + additional meetings if needed
* Response expectations: reply within 24 hours; notify in advance about extended absence (>24 hours)

## 4. Collaboration and Workflow

* Branching strategy: GitHub Flow
* Commit practices: at least 2 commits per week, commit messages must include a short description. Review responsible: Anton (GitHub: @MaFiN1337)
* Code review rules: merges require approval from at least one team member
* Task workflow: open → assign (assigned by @anastasiaaq) → work → PR (tag @MaFiN1337; if Anton creates PR, he can tag anyone) → close
* User story review: stories are agreed upon in joint meetings and committed by one person, or new stories can be added by one person if reviewed by Requirements Lead @valuuusha; before merging to main, tag @valuuusha
* Non-functional requirements verification: joint review session by all members, agree on metrics and methods for each requirement; each requirement must belong to ISO 25010 categories, at least one measurable NFR per category in requirements.md
* Commits must include a link to the related issue

## 5. Conflict Resolution

* Conflicts are discussed during meetings and resolved by majority vote

## 6. Availability and Workload

* Member availability: 6 hours per week per member
* Workload should be distributed evenly; excessive workload on a member is discussed and redistributed

## 7. Ethical and Professional Behavior

* Shared principles:

  * treat each other with respect
  * maintain academic integrity and ACM code of ethics
  * do not plagiarize code or documentation

## 8. Artifact Management

* All requirements documents are stored in `/docs/requirements/`
* Responsibility for maintaining README.md with up-to-date links: @Victoria7778

## 9. Individual Accountability

* Each member records a weekly Loom video showing their contribution and explaining how it helped the team

## 10. Coding Standards & Quality Policy

### Code Style Guide

We follow **PEP 8** for Python code.

#### Naming

* **Functions and variables:** `snake_case` (e.g., `calculate_total`, `user_id`)
* **Classes:** `PascalCase` (e.g., `UserProfile`)
* **Constants:** `UPPER_CASE` (e.g., `MAX_RETRIES`)
* **Test names:** start with `test_`
* **Max line length:** 99 characters

#### Documentation

* Explain **why**, not just **what**
* Keep documentation **close to the code**

---

### Mandatory Tools

* **Static code analysis:** use `bandit` for security checks

---

### Peer Review

Each **Pull Request** requires at least one approval before merging.

Code review checks:

1. **Style and formatting:** PEP 8 compliance, presence of docstrings
2. **Readability:** is the logic clear? Should functions be split?
3. **Code duplication:** any repeated code?
4. **Security:** input handling, file operations, passwords, logging

---

### Definition of Done (DoD)

1. **Functionality implemented** — all issue requirements met, code works correctly
2. **Code style followed** — formatting follows agreed style, autoformatters used
3. **Code covered by tests** — all tests pass, coverage above minimum
4. **Peer review passed** — PR approved by at least one member, all comments addressed
5. **Documentation updated** — README, docstrings, or `/docs/code-quality/progress.md` updated
6. **Issue closed** — changes merged to main branch, issue marked as done

## 11. Signatures

* [x] Anastasia (GitHub: @anastasiaaq)
* [x] Valentina (GitHub: @valuuusha)
* [x] Anton (GitHub: @MaFiN1337)
* [x] Victoria (GitHub: @Victoria7778)
