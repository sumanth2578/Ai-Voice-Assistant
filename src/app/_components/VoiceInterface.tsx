"use client";

import { useState, useEffect } from "react";
import { useVoiceAssistant } from "~/hooks/useVoiceAssistant";

export const VoiceInterface = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const {
    isListening,
    transcript,
    status,
    statusMessage,
    pendingAssignment,
    error,
    startListening,
    stopListening,
    confirmAssignment,
    cancelAssignment,
  } = useVoiceAssistant();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <div className="flex w-full max-w-xl flex-col items-center space-y-8 rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-slate-900">Voice Assistant</h2>
        <p className="text-sm text-slate-500 font-medium">Command your tasks with voice</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
            isListening 
              ? "bg-red-500 text-white animate-pulse" 
              : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
          }`}
        >
          {isListening ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H10a1 1 0 01-1-1v-4z" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
        <p className={`text-sm font-bold ${status === "error" ? "text-red-500" : "text-slate-600"}`}>
          {statusMessage || (isListening ? "Listening..." : "Ready")}
        </p>
      </div>

      {(transcript || status === "confirming") && (
        <div className="w-full space-y-6 rounded-xl bg-slate-50 p-6 border border-slate-100 italic">
          {transcript && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Audio Transcription</p>
              <p className="text-sm text-slate-700 italic">"{transcript}"</p>
            </div>
          )}

          {status === "confirming" && pendingAssignment && (
            <div className="space-y-4 not-italic">
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-xs font-bold text-blue-600 uppercase mb-3">Proposed Task</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Task Title</label>
                    <p className="text-sm font-bold text-slate-800">{pendingAssignment.taskTitle}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Assign To</label>
                    <p className="text-sm font-bold text-slate-800">{pendingAssignment.userName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                    <p className="text-sm font-bold text-slate-800 capitalize">{pendingAssignment.priority || "Medium"}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={confirmAssignment}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Confirm Task
                </button>
                <button
                  onClick={cancelAssignment}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === "idle" && !isListening && (
        <p className="text-xs text-slate-400 italic">
          Tip: Try "Assign fixing the login bug to Sumanth by Friday"
        </p>
      )}
    </div>
  );
};
