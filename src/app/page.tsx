import { VoiceInterface } from "~/app/_components/VoiceInterface";

export default async function Home() {
  return (
    <main className="flex flex-col items-center overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),_transparent_40%),_radial-gradient(circle_at_bottom_left,_var(--tw-gradient-to),_transparent_40%)] from-blue-50/50 via-slate-50 to-indigo-50/50">
      <div className="w-full flex flex-col items-center">
        <VoiceInterface />
      </div>
    </main>
  );
}
