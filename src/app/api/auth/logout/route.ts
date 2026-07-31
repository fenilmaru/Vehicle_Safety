import { guard, ok } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  return guard(async () => {
    await clearSessionCookie();
    return ok({ loggedOut: true });
  });
}
