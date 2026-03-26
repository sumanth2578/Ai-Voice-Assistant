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
  const [showFilters, setShowFilters] = useState(true);

  const utils = api.useUtils();
  const updateTask = api.task.update.useMutation({
    onMutate: async (newData) => {
      await utils.task.getAll.cancel();
      const previous = utils.task.getAll.getData();
      utils.task.getAll.setData(undefined, (old) =>
        old?.map((t) =>
          t.id === newData.taskId
            ? { ...t, status: newData.status ?? t.status, priority: newData.priority ?? t.priority }
            : t
        )
      );
      if (selectedTask?.id === newData.taskId) {
        setSelectedTask((prev: any) => prev ? { ...prev, status: newData.status ?? prev.status, priority: newData.priority ?? prev.priority } : prev);
      }
      return { previous };
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) utils.task.getAll.setData(undefined, context.previous);
    },
    onSettled: () => {
      void utils.task.getAll.invalidate();
    },
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks?.filter((task) => {
    const matchesName = !nameFilter || task.assignedTo.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesDate = !dateFilter || task.updatedAt.toISOString().split('T')[0] === dateFilter;
    const matchesSearch = !activeSearch ||
      task.assignedTo.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      task.title.toLowerCase().includes(activeSearch.toLowerCase());
    return matchesName && matchesStatus && matchesDate && matchesSearch;
  });

  const hasActiveFilters = nameFilter || statusFilter || dateFilter || activeSearch;

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      {/* Search + Filter Toggle */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search tasks or assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setActiveSearch(searchQuery)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-white"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setActiveSearch(searchQuery)}
            className="bg-blue-600 text-white rounded-xl px-4 sm:px-5 text-sm font-bold hover:bg-blue-700 transition-colors active:scale-95 shrink-0"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-xl px-3 border text-sm font-bold transition-all active:scale-95 shrink-0 ${
              showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm animate-[slide-up_0.2s_ease-out]">
            <div className="flex flex-col space-y-1 flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Assignee</label>
              <select
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
              >
                <option value="">All</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-1 flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
              >
                <option value="">All</option>
                <option value="todo">Todo</option>
                <option value="in-progress">In-Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1 flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setNameFilter(""); setStatusFilter(""); setDateFilter(""); setSearchQuery(""); setActiveSearch(""); }}
                className="self-end px-4 py-2 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {!filteredTasks || filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 sm:py-20 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
            No tasks found matching your filters.
          </div>
        ) : (
          filteredTasks.map((task, i) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="group flex flex-col justify-between rounded-xl bg-white p-4 sm:p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-blue-400 cursor-pointer active:scale-[0.98]"
              style={{ animationDelay: `${i * 50}ms` }}
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
              </div>

              <h4 className="mt-3 text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                {task.title}
              </h4>

              {(task as any).dueDate && (
                <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due: {new Date((task as any).dueDate).toLocaleDateString()}
                </p>
              )}

              {task.description && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{task.description}</p>
              )}

              {/* Status buttons */}
              <div className="mt-3 flex items-center space-x-1">
                {(['todo', 'in-progress', 'done'] as const).map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (task.status !== s) updateTask.mutate({ taskId: task.id, status: s });
                    }}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${
                      task.status === s
                        ? (s === 'done' ? 'bg-emerald-500 text-white shadow-sm' :
                           s === 'in-progress' ? 'bg-amber-500 text-white shadow-sm' : 'bg-blue-500 text-white shadow-sm')
                        : 'bg-slate-50 text-slate-400 border border-slate-150 hover:border-blue-300 hover:text-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Assignee */}
              <div className="mt-3 flex items-center space-x-2 border-t border-slate-50 pt-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 text-[10px] shrink-0">
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

      {/* Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedTask(null)}
          />

          <div className="relative w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] sm:shadow-[0_30px_70px_rgba(0,0,0,0.2)] border-t sm:border border-slate-200/50 animate-[slide-up_0.3s_ease-out] sm:mx-4">
             {/* Drag handle (mobile) */}
             <div className="sm:hidden flex justify-center mb-4">
               <div className="h-1 w-10 rounded-full bg-slate-200" />
             </div>

             {/* Close */}
             <button
                onClick={() => setSelectedTask(null)}
                className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors z-20"
             >
               <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>

             <div className="space-y-5 sm:space-y-8">
                <header className="space-y-2 sm:space-y-3 pr-10">
                  <div className="flex flex-wrap items-center gap-2">
                     <span className={`rounded-full px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${
                        selectedTask.status === "done" ? "bg-emerald-50 text-emerald-600" :
                        selectedTask.status === "in-progress" ? "bg-amber-50 text-amber-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                        {selectedTask.status}
                      </span>
                      {selectedTask.priority && (
                        <span className={`rounded-full px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${
                          selectedTask.priority === "high" ? "bg-red-50 text-red-600" :
                          selectedTask.priority === "medium" ? "bg-amber-50 text-amber-600" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {selectedTask.priority}
                        </span>
                      )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {selectedTask.title}
                  </h2>
                </header>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 py-4 sm:py-6 border-y border-slate-100">
                  <div className="space-y-1 p-2.5 sm:p-4 rounded-xl bg-slate-50/50">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned</p>
                    <div className="flex items-center space-x-1.5">
                      <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-600 shrink-0">
                        {selectedTask.assignedTo.name.charAt(0)}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{selectedTask.assignedTo.name}</p>
                    </div>
                  </div>

                  <div className="space-y-1 p-2.5 sm:p-4 rounded-xl bg-slate-50/50">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</p>
                    <div className="flex items-center space-x-1 mt-0.5">
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => updateTask.mutate({ taskId: selectedTask.id, priority: p })}
                          className={`px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase transition-all ${
                            selectedTask.priority === p
                              ? (p === 'high' ? 'bg-red-500 text-white' :
                                 p === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white')
                              : 'bg-white text-slate-400 border border-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 p-2.5 sm:p-4 rounded-xl bg-slate-50/50">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Due</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>

                {/* AI Insights */}
                {(selectedTask.transcript || selectedTask.summary || selectedTask.suggestions) && (
                  <div className="space-y-5 sm:space-y-6">
                    {selectedTask.transcript && (
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div className="h-1 w-3 bg-blue-400 rounded-full" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Voice</p>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed italic border-l-4 border-blue-50 pl-3 py-1">
                            &ldquo;{selectedTask.transcript}&rdquo;
                          </p>
                        </div>
                        {selectedTask.audioData && (
                          <button
                            onClick={() => {
                              const audio = new Audio(`data:audio/webm;base64,${selectedTask.audioData}`);
                              void audio.play();
                            }}
                            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-90 shrink-0"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTask.summary && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/30 border border-emerald-100/50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Summary</p>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedTask.summary}</p>
                          {selectedTask.tags && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {selectedTask.tags.split(',').map((t: string, i: number) => (
                                <span key={i} className="text-[9px] font-black uppercase opacity-60">#{t.trim()}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {selectedTask.suggestions && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Next Steps</p>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedTask.suggestions.split(',').map((s: string, i: number) => (
                              <div key={i} className="flex items-center space-x-2 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                                <p className="text-[11px] font-semibold text-slate-600">{s.trim()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
