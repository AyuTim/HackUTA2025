import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering to avoid cookies() warnings in Next.js 15
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { medicalRecordUrl } = body;

    if (!medicalRecordUrl) {
      return NextResponse.json(
        { error: 'Missing medical record URL' },
        { status: 400 }
      );
    }

    // Update status to processing
    await supabase
      .from('profiles')
      .update({ processing_status: 'processing' })
      .eq('user_id', session.user.sub);

    // TODO: Call Gemini API here
    // For now, this is a placeholder structure
    const geminiResponse = await processWithGemini(medicalRecordUrl);

    // Parse the Gemini response
    const parsedData = JSON.parse(geminiResponse);

    // Store the full JSON in profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        medical_data: parsedData,
        parsed_at: new Date().toISOString(),
        processing_status: 'completed'
      })
      .eq('user_id', session.user.sub);

    if (profileError) {
      throw new Error('Failed to update profile with parsed data');
    }

    // Insert categorized data into separate tables
    if (parsedData.conditions && Array.isArray(parsedData.conditions)) {
      for (const condition of parsedData.conditions) {
        await supabase.from('medical_conditions').insert({
          user_id: session.user.sub,
          condition_name: condition.name,
          diagnosis_date: condition.diagnosis_date,
          severity: condition.severity,
          status: condition.status,
          notes: condition.notes,
          source_document_url: medicalRecordUrl
        });
      }
    }

    if (parsedData.medications && Array.isArray(parsedData.medications)) {
      for (const med of parsedData.medications) {
        await supabase.from('medications').insert({
          user_id: session.user.sub,
          medication_name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          start_date: med.start_date,
          prescribing_doctor: med.doctor,
          purpose: med.purpose,
          source_document_url: medicalRecordUrl
        });
      }
    }

    if (parsedData.allergies && Array.isArray(parsedData.allergies)) {
      for (const allergy of parsedData.allergies) {
        await supabase.from('allergies').insert({
          user_id: session.user.sub,
          allergen: allergy.allergen,
          reaction: allergy.reaction,
          severity: allergy.severity,
          source_document_url: medicalRecordUrl
        });
      }
    }

    if (parsedData.lab_results && Array.isArray(parsedData.lab_results)) {
      for (const result of parsedData.lab_results) {
        await supabase.from('lab_results').insert({
          user_id: session.user.sub,
          test_name: result.test_name,
          test_date: result.test_date,
          result_value: result.value,
          unit: result.unit,
          reference_range: result.reference_range,
          status: result.status,
          source_document_url: medicalRecordUrl
        });
      }
    }

    if (parsedData.procedures && Array.isArray(parsedData.procedures)) {
      for (const procedure of parsedData.procedures) {
        await supabase.from('procedures').insert({
          user_id: session.user.sub,
          procedure_name: procedure.name,
          procedure_date: procedure.date,
          doctor: procedure.doctor,
          hospital: procedure.hospital,
          outcome: procedure.outcome,
          notes: procedure.notes,
          source_document_url: medicalRecordUrl
        });
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Medical document processed successfully',
        data: parsedData
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing medical document:', error);
    
    // Update status to failed
    const session = await getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ processing_status: 'failed' })
        .eq('user_id', session.user.sub);
    }

    return NextResponse.json(
      { error: 'Failed to process medical document' },
      { status: 500 }
    );
  }
}

// Placeholder function for Gemini API call
async function processWithGemini(pdfUrl: string): Promise<string> {
  // TODO: Replace this with actual Gemini API call
  // You'll need to:
  // 1. Download the PDF from the URL
  // 2. Convert it to base64 or appropriate format
  // 3. Send to Gemini API with your prompt
  // 4. Return the JSON response

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Example prompt structure:
  const prompt = `
    Analyze this medical document and extract the following information in JSON format:
    {
      "conditions": [
        {
          "name": "condition name",
          "diagnosis_date": "YYYY-MM-DD",
          "severity": "mild|moderate|severe",
          "status": "active|resolved|chronic",
          "notes": "additional details"
        }
      ],
      "medications": [
        {
          "name": "medication name",
          "dosage": "dosage",
          "frequency": "frequency",
          "start_date": "YYYY-MM-DD",
          "doctor": "prescribing doctor",
          "purpose": "reason for medication"
        }
      ],
      "allergies": [
        {
          "allergen": "allergen name",
          "reaction": "reaction description",
          "severity": "mild|moderate|severe"
        }
      ],
      "lab_results": [
        {
          "test_name": "test name",
          "test_date": "YYYY-MM-DD",
          "value": "result value",
          "unit": "unit of measurement",
          "reference_range": "normal range",
          "status": "normal|abnormal|critical"
        }
      ],
      "procedures": [
        {
          "name": "procedure name",
          "date": "YYYY-MM-DD",
          "doctor": "doctor name",
          "hospital": "hospital name",
          "outcome": "outcome",
          "notes": "additional notes"
        }
      ]
    }
  `;

  // TODO: Implement actual Gemini API call here
  // Example using fetch:
  // const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${GEMINI_API_KEY}`
  //   },
  //   body: JSON.stringify({
  //     contents: [{
  //       parts: [{
  //         text: prompt
  //       }]
  //     }]
  //   })
  // });

  // For now, return a mock response
  return JSON.stringify({
    conditions: [],
    medications: [],
    allergies: [],
    lab_results: [],
    procedures: []
  });
}
