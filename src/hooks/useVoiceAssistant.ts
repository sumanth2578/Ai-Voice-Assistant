"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "~/trpc/react";

export const useVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "confirming" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    isNewTask?: boolean;
  } | null>(null);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const utils = api.useUtils();
  const assignTask = api.task.assign.useMutation({
    onSuccess: () => {
      void utils.task.getAll.invalidate();
    },
  });

  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      void utils.task.getAll.invalidate();
    },
  });

  const transcribe = api.task.transcribe.useMutation();
  const parseCommand = api.task.parseCommand.useMutation();

  const { data: users } = api.task.getUsers.useQuery();
  const { data: tasks } = api.task.getAll.useQuery();

  const processCommand = useCallback(
    async (text: string) => {
      console.log("Analyzing with Groq:", text);
      setStatus("processing");
      setStatusMessage("Extracting command with Groq AI...");
      
      try {
        const result = await parseCommand.mutateAsync({ 
          transcript: text,
          users: users?.map(u => u.name),
          tasks: tasks?.map(t => t.title),
        });

        const { task: taskTitleSearch, user: userNameSearch, priority, dueDate, originalTranscript, summary, suggestions } = result;

        if (!taskTitleSearch || !userNameSearch) {
          setStatus("error");
          const msg = `Could not find a clear task or user in: "${text}"`;
          setStatusMessage(msg);
          speak("I'm sorry, I couldn't understand that command.");
          return;
        }

        const task = tasks?.find((t) => t.title.toLowerCase().includes(taskTitleSearch.toLowerCase()));
        const user = users?.find((u) => u.name.toLowerCase().includes(userNameSearch.toLowerCase()));

        if (user) {
          setPendingAssignment({
            taskId: task?.id ?? "",
            userId: user.id,
            taskTitle: task?.title ?? taskTitleSearch.charAt(0).toUpperCase() + taskTitleSearch.slice(1),
            userName: user.name,
            priority,
            dueDate,
            transcript: originalTranscript,
            summary,
            suggestions,
            isNewTask: !task,
          });
          setStatus("confirming");
          const question = !task 
            ? `Should I create "${taskTitleSearch}" and assign it to ${user.name}?`
            : `Assign "${task.title}" to ${user.name}?`;
          
          setStatusMessage(question);
          speak(question);
        } else {
          setStatus("error");
          const msg = `User "${userNameSearch}" not found in database.`;
          setStatusMessage(msg);
          speak(`Sorry, I couldn't find a user named ${userNameSearch}.`);
        }
      } catch (err) {
        setStatus("error");
        setStatusMessage("Groq AI parsing failed.");
        speak("Something went wrong while parsing your command.");
      }
    },
    [tasks, users, parseCommand]
  );

  const confirmAssignment = async () => {
    if (!pendingAssignment) return;
    
    setStatus("processing");
    setStatusMessage(pendingAssignment.isNewTask ? "Creating and assigning..." : "Assigning task...");
    
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
        });
        const msg = `Successfully created and assigned "${pendingAssignment.taskTitle}" to ${pendingAssignment.userName}`;
        setStatus("success");
        setStatusMessage(msg);
        speak(msg);
      } else {
        await assignTask.mutateAsync({
          taskId: pendingAssignment.taskId,
          userId: pendingAssignment.userId,
        });
        const msg = `Successfully assigned "${pendingAssignment.taskTitle}" to ${pendingAssignment.userName}`;
        setStatus("success");
        setStatusMessage(msg);
        speak(msg);
      }
      setPendingAssignment(null);
    } catch (e) {
      console.error("Database update error:", e);
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      setStatus("error");
      setStatusMessage(`Failed to update database: ${errMsg}`);
      speak("I encountered an error while updating the database.");
    }
  };

  const updatePendingPriority = (priority: string) => {
    if (pendingAssignment) {
      setPendingAssignment({ ...pendingAssignment, priority });
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
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        setIsListening(false);
        setStatus("processing");
        setStatusMessage("Transcribing with Groq AI...");

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(",")[1];
            if (base64Audio) {
              const text = await transcribe.mutateAsync({ audioBase64: base64Audio });
              setTranscript(text);
              if (!text.trim()) {
                setStatus("error");
                setStatusMessage("No speech detected. Please try again.");
                return;
              }
              await processCommand(text);
            }
          } catch (err) {
            console.error("Transcription error:", err);
            setStatus("error");
            setStatusMessage(
              err instanceof Error ? err.message : "Transcription failed. Please try again."
            );
          }
        };
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
      setStatus("listening");
      setStatusMessage("Listening... Click again to stop.");
      setPendingAssignment(null);
      setError(null);
      setTranscript("");
    } catch (err) {
      setError("Microphone access denied or not supported.");
      setStatus("error");
      setStatusMessage("Microphone access denied. Ensure you are using 'localhost' or HTTPS.");
    }
  };

  const stopListening = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  const reset = () => {
    setTranscript("");
    setStatus("idle");
    setStatusMessage("");
    setPendingAssignment(null);
    setError(null);
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  return {
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
    updatePendingPriority,
    reset,
  };
};
