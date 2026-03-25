import { VoiceInterface } from "~/app/_components/VoiceInterface";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <VoiceInterface />
      </div>
    </main>
  );
}
