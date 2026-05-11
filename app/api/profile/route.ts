import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getProfile, updateProfile } from "@/services/user.service";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getProfile(authUser.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, username, email, phone, gender, dob, address } = body;

    const result = await updateProfile(authUser.id, {
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
    console.error("PATCH profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}