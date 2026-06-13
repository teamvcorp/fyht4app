import { listBeltSubmissions } from "@/app/actions/admin";
import { ReviewQueue } from "@/components/admin/ReviewQueue";

export default async function AdminReviewsPage() {
  const submissions = await listBeltSubmissions();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-black text-ink">Belt-test reviews</h1>
      <ReviewQueue submissions={submissions} />
    </div>
  );
}
