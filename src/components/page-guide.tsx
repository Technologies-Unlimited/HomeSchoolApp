"use client";

import { useState } from "react";

const PAGE_GUIDES: Record<string, { headline: string; summary: string; details: string[] }> = {
  home: {
    headline: "Welcome to your homepage",
    summary: "This is the central hub for the community. See the latest announcements and upcoming events at a glance.",
    details: [
      "Announcements from admins appear front and center — public ones are visible to everyone, while members-only announcements require signing in.",
      "The upcoming events sidebar shows the next few gatherings so you can quickly RSVP or plan ahead.",
      "Quick action cards give you one-click access to create events, browse the calendar, check the family directory, or update your profile.",
    ],
  },
  events_directory: {
    headline: "Browse community events",
    summary: "Find upcoming gatherings, field trips, and activities. Filter by category, RSVP, and sign up for volunteer slots.",
    details: [
      "Browse all published events across the group. Filter by category to find field trips, co-op classes, park days, and more.",
      "Each event can include details like location, age ranges, fees, volunteer slots, and custom sign-up forms.",
      "Click any event to see full details, RSVP, join a carpool, or sign up as a volunteer.",
    ],
  },
  events_drafts: {
    headline: "Your draft events",
    summary: "Events you've created that haven't been published yet. Edit them or submit for admin review.",
    details: [
      "Draft events are only visible to you until you submit them for review.",
      "Once submitted, an admin will review and either approve (publish) or send it back with feedback.",
      "You can continue editing a draft event from the event detail page before submitting.",
    ],
  },
  events_mine: {
    headline: "Your personal schedule",
    summary: "See all events you've RSVP'd to plus events you've created, all in one place.",
    details: [
      "Events you're attending shows everything you've RSVP'd going, maybe, or waitlisted to — so you can quickly see your upcoming commitments.",
      "Events you created shows your published events so you can track attendance and manage them.",
    ],
  },
  calendar: {
    headline: "Your community calendar",
    summary: "See all approved events laid out by month so you can plan your family's schedule around the group's activities.",
    details: [
      "Events are grouped by month with key details like date, time, and location visible at a glance.",
      "Click any event to see full details, RSVP, or sign up for volunteer slots.",
      "The calendar only shows published events — drafts and pending events are managed from the events page.",
    ],
  },
  directory: {
    headline: "Family directory",
    summary: "Connect with other families in the group. Find contact info, see who's nearby, and build relationships.",
    details: [
      "Each family's listing shows the parents' names and contact info so you can coordinate playdates, carpools, or study groups.",
      "Your own directory visibility is controlled from your profile — you choose what information other families can see.",
      "Search and filter to find specific families or browse the full community roster.",
    ],
  },
  notifications: {
    headline: "Stay in the loop",
    summary: "See alerts for event updates, approval status changes, and community activity that involves you.",
    details: [
      "Notifications let you know when events you've RSVP'd to are updated, when your event submissions are approved or rejected, and when admin actions affect your account.",
      "You can configure your notification preferences to control what you receive email alerts for versus in-app only.",
      "Mark notifications as read individually or clear them all at once to keep things tidy.",
    ],
  },
  profile: {
    headline: "Your family profile",
    summary: "Manage your account details, add children, link with a spouse, and control what's visible in the directory.",
    details: [
      "Your profile includes your contact info, children's details, and family information — this is what other families see in the directory.",
      "Add multiple children with their names, ages, and any relevant details like allergies or grade level.",
      "Link your account with a spouse or partner so you share the same family profile and children list without duplicating information.",
    ],
  },
  admin_overview: {
    headline: "Your command center",
    summary: "See everything that needs your attention in one place — pending members, event approvals, and shared admin notes.",
    details: [
      "Pending members shows verified users waiting for your approval before they can access community content like events, the directory, and announcements.",
      "Event approvals lists events submitted by members that need admin review before they go live on the calendar.",
      "Team notes is a shared scratchpad visible to all admins — use it for reminders, decisions, or handoff context between co-admins.",
    ],
  },
  admin_users: {
    headline: "Manage your community",
    summary: "View every registered member, change roles, and monitor verification and approval status at a glance.",
    details: [
      "Roles control what a user can do: regular users can create events and RSVP, admins can approve members and events, and super admins have full access including role management.",
      "Status badges show whether a member has verified their email and whether an admin has approved their account — both are required before they can access protected content.",
      "You can promote trusted members to admin so they can help manage the group, or demote if needed. You cannot change your own role.",
    ],
  },
  admin_announcements: {
    headline: "Keep everyone informed",
    summary: "Publish announcements to the homepage. Control who sees them, how urgent they are, and when they go live.",
    details: [
      "Visibility controls who can read an announcement: public announcements appear on the homepage even for visitors who aren't signed in, while members-only announcements require login.",
      "Priority levels (normal, important, urgent) change the visual styling on the homepage so members can quickly spot what matters most.",
      "Pinned announcements always appear at the top of the list regardless of date. Scheduling lets you write an announcement now and have it appear automatically at a future date and time.",
    ],
  },
  admin_invites: {
    headline: "Grow your community",
    summary: "Send email invitations to families you'd like to join. They'll get a styled email with a direct link to register.",
    details: [
      "Invites send a branded email through Mailgun with a one-click registration link. The recipient's email is pre-filled on the sign-up form so they just need to complete their details.",
      "You can invite someone as a regular member or as an admin if you need help managing the group. Their role is set once they complete registration.",
      "The personal message field lets you add a warm note that appears in the invite email — great for making new families feel welcome. You can resend any invite if the recipient missed it.",
    ],
  },
  admin_activity: {
    headline: "Activity log",
    summary: "Track every action across the app — member approvals, role changes, event lifecycle, and announcement management. Revert changes if something was done in error.",
    details: [
      "Member actions are tracked: approvals, denials, role changes, deactivations, and reactivations — so you always know who granted or revoked access.",
      "Event actions are tracked: creation, edits, approvals, and cancellations — giving you a full timeline of every event from draft to published or cancelled.",
      "Announcement actions are tracked: creation, edits, and deletions — so you can see who posted what and restore deleted announcements if needed.",
      "Actions that changed data include a snapshot of the previous state. You can revert these with one click to restore the original values.",
      "Filter by action type to quickly find specific changes, and paginate through the full history.",
    ],
  },
  my_events: {
    headline: "Your personal schedule",
    summary: "See all events you've RSVP'd to plus events you've created, all in one place.",
    details: [
      "Events you're attending shows everything you've RSVP'd going, maybe, or waitlisted to — so you can quickly see your upcoming commitments.",
      "Events you created shows your drafts, pending submissions, and published events so you can track their status.",
    ],
  },
};

export function PageGuide({ pageKey, children }: { pageKey: string; children: React.ReactNode }) {
  const guide = PAGE_GUIDES[pageKey];
  const storageKey = `page-guide-dismissed-${pageKey}`;
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(storageKey) !== "1";
  });
  const [expanded, setExpanded] = useState(false);

  if (!guide) return <>{children}</>;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        {children}
        {!visible && (
          <button
            onClick={() => { localStorage.removeItem(storageKey); setVisible(true); }}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
            What is this?
          </button>
        )}
      </div>
      {visible && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{guide.headline}</p>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{guide.summary}</p>
            </div>
            <button
              onClick={() => { localStorage.setItem(storageKey, "1"); setVisible(false); }}
              className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Dismiss guide"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-700"
          >
            <svg className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            {expanded ? "Hide details" : "What can I do here?"}
          </button>
          {expanded && (
            <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {guide.details.map((detail, index) => (
                <li key={index} className="flex gap-2 text-xs leading-relaxed text-slate-500">
                  <span className="mt-0.5 shrink-0 text-slate-300">&#x2022;</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
