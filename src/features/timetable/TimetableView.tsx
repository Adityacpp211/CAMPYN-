import React, { useState } from 'react';
import { db } from '../../services/db';
import { Badge } from '../../components/ui/Badge';
import { Calendar, AlertTriangle, Clock, MapPin, User } from 'lucide-react';

export const TimetableView: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const days = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const slots = selectedDay === 'All'
    ? db.timetableSlots
    : db.timetableSlots.filter((s) => s.day === selectedDay);

  const conflictCount = db.timetableSlots.filter((s) => s.hasConflict).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-white)' }}>
            Class & Room Timetable
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)' }}>
            Department of Computer Science • Section A • 2026-2027 Fall Term
          </p>
        </div>

        {conflictCount > 0 && (
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#FFA4A4',
            }}
          >
            <AlertTriangle size={15} />
            <span>{conflictCount} Scheduling Conflict Detected</span>
          </div>
        )}
      </div>

      {/* Day Filter Pills */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`btn btn-sm ${selectedDay === day ? 'btn-primary' : 'btn-secondary'}`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Schedule Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {slots.map((slot) => (
          <div
            key={slot.id}
            style={{
              padding: '14px',
              backgroundColor: 'var(--color-dark-charcoal)',
              border: slot.hasConflict ? '1px solid var(--color-danger-border)' : '1px solid var(--color-border-gray)',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {slot.hasConflict && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: 'var(--color-danger)',
                }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-light-gray)', textTransform: 'uppercase' }}>
                {slot.day}
              </span>
              <Badge variant={slot.hasConflict ? 'danger' : 'default'}>
                <Clock size={11} style={{ marginRight: '4px' }} /> {slot.timeSlot}
              </Badge>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-white)' }}>
              {slot.courseCode}: {slot.courseName}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', fontSize: '12px', color: 'var(--color-light-gray)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} color="var(--color-medium-gray)" /> {slot.facultyName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="var(--color-medium-gray)" /> {slot.roomNumber} ({slot.sectionName})
              </div>
            </div>

            {slot.hasConflict && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-danger-bg)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  color: '#FFBABA',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={13} />
                <span>{slot.conflictDetails}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
