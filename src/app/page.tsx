const quickStats = [
  { label: "Upcoming events", value: "12" },
  { label: "Active members", value: "248" },
  { label: "Open RSVPs", value: "36" },
];

const highlights = [
  {
    title: "Community Calendar",
    description:
      "See everything happening across the group and filter by age or category.",
  },
  {
    title: "RSVP + Forms",
    description:
      "Collect attendee details, allergies, and permissions in one place.",
  },
  {
    title: "Announcements",
    description:
      "Keep families informed with reminder emails and in-app updates.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Home School Group
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Manage events, RSVPs, and community updates in one place.
            </h1>
            <p className="text-base text-slate-600">
              Use the navigation to create events, invite families, and keep
              everyone on schedule.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
