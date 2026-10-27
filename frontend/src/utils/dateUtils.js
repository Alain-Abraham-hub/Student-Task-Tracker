import { Temporal as TemporalPolyfill } from 'temporal-polyfill';

// Ensure Temporal is available globally with feature-detection fallback
const T = typeof globalThis.Temporal !== 'undefined' ? globalThis.Temporal : TemporalPolyfill;
if (typeof globalThis.Temporal === 'undefined') {
  globalThis.Temporal = TemporalPolyfill;
}

/**
 * Returns today's location-agnostic calendar date in ISO YYYY-MM-DD format
 * using Temporal.Now.plainDateISO().
 */
export function getTodayISO() {
  return T.Now.plainDateISO().toString();
}

/**
 * Parses a YYYY-MM-DD deadline string with Temporal.PlainDate.from()
 * and formats it cleanly for display without timezone drift.
 */
export function formatCalendarDeadline(deadlineStr) {
  if (!deadlineStr) return 'No deadline';
  try {
    const plainDate = T.PlainDate.from(deadlineStr);
    return plainDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return deadlineStr;
  }
}

/**
 * Computes the calendar differential between today and the deadline using
 * Temporal.PlainDate and formats human-readable duration strings via
 * duration.toLocaleString() (Intl.DurationFormat).
 */
export function getDeadlineUrgency(deadlineStr, status) {
  if (status === 'Completed') {
    return {
      state: 'completed',
      days: 0,
      badgeText: 'Completed',
      badgeClass: 'bg-success-subtle text-success border border-success-subtle',
      icon: 'bi-check2-circle'
    };
  }

  try {
    const today = T.Now.plainDateISO();
    const target = T.PlainDate.from(deadlineStr);
    const duration = today.until(target, { largestUnit: 'day' });
    const days = duration.days;

    if (duration.sign < 0) {
      const overdueDuration = target.until(today, { largestUnit: 'day' });
      const formattedSpan =
        typeof overdueDuration.toLocaleString === 'function'
          ? overdueDuration.toLocaleString('en-US', { style: 'long' })
          : `${Math.abs(days)} days`;
      return {
        state: 'overdue',
        days,
        badgeText: `Overdue by ${formattedSpan}`,
        badgeClass: 'bg-danger text-white',
        icon: 'bi-exclamation-octagon-fill'
      };
    }

    if (days === 0) {
      return {
        state: 'today',
        days: 0,
        badgeText: 'Due Today',
        badgeClass: 'bg-warning text-dark fw-semibold',
        icon: 'bi-alarm-fill'
      };
    }

    const formattedRemaining =
      typeof duration.toLocaleString === 'function'
        ? duration.toLocaleString('en-US', { style: 'short' })
        : `${days}d`;

    if (days <= 3) {
      return {
        state: 'approaching',
        days,
        badgeText: `Due in ${formattedRemaining}`,
        badgeClass: 'bg-warning-subtle text-warning-emphasis border border-warning',
        icon: 'bi-hourglass-split'
      };
    }

    return {
      state: 'upcoming',
      days,
      badgeText: `${formattedRemaining} left`,
      badgeClass: 'bg-light text-secondary border',
      icon: 'bi-calendar-event'
    };
  } catch {
    return {
      state: 'upcoming',
      days: 0,
      badgeText: deadlineStr,
      badgeClass: 'bg-light text-secondary border',
      icon: 'bi-calendar-event'
    };
  }
}

