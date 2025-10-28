### **1. Description**

This document defines mandatory rules and standards aimed at ensuring the stability, maintainability, and overall quality of tests. Adherence to this guideline is the responsibility of every team member.

---

### **2. Test Writing Standards**

2.1.  **Descriptive Naming.** Test function names should clearly describe the scenario being tested and the expected outcome.
**Example:** `test_create_booking_fails_if_spot_is_already_taken` instead of `test_booking_error`.

2.2.  **Arrange-Act-Assert (AAA) Structure.** Each test should have clearly separated blocks for data preparation (Arrange), action execution (Act), and result verification (Assert). This improves readability and maintainability.

2.3.  **Single Responsibility Principle.** A single test case should check only one logical aspect of functionality. The test should have one, and only one, reason to fail.

2.4.  **Edge Case Analysis.** Testing must include verification of boundary conditions: zero values (`0`, `None`), empty strings, negative numbers, maximum allowed values, etc.

### **3. Bug Fixing Process**

Fixing bugs should follow a structured process to ensure quality and prevent regressions.

3.1.  **Step 1: Reproduction.** The defect must be reliably reproduced. A new test case is created to simulate the conditions of the bug and fail.

3.2.  **Step 2: Isolation and Diagnosis.** Analyze to identify the exact root cause of the problem. Using a debugger and logs is prioritized over random fixes.

3.3.  **Step 3: Fixing.** Apply the minimal necessary code changes to eliminate the root cause of the defect.

3.4.  **Step 4: Verification.** Run the previously created regression test to ensure it now passes. Then run the full test suite to check for side effects.

### **4. Maintaining Codebase and Tests**

4.1.  **Test Refactoring.** Tests are a full part of the codebase. The same standards of cleanliness and readability applied to production code also apply to tests.

4.2.  **Test Updating.** When functionality is changed or removed, the corresponding tests must be updated or deleted in the same Pull Request.

4.3. **Regular Test Updates.** Test suites should be periodically reviewed and supplemented with new scenarios. Running the same tests repeatedly over time loses effectiveness in detecting new defect types.

4.4.  **Commenting Complex Scenarios.** If a test case covers complex or non-obvious business logic, it should be accompanied by a short comment explaining its purpose.

## Tooling

**Main testing framework: `pytest`**

* **Purpose:** Writing and running unit and integration tests.
* **Rationale:** `pytest` requires minimal boilerplate code, has a powerful fixture system for test environment setup, and extensive plugin support. This allows writing clean and readable tests.

**Dependency Isolation: `unittest.mock`**

* **Purpose:** Creating mocks for external dependencies (e.g., third-party APIs) during unit testing.
* **Rationale:** Enables testing components in complete isolation, making tests fast and stable.
* **Code Coverage Measurement: `pytest-cov`**

  * **Purpose:** Generating reports on code coverage by tests.
  * **Rationale:** Easily integrates with `pytest` and allows tracking which parts of the code are not covered by tests, which is a key quality metric.
* **Automation and CI/CD: `GitHub Actions`**

  * **Purpose:** Automatically run tests and checks on every push and Pull Request.
  * **Rationale:** Integrated directly into GitHub, simplifying setup. Enables continuous testing, providing fast feedback to the team.
* **Scenario-Level Testing (BDD): `pytest-bdd`**

  * **Purpose:** Writing system tests in a format understandable by the whole team (Gherkin).
  * **Rationale:** Turns acceptance criteria into executable tests, serving as "living documentation" for our API.

## Types of Checks and Their Purpose

Our CI pipeline will include multiple levels of automated checks to ensure comprehensive control.

* **Static Code Analysis (Linting)**

  * **Checks:** Code style compliance (PEP 8), potential errors, unused variables and imports.
  * **Purpose:** Maintain code cleanliness and consistency. Helps catch minor issues before running tests.
  * **When:** On every commit in CI.
* **Unit Tests**

  * **Checks:** Correctness of individual functions and methods in isolation.
  * **Purpose:** Fastest way to get feedback that core logic works correctly. Forms the foundation of the testing pyramid.
  * **When:** On every push to a branch in CI.
* **Integration Tests**

  * **Checks:** Interaction between multiple components of the system, e.g., API endpoint with the database.
  * **Purpose:** Ensure different parts of the system communicate correctly. Unit tests cannot detect these issues.
  * **When:** On Pull Request creation to `develop`.
* **Code Coverage Gate**

  * **Checks:** Percentage of code executed during test runs.
  * **Purpose:** Acts as a quality "gate," preventing code from being merged without sufficient test coverage. Helps avoid "blind spots" in the project.
  * **When:** On Pull Request creation to `develop`.

