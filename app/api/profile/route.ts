import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getProfile, updateProfile } from "@/services/user.service";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  // Check if user is authenticated AND has an active business context
  if (!user || !user.businessId) {
    // Returning 403 Forbidden as per requirements when business context is missing
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  try {
    // Services like getProfile() will implicitly use the context set by getAuthUser().
    const userProfile = await getProfile(user.id); // Pass user.id
    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error("GET profile error:", error); // Added logging for debugging
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();

  // Check if user is authenticated AND has an active business context
  if (!user || !user.businessId) {
    // Returning 403 Forbidden as per requirements when business context is missing
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, username, email, phone, gender, dob, address } = body;

    // Pass user.id to the updateProfile service
    const result = await updateProfile(user.id, {
      name,
      username,
      email,
      phone: phone || null,
      gender: gender || null,
      dob: dob ? new Date(dob) : null,
      address: address || null,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ user: result, message: "Profile updated successfully" });
  } catch (error) {
    console.error("PATCH profile error:", error); // Added logging for debugging
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
