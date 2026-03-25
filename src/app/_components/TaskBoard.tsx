"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

export const TaskBoard = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const { data: tasks, isLoading } = api.task.getAll.useQuery();
  const { data: users } = api.task.getUsers.useQuery();

  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || isLoading) return <div className="text-slate-500">Loading dashboard...</div>;

  // Filter tasks
  const filteredTasks = tasks?.filter((task) => {
    const matchesName = !nameFilter || task.assignedTo.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesDate = !dateFilter || task.updatedAt.toISOString().split('T')[0] === dateFilter;
    return matchesName && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 rounded-xl bg-white p-4 md:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col space-y-1.5 flex-[2] min-w-0">
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
            onClick={() => { setNameFilter(""); setStatusFilter(""); setDateFilter(""); }}
            className="w-full md:w-auto px-6 py-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 md:bg-transparent rounded-lg md:rounded-none"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Dashboard Grid (Unified) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {!filteredTasks || filteredTasks.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
            No tasks found matching your filters.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              className={`group flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-blue-200 cursor-pointer ${
                expandedTaskId === task.id ? "ring-2 ring-blue-500 ring-offset-2" : ""
              }`}
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

                <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
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

                {expandedTaskId === task.id && (
                  <div className="mt-4 space-y-4 rounded-lg bg-slate-50 p-3 border-l-4 border-blue-400 animate-in fade-in slide-in-from-top-1 transition-all">
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 tracking-wider">Voice Transcript</p>
                      { (task as any).transcript ? (
                        <p className="text-xs italic text-slate-600 leading-relaxed">"{ (task as any).transcript }"</p>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No transcript available.</p>
                      )}
                    </div>

                    { (task as any).summary && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 tracking-wider">AI Summary</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{ (task as any).summary }</p>
                      </div>
                    )}

                    { (task as any).suggestions && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-amber-600 uppercase mb-1 tracking-wider">Smart Suggestions</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          { (task as any).suggestions.split(',').map((s: string, i: number) => (
                            <span key={i} className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-md shadow-sm">
                              { s.trim() }
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              <div className="mt-6 flex items-center space-x-3 border-t border-slate-50 pt-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-[10px]">
                  {task.assignedTo.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 leading-none">Assigned to</p>
                  <p className="text-xs font-semibold text-slate-700">{task.assignedTo.name}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
