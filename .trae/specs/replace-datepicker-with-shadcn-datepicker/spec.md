# Replace Datepicker with Proper shadcn Date Picker Spec

## Why
The current date picker behavior is implemented in a custom wrapper and does not fully align with the canonical shadcn date picker composition. Aligning it improves consistency, maintainability, and expected UX behavior.

## What Changes
- Replace custom date picker composition with the proper shadcn date picker pattern in admin forms.
- Preserve existing field behavior for single date selection, clear action, disabled state, and locale-aware display.
- Keep current data contracts for form values so backend payload formats remain unchanged.
- Ensure all existing date input points use the updated component.

## Impact
- Affected specs: admin event date entry, admin distance/category date entry, shared form controls
- Affected code: `components/admin/date-picker-field.tsx`, `components/admin/event-form.tsx`, `components/admin/distance-fieldset.tsx`, `components/ui/*` as needed

## ADDED Requirements
### Requirement: Canonical shadcn Date Picker Composition
The system SHALL provide a shared date picker field that follows the standard shadcn date picker composition and interaction model.

#### Scenario: Success case
- **WHEN** an admin opens a date field
- **THEN** a popover calendar appears using the shadcn composition
- **AND** selecting a date updates the field value and closes the popover

#### Scenario: Clear selection
- **WHEN** an admin clears a selected date
- **THEN** the field value becomes empty
- **AND** the form reflects no selected date for that input

## MODIFIED Requirements
### Requirement: Admin Date Inputs
All admin date inputs SHALL use the shared shadcn-compliant date picker field while preserving current form value formats and validation expectations.

## REMOVED Requirements
### Requirement: Custom Non-Canonical Date Picker Behavior
**Reason**: It duplicates behavior and diverges from the standardized shadcn date picker approach.
**Migration**: Replace custom internal date picker implementation with shadcn-compliant composition without changing field names or submitted value formats.
