import { verifyToken } from "@/lib/auth-server";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0]

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabase = await getDb()

    const fileName = `${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage
      .from('downpayment_screenshots')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: 'Failed to upload file', details: error.message }, { status: 500 });
    }

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from('downpayment_screenshots')
      .createSignedUrl(fileName, 31536000);

    return NextResponse.json({
      success: true,
      fileName,
      url: signedUrlData?.signedUrl,
    });
  } catch (error) {
    console.error('Error uploading downpayment screenshot:', error);
    return NextResponse.json({ error: 'Failed to upload file', details: String(error) }, { status: 500 });
  }
}