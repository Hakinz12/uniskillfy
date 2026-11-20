function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildCalendarContent(request, session, stamp = new Date()) {
  const start = new Date(session.start);
  const end = new Date(start.getTime() + session.minutes * 60_000);
  const title = `Skill swap: ${request.offer} for ${request.learn} with ${request.mname}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Skill Swap//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeText(request.id)}@campus-skill-swap`,
    `DTSTAMP:${toIcsDate(stamp)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(title)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadCalendarEvent(request, session) {
  const content = buildCalendarContent(request, session);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'skill-swap-session.ics';
  link.click();
  URL.revokeObjectURL(url);
}
