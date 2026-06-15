"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, AlertTriangle, CheckCircle, XCircle, Clock, Shield,
  LogOut, BarChart3, Search, Filter, Loader2, ChevronDown,
  Activity, TrendingUp,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import type { Rider, Emergency, AdminUser, RescueReview, Review } from "@/types/database";

type Tab = "overview" | "riders" | "emergencies" | "reviews" | "feedback";
type RiderFilter = "all" | "pending" | "verified" | "rejected" | "suspended";

interface Props {
  adminUser: AdminUser;
  riders: Rider[];
  emergencies: Emergency[];
}

export default function AdminDashboardClient({ adminUser, riders: initialRiders, emergencies: initialEmergencies }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [riders, setRiders] = useState(initialRiders);
  const [emergencies, setEmergencies] = useState(initialEmergencies);
  const [rescueReviews, setRescueReviews] = useState<RescueReview[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [victimFeedback, setVictimFeedback] = useState<any[]>([]);
  const [riderFilter, setRiderFilter] = useState<RiderFilter>("all");
  const [riderSearch, setRiderSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedRider, setExpandedRider] = useState<string | null>(null);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  // Realtime: listen for new emergencies and status changes
  useEffect(() => {
    const channel = supabase
      .channel("admin-emergencies")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "emergencies" },
        (payload) => { setEmergencies((prev) => [payload.new as Emergency, ...prev]); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "emergencies" },
        (payload) => {
          setEmergencies((prev) =>
            prev.map((e) => e.id === (payload.new as Emergency).id ? payload.new as Emergency : e)
          );
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch rescue reviews
  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("rescue_reviews")
        .select("*, emergencies(*), riders(*)")
        .order("created_at", { ascending: false });
      if (data) setRescueReviews(data as any);
    };
    fetchReviews();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch victim feedback
  useEffect(() => {
    const fetchFeedback = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          emergencies ( emergency_id, threat_description ),
          riders ( full_name, delivery_company )
        `)
        .order("created_at", { ascending: false });
      if (error) console.error("Feedback fetch error:", error.message);
      if (data) setVictimFeedback(data as unknown as Review[]);
    };
    fetchFeedback();

    // Realtime: new feedback submitted by victims
    const channel = supabase
      .channel("admin-feedback")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reviews" },
        () => { fetchFeedback(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const updateRiderStatus = async (
    riderId: string,
    status: Rider["verification_status"]
  ) => {
    setProcessingId(riderId);
    const { error } = await supabase
      .from("riders")
      .update({ verification_status: status })
      .eq("id", riderId);

    if (!error) {
      setRiders((prev) =>
        prev.map((r) => (r.id === riderId ? { ...r, verification_status: status } : r))
      );
    }
    setProcessingId(null);
  };

  const handleReviewAction = async (reviewId: string, action: "approved" | "rejected") => {
    setProcessingId(reviewId);
    try {
      const response = await fetch(`/api/rescue-reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          admin_notes: adminNotes[reviewId] || null,
        }),
      });

      if (response.ok) {
        setRescueReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, review_status: action, admin_notes: adminNotes[reviewId] || null }
              : r
          )
        );
        setExpandedReview(null);
      }
    } catch (error) {
      console.error("Failed to update review:", error);
    }
    setProcessingId(null);
  };

  const filteredRiders = riders.filter((r) => {
    const matchesFilter = riderFilter === "all" || r.verification_status === riderFilter;
    const matchesSearch =
      riderSearch === "" ||
      r.full_name.toLowerCase().includes(riderSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(riderSearch.toLowerCase()) ||
      r.delivery_company.toLowerCase().includes(riderSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Stats
  const stats = {
    totalRiders: riders.length,
    pendingRiders: riders.filter((r) => r.verification_status === "pending").length,
    verifiedRiders: riders.filter((r) => r.verification_status === "verified").length,
    totalEmergencies: emergencies.length,
    activeEmergencies: emergencies.filter((e) =>
      ["pending", "assigned", "in_progress"].includes(e.status)
    ).length,
    completedEmergencies: emergencies.filter((e) => e.status === "completed").length,
    pendingReviews: rescueReviews.filter((r) => r.review_status === "pending").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs font-bold text-emergency-600 bg-emergency-50 dark:bg-emergency-900/20 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              {adminUser.full_name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-100 dark:border-gray-800 w-fit">
          {[
            { id: "overview" as Tab, icon: <BarChart3 className="w-4 h-4" />, label: "Overview" },
            { id: "riders" as Tab, icon: <Users className="w-4 h-4" />, label: `Riders (${stats.pendingRiders} pending)` },
            { id: "emergencies" as Tab, icon: <AlertTriangle className="w-4 h-4" />, label: "Emergencies" },
            { id: "reviews" as Tab, icon: <CheckCircle className="w-4 h-4" />, label: `Rescues (${stats.pendingReviews} pending)` },
            { id: "feedback" as Tab, icon: <Activity className="w-4 h-4" />, label: "Feedback" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ──────────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  icon: <Users className="w-5 h-5 text-blue-600" />,
                  value: stats.totalRiders,
                  label: "Total Riders",
                  bg: "bg-blue-50 dark:bg-blue-900/10",
                  border: "border-blue-100 dark:border-blue-900/30",
                },
                {
                  icon: <Clock className="w-5 h-5 text-yellow-600" />,
                  value: stats.pendingRiders,
                  label: "Pending Verification",
                  bg: "bg-yellow-50 dark:bg-yellow-900/10",
                  border: "border-yellow-100 dark:border-yellow-900/30",
                },
                {
                  icon: <CheckCircle className="w-5 h-5 text-green-600" />,
                  value: stats.verifiedRiders,
                  label: "Verified Riders",
                  bg: "bg-green-50 dark:bg-green-900/10",
                  border: "border-green-100 dark:border-green-900/30",
                },
                {
                  icon: <AlertTriangle className="w-5 h-5 text-emergency-600" />,
                  value: stats.totalEmergencies,
                  label: "Total Emergencies",
                  bg: "bg-emergency-50 dark:bg-emergency-900/10",
                  border: "border-emergency-100 dark:border-emergency-900/30",
                },
                {
                  icon: <Activity className="w-5 h-5 text-orange-600" />,
                  value: stats.activeEmergencies,
                  label: "Active Now",
                  bg: "bg-orange-50 dark:bg-orange-900/10",
                  border: "border-orange-100 dark:border-orange-900/30",
                },
                {
                  icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
                  value: stats.completedEmergencies,
                  label: "Completed",
                  bg: "bg-purple-50 dark:bg-purple-900/10",
                  border: "border-purple-100 dark:border-purple-900/30",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`${stat.bg} border ${stat.border} rounded-2xl p-4`}
                >
                  <div className="flex items-center gap-2 mb-2">{stat.icon}</div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Pending Riders Quick Action */}
            {stats.pendingRiders > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <p className="font-bold text-yellow-800 dark:text-yellow-300">
                      {stats.pendingRiders} rider{stats.pendingRiders !== 1 ? "s" : ""} awaiting verification
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveTab("riders"); setRiderFilter("pending"); }}
                    className="text-sm font-bold text-yellow-700 dark:text-yellow-400 hover:underline"
                  >
                    Review →
                  </button>
                </div>
              </div>
            )}

            {/* Recent Emergencies */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Emergencies</h3>
              </div>
              {emergencies.slice(0, 5).length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">No emergencies yet</div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {emergencies.slice(0, 5).map((e) => (
                    <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                          {e.emergency_id}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(e.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={e.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RIDERS ───────────────────────────────────────────────────────────── */}
        {activeTab === "riders" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, company..."
                  value={riderSearch}
                  onChange={(e) => setRiderSearch(e.target.value)}
                  className="input-field pl-9 text-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={riderFilter}
                  onChange={(e) => setRiderFilter(e.target.value as RiderFilter)}
                  className="input-field pl-9 pr-8 text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Riders</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Riders List */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {filteredRiders.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400 text-sm">
                  No riders match your filter
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filteredRiders.map((r) => (
                    <div key={r.id} className="px-4 py-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedRider(expandedRider === r.id ? null : r.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emergency-600 flex items-center justify-center text-white font-black">
                            {r.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {r.full_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {r.delivery_company} · {r.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={r.verification_status} size="sm" />
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedRider === r.id ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {expandedRider === r.id && (
                        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {[
                              { label: "Phone", value: r.phone },
                              { label: "Employee ID", value: r.employee_id },
                              { label: "Total Rescues", value: r.total_rescues },
                              { label: "Hero Points", value: r.hero_points },
                              { label: "Joined", value: formatDate(r.created_at) },
                              { label: "Available", value: r.is_available ? "Yes" : "No" },
                            ].map((f) => (
                              <div key={f.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">{f.label}</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {r.verification_status !== "verified" && (
                              <button
                                onClick={() => updateRiderStatus(r.id, "verified")}
                                disabled={processingId === r.id}
                                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                              >
                                {processingId === r.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                Verify
                              </button>
                            )}
                            {r.verification_status !== "rejected" && (
                              <button
                                onClick={() => updateRiderStatus(r.id, "rejected")}
                                disabled={processingId === r.id}
                                className="flex items-center gap-1.5 px-3 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            )}
                            {r.verification_status !== "suspended" && r.verification_status === "verified" && (
                              <button
                                onClick={() => updateRiderStatus(r.id, "suspended")}
                                disabled={processingId === r.id}
                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                              >
                                <Shield className="w-3 h-3" />
                                Suspend
                              </button>
                            )}
                            {r.verification_status === "suspended" && (
                              <button
                                onClick={() => updateRiderStatus(r.id, "verified")}
                                disabled={processingId === r.id}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Reinstate
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EMERGENCIES ──────────────────────────────────────────────────────── */}
        {activeTab === "emergencies" && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">
                All Emergencies ({emergencies.length})
              </h3>
            </div>
            {emergencies.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-400 text-sm">
                No emergencies recorded yet
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {emergencies.map((e) => (
                  <div key={e.id} className="px-4 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white font-mono">
                          {e.emergency_id}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(e.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={e.status} size="sm" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {e.threat_description || "No description provided"}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs text-gray-400 font-mono">
                        📍 {e.latitude.toFixed(5)}, {e.longitude.toFixed(5)}
                      </p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        (e as any).severity_level === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        (e as any).severity_level === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        (e as any).severity_level === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {(e as any).severity_level?.toUpperCase() || 'MEDIUM'}
                      </span>
                    </div>
                    {e.victim_contact && (
                      <p className="text-xs text-gray-400 mt-0.5">📞 {e.victim_contact}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REVIEWS ──────────────────────────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Rescue Reviews ({rescueReviews.length})
                </h3>
              </div>
              {rescueReviews.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400 text-sm">
                  No rescue reviews yet
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {rescueReviews.map((review) => {
                    const emergency = (review as any).emergencies;
                    const rider = (review as any).riders;
                    return (
                      <div key={review.id} className="px-4 py-4">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emergency-600 flex items-center justify-center text-white font-black">
                              {rider?.full_name?.charAt(0) || "R"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {rider?.full_name || "Unknown Rider"}
                              </p>
                              <p className="text-xs text-gray-400">
                                Emergency: {emergency?.emergency_id || "Unknown"} · {formatDate(review.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={review.review_status} size="sm" />
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                expandedReview === review.id ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {expandedReview === review.id && (
                          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">Emergency ID</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                                  {emergency?.emergency_id || "—"}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">Rider</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {rider?.full_name || "—"}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">Company</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {rider?.delivery_company || "—"}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">Submitted</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatDateTime(review.created_at)}
                                </p>
                              </div>
                            </div>

                            {emergency?.threat_description && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 mb-4">
                                <p className="text-xs text-gray-400">Threat Description</p>
                                <p className="text-sm text-gray-900 dark:text-white">{emergency.threat_description}</p>
                              </div>
                            )}

                            {review.review_status === "pending" && (
                              <>
                                <div className="mb-4">
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Admin Notes (optional)
                                  </label>
                                  <textarea
                                    value={adminNotes[review.id] || ""}
                                    onChange={(e) => setAdminNotes((prev) => ({ ...prev, [review.id]: e.target.value }))}
                                    placeholder="Add notes about this rescue..."
                                    rows={2}
                                    className="input-field resize-none"
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReviewAction(review.id, "approved")}
                                    disabled={processingId === review.id}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                                  >
                                    {processingId === review.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReviewAction(review.id, "rejected")}
                                    disabled={processingId === review.id}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Reject
                                  </button>
                                </div>
                              </>
                            )}

                            {review.review_status !== "pending" && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">Admin Notes</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {review.admin_notes || "No notes provided"}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VICTIM FEEDBACK ───────────────────────────────────────────────────── */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Victim Feedback ({victimFeedback.length})
                </h3>
              </div>
              {victimFeedback.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400 text-sm">
                  No victim feedback yet
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {victimFeedback.map((feedback) => {
                    const emergency = (feedback as any).emergencies;
                    const rider = (feedback as any).riders;
                    return (
                      <div key={feedback.id} className="px-4 py-4">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedFeedback(expandedFeedback === feedback.id ? null : feedback.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-white font-black">
                              {feedback.rating}⭐
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {rider?.full_name || "Unknown Rider"}
                              </p>
                              <p className="text-xs text-gray-400">
                                Emergency: {emergency?.emergency_id || "Unknown"} · {formatDate(feedback.created_at)}
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedFeedback === feedback.id ? "rotate-180" : ""
                            }`}
                          />
                        </div>

                        {expandedFeedback === feedback.id && (
                          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">Emergency ID</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                                  {emergency?.emergency_id || "—"}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">Rating</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {feedback.rating} / 5 stars
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">Rider</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {rider?.full_name || "—"}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400">Submitted</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatDateTime(feedback.created_at)}
                                </p>
                              </div>
                            </div>

                            {feedback.feedback && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 mb-4">
                                <p className="text-xs text-gray-400">Feedback</p>
                                <p className="text-sm text-gray-900 dark:text-white">{feedback.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
