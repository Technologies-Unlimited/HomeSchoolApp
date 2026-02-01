const upcoming = [
  { date: "Feb 5", title: "Planning committee", time: "6:00 PM" },
  { date: "Feb 15", title: "Family Nature Hike", time: "10:00 AM" },
  { date: "Feb 25", title: "Science Fair", time: "2:00 PM" },
];

export default function CalendarPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Calendar
        </h1>
        <p className="text-sm text-slate-600">
          Keep the schedule organized for families and volunteers.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming</h2>
        <div className="grid gap-3">
          {upcoming.map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <span className="font-semibold">{item.date}</span>
              <span>{item.title}</span>
              <span className="text-slate-500">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
