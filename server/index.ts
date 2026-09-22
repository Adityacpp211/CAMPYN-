import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { studentsRouter } from './routes/students.routes';
import { facultyRouter } from './routes/faculty.routes';
import { academicsRouter } from './routes/academics.routes';
import { attendanceRouter } from './routes/attendance.routes';
import { feesRouter } from './routes/fees.routes';
import { approvalsRouter } from './routes/approvals.routes';
import { auditRouter } from './routes/audit.routes';
import { timetableRouter } from './routes/timetable.routes';
import { assignmentsRouter } from './routes/assignments.routes';
import { examsRouter } from './routes/exams.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { getDb } from './db';
import { runMigrations } from './db/migrate';

export const app = express();

// Security and utility middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow development inline assets
}));
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'CampusOS Enterprise Server',
    database: 'PostgreSQL Relational Engine',
    timestamp: new Date().toISOString(),
  });
});

// Mount domain routes
app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api/academics', academicsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/fees', feesRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/exams', examsRouter);
app.use('/api/dashboard', dashboardRouter);

// Global Error Handler
app.use(errorHandler);

export async function startServer(): Promise<any> {
  await getDb();
  await runMigrations();

  return new Promise((resolve) => {
    const server = app.listen(config.port, () => {
      console.log(`[CampusOS API] Running on http://localhost:${config.port} (${config.nodeEnv})`);
      resolve(server);
    });
  });
}

// Direct execution
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  startServer().catch((err) => {
    console.error('[CampusOS API] Server startup error:', err);
    process.exit(1);
  });
}
