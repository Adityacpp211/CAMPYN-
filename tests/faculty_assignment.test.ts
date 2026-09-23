import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { seedDatabase } from '../server/db/seed';
import { dbClient } from '../server/db';

let facultyToken: string;
let assignedSectionCourseId: string;
let studentId: string;

beforeAll(async () => {
  await seedDatabase();

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 's.jenkins@campus.edu',
      password: 'Password@123',
    });
  facultyToken = loginRes.body.data.token;

  // Fetch assigned section course for Sarah Jenkins
  const scRes = await dbClient.query(`
    SELECT sc.id, sc.section_id, c.code, f.user_id
    FROM section_courses sc
    JOIN courses c ON sc.course_id = c.id
    JOIN faculty f ON sc.faculty_id = f.id
    JOIN users u ON f.user_id = u.id
    WHERE u.email = 's.jenkins@campus.edu'
    LIMIT 1
  `);
  assignedSectionCourseId = scRes.rows[0].id;

  // Fetch a student in this section
  const stuRes = await dbClient.query(`
    SELECT s.id FROM students s
    JOIN sections sec ON s.current_section_id = sec.id
    JOIN section_courses sc ON sc.section_id = sec.id
    WHERE sc.id = $1
    LIMIT 1
  `, [assignedSectionCourseId]);
  studentId = stuRes.rows[0].id;
});

describe('Instructional Boundary Authorization (ABAC)', () => {
  it('allows faculty to record attendance for an assigned section-course', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/sessions')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        sectionCourseId: assignedSectionCourseId,
        sessionDate: '2026-09-24',
        slotStart: '09:00:00',
        slotEnd: '10:00:00',
        records: [{ studentId, status: 'present' }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionId).toBeDefined();
  });

  it('rejects faculty attempt to record attendance for an unassigned course allocation', async () => {
    // Select an unassigned section-course (taught by David Miller, not Sarah Jenkins)
    const otherScRes = await dbClient.query(`
      SELECT sc.id 
      FROM section_courses sc
      JOIN faculty f ON sc.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE u.email != 's.jenkins@campus.edu'
      LIMIT 1
    `);

    if (otherScRes.rows.length > 0) {
      const unassignedId = otherScRes.rows[0].id;
      const res = await request(app)
        .post('/api/v1/attendance/sessions')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          sectionCourseId: unassignedId,
          sessionDate: '2026-09-24',
          slotStart: '11:00:00',
          slotEnd: '12:00:00',
          records: [{ studentId, status: 'present' }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FACULTY_COURSE_UNASSIGNED');
    }
  });

  it('blocks attendance recording with empty student records', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/sessions')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        sectionCourseId: assignedSectionCourseId,
        sessionDate: '2026-09-24',
        slotStart: '09:00:00',
        slotEnd: '10:00:00',
        records: [],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
