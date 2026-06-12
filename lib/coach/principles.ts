import { principlesCollection } from "@/lib/db";
import type { Principle } from "@/lib/types";

export const TOTAL_STEPS = 5;

export async function getAllPrinciples(): Promise<Principle[]> {
  const col = await principlesCollection();
  return col.find({}).sort({ step: 1 }).toArray();
}

export async function getPrinciple(step: number): Promise<Principle | null> {
  const col = await principlesCollection();
  return col.findOne({ step });
}
