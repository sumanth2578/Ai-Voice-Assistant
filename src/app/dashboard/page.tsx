import { api, HydrateClient } from "~/trpc/server";
import { TaskBoard } from "~/app/_components/TaskBoard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  void api.task.getAll.prefetch();
  void api.task.getUsers.prefetch();

  return (
    <HydrateClient>
      <main className="min-h-screen bg-[#f8fafc] text-slate-900 px-4 md:px-8">
        <div className="container mx-auto py-6 sm:py-10">
          <header className="mb-6 sm:mb-10 animate-[fade-in_0.5s_ease-out]">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-3">
              <span className="h-6 sm:h-8 w-1.5 sm:w-2 bg-blue-500 rounded-full" />
              <span>Dashboard</span>
            </h2>
            <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-slate-500 font-medium ml-4 sm:ml-5">View and manage tasks by assignee</p>
          </header>

          <TaskBoard />
        </div>
      </main>
    </HydrateClient>
  );
}
