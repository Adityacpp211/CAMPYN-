# CAMPYN V2 — Authorization & Access Control Specification

## 1. Overview & Security Philosophy

CAMPYN V2 enforces **Server-Side Dual-Layer Authorization**:
1. **Layer 1: Role-Based Access Control (RBAC)** — Grants functional access based on role permissions (`requirePermission()`, `requireAnyPermission()`).
2. **Layer 2: Attribute-Based Access Control (ABAC)** — Validates ownership, organizational hierarchy, and instructional assignments (`assertStudentSelfAccess()`, `assertFacultyCourseAssignment()`).

> [!IMPORTANT]
> The frontend never determines authorization or security boundaries. UI permission checks (`hasPermission()`) are purely cosmetic conveniences to adjust UI visibility. Every operation is strictly validated on the server.

---

## 2. Institutional Permission Matrix

| Module | Permission Code | Super Admin | College Admin | Principal | HOD | Faculty | Student | Accountant | Exam Cell | Auditor |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Students** | `students.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌* | ✅ | ✅ | ✅ |
| **Students** | `students.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Students** | `students.update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Faculty** | `faculty.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Faculty** | `faculty.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Academics** | `departments.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Academics** | `courses.manage` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Attendance** | `attendance.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Attendance** | `attendance.record` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Attendance** | `attendance.correct` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Attendance** | `attendance.approve` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Timetable** | `timetable.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Timetable** | `timetable.edit` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Assignments** | `assignments.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Assignments** | `assignments.create` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Assignments** | `assignments.grade` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Assignments** | `assignments.submit` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Marks** | `marks.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Marks** | `marks.enter` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Marks** | `marks.verify` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Marks** | `marks.lock_publish`| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Fees** | `fees.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Fees** | `fees.collect` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Fees** | `fees.refund` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Approvals** | `approvals.manage` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Audit** | `audit.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

*\* Note: Students cannot browse the college-wide student directory (`students.read`), but have self-access to view their own personal dossier via ABAC IDOR protections.*

---

## 3. Resource-Level ABAC & Privacy Protections

### A. Student Privacy & IDOR / BOLA Prevention
When an authenticated student requests a record (`/api/v1/students/:id`, `/api/v1/students/profile`, `/api/v1/fees/dues`), the system executes:

```typescript
export async function assertStudentSelfAccess(actor: AuthUser, targetStudentIdOrRoll: string): Promise<void> {
  if (actor.role !== 'STUDENT') return;

  const stuRes = await dbClient.query(`
    SELECT user_id FROM students WHERE id::text = $1 OR roll_number = $1
  `, [targetStudentIdOrRoll]);

  if (stuRes.rows.length === 0) {
    throw new ResourceAuthError('Requested student record not found', 'RESOURCE_NOT_FOUND', 404);
  }

  if (stuRes.rows[0].user_id !== actor.id) {
    throw new ResourceAuthError(
      'IDOR Violation: Students are strictly restricted to accessing their own records',
      'STUDENT_PRIVACY_VIOLATION',
      403
    );
  }
}
```

### B. Instructional Boundary Enforcement
A faculty member holding `attendance.record` or `marks.enter` cannot modify records college-wide. The server enforces course-faculty assignment before any mutation:

```typescript
export async function assertFacultyCourseAssignment(actor: AuthUser, courseCode: string, sectionId?: string): Promise<void> {
  if (['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'HOD'].includes(actor.role)) return;

  const res = await dbClient.query(`
    SELECT sc.id 
    FROM section_courses sc
    JOIN faculty f ON sc.faculty_id = f.id
    JOIN courses c ON sc.course_id = c.id
    WHERE f.user_id = $1 AND (c.id::text = $2 OR c.code = $2)
      ${sectionId ? 'AND sc.section_id = $3' : ''}
  `, params);

  if (res.rows.length === 0) {
    throw new ResourceAuthError(
      'Instructional Boundary Violation: Faculty member is not assigned to this course/section',
      'FACULTY_COURSE_UNASSIGNED',
      403
    );
  }
}
```
