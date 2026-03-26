"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "~/trpc/react";

export const useVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "confirming" | "answering" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [lastAudio, setLastAudio] = useState<string | null>(null);

  const [pendingAssignment, setPendingAssignment] = useState<{
    taskId: string;
    userId: string;
    taskTitle: string;
    userName: string;
    priority?: string;
    dueDate?: string | null;
    transcript?: string;
    summary?: string;
    suggestions?: string;
    tags?: string;
    importance?: number;
    isNewTask?: boolean;
    audioData?: string;
  } | null>(null);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const utils = api.useUtils();
  const assignTask = api.task.assign.useMutation({
    onSuccess: () => { void utils.task.getAll.invalidate(); },
  });

  const createTask = api.task.create.useMutation({
    onSuccess: () => { void utils.task.getAll.invalidate(); },
  });

  const updateTask = api.task.update.useMutation({
    onSuccess: () => { void utils.task.getAll.invalidate(); },
  });

  const transcribe = api.task.transcribe.useMutation();
  const parseCommand = api.task.parseCommand.useMutation();
  const getBrief = api.task.getDailyBrief.useQuery(undefined, { enabled: false });

  const { data: users } = api.task.getUsers.useQuery();
  const { data: tasks } = api.task.getAll.useQuery();

  const handleBriefing = async () => {
    if (status === "answering") {
      window.speechSynthesis?.cancel();
      setStatus("idle");
      setAiResponse(null);
      return;
    }

    setStatus("processing");
    setStatusMessage("Hold on, preparing your briefing...");
    try {
      const { data: briefText } = await getBrief.refetch();
      if (briefText) {
        setStatus("answering");
        setAiResponse({ query_answer: briefText });
        speak(briefText);
      } else {
        setStatus("error");
        setStatusMessage("Could not retrieve briefing.");
      }
    } catch (e) {
      setStatus("error");
      setStatusMessage("Briefing failed.");
    }
  };

  const processCommand = useCallback(
    async (text: string, audioBase64?: string) => {
      setStatus("processing");
      setStatusMessage("Hold on, analyzing your request...");
      
      try {
        const result = await parseCommand.mutateAsync({ 
          transcript: text,
          users: users?.map(u => u.name),
          tasks: tasks?.map(t => t.title),
        });

        const { intent, task: taskTitleSearch, user: userNameSearch, status: newStatus, priority, dueDate, tags, importance, summary, suggestions, query_answer } = result;

        if (intent === "QUERY") {
          setStatus("answering");
          setAiResponse({ query_answer });
          speak(query_answer || "I'm sorry, I couldn't find an answer to that.");
          return;
        }

        if (intent === "UPDATE") {
          const task = tasks?.find((t) => t.title.toLowerCase().includes(taskTitleSearch?.toLowerCase()));
          if (task) {
            await updateTask.mutateAsync({
              taskId: task.id,
              status: newStatus,
              priority: priority,
            });
            const msg = `Successfully updated "${task.title}" to ${newStatus || priority}.`;
            setStatus("success");
            setStatusMessage(msg);
            speak(msg);
          } else {
            setStatus("error");
            setStatusMessage(`Target task "${taskTitleSearch}" not found.`);
            speak(`Sorry, I couldn't find a task named ${taskTitleSearch}.`);
          }
          return;
        }

        const user = users?.find((u) => u.name.toLowerCase().includes(userNameSearch?.toLowerCase() || ""));
        const existingTask = tasks?.find((t) => t.title.toLowerCase().includes(taskTitleSearch?.toLowerCase() || ""));

        // Intelligent Conflict Check
        const userTasks = tasks?.filter(t => t.userId === user?.id && t.status !== 'done');
        const isOverloaded = (userTasks?.length || 0) >= 3;

        setPendingAssignment({
          taskId: existingTask?.id ?? "",
          userId: user?.id ?? users?.[0]?.id ?? "",
          taskTitle: taskTitleSearch || "New Task",
          userName: user?.name ?? "Multiple Team Members",
          priority: priority || "medium",
          dueDate,
          transcript: text,
          summary,
          suggestions,
          tags,
          importance,
          isNewTask: !existingTask,
          audioData: audioBase64,
        });

        setStatus("confirming");
        let question = !existingTask 
          ? `Should I create "${taskTitleSearch}" and assign it to ${user?.name || "your team"}?`
          : `Assign "${existingTask.title}" to ${user?.name || "the team"}?`;
        
        if (isOverloaded && user) {
          question = `${user.name} already has ${userTasks?.length} active tasks. ` + question;
        }
        
        setStatusMessage(question);
        speak(question);
      } catch (err) {
        console.error("Process Error:", err);
        setStatus("error");
        setStatusMessage("Sorry, I couldn't quite process that.");
        speak("Something went wrong while thinking about your command.");
      }
    },
    [tasks, users, parseCommand, updateTask]
  );

  const confirmAssignment = async () => {
    if (!pendingAssignment) return;
    
    setStatus("processing");
    setStatusMessage("Executing command...");
    
    try {
      if (pendingAssignment.isNewTask) {
        await createTask.mutateAsync({
          title: pendingAssignment.taskTitle,
          userId: pendingAssignment.userId,
          priority: pendingAssignment.priority,
          dueDate: pendingAssignment.dueDate,
          transcript: pendingAssignment.transcript,
          summary: pendingAssignment.summary,
          suggestions: pendingAssignment.suggestions,
          tags: pendingAssignment.tags,
          audioData: pendingAssignment.audioData,
          importance: pendingAssignment.importance,
        });
      } else {
        await assignTask.mutateAsync({
          taskId: pendingAssignment.taskId,
          userId: pendingAssignment.userId,
        });
      }
      setStatus("success");
      setStatusMessage("Done! Everything is up to date.");
      speak("Command executed successfully.");
      setPendingAssignment(null);
    } catch (e) {
      setStatus("error");
      setStatusMessage("Failed to update system.");
    }
  };

  const cancelAssignment = () => {
    setPendingAssignment(null);
    setStatus("idle");
    setStatusMessage("");
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setIsListening(false);
        setStatus("processing");
        setStatusMessage("Almost there, understanding your voice...");

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(",")[1];
          if (base64Audio) {
            const text = await transcribe.mutateAsync({ audioBase64: base64Audio });
            setTranscript(text);
            setLastAudio(base64Audio);
            await processCommand(text, base64Audio);
          }
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
      setStatus("listening");
      setStatusMessage("Listening...");
      setAiResponse(null);
      setTranscript("");
    } catch (err) {
      setStatus("error");
      setStatusMessage("Microphone access denied.");
    }
  };

  const stopListening = () => { if (mediaRecorder?.state !== "inactive") mediaRecorder?.stop(); };

  return {
    isListening, transcript, status, statusMessage, pendingAssignment, aiResponse, lastAudio,
    startListening, stopListening, confirmAssignment, cancelAssignment, handleBriefing,
    reset: () => { setTranscript(""); setStatus("idle"); setStatusMessage(""); setPendingAssignment(null); setAiResponse(null); }
  };
};
