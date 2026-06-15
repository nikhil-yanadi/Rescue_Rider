"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Star, Flame, Award, Bell, LogOut, CheckCircle,
  Clock, XCircle, MapPin, AlertTriangle, Navigation,
  Loader2, ChevronRight, ToggleLeft, ToggleRight, Timer,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import type { Rider } from "@/types/database";

const MISSION_DEADLINE_SECONDS = 300; // 5 minutes

// Badge levels based on hero points
const getBadgeLevel = (points: number): { name: string; icon: string; color: string } => {
  if (points >= 1000) return { name: "Nation Saver", icon: "🏆", color: "text-purple-600" };
  if (points >= 500) return { name: "Rescue Champion", icon: "🥇", color: "text-yellow-600" };
  if (points >= 200) return { name: "Community Protector", icon: "🥈", color: "text-gray-600" };
  if (points >= 50) return { name: "Beginner Hero", icon: "🥉", color: "text-orange-600" };
  return { name: "Newcomer", icon: "🌟", color: "text-gray-400" };
};

interface Assignment {
  id: string;
  emergency_id: string;
  rider_id: string;
  status: string;
  notified_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
  emergencies: {
    id: string;
    emergency_id: string;
    latitude: number;
    longitude: number;
    threat_description: string | null;
    status: string;
    created_at: string;
  } | null;
}

interface IncomingEmergency {
  assignment_id: string;
  emergency: {
    id: string;
    emergency_id: string;
    latitude: number;
    longitude: number;
    threat_description: string | null;
    status: string;
    created_at: string;
  };
}

interface ActiveMission {
  assignment_id: string;
  accepted_at: string;
  emergency: {
    id: string;
    emergency_id: string;
    latitude: number;
    longitude: number;
    threat_description: string | null;
    status: string;
  };
}

type Tab = "dashboard" | "missions" | "profile";
type MilestoneStatus = "pending" | "done";

interface Milestone { label: string; status: MilestoneStatus; }

interface Props { rider: Rider; assignments: Assignment[]; }

