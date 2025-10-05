import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering to avoid cookies() warnings in Next.js 15
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Please add your Supabase credentials to .env.local' },
        { status: 503 }
      );
    }

    // Get the authenticated user from Auth0
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const {
      fullName,
      age,
      heightFeet,
      heightInches,
      weight,
      gender,
      bloodType,
      medicalRecordUrl,
      medicalRecordFilename
    } = body;

    // Validate required fields
    if (!fullName || !age) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare the profile data
    const profileData = {
      user_id: session.user.sub, // Auth0 user ID
      email: session.user.email,
      full_name: fullName,
      age: parseInt(age),
      height_feet: heightFeet ? parseInt(heightFeet) : null,
      height_inches: heightInches ? parseInt(heightInches) : null,
      weight: weight ? parseFloat(weight) : null,
      gender: gender || null,
      blood_type: bloodType || null,
      medical_record_url: medicalRecordUrl || null,
      medical_record_filename: medicalRecordFilename || null,
      updated_at: new Date().toISOString()
    };

    // Insert or update profile in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { 
        onConflict: 'user_id' 
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save profile', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Profile saved successfully',
        data: data[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: true, data: null },
        { status: 200 }
      );
    }

    // Get the authenticated user from Auth0
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the user's profile from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.sub)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: data || null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
