import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Validate secret to avoid public abuse
  const secret = request.headers.get("x-revalidate-secret") || request.nextUrl.searchParams.get("secret");
  
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  const tag = request.nextUrl.searchParams.get("tag") || "project-data";
  
  // Revalidate specified Next.js cache tag
  // @ts-expect-error - Next 15 typings sometimes incorrectly require a 'profile' param
  revalidateTag(tag);

  return NextResponse.json({ 
    revalidated: true, 
    now: Date.now(), 
    tag 
  });
}
