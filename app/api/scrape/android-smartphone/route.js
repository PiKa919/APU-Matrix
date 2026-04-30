export const dynamic = 'force-dynamic';
import { runScrapeCategory } from '@/lib/runScrapeCategory';

const CATEGORY = 'android';

export async function GET() {
    return runScrapeCategory(CATEGORY);
}
