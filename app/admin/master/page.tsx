import { listAdvice } from "@/app/actions/master";
import { elevenConfigured } from "@/lib/elevenlabs";
import { AdviceManager } from "@/components/admin/AdviceManager";

export default async function AdminMasterPage() {
  const advice = await listAdvice();
  return (
    <div className="flex flex-col gap-4 lg:max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-ink">The Master&apos;s advice</h1>
        <p className="mt-1 text-sm leading-relaxed text-ink/60">
          Lines the Master speaks at random on the landing while idle. Write a
          line, save it, then generate its voice with ElevenLabs.
        </p>
      </div>
      <AdviceManager initial={advice} voiceReady={elevenConfigured()} />
    </div>
  );
}
