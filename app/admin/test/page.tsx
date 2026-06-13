import { TestPanel } from "@/components/admin/TestPanel";

export default function AdminTestPage() {
  return (
    <div className="flex flex-col gap-4 lg:max-w-2xl">
      <h1 className="text-xl font-black text-ink">Test the coach</h1>
      <TestPanel />
    </div>
  );
}
