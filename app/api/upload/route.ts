import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cookieName } from '@/app/utils/supabase';

// Helper to create a Supabase admin client for server-side operations
const createSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

// File size limits (in bytes)
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_BUCKETS = ['videos', 'audio', 'thumbnails'];

// Allowed file types for each bucket
const ALLOWED_TYPES = {
  videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a'],
  thumbnails: ['image/jpeg', 'image/png', 'image/webp']
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;

    if (!accessToken) {
      console.error('Upload API: No access token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 });
    }

    // Verify the user token
    const supabase = createSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError) {
      console.error('Upload API: Token validation error:', userError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (!user) {
      console.error('Upload API: No user found for token');
      return NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 });
    }

    console.log('Upload API: User authenticated:', user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucketName = formData.get('bucketName') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !bucketName || !fileName) {
      console.error('Upload API: Missing required fields', { file: !!file, bucketName, fileName });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate bucket name
    if (!ALLOWED_BUCKETS.includes(bucketName)) {
      console.error('Upload API: Invalid bucket name:', bucketName);
      return NextResponse.json({ error: 'Invalid bucket name' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('Upload API: File too large:', file.size, 'bytes');
      return NextResponse.json({ 
        error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ALLOWED_TYPES[bucketName as keyof typeof ALLOWED_TYPES];
    if (!allowedTypes.includes(file.type)) {
      console.error('Upload API: Invalid file type:', file.type, 'for bucket:', bucketName);
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types for ${bucketName}: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    console.log('Upload API: Starting upload', { 
      fileName, 
      bucketName, 
      fileSize: file.size, 
      fileType: file.type,
      userId: user.id 
    });

    // Convert File to Buffer for server-side upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase storage using admin client
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload API: Supabase upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log('Upload API: Upload successful', { 
      fileName, 
      bucketName, 
      url: urlData.publicUrl 
    });

    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: data.path,
      size: file.size,
      type: file.type
    });

  } catch (error: any) {
    console.error('Upload API: Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload file' 
    }, { status: 500 });
  }
} 