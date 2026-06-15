import Link from "next/link";
import { Shield, Bike, Users, Zap, CheckCircle, ArrowRight } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Link
              href="/rider/login"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2"
            >
              Rider Login
            </Link>
            <Link
              href="/rider/register"
              className="hidden sm:block text-sm font-semibold border border-gray-900 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 px-4 py-2 rounded-lg transition-colors"
            >
              Become a Rider
            </Link>
            <Link
              href="/admin/login"
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-12">
        {/* Alert Banner */}
        <div className="mb-8 px-4 py-2 rounded-full bg-emergency-50 dark:bg-emergency-900/20 border border-emergency-200 dark:border-emergency-800 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emergency-500 animate-pulse" />
          <span className="text-sm text-emergency-700 dark:text-emergency-400 font-medium">
            Live Emergency System Active
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-center text-gray-900 dark:text-white leading-tight mb-4 max-w-3xl">
          Help Is Just
          <br />
          <span className="text-emergency-600">One Tap</span> Away
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 text-center max-w-xl mb-12 leading-relaxed">
          Rescue Rider connects people in danger with nearby verified delivery
          riders for fast, real emergency response.
        </p>

        {/* SAVE ME Button */}
        <div className="flex flex-col items-center gap-6 mb-16">
          <div className="relative">
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full bg-emergency-500 opacity-20 animate-ping" />
            <div
              className="absolute inset-0 rounded-full bg-emergency-500 opacity-10 animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
            <Link
              href="/save-me"
              className="relative z-10 flex flex-col items-center justify-center w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-emergency-600 hover:bg-emergency-700 active:bg-emergency-800 text-white shadow-2xl shadow-emergency-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <span className="text-5xl mb-1">🚨</span>
              <span className="text-2xl sm:text-3xl font-black tracking-wider">
                SAVE ME
              </span>
              <span className="text-xs font-medium opacity-80 mt-1">
                Tap for emergency help
              </span>
            </Link>
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-xs">
            No account needed. We&apos;ll find your location and alert nearby riders
            instantly.
          </p>

          <Link
            href="/rider/register"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-emergency-600 dark:hover:text-emergency-400 transition-colors border border-gray-300 dark:border-gray-700 hover:border-emergency-400 dark:hover:border-emergency-600 px-6 py-3 rounded-full"
          >
            <Bike className="w-4 h-4" />
            Become A Rider
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* How It Works */}
        <section className="w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6 text-emergency-600" />,
                step: "01",
                title: "Tap SAVE ME",
                description:
                  "One tap shares your GPS location instantly. No signup, no delay.",
              },
              {
                icon: <Users className="w-6 h-6 text-emergency-600" />,
                step: "02",
                title: "Riders Notified",
                description:
                  "Nearby verified delivery riders receive your emergency alert immediately.",
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-emergency-600" />,
                step: "03",
                title: "Help Arrives",
                description:
                  "The first rider who accepts navigates to you in real-time.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
              >
                <div className="w-12 h-12 rounded-2xl bg-emergency-50 dark:bg-emergency-900/30 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-emergency-500 mb-2">
                  STEP {item.step}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Stats Bar */}
      <div className="border-t border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
          {[
            { value: "10K+", label: "Verified Riders" },
            { value: "50K+", label: "Emergencies Handled" },
            { value: "< 5 min", label: "Avg Response Time" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl sm:text-2xl font-black text-emergency-600">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-900 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size="sm" />
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
            &copy; {new Date().getFullYear()} Rescue Rider. Rescuing The Nation.
          </p>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emergency-500" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Safety first, always
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
