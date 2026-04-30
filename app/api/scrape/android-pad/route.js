export const dynamic = 'force-dynamic';
import { runScrapeCategory } from '@/lib/runScrapeCategory';

const CATEGORY = 'android_lite';

export async function GET() {
    return runScrapeCategory(CATEGORY);
}
