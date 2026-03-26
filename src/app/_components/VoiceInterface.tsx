"use client";

import { useState, useEffect } from "react";
import { useVoiceAssistant } from "~/hooks/useVoiceAssistant";

export const VoiceInterface = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const {
    isListening,
    transcript,
    status,
    statusMessage,
    pendingAssignment,
    aiResponse,
    lastAudio,
    startListening,
    stopListening,
    confirmAssignment,
    cancelAssignment,
    handleBriefing,
    setPendingPriority,
    users,
    selectUser,
  } = useVoiceAssistant();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const playAudio = (base64: string) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      return;
    }
    const audio = new Audio(`data:audio/webm;base64,${base64}`);
    audio.onended = () => setCurrentAudio(null);
    setCurrentAudio(audio);
    void audio.play();
  };

  if (!hasMounted) return null;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center px-4 sm:px-0 py-6 sm:py-0" style={{ minHeight: 'calc(100svh - 4rem)' }}>
      {/* Header */}
      <div className="w-full flex flex-col items-center space-y-4 sm:space-y-6 pt-6 sm:pt-12 animate-[fade-in_0.6s_ease-out]">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Voice Assistant</h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xs sm:max-w-sm mx-auto">
            Your workspace, controlled by your voice.
          </p>
        </div>

        <button
          onClick={handleBriefing}
          className={`flex items-center space-x-2 px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold border transition-all shadow-sm active:scale-95 ${
            status === "answering"
              ? "bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
              : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {status === "answering" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            )}
          </svg>
          <span>{status === "answering" ? "Stop Briefing" : "Get Daily Briefing"}</span>
        </button>
      </div>

      {/* Main Hub — centered mic button */}
      <div className="flex flex-1 items-center justify-center w-full py-8 sm:py-12">
        <div className={`relative flex flex-col items-center justify-center transition-all duration-500 ${
          isListening ? "scale-105" : ""
        }`}>
          {/* Pulse rings when listening */}
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="absolute h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-blue-400 opacity-20 animate-[pulse-ring_2s_ease-in-out_infinite]" />
              <div className="absolute h-56 w-56 sm:h-64 sm:w-64 rounded-full bg-blue-300 opacity-10 animate-[pulse-ring_2s_ease-in-out_infinite_0.5s]" />
            </div>
          )}

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={status === "processing"}
            className={`group relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full transition-all duration-300 shadow-xl ${
              isListening
                ? "bg-red-500 text-white shadow-red-200/50"
                : status === "processing"
                ? "bg-blue-600 text-white shadow-blue-200/50 animate-pulse"
                : "bg-white text-blue-600 hover:scale-110 active:scale-95 border-2 border-slate-100 shadow-slate-200/50"
            }`}
          >
            {status === "processing" ? (
               <svg className="h-8 w-8 sm:h-10 sm:w-10 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : isListening ? (
               <svg className="h-8 w-8 sm:h-10 sm:w-10" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
               </svg>
            ) : (
              <svg className="h-8 w-8 sm:h-10 sm:w-10 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Status text */}
          <p className="mt-6 text-center text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-400 max-w-[250px]">
            {statusMessage || (isListening ? "Listening..." : "Tap to speak")}
          </p>
        </div>
      </div>

      {/* Interaction Panel */}
      {(transcript || status === "confirming" || status === "answering" || status === "success" || status === "error") && (
        <div className="w-full space-y-4 sm:space-y-6 pb-8 sm:pb-12 animate-[slide-up_0.5s_ease-out]">

          {/* AI Answer View */}
          {status === "answering" && aiResponse && (
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-indigo-600 p-5 sm:p-10 shadow-2xl text-white">
               <div className="absolute top-0 right-0 h-40 w-40 sm:h-64 sm:w-64 -mr-20 -mt-20 sm:-mr-32 sm:-mt-32 rounded-full bg-white opacity-10 blur-3xl animate-pulse" />
               <div className="relative z-10 space-y-2 sm:space-y-4">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">Assistant Response</span>
                  <p className="text-lg sm:text-2xl font-bold leading-relaxed">
                    {aiResponse.query_answer}
                  </p>
               </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="flex items-center space-x-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 sm:p-5 animate-[scale-in_0.3s_ease-out]">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-bold text-emerald-800">{statusMessage}</p>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="flex items-center space-x-3 rounded-2xl bg-red-50 border border-red-100 p-4 sm:p-5 animate-[scale-in_0.3s_ease-out]">
              <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm font-bold text-red-800">{statusMessage}</p>
            </div>
          )}

          {/* User Selection Card */}
          {status === "selecting_user" && pendingAssignment && (
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-white p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 animate-[slide-up_0.4s_ease-out]">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-1 bg-amber-500 rounded-full" />
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900">Assign To...</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {users?.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user.id, user.name)}
                      className="flex flex-col items-center space-y-2 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all hover:scale-[1.02] active:scale-95 group"
                    >
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white flex items-center justify-center text-sm font-bold text-slate-600 group-hover:text-blue-600 shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700">{user.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={cancelAssignment}
                  className="w-full rounded-xl py-3 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  Cancel Creation
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Card */}
          {(transcript || status === "confirming" || status === "processing") && status !== "answering" && status !== "success" && status !== "error" && status !== "selecting_user" && (
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-white p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100">
               {transcript && status !== "processing" && (
                <div className="relative z-10 space-y-2 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-500">What I heard</span>
                    {lastAudio && (
                      <button
                        onClick={() => playAudio(lastAudio)}
                        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors flex items-center space-x-1 ${
                          currentAudio ? "text-red-500" : "text-slate-400 hover:text-blue-500"
                        }`}
                      >
                        {currentAudio ? (
                          <>
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>Listen Back</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-base sm:text-xl font-medium text-slate-800 leading-relaxed italic">
                    &ldquo;{transcript}&rdquo;
                  </p>
                </div>
              )}

              {(status === "confirming" || status === "processing") && pendingAssignment && (
                <div className="relative z-10 space-y-5 sm:space-y-6 animate-[slide-up_0.4s_ease-out]">
                  <div className="flex items-center space-x-3 mb-1">
                    <div className={`h-6 w-1 rounded-full transition-colors ${status === "processing" ? "bg-amber-400 animate-pulse" : "bg-blue-600"}`} />
                    <h3 className="text-sm sm:text-lg font-bold text-slate-900">
                      {status === "processing" ? "Executing Command..." : "Proposed Action"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-2 sm:col-span-1 space-y-1 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/50">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Task</label>
                      <p className="text-sm font-bold text-slate-800 break-words">{pendingAssignment.taskTitle}</p>
                      {pendingAssignment.tags && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {pendingAssignment.tags.split(',').map((t, i) => (
                            <span key={i} className="text-[8px] font-black uppercase bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                              #{t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 sm:col-span-1 space-y-1 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/50">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Assignee</label>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                          {pendingAssignment.userName.charAt(0)}
                        </div>
                        <p className="text-sm font-bold text-slate-800 truncate">{pendingAssignment.userName}</p>
                      </div>
                    </div>

                    <div className="space-y-1 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/50">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Priority</label>
                      <div className="flex items-center space-x-1.5 mt-1">
                         {(['low', 'medium', 'high'] as const).map((p) => (
                           <button
                             key={p}
                             onClick={() => setPendingPriority(p)}
                             className={`px-2 sm:px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${
                               pendingAssignment.priority === p
                                 ? (p === 'high' ? 'bg-red-500 text-white shadow-md' :
                                    p === 'medium' ? 'bg-amber-500 text-white shadow-md' : 'bg-emerald-500 text-white shadow-md')
                                 : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-200'
                             }`}
                           >
                             {p}
                           </button>
                         ))}
                      </div>
                    </div>

                    {pendingAssignment.dueDate && (
                      <div className="space-y-1 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/50">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Due Date</label>
                        <p className="text-sm font-bold text-slate-800">{new Date(pendingAssignment.dueDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={confirmAssignment}
                      disabled={status === "processing"}
                      className="flex-1 rounded-xl sm:rounded-2xl bg-slate-900 px-4 sm:px-8 py-3.5 text-xs sm:text-sm font-bold text-white transition-all hover:bg-black active:scale-95 shadow-lg disabled:opacity-50"
                    >
                      {status === "processing" ? "Executing..." : "Execute"}
                    </button>
                    <button
                      onClick={cancelAssignment}
                      className="flex-1 rounded-xl sm:rounded-2xl bg-white border border-slate-200 px-4 sm:px-8 py-3.5 text-xs sm:text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Idle hint */}
      {status === "idle" && !isListening && !transcript && (
        <div className="pb-8 sm:pb-12 animate-[fade-in_1s_ease-out_0.5s_both]">
           <p className="text-xs text-slate-400 font-medium text-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-100">
            Try: &ldquo;Assign a design task to Alice&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};
