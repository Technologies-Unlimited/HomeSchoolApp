import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = await getDb();
  const events = await db
    .collection("events")
    .find({ status: "published" })
    .sort({ startDate: 1 })
    .limit(200)
    .toArray();

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Home School Group//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Home School Group Events",
  ];

  for (const event of events) {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const uid = event._id.toString() + "@homeschoolgroup";

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART:${formatICalDate(start)}`);
    lines.push(`DTEND:${formatICalDate(end)}`);
    lines.push(`SUMMARY:${escapeICalText(event.title)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }
    if (event.location?.name) {
      const loc = [event.location.name, event.location.address].filter(Boolean).join(", ");
      lines.push(`LOCATION:${escapeICalText(loc)}`);
    }
    lines.push(`DTSTAMP:${formatICalDate(new Date())}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=homeschoolgroup.ics",
    },
  });
}
