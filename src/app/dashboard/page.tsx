import { api, HydrateClient } from "~/trpc/server";
import { TaskBoard } from "~/app/_components/TaskBoard";

export default async function DashboardPage() {
  void api.task.getAll.prefetch();
  void api.task.getUsers.prefetch();

  return (
    <HydrateClient>
      <main className="min-h-screen bg-[#f8fafc] text-slate-900 pt-20 px-4 md:px-8">
        <div className="container mx-auto py-16">
          <header className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-3">
              <span className="h-8 w-2 bg-blue-500 rounded-full" />
              <span>Assigned Dashboards</span>
            </h2>
            <p className="mt-2 text-slate-500 font-medium ml-5">View and manage tasks by assignee</p>
          </header>

          <TaskBoard />
        </div>
      </main>
    </HydrateClient>
  );
}
