import Link from "next/link";
import ThemeToggle from "./components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 font-sans transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md transition-colors duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
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
          </div>
          <nav className="hidden items-center gap-8 text-sm text-zinc-600 md:flex dark:text-zinc-400">
            <a
              href="#how-it-works"
              className="transition-colors duration-300 hover:text-zinc-900 dark:hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="transition-colors duration-300 hover:text-zinc-900 dark:hover:text-white"
            >
              Features
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="hidden rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-red-500 sm:inline-block"
            >
              Get Help
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pb-32 md:pt-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-red-900/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm text-red-600 transition-colors duration-300 dark:text-red-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Emergency Response Platform
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
            Rescue <span className="text-red-500">Rider</span>
          </h1>
          <p className="mt-4 text-xl font-medium text-red-600 transition-colors duration-300 dark:text-red-400 md:text-2xl">
            Rescuing The Nation
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 transition-colors duration-300 dark:text-zinc-400 md:text-xl">
            When every second counts, Rescue Rider connects people in crisis with
            trained responders nearby. Our AI-powered platform analyzes threats
            in real time and dispatches the closest rider — getting help to you
            faster than traditional emergency services.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/emergency"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-8 text-base font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 hover:shadow-red-500/40 sm:w-auto"
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
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              Request Emergency Help
            </Link>
            <Link
              href="/rider/register"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-8 text-base font-semibold text-zinc-900 transition-all duration-300 hover:border-red-500/50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 sm:w-auto"
            >
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.83m8.34-4.83a6 6 0 0 0-11.67 0M12 3v4m0 0a6 6 0 0 1 6 6v1"
                />
              </svg>
              Become a Rider
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 border-t border-zinc-200 pt-10 transition-colors duration-300 dark:border-zinc-800 md:gap-12">
            {[
              { value: "< 3 min", label: "Avg. Response Time" },
              { value: "10K+", label: "Active Riders" },
              { value: "24/7", label: "Nationwide Coverage" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-red-500 md:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-zinc-500 md:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="border-t border-zinc-200 px-6 py-24 transition-colors duration-300 dark:border-zinc-800"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-600 transition-colors duration-300 dark:text-zinc-400">
              From emergency to assistance in four simple steps — powered by AI
              and a network of dedicated riders.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Raise Emergency",
                description:
                  "Tap one button to alert the network. Share your location and situation instantly.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                ),
              },
              {
                step: "02",
                title: "AI Analyzes Threat",
                description:
                  "Our AI assesses severity, type of emergency, and prioritizes your request.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                  />
                ),
              },
              {
                step: "03",
                title: "Nearby Rider Responds",
                description:
                  "The closest certified rider is notified and dispatched to your location immediately.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                ),
              },
              {
                step: "04",
                title: "Help Arrives Faster",
                description:
                  "Trained responders reach you in minutes — bridging the gap until official services arrive.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                  />
                ),
              },
            ].map((card) => (
              <div
                key={card.step}
                className="group relative rounded-2xl border border-zinc-200 bg-white/80 p-6 transition-all duration-300 hover:border-red-500/40 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
              >
                <span className="text-xs font-bold text-red-500">
                  STEP {card.step}
                </span>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/10 text-red-500 transition-colors group-hover:bg-red-600 group-hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    {card.icon}
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 transition-colors duration-300 dark:text-zinc-400">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-zinc-200 px-6 py-24 transition-colors duration-300 dark:border-zinc-800"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Built for Emergencies
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-600 transition-colors duration-300 dark:text-zinc-400">
              Every feature is designed to save time when lives are on the line.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Real-Time GPS Tracking",
                description:
                  "Pinpoint location sharing ensures riders find you fast, even in unfamiliar areas.",
              },
              {
                title: "AI Threat Classification",
                description:
                  "Machine learning models categorize emergencies and route the right resources.",
              },
              {
                title: "Verified Rider Network",
                description:
                  "Every rider is background-checked, trained, and rated by the community.",
              },
              {
                title: "One-Tap SOS",
                description:
                  "No complicated menus — a single tap triggers the full emergency response chain.",
              },
              {
                title: "Live Status Updates",
                description:
                  "Track your rider's ETA and receive updates until help is at your side.",
              },
              {
                title: "Nationwide Coverage",
                description:
                  "A growing network of riders across cities, towns, and rural communities.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-xl border border-zinc-200/80 p-6 transition-colors duration-300 hover:border-red-500/30 dark:border-zinc-800/60"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600/15">
                  <svg
                    className="h-4 w-4 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600 transition-colors duration-300 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-50/90 to-zinc-100 px-8 py-16 text-center transition-colors duration-300 dark:from-red-950/80 dark:to-zinc-900 md:px-16">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to Make a Difference?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-zinc-600 transition-colors duration-300 dark:text-zinc-400">
            Join thousands of riders across the nation who are saving lives every
            day. Sign up today and be the help someone needs tomorrow.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/rider/register"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-red-600 px-8 font-semibold text-white transition-colors hover:bg-red-500 sm:w-auto"
            >
              Become a Rider
            </Link>
            <a
              href="#"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-zinc-300 px-8 font-semibold text-zinc-900 transition-colors duration-300 hover:border-red-500/50 dark:border-zinc-600 dark:text-white sm:w-auto"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-6 py-12 transition-colors duration-300 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
                  <svg
                    className="h-4 w-4 text-white"
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
                <span className="text-lg font-bold">
                  Rescue <span className="text-red-500">Rider</span>
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                Rescuing The Nation — one emergency at a time.
              </p>
            </div>

            <div className="flex gap-12 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-zinc-800 dark:text-zinc-300">
                  Platform
                </span>
                <a
                  href="#how-it-works"
                  className="transition-colors duration-300 hover:text-zinc-900 dark:hover:text-white"
                >
                  How It Works
                </a>
                <a
                  href="#features"
                  className="transition-colors duration-300 hover:text-zinc-900 dark:hover:text-white"
                >
                  Features
                </a>
                <a
                  href="#"
                  className="transition-colors duration-300 hover:text-zinc-900 dark:hover:text-white"
                >
                  Become a Rider
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-zinc-800 dark:text-zinc-300">
                  Support
                </span>
                <a
                  href="#"
                  className="transition-colors duration-300 hover:text-zinc-900 dark:hover:text-white"
                >
                  Contact
                </a>
                <a
                  href="#"
                  className="transition-colors duration-300 hover:text-zinc-900 dark:hover:text-white"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="transition-colors duration-300 hover:text-zinc-900 dark:hover:text-white"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500 transition-colors duration-300 dark:border-zinc-800 dark:text-zinc-600">
            &copy; {new Date().getFullYear()} Rescue Rider. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
