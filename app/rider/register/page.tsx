import Link from "next/link";
import ThemeToggle from "../../components/theme-toggle";

export const metadata = {
  title: "Become a Rider | Rescue Rider",
  description: "Register as a Rescue Rider and help your community in emergencies.",
};

export default function RiderRegisterPage() {
  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 font-sans transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md transition-colors duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              Rescue <span className="text-red-500">Rider</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center md:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm text-red-600 transition-colors duration-300 dark:text-red-400">
          Rider Registration
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Become a Rider
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600 transition-colors duration-300 dark:text-zinc-400">
          Join the Rescue Rider network and help people in your community during
          emergencies. The registration form will be available here soon.
        </p>

        <Link
          href="/"
          className="mt-10 flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-8 font-semibold text-zinc-900 transition-all duration-300 hover:border-red-500/50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back to Home
        </Link>
      </main>
    </div>
  );
}