export default function RiderDashboardClient({ rider: initialRider, assignments: initialAssignments }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [rider, setRider] = useState(initialRider);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [incomingEmergency, setIncomingEmergency] = useState<IncomingEmergency | null>(null);
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [missionAction, setMissionAction] = useState("");
  const [countdown, setCountdown] = useState(MISSION_DEADLINE_SECONDS);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { label: "Mission Accepted", status: "done" },
    { label: "En Route to Victim", status: "pending" },
    { label: "Arrived at Location", status: "pending" },
    { label: "Rescue In Progress", status: "pending" },
    { label: "Mission Completed", status: "pending" },
  ]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const milestoneTrackingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch active mission on load
  const fetchActiveMission = useCallback(async () => {
    const { data } = await supabase
      .from("emergency_assignments")
      .select("*, emergencies(*)")
      .eq("rider_id", rider.id)
      .eq("status", "accepted")
      .maybeSingle();

    if (data && data.emergencies) {
      setActiveMission({
        assignment_id: data.id,
        accepted_at: data.accepted_at || new Date().toISOString(),
        emergency: data.emergencies as ActiveMission["emergency"],
      });
      updateMilestones(data.emergencies.status);
    }
  }, [rider.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchActiveMission(); }, [fetchActiveMission]);

  // Countdown timer for active mission
  useEffect(() => {
    if (!activeMission) { if (countdownRef.current) clearInterval(countdownRef.current); return; }
    const accepted = new Date(activeMission.accepted_at).getTime();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - accepted) / 1000);
      const remaining = Math.max(0, MISSION_DEADLINE_SECONDS - elapsed);
      setCountdown(remaining);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [activeMission]);

  // Milestone tracking - capture rider location every 30 seconds during active mission
  useEffect(() => {
    if (!activeMission || activeMission.emergency.status === "completed") {
      if (milestoneTrackingRef.current) {
        clearInterval(milestoneTrackingRef.current);
        milestoneTrackingRef.current = null;
      }
      return;
    }

    const trackLocation = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await fetch("/api/milestones", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assignment_id: activeMission.assignment_id,
                rider_id: rider.id,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            });
          } catch (error) {
            console.error("Failed to track milestone:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Track immediately, then every 30 seconds
    trackLocation();
    milestoneTrackingRef.current = setInterval(trackLocation, 30000);

    return () => {
      if (milestoneTrackingRef.current) {
        clearInterval(milestoneTrackingRef.current);
      }
    };
  }, [activeMission, rider.id]);

  const updateMilestones = (status: string) => {
    setMilestones([
      { label: "Mission Accepted", status: "done" },
      { label: "En Route to Victim", status: "done" },
      { label: "Arrived at Location", status: status === "in_progress" || status === "completed" ? "done" : "pending" },
      { label: "Rescue In Progress", status: status === "in_progress" || status === "completed" ? "done" : "pending" },
      { label: "Mission Completed", status: status === "completed" ? "done" : "pending" },
    ]);
  };

  // Realtime: new emergency assignment for this rider
  useEffect(() => {
    if (rider.verification_status !== "verified") return;

    const channel = supabase
      .channel(`rider-${rider.id}-assignments`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "emergency_assignments",
        filter: `rider_id=eq.${rider.id}`,
      }, async (payload) => {
        const assignment = payload.new as { id: string; emergency_id: string; status: string };
        if (assignment.status !== "notified") return;
        const { data: emergency } = await supabase
          .from("emergencies").select("*").eq("id", assignment.emergency_id).single();
        if (emergency && emergency.status === "pending") {
          setIncomingEmergency({ assignment_id: assignment.id, emergency });
          // Play alert sound
          try {
            if (!alertAudioRef.current) {
              alertAudioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2ozETF2pcfYsXs8FStgjrbb0aNqMB9OkMjn1qxwORdAg7vg1bGASjAgRIHD8N23e0kqGTx9wvjnuHBFICo7esDz7LJlORgqN3e");
            }
            alertAudioRef.current.play().catch(() => {});
          } catch {}
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rider.id, rider.verification_status]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAvailability = async () => {
    setIsTogglingAvailability(true);
    const newStatus = !rider.is_available;
    const { error } = await supabase.from("riders").update({ is_available: newStatus }).eq("id", rider.id);
    if (!error) setRider((prev) => ({ ...prev, is_available: newStatus }));
    setIsTogglingAvailability(false);
  };

  const handleAcceptEmergency = async () => {
    if (!incomingEmergency) return;
    setIsProcessing(true);
    try {
      // Check if already taken
      const { data: existing } = await supabase
        .from("emergency_assignments").select("id").eq("emergency_id", incomingEmergency.emergency.id).eq("status", "accepted").maybeSingle();

      if (existing) {
        alert("Sorry — this mission was already accepted by another rider.");
        setIncomingEmergency(null);
        return;
      }

      await supabase.from("emergency_assignments")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", incomingEmergency.assignment_id);

      await supabase.from("emergencies")
        .update({ status: "assigned", assigned_rider_id: rider.id })
        .eq("id", incomingEmergency.emergency.id);

      const now = new Date().toISOString();
      setActiveMission({ assignment_id: incomingEmergency.assignment_id, accepted_at: now, emergency: incomingEmergency.emergency });
      setMilestones([
        { label: "Mission Accepted", status: "done" },
        { label: "En Route to Victim", status: "done" },
        { label: "Arrived at Location", status: "pending" },
        { label: "Rescue In Progress", status: "pending" },
        { label: "Mission Completed", status: "pending" },
      ]);
      setIncomingEmergency(null);
    } catch (err) { console.error(err); }
    finally { setIsProcessing(false); }
  };

  const handleIgnoreEmergency = async () => {
    if (!incomingEmergency) return;
    await supabase.from("emergency_assignments").update({ status: "rejected" }).eq("id", incomingEmergency.assignment_id);
    setIncomingEmergency(null);
  };

  const handleMissionAction = async (action: "arrived" | "backup" | "completed" | "failed") => {
    if (!activeMission) return;
    setMissionAction(action);
    setIsProcessing(true);

    try {
      if (action === "arrived") {
        await supabase.from("emergencies").update({ status: "in_progress" }).eq("id", activeMission.emergency.id);
        setActiveMission((prev) => prev ? { ...prev, emergency: { ...prev.emergency, status: "in_progress" } } : null);
        updateMilestones("in_progress");

      } else if (action === "completed" || action === "failed") {
        const finalStatus = action === "completed" ? "completed" : "cancelled";
        await supabase.from("emergency_assignments")
          .update({ status: action === "completed" ? "completed" : "rejected", completed_at: new Date().toISOString() })
          .eq("id", activeMission.assignment_id);

        await supabase.from("emergencies").update({ status: finalStatus }).eq("id", activeMission.emergency.id);

        if (action === "completed") {
          // Create rescue review for admin approval instead of awarding points immediately
          await supabase.from("rescue_reviews").insert({
            emergency_id: activeMission.emergency.id,
            rider_id: rider.id,
            review_status: "pending",
          });

          const newRescues = rider.total_rescues + 1;
          await supabase.from("riders").update({ total_rescues: newRescues }).eq("id", rider.id);
          setRider((prev) => ({ ...prev, total_rescues: newRescues }));
          updateMilestones("completed");
        }

        setActiveMission(null);
        // Refresh assignments list
        const { data: fresh } = await supabase
          .from("emergency_assignments").select("*, emergencies(*)")
          .eq("rider_id", rider.id).order("created_at", { ascending: false }).limit(10);
        if (fresh) setAssignments(fresh as Assignment[]);
        router.refresh();

      } else if (action === "backup") {
        alert("Backup request sent to nearby riders!");
      }
    } catch (err) { console.error(err); }
    finally { setIsProcessing(false); setMissionAction(""); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const verificationColor = rider.verification_status === "verified"
    ? "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
    : rider.verification_status === "pending"
    ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400"
    : "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";

  const badgeLevel = getBadgeLevel(rider.hero_points);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col pb-20">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-1">
            {activeMission && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black mr-2 ${countdown < 60 ? "bg-emergency-600 text-white animate-pulse" : countdown < 120 ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
                <Timer className="w-3.5 h-3.5" />
                {formatCountdown(countdown)}
              </div>
            )}
            <button className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-4 pt-4">
        {/* ── INCOMING EMERGENCY ─────────────────────────────────────────────────── */}
        {incomingEmergency && (
          <div className="mb-4 bg-emergency-600 rounded-2xl p-4 text-white shadow-2xl shadow-emergency-600/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="font-black text-lg tracking-wide">🚨 EMERGENCY NEARBY</span>
            </div>
            <p className="text-sm opacity-90 mb-1">{incomingEmergency.emergency.threat_description || "Emergency — victim needs immediate help"}</p>
            <p className="text-xs opacity-70 mb-4 font-mono">
              📍 {incomingEmergency.emergency.latitude.toFixed(4)}, {incomingEmergency.emergency.longitude.toFixed(4)}
            </p>
            <div className="flex gap-3">
              <button onClick={handleAcceptEmergency} disabled={isProcessing}
                className="flex-1 py-3 bg-white text-emergency-600 font-black rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                ACCEPT
              </button>
              <button onClick={handleIgnoreEmergency} disabled={isProcessing}
                className="flex-1 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 flex items-center justify-center gap-2 transition-colors">
                <XCircle className="w-4 h-4" /> IGNORE
              </button>
            </div>
          </div>
        )}

        {/* ── ACTIVE MISSION ──────────────────────────────────────────────────────── */}
        {activeMission && (
          <div className="mb-4 bg-white dark:bg-gray-900 border-2 border-emergency-500 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-emergency-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="font-black text-white text-sm uppercase tracking-wide">Active Mission</span>
              </div>
            </div>

            {/* BIG COUNTDOWN TIMER above map */}
            <div className={`flex flex-col items-center justify-center py-5 border-b border-gray-100 dark:border-gray-800 ${countdown < 60 ? "bg-emergency-50 dark:bg-emergency-900/20" : countdown < 120 ? "bg-orange-50 dark:bg-orange-900/10" : "bg-gray-50 dark:bg-gray-800/50"}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Time to reach victim</p>
              <div className={`text-7xl font-black tabular-nums tracking-tight ${countdown < 60 ? "text-emergency-600 animate-pulse" : countdown < 120 ? "text-orange-500" : "text-gray-900 dark:text-white"}`}>
                {formatCountdown(countdown)}
              </div>
              <div className="w-full px-4 mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${countdown < 60 ? "bg-emergency-600" : countdown < 120 ? "bg-orange-500" : "bg-green-500"}`}
                    style={{ width: `${(countdown / MISSION_DEADLINE_SECONDS) * 100}%` }}
                  />
                </div>
              </div>
              {countdown === 0 && (
                <p className="text-sm font-black text-emergency-600 mt-2 animate-pulse">⚠️ TIME OVERDUE — HURRY!</p>
              )}
              {countdown > 0 && countdown <= 60 && (
                <p className="text-sm font-bold text-emergency-600 mt-1">🔥 Less than 1 minute left!</p>
              )}
            </div>

            <div className="p-4">
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-3">{activeMission.emergency.emergency_id}</p>

              {/* Map embed */}
              <div className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-3" style={{ height: 200 }}>
                <iframe
                  title="Victim Location"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${activeMission.emergency.latitude},${activeMission.emergency.longitude}&z=15&output=embed`}
                />
              </div>

              {/* Victim location + last seen timeline */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emergency-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-mono">
                      {activeMission.emergency.latitude.toFixed(5)}, {activeMission.emergency.longitude.toFixed(5)}
                    </p>
                  </div>
                  <a href={`https://maps.google.com/?q=${activeMission.emergency.latitude},${activeMission.emergency.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-emergency-600 font-bold bg-emergency-50 dark:bg-emergency-900/20 px-2 py-1 rounded-lg">
                    <Navigation className="w-3 h-3" /> Navigate
                  </a>
                </div>
                {/* Last seen timeline */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">📍 Victim Location Timeline</p>
                  <div className="space-y-1.5">
                    {[
                      { time: "Just now", label: "Last known location", color: "bg-emergency-500" },
                      { time: `${Math.floor((Date.now() - new Date(activeMission.emergency.created_at || activeMission.accepted_at).getTime()) / 60000)} min ago`, label: "Emergency triggered here", color: "bg-orange-400" },
                      { time: `${Math.floor((Date.now() - new Date(activeMission.accepted_at).getTime()) / 60000) + 1} min ago`, label: "Mission accepted", color: "bg-blue-400" },
                    ].map((point, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${point.color} flex-shrink-0`} />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-300">{point.label}</span>
                          <span className="text-xs font-bold text-gray-400">{point.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {activeMission.emergency.threat_description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl px-3 py-2 mb-3">
                  ⚠️ {activeMission.emergency.threat_description}
                </p>
              )}

              {/* Milestones */}
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Mission Progress</p>
                <div className="space-y-2">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${m.status === "done" ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                        {m.status === "done" ? <CheckCircle className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                      </div>
                      <span className={`text-sm ${m.status === "done" ? "text-gray-900 dark:text-white font-semibold" : "text-gray-400"}`}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleMissionAction("arrived")}
                  disabled={isProcessing || activeMission.emergency.status === "in_progress" || activeMission.emergency.status === "completed"}
                  className="py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                  {missionAction === "arrived" && isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  Arrived
                </button>
                <button onClick={() => handleMissionAction("backup")} disabled={isProcessing}
                  className="py-3 text-sm font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                  <AlertTriangle className="w-4 h-4" /> Need Backup
                </button>
                <button onClick={() => handleMissionAction("completed")} disabled={isProcessing}
                  className="py-3 text-sm font-bold bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                  {missionAction === "completed" && isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  ✅ Completed
                </button>
                <button onClick={() => handleMissionAction("failed")} disabled={isProcessing}
                  className="py-3 text-sm font-bold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                  <XCircle className="w-4 h-4" /> Mission Failed
                </button>
              </div>

              {/* Inform Police Button */}
              <button
                onClick={() => {
                  const msg = `🚨 RESCUE RIDER ALERT\nEmergency ID: ${activeMission.emergency.emergency_id}\nLocation: ${activeMission.emergency.latitude.toFixed(6)}, ${activeMission.emergency.longitude.toFixed(6)}\nMaps: https://maps.google.com/?q=${activeMission.emergency.latitude},${activeMission.emergency.longitude}\nSituation: ${activeMission.emergency.threat_description || "Victim needs help"}\nPlease dispatch units immediately.`;
                  const encoded = encodeURIComponent(msg);
                  window.open(`https://wa.me/?text=${encoded}`, "_blank");
                }}
                className="w-full mt-2 py-3 text-sm font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                🚔 Inform Police / Share Location
              </button>
            </div>
          </div>
        )}
        {/* ── DASHBOARD TAB ──────────────────────────────────────────────────────── */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emergency-600 flex items-center justify-center text-white font-black text-xl">
                  {rider.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-gray-900 dark:text-white">{rider.full_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{rider.delivery_company}</p>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${verificationColor}`}>
                    {rider.verification_status.charAt(0).toUpperCase() + rider.verification_status.slice(1)}
                  </span>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${badgeLevel.color}`}>
                    <span>{badgeLevel.icon}</span>
                    <span>{badgeLevel.name}</span>
                  </div>
                </div>
              </div>

              {rider.verification_status === "verified" && (
                <button onClick={toggleAvailability} disabled={isTogglingAvailability}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${rider.is_available ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${rider.is_available ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    <span className={`text-sm font-bold ${rider.is_available ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
                      {rider.is_available ? "Available for Missions" : "Currently Offline"}
                    </span>
                  </div>
                  {isTogglingAvailability ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> :
                    rider.is_available ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                </button>
              )}

              {rider.verification_status === "pending" && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Pending admin verification</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Award className="w-5 h-5 text-yellow-500" />, value: rider.hero_points, label: "Hero Points", bg: "bg-yellow-50 dark:bg-yellow-900/10" },
                { icon: <Flame className="w-5 h-5 text-orange-500" />, value: rider.rescue_streak, label: "Streak", bg: "bg-orange-50 dark:bg-orange-900/10" },
                { icon: <Shield className="w-5 h-5 text-emergency-600" />, value: rider.total_rescues, label: "Rescues", bg: "bg-emergency-50 dark:bg-emergency-900/10" },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Missions */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Missions</h3>
                <button onClick={() => setActiveTab("missions")} className="text-xs text-emergency-600 font-semibold flex items-center gap-0.5">
                  All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {assignments.slice(0, 3).length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">No missions yet</div>
              ) : assignments.slice(0, 3).map((a) => (
                <div key={a.id} className="px-4 py-3 border-b last:border-b-0 border-gray-50 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{a.emergencies?.emergency_id ?? "—"}</p>
                    <p className="text-xs text-gray-400">{formatDate(a.created_at)}</p>
                  </div>
                  <StatusBadge status={a.status as Parameters<typeof StatusBadge>[0]["status"]} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MISSIONS TAB ───────────────────────────────────────────────────────── */}
        {activeTab === "missions" && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Mission History</h3>
            </div>
            {assignments.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-400 text-sm">No mission history yet</div>
            ) : assignments.map((a) => (
              <div key={a.id} className="px-4 py-4 border-b last:border-b-0 border-gray-50 dark:border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-black text-gray-900 dark:text-white font-mono">{a.emergencies?.emergency_id ?? "—"}</p>
                  <StatusBadge status={a.status as Parameters<typeof StatusBadge>[0]["status"]} size="sm" />
                </div>
                <p className="text-xs text-gray-400">{a.emergencies?.threat_description || "No description"}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(a.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── PROFILE TAB ────────────────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-emergency-600 flex items-center justify-center text-white font-black text-2xl">
                  {rider.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-black text-xl text-gray-900 dark:text-white">{rider.full_name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{rider.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Phone", value: rider.phone },
                  { label: "Company", value: rider.delivery_company },
                  { label: "Employee ID", value: rider.employee_id },
                  { label: "Member since", value: formatDate(rider.created_at) },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-sm text-gray-500">{f.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{rider.hero_points} hero points earned</span>
            </div>
            <button onClick={handleLogout}
              className="w-full py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 transition-colors">
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#111] border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-around">
          {[
            { id: "dashboard" as Tab, icon: <Shield className="w-5 h-5" />, label: "Dashboard" },
            { id: "missions" as Tab, icon: <Clock className="w-5 h-5" />, label: "Missions" },
            { id: "profile" as Tab, icon: <Star className="w-5 h-5" />, label: "Profile" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === tab.id ? "text-emergency-600" : "text-gray-400 dark:text-gray-500 hover:text-gray-600"}`}>
              {tab.icon}
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
