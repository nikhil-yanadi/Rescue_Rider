"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MapPin, AlertTriangle, Camera, Mic, CheckCircle,
  Loader2, ArrowLeft, Shield, X, MicOff,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

type Step = "loading" | "form" | "submitted" | "feedback" | "error";

interface LocationData { latitude: number; longitude: number; accuracy: number; }

export default function SaveMeClient() {
  const [step, setStep] = useState<Step>("loading");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [emergencyId, setEmergencyId] = useState("");
  const [emergencyDbId, setEmergencyDbId] = useState("");
  const [assignedRiderId, setAssignedRiderId] = useState<string | null>(null);
  const [threatDescription, setThreatDescription] = useState("");
  const [victimContact, setVictimContact] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notifiedCount, setNotifiedCount] = useState(0);
  // Feedback
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const getLocation = () => {
    setStep("loading");
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation not supported by your browser.");
      setStep("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setStep("form");
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: "Location access denied. Please allow location and retry.",
          2: "Location unavailable. Please try again.",
          3: "Location timed out. Please try again.",
        };
        setErrorMessage(msgs[err.code] || "Unable to get your location.");
        setStep("error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => { getLocation(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Poll for assignment after submission (victim watches for rider acceptance)
  useEffect(() => {
    if (step !== "submitted" || !emergencyDbId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`emergency-status-${emergencyDbId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "emergencies",
        filter: `id=eq.${emergencyDbId}`,
      }, (payload) => {
        const updated = payload.new as { status: string; assigned_rider_id: string | null };
        if (updated.assigned_rider_id) setAssignedRiderId(updated.assigned_rider_id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [step, emergencyDbId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setIsRecording(true);
    } catch { alert("Microphone access denied."); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const generateEmergencyId = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RR-${ts}-${rand}`;
  };

  const handleSubmit = async () => {
    if (!location) return;
    setIsSubmitting(true);
    const supabase = createClient();
    const eid = generateEmergencyId();

    try {
      // 1. Insert emergency
      const { data: emergency, error: emergencyError } = await supabase
        .from("emergencies")
        .insert({
          emergency_id: eid,
          latitude: location.latitude,
          longitude: location.longitude,
          threat_description: threatDescription || null,
          victim_contact: victimContact || null,
          status: "pending",
        })
        .select()
        .single();

      if (emergencyError) throw new Error(emergencyError.message);

      // 2. Upload media
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `emergencies/${emergency.id}/image.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("emergency-media").upload(path, imageFile);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("emergency-media").getPublicUrl(path);
          await supabase.from("emergency_media").insert({ emergency_id: emergency.id, media_type: "image", url: urlData.publicUrl });
        }
      }
      if (audioBlob) {
        const path = `emergencies/${emergency.id}/voice.webm`;
        const { error: audioErr } = await supabase.storage.from("emergency-media").upload(path, audioBlob);
        if (!audioErr) {
          const { data: urlData } = supabase.storage.from("emergency-media").getPublicUrl(path);
          await supabase.from("emergency_media").insert({ emergency_id: emergency.id, media_type: "voice", url: urlData.publicUrl });
        }
      }

      // 3. Notify verified + available riders (create assignment records)
      const { data: riders } = await supabase
        .from("riders")
        .select("id")
        .eq("verification_status", "verified")
        .eq("is_available", true);

      if (riders && riders.length > 0) {
        const assignments = riders.map((r) => ({
          emergency_id: emergency.id,
          rider_id: r.id,
          status: "notified" as const,
          notified_at: new Date().toISOString(),
        }));
        await supabase.from("emergency_assignments").insert(assignments);
        setNotifiedCount(riders.length);
      }

      setEmergencyId(eid);
      setEmergencyDbId(emergency.id);
      setStep("submitted");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setErrorMessage(`Failed: ${msg}`);
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!assignedRiderId || !emergencyDbId || rating === 0) return;
    const supabase = createClient();
    await supabase.from("reviews").insert({
      emergency_id: emergencyDbId,
      rider_id: assignedRiderId,
      rating,
      feedback: feedbackText || null,
    });
    setFeedbackSubmitted(true);
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-emergency-600 opacity-20 animate-ping" />
          <div className="relative w-full h-full rounded-full bg-emergency-600 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Getting Your Location</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Please allow location access when prompted</p>
        </div>
        <Loader2 className="w-6 h-6 text-emergency-600 animate-spin" />
      </div>
    </div>
  );

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (step === "error") return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-emergency-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Something Went Wrong</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">{errorMessage}</p>
        <button onClick={getLocation} className="w-full py-4 bg-emergency-600 hover:bg-emergency-700 text-white font-bold rounded-2xl mb-3">Try Again</button>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">← Back to Home</Link>
      </div>
    </div>
  );

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (step === "form") return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <Logo size="sm" />
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-md mx-auto w-full">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Location Captured</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              {location?.latitude.toFixed(5)}, {location?.longitude.toFixed(5)} · ±{Math.round(location?.accuracy ?? 0)}m
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
          Add Details <span className="text-gray-400 font-normal text-base">(Optional)</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">More info helps riders respond better.</p>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">What&apos;s happening?</label>
          <textarea value={threatDescription} onChange={(e) => setThreatDescription(e.target.value)}
            placeholder="Briefly describe the threat..." rows={3} className="input-field resize-none" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Your phone number</label>
          <input type="tel" value={victimContact} onChange={(e) => setVictimContact(e.target.value)}
            placeholder="+91 XXXXX XXXXX" className="input-field" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Photo</label>
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-emergency-400 bg-gray-50 dark:bg-gray-900/30">
              <Camera className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-sm text-gray-500">Tap to upload photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Voice note</label>
          {!audioBlob ? (
            <button onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${isRecording ? "bg-emergency-600 text-white animate-pulse" : "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"}`}>
              {isRecording ? <><MicOff className="w-4 h-4" /> Stop Recording</> : <><Mic className="w-4 h-4" /> Record Voice Note</>}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Voice note recorded
              </div>
              <button onClick={() => setAudioBlob(null)} className="p-2 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full py-4 bg-emergency-600 hover:bg-emergency-700 disabled:opacity-70 text-white font-black text-lg rounded-2xl shadow-lg shadow-emergency-600/30 flex items-center justify-center gap-2 transition-all">
          {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending Alert...</> : <>🚨 SEND EMERGENCY ALERT</>}
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">Nearby verified riders will be alerted immediately</p>
      </div>
    </div>
  );

  // ── SUBMITTED ─────────────────────────────────────────────────────────────
  if (step === "submitted") return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative w-28 h-28 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping" />
          <div className="relative w-full h-full rounded-full bg-green-500 flex items-center justify-center">
            <Shield className="w-14 h-14 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Help Is On The Way!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {notifiedCount > 0 ? `${notifiedCount} rider${notifiedCount > 1 ? "s" : ""} notified.` : "Searching for nearby riders..."}
        </p>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Emergency ID</p>
          <p className="text-2xl font-black text-emergency-600 tracking-wider">{emergencyId}</p>
          <p className="text-xs text-gray-400 mt-1">Share with emergency services if needed</p>
        </div>

        {assignedRiderId && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold text-green-800 dark:text-green-300">Rider Accepted!</p>
              <p className="text-xs text-green-600 dark:text-green-400">A rider is on their way to you now</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-0.5">Status</p>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
              {assignedRiderId ? "Rider En Route" : "Searching..."}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-0.5">Avg Response</p>
            <p className="text-sm font-bold text-orange-900 dark:text-orange-200">Under 5 min</p>
          </div>
        </div>

        <div className="bg-emergency-50 dark:bg-emergency-900/20 border border-emergency-200 dark:border-emergency-800 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-emergency-800 dark:text-emergency-300 mb-1">⚠️ Stay Safe</p>
          <ul className="text-xs text-emergency-600 dark:text-emergency-400 space-y-1">
            <li>• Stay in a visible location if possible</li>
            <li>• Keep your phone accessible</li>
            <li>• If in immediate danger, also call 112</li>
          </ul>
        </div>

        {assignedRiderId && (
          <button onClick={() => setStep("feedback")}
            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl mb-3 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
            Rate Your Rider
          </button>
        )}

        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">← Back to Home</Link>
      </div>
    </div>
  );

  // ── FEEDBACK ──────────────────────────────────────────────────────────────
  if (step === "feedback") return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⭐</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Rate Your Rider</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Help us improve the service</p>
        </div>

        {feedbackSubmitted ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Thank You!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Your feedback helps keep our riders accountable.</p>
            <Link href="/" className="block w-full py-3 bg-emergency-600 text-white font-bold rounded-xl text-center">Back to Home</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">How was your experience?</label>
              <div className="flex gap-3 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)}
                    className={`text-4xl transition-transform hover:scale-110 ${star <= rating ? "opacity-100" : "opacity-30"}`}>
                    ⭐
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm font-semibold mt-2 text-gray-600 dark:text-gray-400">
                  {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Additional comments</label>
              <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="How was the response time? Was the rider helpful?" rows={3} className="input-field resize-none" />
            </div>

            <button onClick={handleFeedbackSubmit} disabled={rating === 0}
              className="w-full py-4 bg-emergency-600 hover:bg-emergency-700 disabled:opacity-50 text-white font-black rounded-xl transition-colors">
              Submit Feedback
            </button>
            <button onClick={() => setStep("submitted")} className="w-full text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}
