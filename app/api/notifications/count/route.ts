import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth"; // Import getAuthUser
import { RoleName } from "@/constants/roles"; // Assuming this is where RoleName is defined
import { getUnreadCount } from "@/services/notification.service";
import { runWithBusinessContext } from "@/lib/business-context"; // Import the new helper

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  // Check if user is authenticated AND has an active business context
  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  // Wrap the service call within the business context
  return runWithBusinessContext(user, async () => {
    // Now getUnreadCount() will have the correct AsyncLocalStorage context
    const count = await getUnreadCount(user.id, user.role as RoleName); // Pass user.id and user.role
    return NextResponse.json({ count });
  });
}
