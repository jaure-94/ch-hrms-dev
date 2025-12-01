## Department Job Roles Implementation Plan

1. **Data Model & Schema Updates**  
   - Add a new `job_roles` table with columns: `id (uuid)`, `departmentId`, `title`, `jobId` (unique code), `description`, `status ('vacant' | 'filled')`, `assignedEmployeeId (nullable)`, timestamps.  
   - Update `shared/schema.ts` with Drizzle definitions, relations, and Zod insert/update schemas.  
   - Add database indexes for `departmentId` and `status` to optimize filtering.  
   - Ensure cascading relationships (e.g., deleting a department removes its job roles) as needed.

2. **API Layer & Business Logic**  
   - Extend Express routes to expose job-role-aware endpoints:  
     - `GET /departments/:id` returning department detail + job roles.  
     - `PATCH /departments/:id` for updating department info and job roles in bulk.  
     - `POST /departments/:id/job-roles` to add roles.  
     - `PATCH /job-roles/:id` for status or assignment changes (fill/vacate).  
   - Enforce RBAC: Admin+ can mutate, Manager can read, superuser always permitted.  
   - Wrap onboarding role assignment in a transaction to mark roles filled atomically.  
   - Implement safeguards so a role cannot move to `filled` without an assigned employee and automatically reopens the role when an employee is removed/transferred.

3. **Company Page Enhancements**  
   - Update reusable department card component to show vacancy stats (e.g., “2 / 5 roles filled”) and add a `View Details` button linking to the department detail page (`/departments/:id`).  
   - Provide visual cues for departments with open vacancies to guide attention.

4. **Department Detail Page**  
   - Create a dedicated route `/departments/:id` (Admin+).  
   - Layout requirements: breadcrumbs (`Company > Departments > {Department}`), department summary header, stats section, and job-role listing.  
   - Job-role section should include status badges, job IDs, descriptions, assigned employee info, filters (vacant/filled), and action buttons (edit, mark vacant, assign).  
   - Include a CTA to add a new job role, opening an inline form or dialog within the page.  
   - Use React Query hook (e.g., `useDepartment(id)`) to fetch detail data and invalidate caches on updates.

5. **Edit Department Page UX**  
   - Implement `client/src/pages/departments/[id]/edit.tsx` (or similar) as a full page, not a modal.  
   - Include breadcrumbs (`Company > Departments > {Department} > Edit`) at the top, followed by a form pre-populated with current department fields and job roles.  
   - Allow adding/removing job roles via dynamic list; validate unique job IDs and required titles.  
   - Provide status toggles and, when marking filled, require selecting an employee or linking to onboarding flow.  
   - Submit via React Query mutation with optimistic UI and toast feedback on success/failure.

6. **Employee Onboarding Integration**  
   - Update onboarding flow to include a “Select Job Role” step filtered by department and limited to `status = vacant`.  
   - On submission, assign the chosen role to the new employee and mark it filled.  
   - Handle role release when employees are deactivated or re-assigned, ensuring vacancies re-open automatically.

7. **State Management & Hooks**  
   - Add React Query hooks:  
     - `useDepartments`, `useDepartment(id)` for data retrieval.  
     - `useUpdateDepartment`, `useCreateJobRole`, `useUpdateJobRole`, `useAssignJobRole`.  
   - Centralize API calls in `client/src/lib/auth.tsx` or a dedicated service file with shared typing from `shared/schema.ts`.

8. **Validation, Testing, & QA**  
   - Share Zod schemas between client/server to keep validation consistent.  
   - Add unit tests for role assignment logic and API endpoints, plus integration tests covering onboarding + vacancy tracking.  
   - Provide manual QA checklist: create department, add roles, assign employee, mark role vacant, edit department, ensure breadcrumbs/navigation behave correctly.  
   - Document role lifecycle and UX flows in `README.md` for future contributors.








