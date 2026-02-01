import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-600">
        The page you are looking for does not exist yet.
      </p>
      <Link
        href="/"
        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Return home
      </Link>
    </section>
  );
}
