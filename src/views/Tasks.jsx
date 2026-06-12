import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventCalendar } from '@mui/x-scheduler';
import './Tasks.css';
import { getUserFromToken, getToken } from '../Helpers';
import { getTasks, createTask, updateTask, deleteTask } from '../services/TaskService';

/* duration >= 23h59m → backend's all-day representation (midnight → 23:59:59 UTC) */
const isAllDayEvent = (start, end) =>
  new Date(end) - new Date(start) >= 23 * 60 * 60 * 1000 + 59 * 60 * 1000;

/* UTC ISO → local "YYYY-MM-DD" so the scheduler shows the right calendar day */
const toLocalDateStr = (isoStr) => {
  const d = new Date(isoStr);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
};

const toCalendarEvent = (task) => {
  const allDay = task.all_day ?? isAllDayEvent(task.start_date, task.end_date);
  return {
    id: task.public_key,
    title: task.title,
    start: allDay ? toLocalDateStr(task.start_date) : task.start_date,
    end: allDay ? toLocalDateStr(task.end_date) : task.end_date,
    color: task.color,
    allDay,
  };
};

const VIEWS = ['day', 'week', 'month'];

function getWeekRange(date) {
  const d = new Date(date);
  const sun = new Date(d);
  sun.setDate(d.getDate() - d.getDay());
  const sat = new Date(sun);
  sat.setDate(sun.getDate() + 6);
  const fmt = (dt, opts) => dt.toLocaleDateString('en-US', opts);
  const start = fmt(sun, { month: 'short', day: 'numeric' });
  const end   = fmt(sat, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} – ${end}`;
}

function getDayLabel(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getMonthLabel(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* ── SVG icons ── */
const IconCalendarLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="3" stroke="#fff" strokeWidth="2"/>
    <path d="M3 9h18" stroke="#fff" strokeWidth="2"/>
    <path d="M8 2v4M16 2v4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    <rect x="7" y="13" width="3" height="3" rx="1" fill="#fff"/>
    <rect x="10.5" y="13" width="3" height="3" rx="1" fill="#fff"/>
  </svg>
);

const IconStar = ({ size = 14, color = '#5457d4' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const IconCrown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#5457d4">
    <path d="M5 16l-2-9 5 4 4-7 4 7 5-4-2 9H5zm0 2h14v2H5v-2z"/>
  </svg>
);

const IconImage = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#9ca3af" strokeWidth="1.5"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="#9ca3af"/>
    <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.8"/>
    <path d="M8 11V7a4 4 0 018 0v4" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconCalendarDate = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="2" stroke="#9ca3af" strokeWidth="1.8"/>
    <path d="M3 9h18" stroke="#9ca3af" strokeWidth="1.8"/>
    <path d="M8 2v4M16 2v4" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ══════════════════════════════════════
   Tasks component
══════════════════════════════════════ */
export const Tasks = () => {
  const navigate = useNavigate();
  const user = getUserFromToken();
  const userEmail = user?.email ?? 'john.doe@example.com';
  const userInitial = userEmail.charAt(0).toUpperCase();

  const [events, setEvents] = useState([]);
  const [view, setView] = useState('week');
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [showPanel, setShowPanel] = useState(true);

  /* Add Task form state */
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState(toLocalDateStr(new Date()));
  const [taskTime, setTaskTime] = useState('10:00');
  const [taskEndTime, setTaskEndTime] = useState('11:00');
  const [taskEndDate, setTaskEndDate] = useState(toLocalDateStr(new Date()));
  const [isAllDay, setIsAllDay] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate('/login');
      return;
    }
    getTasks()
      .then((result) => setEvents(result.data.map(toCalendarEvent)))
      .catch(() => {});
  }, []);

  /* Navigation */
  const goPrev = () => {
    const d = new Date(visibleDate);
    if (view === 'week')  d.setDate(d.getDate() - 7);
    if (view === 'day')   d.setDate(d.getDate() - 1);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    setVisibleDate(d);
  };
  const goNext = () => {
    const d = new Date(visibleDate);
    if (view === 'week')  d.setDate(d.getDate() + 7);
    if (view === 'day')   d.setDate(d.getDate() + 1);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    setVisibleDate(d);
  };
  const goToday = () => setVisibleDate(new Date());

  const dateLabel =
    view === 'week'  ? getWeekRange(visibleDate) :
    view === 'day'   ? getDayLabel(visibleDate) :
    getMonthLabel(visibleDate);

  const handleStartDateChange = (val) => {
    setTaskDate(val);
    // keep end date in sync unless the user already set it past start
    if (taskEndDate <= val) setTaskEndDate(val);
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    const start = isAllDay ? taskDate : `${taskDate}T${taskTime}:00`;
    const end   = isAllDay ? taskEndDate : `${taskDate}T${taskEndTime}:00`;
    try {
      const result = await createTask({
        title: taskTitle,
        start_date: start,
        end_date: end,
        color: 'blue',
        all_day: isAllDay,
      });
      setEvents(prev => [...prev, toCalendarEvent(result.data)]);
      setTaskTitle('');
      setShowPanel(false);
    } catch {
      // 401 handled by interceptor
    }
  };

  const handleEventsChange = async (updatedEvents) => {
    const prevEvents = events;
    setEvents(updatedEvents);

    const deleted = prevEvents.filter(e => !updatedEvents.find(u => u.id === e.id));
    for (const ev of deleted) {
      try { await deleteTask(ev.id); } catch { /* interceptor handles 401 */ }
    }

    const changed = updatedEvents.filter(u => {
      const prev = prevEvents.find(e => e.id === u.id);
      if (!prev) return false;
      return prev.start !== u.start || prev.end !== u.end || prev.title !== u.title || prev.color !== u.color;
    });
    for (const ev of changed) {
      try {
        await updateTask(ev.id, { title: ev.title, start_date: ev.start, end_date: ev.end, color: ev.color });
      } catch { /* interceptor handles 401 */ }
    }
  };

  return (
    <div className="tasks-page">

      {/* ── Navbar ── */}
      <header className="tasks-nav">
        <div className="tasks-nav-logo">
          <div className="tasks-nav-logo-icon">
            <IconCalendarLogo />
          </div>
          <span className="logo-text">Task Calendar</span>
        </div>

        <div className="tasks-nav-right">
          <button className="btn-upgrade">
            <IconStar size={14} color="#5457d4" />
            <span className="btn-upgrade-text">Upgrade to Pro</span>
          </button>

          <div className="tasks-nav-user">
            <div className="user-avatar">{userInitial}</div>
            <span className="user-email">{userEmail}</span>
            <IconChevronDown />
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="tasks-body">

        {/* Calendar area */}
        <div className="tasks-calendar-area">

          {/* Custom toolbar */}
          <div className="tasks-toolbar">
            <div className="toolbar-left">
              <button className="btn-today" onClick={goToday}>Today</button>
              <div className="toolbar-nav-group">
                <button className="nav-arrow" onClick={goPrev}>&#8249;</button>
                <button className="nav-arrow" onClick={goNext}>&#8250;</button>
              </div>
              <span className="toolbar-date-range">{dateLabel}</span>
            </div>

            <div className="toolbar-right">
              <div className="view-switcher">
                {VIEWS.map(v => (
                  <button
                    key={v}
                    className={`view-btn${view === v ? ' active' : ''}`}
                    onClick={() => setView(v)}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
              <button className="btn-add-task" onClick={() => setShowPanel(true)}>
                <span className="btn-add-task-plus">+</span> Add Task
              </button>
            </div>
          </div>

          {/* MUI X Scheduler */}
          <div className="tasks-calendar-wrap">
            <EventCalendar
              events={events}
              onEventsChange={handleEventsChange}
              view={view}
              onViewChange={(v) => setView(v)}
              visibleDate={visibleDate}
              onVisibleDateChange={(d) => setVisibleDate(new Date(d))}
              defaultPreferences={{ isSidePanelOpen: false, ampm: true }}
              preferencesMenuConfig={false}
              sx={{
                height: '100%',
                border: 'none',
                '& .MuiEventCalendar-headerToolbar': { display: 'none' },
                '& .MuiEventCalendar-sidePanel':     { display: 'none' },
              }}
            />
          </div>
        </div>

        {/* ── Add Task panel ── */}
        {showPanel && (
          <div className="tasks-add-panel">
            <div className="panel-header">
              <span>Add Task</span>
              <button className="panel-close" onClick={() => setShowPanel(false)}>&#10005;</button>
            </div>

            <div className="panel-body">

              {/* Date & Time */}
              <div className="panel-section">
                <div className="panel-label-row">
                  <span className="panel-label">Date &amp; Time</span>
                  <label className="allday-toggle">
                    <input
                      type="checkbox"
                      checked={isAllDay}
                      onChange={e => setIsAllDay(e.target.checked)}
                    />
                    All day
                  </label>
                </div>

                {isAllDay ? (
                  /* All-day: start date → end date */
                  <div className="panel-datetime-row">
                    <div className="panel-date-input">
                      <IconCalendarDate />
                      <input
                        type="date"
                        value={taskDate}
                        onChange={e => handleStartDateChange(e.target.value)}
                        className="date-native"
                      />
                    </div>
                    <span className="datetime-arrow">→</span>
                    <div className="panel-date-input">
                      <IconCalendarDate />
                      <input
                        type="date"
                        value={taskEndDate}
                        min={taskDate}
                        onChange={e => setTaskEndDate(e.target.value)}
                        className="date-native"
                      />
                    </div>
                  </div>
                ) : (
                  /* Timed: date, start time → end time */
                  <>
                    <div className="panel-datetime-row">
                      <div className="panel-date-input">
                        <IconCalendarDate />
                        <input
                          type="date"
                          value={taskDate}
                          onChange={e => handleStartDateChange(e.target.value)}
                          className="date-native"
                        />
                      </div>
                    </div>
                    <div className="panel-datetime-row">
                      <div className="panel-time-input" style={{ flex: 1 }}>
                        <select value={taskTime} onChange={e => setTaskTime(e.target.value)} className="time-select">
                          {Array.from({ length: 24 }, (_, h) =>
                            ['00', '30'].map(m => {
                              const val = `${String(h).padStart(2,'0')}:${m}`;
                              const label = new Date(`2000-01-01T${val}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                              return <option key={val} value={val}>{label}</option>;
                            })
                          )}
                        </select>
                        <IconChevronDown />
                      </div>
                      <span className="datetime-arrow">→</span>
                      <div className="panel-time-input" style={{ flex: 1 }}>
                        <select value={taskEndTime} onChange={e => setTaskEndTime(e.target.value)} className="time-select">
                          {Array.from({ length: 24 }, (_, h) =>
                            ['00', '30'].map(m => {
                              const val = `${String(h).padStart(2,'0')}:${m}`;
                              const label = new Date(`2000-01-01T${val}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                              return <option key={val} value={val}>{label}</option>;
                            })
                          )}
                        </select>
                        <IconChevronDown />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Title */}
              <div className="panel-section">
                <div className="panel-label">Title</div>
                <div className="panel-title-wrap">
                  <input
                    type="text"
                    className="panel-title-input"
                    placeholder="Enter task title"
                    maxLength={100}
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                  />
                  <span className="char-count">{taskTitle.length}/100</span>
                </div>
              </div>

              {/* Premium feature box */}
              <div className="panel-premium-box">
                <div className="premium-icon-wrap"><IconCrown /></div>
                <div className="premium-content">
                  <div className="premium-title">Premium feature</div>
                  <div className="premium-text">
                    <span className="premium-link">Upgrade to Pro</span> to add description,
                    images and more to your tasks.
                  </div>
                  <button className="btn-upgrade-pro">
                    <IconStar size={13} color="#fff" /> Upgrade to Pro
                  </button>
                </div>
              </div>

              {/* Description (locked) */}
              <div className="panel-section panel-locked">
                <div className="panel-label">
                  Description <span className="label-optional">(optional)</span>
                  <IconLock />
                </div>
                <div className="panel-desc-wrap">
                  <textarea
                    className="panel-desc-input"
                    placeholder="Add a description..."
                    disabled
                    maxLength={1000}
                  />
                  <span className="char-count">0/1000</span>
                </div>
              </div>

              {/* Image (locked) */}
              <div className="panel-section panel-locked">
                <div className="panel-label">
                  Image <span className="label-optional">(optional)</span>
                  <IconLock />
                </div>
                <div className="panel-image-upload">
                  <IconImage />
                  <span className="upload-title">Upload image</span>
                  <span className="upload-sub">PNG, JPG up to 5MB</span>
                </div>
              </div>

            </div>

            {/* Panel footer */}
            <div className="panel-footer">
              <button className="btn-cancel" onClick={() => setShowPanel(false)}>Cancel</button>
              <button className="btn-add-task-submit" onClick={handleAddTask}>Add Task</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
