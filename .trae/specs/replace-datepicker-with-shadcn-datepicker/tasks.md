# Tasks
- [x] Task 1: Align shared date picker field with proper shadcn pattern
  - [x] Review existing date picker behavior and map to shadcn date picker composition
  - [x] Refactor shared date picker field to use canonical shadcn structure
  - [x] Preserve existing value contracts, clear behavior, and localization output

- [x] Task 2: Migrate admin forms to the updated shared date picker
  - [x] Update event form date inputs to use the refactored shared field
  - [x] Update distance/category date inputs to use the refactored shared field
  - [x] Confirm disabled and optional field behavior remains unchanged

- [x] Task 3: Verify behavior and prevent regressions
  - [x] Run relevant lint/type checks and targeted tests for admin form components
  - [x] Manually verify date selection, clearing, and display format in admin workflows
  - [x] Resolve any integration issues found during validation

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
