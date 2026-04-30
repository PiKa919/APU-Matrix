export const dynamic = 'force-dynamic';
import { runScrapeCategory } from '@/lib/runScrapeCategory';

const CATEGORY = 'android_ai_llm';

export async function GET() {
    return runScrapeCategory(CATEGORY);
}
