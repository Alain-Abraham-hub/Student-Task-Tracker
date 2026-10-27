import React, { useMemo, useState } from 'react';
import { Temporal as TemporalPolyfill } from 'temporal-polyfill';
import { formatCalendarDeadline } from '../utils/dateUtils';

const T = typeof globalThis.Temporal !== 'undefined' ? globalThis.Temporal : TemporalPolyfill;

const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };

const START_HOURS = {
  morning: 9,
  afternoon: 14,
  evening: 18
};

function formatTimeRange(startMinutesFromMidnight, durationHours) {
  const endMinutes = Math.round(startMinutesFromMidnight + durationHours * 60);
  const toHHMM = (mins) => {
    const h = Math.floor((mins % 1440) / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  return `${toHHMM(startMinutesFromMidnight)} – ${toHHMM(endMinutes)}`;
}

export default function StudyPlanner({
  tasks,
  onStatusChange,
  onEditTask,
  onOpenCreateTask
}) {
  const [dailyCapacity, setDailyCapacity] = useState(4);
  const [horizonDays, setHorizonDays] = useState(7);
  const [strategy, setStrategy] = useState('urgency'); // 'urgency' | 'balanced' | 'quickwins'
  const [maxBlockHours, setMaxBlockHours] = useState(1.5);
  const [studyWindow, setStudyWindow] = useState('morning'); // 'morning' | 'afternoon' | 'evening'
  const [weekendMode, setWeekendMode] = useState('light'); // 'full' | 'light' | 'off'
  const [generatedStamp, setGeneratedStamp] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const activeTasks = useMemo(
    () => (tasks || []).filter((t) => t.status !== 'Completed'),
    [tasks]
  );

  // Generate the day-by-day study schedule
  const plan = useMemo(() => {
    const today = T.Now.plainDateISO();
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Build calendar days bucket list
    const days = Array.from({ length: horizonDays }, (_, idx) => {
      const dateObj = today.add({ days: idx });
      const iso = dateObj.toString();
      const dayOfWeek = dateObj.dayOfWeek; // 1 = Mon ... 7 = Sun
      const isWeekend = dayOfWeek === 6 || dayOfWeek === 7;

      let capacity = Number(dailyCapacity);
      if (isWeekend) {
        if (weekendMode === 'light') capacity = Number((dailyCapacity * 0.5).toFixed(1));
        if (weekendMode === 'off') capacity = 0;
      }

      return {
        iso,
        label:
          idx === 0
            ? 'Today'
            : idx === 1
            ? 'Tomorrow'
            : `${dayNames[dayOfWeek - 1]}, ${dateObj.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric'
              })}`,
        shortLabel: idx === 0 ? 'Today' : idx === 1 ? 'Tmrw' : dayNames[dayOfWeek - 1],
        shortDate: `${String(dateObj.month).padStart(2, '0')}/${String(dateObj.day).padStart(2, '0')}`,
        isWeekend,
        capacity,
        scheduledHours: 0,
        nextStartMinutes: (START_HOURS[studyWindow] || 9) * 60,
        sessions: []
      };
    });

    // Sort active tasks based on strategy
    const sortedTasks = [...activeTasks].sort((a, b) => {
      if (strategy === 'quickwins') {
        const diffHours = (Number(a.estimatedHours) || 2) - (Number(b.estimatedHours) || 2);
        if (diffHours !== 0) return diffHours;
      }
      const dateCmp = String(a.deadline).localeCompare(String(b.deadline));
      if (dateCmp !== 0) return dateCmp;
      return (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1);
    });

    // Break tasks into study session chunks
    const taskQueues = sortedTasks.map((task) => {
      const totalTaskHours = Math.max(0.5, Number(task.estimatedHours) || 2);
      const chunks = [];
      let remaining = totalTaskHours;
      let part = 1;
      const totalParts = Math.ceil(totalTaskHours / maxBlockHours);

      while (remaining > 0.01) {
        const duration = Number(Math.min(maxBlockHours, remaining).toFixed(1));
        chunks.push({
          task,
          duration,
          part,
          totalParts
        });
        remaining = Number((remaining - duration).toFixed(1));
        part += 1;
      }
      return chunks;
    });

    // Flatten chunks either sequentially (urgency / quickwins) or interleaved round-robin (balanced)
    const orderedChunks = [];
    if (strategy === 'balanced') {
      let hasMore = true;
      let round = 0;
      while (hasMore) {
        hasMore = false;
        for (const q of taskQueues) {
          if (round < q.length) {
            orderedChunks.push(q[round]);
            hasMore = true;
          }
        }
        round += 1;
      }
    } else {
      for (const q of taskQueues) {
        orderedChunks.push(...q);
      }
    }

    const unscheduledChunks = [];
    let onTimeSessions = 0;
    let lateRiskSessions = 0;

    // Assign each chunk to the earliest day with available capacity
    for (const chunk of orderedChunks) {
      let placed = false;

      for (const day of days) {
        const available = Number((day.capacity - day.scheduledHours).toFixed(1));
        if (available >= chunk.duration) {
          const timeSlot = formatTimeRange(day.nextStartMinutes, chunk.duration);
          const isAfterDeadline = day.iso > chunk.task.deadline;
          if (isAfterDeadline) {
            lateRiskSessions += 1;
          } else {
            onTimeSessions += 1;
          }

          day.sessions.push({
            id: `${chunk.task._id}-p${chunk.part}`,
            task: chunk.task,
            duration: chunk.duration,
            part: chunk.part,
            totalParts: chunk.totalParts,
            timeSlot,
            isAfterDeadline
          });

          day.scheduledHours = Number((day.scheduledHours + chunk.duration).toFixed(1));
          // Advance start clock by session duration + 15-minute break
          day.nextStartMinutes += Math.round(chunk.duration * 60) + 15;
          placed = true;
          break;
        }
      }

      if (!placed) {
        unscheduledChunks.push(chunk);
      }
    }

    const totalScheduledHours = Number(
      days.reduce((sum, d) => sum + d.scheduledHours, 0).toFixed(1)
    );
    const totalUnscheduledHours = Number(
      unscheduledChunks.reduce((sum, c) => sum + c.duration, 0).toFixed(1)
    );
    const totalSessions = days.reduce((sum, d) => sum + d.sessions.length, 0);
    const activeStudyDays = days.filter((d) => d.sessions.length > 0).length;

    return {
      days,
      totalScheduledHours,
      totalUnscheduledHours,
      totalSessions,
      activeStudyDays,
      onTimeSessions,
      lateRiskSessions,
      unscheduledChunks
    };
  }, [activeTasks, dailyCapacity, horizonDays, strategy, maxBlockHours, studyWindow, weekendMode]);

  const handleRegenerateClick = (e) => {
    e.preventDefault();
    setGeneratedStamp(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  return (
    <section aria-label="Study Planner Schedule Generator">
      {/* Header Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary p-2 rounded-3">
              <i className="bi bi-calendar2-week-fill fs-5" aria-hidden="true"></i>
            </span>
            <div>
              <h1 className="h4 fw-bold mb-0 text-dark">Smart Study Planner & Schedule Generator</h1>
              <p className="text-muted small mb-0">
                Automatically breaks your active assignments into focused study blocks before each deadline
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-secondary border py-2 px-3">
            <i className="bi bi-clock me-1" aria-hidden="true"></i>
            Updated {generatedStamp}
          </span>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer me-1" aria-hidden="true"></i>
            Print Plan
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm px-3 fw-semibold"
            onClick={onOpenCreateTask}
          >
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            Add Task
          </button>
        </div>
      </div>

      {/* Generator Controls Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex align-items-center justify-content-between">
          <div>
            <h2 className="h6 fw-bold mb-0">
              <i className="bi bi-sliders me-2 text-primary" aria-hidden="true"></i>
              Schedule Generator Parameters
            </h2>
            <small className="text-muted">
              Adjust your daily study hours, session length, and prioritization strategy
            </small>
          </div>
        </div>
        <div className="card-body px-4 pb-4">
          <form onSubmit={handleRegenerateClick}>
            <div className="row g-3 align-items-end">
              {/* Daily Capacity */}
              <div className="col-12 col-sm-6 col-lg-2">
                <label htmlFor="planner-capacity" className="form-label small fw-bold text-secondary mb-1">
                  Daily Capacity: <strong className="text-primary">{dailyCapacity}h / day</strong>
                </label>
                <input
                  id="planner-capacity"
                  name="dailyCapacity"
                  type="range"
                  className="form-range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={dailyCapacity}
                  onChange={(e) => setDailyCapacity(Number(e.target.value))}
                />
              </div>

              {/* Horizon */}
              <div className="col-6 col-sm-6 col-lg-2">
                <label htmlFor="planner-horizon" className="form-label small fw-bold text-secondary mb-1">
                  Planning Horizon
                </label>
                <select
                  id="planner-horizon"
                  name="horizonDays"
                  className="form-select form-select-sm"
                  value={horizonDays}
                  onChange={(e) => setHorizonDays(Number(e.target.value))}
                >
                  <option value={7}>Next 7 Days</option>
                  <option value={14}>Next 14 Days</option>
                  <option value={21}>Next 21 Days</option>
                </select>
              </div>

              {/* Scheduling Strategy */}
              <div className="col-6 col-sm-6 col-lg-3">
                <label htmlFor="planner-strategy" className="form-label small fw-bold text-secondary mb-1">
                  Optimization Strategy
                </label>
                <select
                  id="planner-strategy"
                  name="strategy"
                  className="form-select form-select-sm"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                >
                  <option value="urgency">Urgency & Priority First (EDF)</option>
                  <option value="balanced">Balanced Course Interleaving</option>
                  <option value="quickwins">Quick Wins First (Shortest Tasks)</option>
                </select>
              </div>

              {/* Session Block Length */}
              <div className="col-6 col-sm-6 col-lg-2">
                <label htmlFor="planner-block" className="form-label small fw-bold text-secondary mb-1">
                  Max Session Block
                </label>
                <select
                  id="planner-block"
                  name="maxBlockHours"
                  className="form-select form-select-sm"
                  value={maxBlockHours}
                  onChange={(e) => setMaxBlockHours(Number(e.target.value))}
                >
                  <option value={1}>1.0 Hour Focus</option>
                  <option value={1.5}>1.5 Hours Deep Work</option>
                  <option value={2}>2.0 Hours Extended</option>
                </select>
              </div>

              {/* Study Time Window & Weekend Pace */}
              <div className="col-6 col-sm-6 col-lg-2">
                <label htmlFor="planner-window" className="form-label small fw-bold text-secondary mb-1">
                  Preferred Time & Weekends
                </label>
                <div className="d-flex gap-1">
                  <select
                    id="planner-window"
                    name="studyWindow"
                    className="form-select form-select-sm"
                    value={studyWindow}
                    onChange={(e) => setStudyWindow(e.target.value)}
                    aria-label="Preferred daily time window"
                  >
                    <option value="morning">Morning (09:00)</option>
                    <option value="afternoon">Afternoon (14:00)</option>
                    <option value="evening">Evening (18:00)</option>
                  </select>
                  <select
                    id="planner-weekend"
                    name="weekendMode"
                    className="form-select form-select-sm"
                    value={weekendMode}
                    onChange={(e) => setWeekendMode(e.target.value)}
                    aria-label="Weekend study pace"
                  >
                    <option value="full">Full Wknd</option>
                    <option value="light">50% Wknd</option>
                    <option value="off">Rest Wknd</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <div className="col-12 col-sm-6 col-lg-1">
                <button type="submit" className="btn btn-primary btn-sm w-100 fw-semibold py-2">
                  <i className="bi bi-magic me-1" aria-hidden="true"></i>
                  Generate
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Summary KPI Row for Study Plan */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-bold text-uppercase">Study Sessions</div>
              <div className="h3 fw-bold text-primary mb-0">{plan.totalSessions}</div>
              <small className="text-muted">Across {plan.activeStudyDays} active days</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-bold text-uppercase">Scheduled Workload</div>
              <div className="h3 fw-bold text-dark mb-0">{plan.totalScheduledHours}h</div>
              <small className="text-muted">
                {plan.totalUnscheduledHours > 0
                  ? `${plan.totalUnscheduledHours}h overflow (increase capacity)`
                  : '100% of active hours fitted'}
              </small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-bold text-uppercase">On-Time Sessions</div>
              <div className="h3 fw-bold text-success mb-0">{plan.onTimeSessions}</div>
              <small className="text-muted">Completed before due date</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="text-muted small fw-bold text-uppercase">Deadline Risk</div>
              <div
                className={`h3 fw-bold mb-0 ${
                  plan.lateRiskSessions > 0 || plan.totalUnscheduledHours > 0
                    ? 'text-danger'
                    : 'text-success'
                }`}
              >
                {plan.lateRiskSessions}
              </div>
              <small className="text-muted">
                {plan.lateRiskSessions > 0
                  ? 'Sessions scheduled past deadline'
                  : 'All sessions beat deadlines'}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Warning if unscheduled overflow exists */}
      {plan.totalUnscheduledHours > 0 && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mb-4 border-warning">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
            <strong>Capacity Alert:</strong> {plan.totalUnscheduledHours}h of active coursework could not fit into the{' '}
            {horizonDays}-day window at {dailyCapacity}h/day. Increase your <strong>Daily Capacity</strong> or extend the{' '}
            <strong>Planning Horizon</strong> above.
          </div>
        </div>
      )}

      {/* Daily Study Load Chart */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h6 fw-bold mb-0">Daily Study Load & Capacity Utilization</h2>
            <small className="text-muted">
              Scheduled study hours per day compared against your {dailyCapacity}h daily target
            </small>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
            {horizonDays}-Day View
          </span>
        </div>
        <div className="card-body px-4 pb-4">
          <div
            className="planner-load-grid pt-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(plan.days.length, 14)}, minmax(38px, 1fr))`
            }}
            aria-hidden="true"
          >
            {plan.days.slice(0, 14).map((day) => {
              const pct =
                day.capacity > 0
                  ? Math.min(100, Math.round((day.scheduledHours / day.capacity) * 100))
                  : 0;
              const barColor =
                day.scheduledHours === 0
                  ? 'bg-secondary bg-opacity-25'
                  : pct >= 95
                  ? 'bg-warning'
                  : 'bg-primary';
              return (
                <div key={day.iso} className="horizon-bar-col">
                  <span className="horizon-bar-val fw-semibold text-dark">
                    {day.scheduledHours}h
                  </span>
                  <div className="horizon-bar-track">
                    <div
                      className={`horizon-bar-fill ${barColor}`}
                      style={{ height: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                  <span className="horizon-bar-label">{day.shortLabel}</span>
                  <span className="horizon-bar-sub">{day.shortDate}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day-by-Day Timetable Cards */}
      {activeTasks.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <i className="bi bi-check2-all text-success display-4 d-block mb-2" aria-hidden="true"></i>
            <h3 className="h5 fw-bold">No Pending Academic Tasks to Schedule</h3>
            <p className="text-muted mb-3">
              All of your tasks are marked as Completed, or you haven&apos;t added any assignments yet.
            </p>
            <button type="button" className="btn btn-primary" onClick={onOpenCreateTask}>
              <i className="bi bi-plus-circle me-1" aria-hidden="true"></i>
              Add an Assignment to Plan
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {plan.days.map((day) => (
            <div key={day.iso} className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`badge rounded-pill ${
                        day.sessions.length > 0 ? 'bg-primary' : 'bg-secondary bg-opacity-25 text-secondary'
                      }`}
                    >
                      {day.sessions.length} {day.sessions.length === 1 ? 'Session' : 'Sessions'}
                    </span>
                    <h3 className="h6 fw-bold mb-0 text-dark">{day.label}</h3>
                    {day.isWeekend && (
                      <span className="badge bg-light text-secondary border">Weekend</span>
                    )}
                  </div>
                  <span className="small fw-semibold text-muted">
                    {day.scheduledHours}h / {day.capacity}h cap
                  </span>
                </div>

                <div className="card-body p-3">
                  {day.sessions.length === 0 ? (
                    <div className="text-center py-4 text-muted small bg-light rounded-3">
                      <i className="bi bi-cup-hot me-1" aria-hidden="true"></i>
                      {day.capacity === 0
                        ? 'Rest day — no weekend study sessions scheduled'
                        : 'Free buffer day — no study sessions required'}
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {day.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="p-3 rounded-3 border bg-white d-flex flex-wrap align-items-center justify-content-between gap-2"
                        >
                          <div className="d-flex align-items-start gap-3">
                            <div className="text-center px-2 py-1 rounded-2 bg-primary bg-opacity-10 text-primary fw-bold small" style={{ minWidth: '105px' }}>
                              <div>{session.timeSlot}</div>
                              <div style={{ fontSize: '0.72rem' }}>{session.duration}h block</div>
                            </div>

                            <div>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="fw-bold text-dark">{session.task.title}</span>
                                {session.totalParts > 1 && (
                                  <span className="badge bg-light text-secondary border">
                                    Part {session.part}/{session.totalParts}
                                  </span>
                                )}
                              </div>

                              <div className="small text-muted d-flex flex-wrap align-items-center gap-2 mt-1">
                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                                  {session.task.subject}
                                </span>
                                <span>{session.task.category}</span>
                                <span>•</span>
                                <span>Due {formatCalendarDeadline(session.task.deadline)}</span>
                                {session.isAfterDeadline && (
                                  <span className="badge bg-danger text-white">
                                    <i className="bi bi-exclamation-circle me-1" aria-hidden="true"></i>
                                    Past Due Date
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-1 ms-auto">
                            {session.task.status === 'Pending' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info"
                                onClick={() => onStatusChange(session.task._id, 'In Progress')}
                                title="Start working on this task"
                              >
                                Start
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => onStatusChange(session.task._id, 'Completed')}
                              title="Mark task Completed"
                            >
                              <i className="bi bi-check2-circle me-1" aria-hidden="true"></i>
                              Done
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-light border"
                              onClick={() => onEditTask(session.task)}
                              aria-label={`Edit ${session.task.title}`}
                            >
                              <i className="bi bi-pencil" aria-hidden="true"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

