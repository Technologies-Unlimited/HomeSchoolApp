export const DEFAULT_NOTIFICATION_PREFERENCES = {
  // Master toggle
  emailEnabled: true,

  // Event reminders (email only — sent before events you RSVP'd to)
  reminder1Day: true,
  reminder1Week: true,
  reminder2Weeks: false,
  reminder1Month: false,
  reminderCustomDays: null as number | null,

  // In-app notification toggles (what appears in your inbox)
  notifyEventApproved: true,
  notifyEventRejected: true,
  notifyEventRsvp: true,
  notifyEventComment: true,
  notifyCommentReply: true,
  notifyWaitlistPromoted: true,
  notifyAnnouncement: true,
};
