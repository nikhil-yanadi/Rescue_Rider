"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Bike,
  User,
  Mail,
  Phone,
  Building2,
  CreditCard,
  Lock,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

const DELIVERY_COMPANIES = [
  "Zomato",
  "Swiggy",
  "Blinkit",
  "Zepto",
  "Other",
];

export default function RiderRegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    deliveryCompany: "",
    employeeId: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.deliveryCompany) {
      setError("Please select your delivery company.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName, role: "rider" },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Sign up failed.");

      // Ensure the session is active before inserting (signUp may need a session refresh)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Session not ready yet — set it manually from the signUp response
        if (authData.session) {
          await supabase.auth.setSession(authData.session);
        }
      }

      // Insert rider profile
      const { error: riderError } = await supabase.from("riders").insert({
        user_id: authData.user.id,
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        delivery_company: form.deliveryCompany,
        employee_id: form.employeeId,
        verification_status: "pending",
        is_available: false,
        hero_points: 0,
        rescue_streak: 0,
        total_rescues: 0,
      });

      if (riderError) {
        console.error("Rider insert error:", riderError);
        throw new Error(riderError.message || riderError.details || JSON.stringify(riderError));
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
            Registration Successful!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Welcome to Rescue Rider. Your account is currently{" "}
            <span className="font-semibold text-yellow-600">pending verification</span>.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
              What happens next?
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
              <li>• Our admin team will review your application</li>
              <li>• Verification typically takes 24-48 hours</li>
              <li>• You&apos;ll receive a notification when approved</li>
            </ul>
          </div>
          <button
            onClick={() => router.push("/rider/login")}
            className="w-full py-3 bg-emergency-600 hover:bg-emergency-700 text-white font-bold rounded-xl transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <Logo size="sm" />
        <div className="w-9" />
      </div>

      <div className="max-w-md mx-auto px-4 pb-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emergency-50 dark:bg-emergency-900/20 flex items-center justify-center mx-auto mb-4">
            <Bike className="w-7 h-7 text-emergency-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
            Become A Rider
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Join thousands of riders saving lives every day
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={form.fullName}
                onChange={set("fullName")}
                placeholder="Your full name"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                required
                value={form.phone}
                onChange={set("phone")}
                placeholder="+91 XXXXX XXXXX"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Delivery Company */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Delivery Company
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                required
                value={form.deliveryCompany}
                onChange={set("deliveryCompany")}
                className="input-field pl-10 appearance-none cursor-pointer"
              >
                <option value="">Select your company</option>
                {DELIVERY_COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Employee ID
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={form.employeeId}
                onChange={set("employeeId")}
                placeholder="Your company employee ID"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={form.password}
                onChange={set("password")}
                placeholder="Min. 8 characters"
                className="input-field pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-emergency-600 hover:bg-emergency-700 disabled:opacity-70 text-white font-black text-base rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
            ) : (
              "Create Rider Account"
            )}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/rider/login" className="text-emergency-600 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
