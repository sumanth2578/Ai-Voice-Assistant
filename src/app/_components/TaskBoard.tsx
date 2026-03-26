"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

export const TaskBoard = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const { data: tasks, isLoading } = api.task.getAll.useQuery();
  const { data: users } = api.task.getUsers.useQuery();

  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || isLoading) return <div className="text-slate-500">Loading dashboard...</div>;

  // Filter tasks
  const filteredTasks = tasks?.filter((task) => {
    const matchesName = !nameFilter || task.assignedTo.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesDate = !dateFilter || task.updatedAt.toISOString().split('T')[0] === dateFilter;
    const matchesSearch = !activeSearch || 
      task.assignedTo.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      task.title.toLowerCase().includes(activeSearch.toLowerCase());
    
    return matchesName && matchesStatus && matchesDate && matchesSearch;
  });

  return (
    <div className="space-y-8 relative">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 rounded-xl bg-white p-4 md:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col space-y-1.5 flex-[2] min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase">Search</label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search assignee or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setActiveSearch(searchQuery)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
            />
            <button
              onClick={() => setActiveSearch(searchQuery)}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase">Assignee</label>
          <select
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
          >
            <option value="">All Assignees</option>
            {users?.map((user) => (
              <option key={user.id} value={user.name}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
          >
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In-Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
          />
        </div>

        <div className="flex shrink-0">
          <button
            onClick={() => { setNameFilter(""); setStatusFilter(""); setDateFilter(""); setSearchQuery(""); setActiveSearch(""); }}
            className="w-full md:w-auto px-6 py-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 md:bg-transparent rounded-lg md:rounded-none"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {!filteredTasks || filteredTasks.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
            No tasks found matching your filters.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="group flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-blue-400 cursor-pointer active:scale-95"
            >
              <div>
                  <div className="flex items-center space-x-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      task.status === "done" ? "bg-emerald-50 text-emerald-600" :
                      task.status === "in-progress" ? "bg-amber-50 text-amber-600" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {task.status}
                    </span>
                    {(task as any).priority && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        (task as any).priority === "high" ? "bg-red-50 text-red-600" :
                        (task as any).priority === "medium" ? "bg-amber-50 text-amber-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {(task as any).priority}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-slate-400">
                    {task.updatedAt.toISOString().split('T')[0]}
                  </p>
                </div>

                <h4 className="mt-4 text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                  {task.title}
                </h4>

                {(task as any).dueDate && (
                  <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {new Date((task as any).dueDate).toISOString().split('T')[0]}
                  </p>
                )}

                {task.description && (
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                    {task.description}
                  </p>
                )}

              <div className="mt-6 flex items-center space-x-3 border-t border-slate-50 pt-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-[10px]">
                  {task.assignedTo.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 leading-none truncate">Assigned to</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{task.assignedTo.name}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Overlay / Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-10">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setSelectedTask(null)}
          />
          
          {/* Detail Card */}
          <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2.5rem] bg-white p-6 sm:p-8 md:p-12 shadow-[0_30px_70px_rgba(0,0,0,0.2)] border border-white/20 animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-500">
             {/* Close Button */}
             <button 
                onClick={() => setSelectedTask(null)}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-20"
             >
               <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>

             {/* Content */}
             <div className="space-y-6 sm:space-y-10">
                <header className="space-y-3 sm:space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                     <span className={`rounded-full px-2 sm:px-3 py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${
                        selectedTask.status === "done" ? "bg-emerald-50 text-emerald-600" :
                        selectedTask.status === "in-progress" ? "bg-amber-50 text-amber-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                        {selectedTask.status}
                      </span>
                      {selectedTask.priority && (
                        <span className={`rounded-full px-2 sm:px-3 py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${
                          selectedTask.priority === "high" ? "bg-red-50 text-red-600" :
                          selectedTask.priority === "medium" ? "bg-amber-50 text-amber-600" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {selectedTask.priority}
                        </span>
                      )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {selectedTask.title}
                  </h2>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 py-6 sm:py-8 border-y border-slate-50">
                  <div className="space-y-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/50">
                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned To</p>
                    <div className="flex items-center space-x-2">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-100 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-blue-600">
                        {selectedTask.assignedTo.name.charAt(0)}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">{selectedTask.assignedTo.name}</p>
                    </div>
                  </div>
                  <div className="space-y-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/50">
                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No deadline"}
                    </p>
                  </div>
                </div>

                {/* AI Insights Section */}
                <div className="space-y-8 pt-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-1 w-4 bg-blue-400 rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Voice Foundation</p>
                      </div>
                      {selectedTask.transcript ? (
                        <p className="text-base text-slate-700 leading-relaxed italic border-l-4 border-blue-50 pl-4 py-2">
                          "{selectedTask.transcript}"
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No original voice data recorded.</p>
                      )}
                    </div>
                    {selectedTask.audioData && (
                      <button 
                        onClick={() => {
                          const audio = new Audio(`data:audio/webm;base64,${selectedTask.audioData}`);
                          void audio.play();
                        }}
                        className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-90"
                        title="Play Voice Memo"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedTask.summary && (
                      <div className="p-6 rounded-[2rem] bg-emerald-50/30 border border-emerald-100/50">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Executive Summary</p>
                          {selectedTask.importance > 0 && (
                            <span className="text-[8px] font-black bg-white px-2 py-0.5 rounded-full border border-emerald-100 text-emerald-600">
                              RANK: {selectedTask.importance}/10
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {selectedTask.summary}
                        </p>
                        {selectedTask.tags && (
                          <div className="flex flex-wrap gap-1 mt-4">
                            {selectedTask.tags.split(',').map((t: string, i: number) => (
                              <span key={i} className="text-[9px] font-black uppercase opacity-60">#{t.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedTask.suggestions && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Strategic Next Steps</p>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedTask.suggestions.split(',').map((s: string, i: number) => (
                            <div key={i} className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              <p className="text-[11px] font-semibold text-slate-600">{s.trim()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
