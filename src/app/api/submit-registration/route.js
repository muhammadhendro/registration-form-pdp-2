import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 'unknown';

    // Parse request body
    const { token, formData } = await request.json();

    if (!token || !formData) {
      return Response.json(
        { error: 'Missing token or form data' },
        { status: 400 }
      );
    }

    if (!formData.full_name?.trim() || !formData.company_name?.trim() || !formData.division_role?.trim()) {
      return Response.json(
        { error: 'Missing required participant information' },
        { status: 400 }
      );
    }

    // 1. Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('rate_limit_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return Response.json(
        { error: 'Invalid token' },
        { status: 403 }
      );
    }

    // Check if token is already used
    if (tokenData.used) {
      return Response.json(
        { error: 'Token already used' },
        { status: 403 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return Response.json(
        { error: 'Token expired' },
        { status: 403 }
      );
    }

    // 2. Check rate limiting (60 seconds cooldown)
    const sixtySecondsAgo = new Date();
    sixtySecondsAgo.setSeconds(sixtySecondsAgo.getSeconds() - 60);

    const { data: recentSubmissions } = await supabase
      .from('submission_logs')
      .select('submitted_at')
      .eq('ip_address', ip)
      .gte('submitted_at', sixtySecondsAgo.toISOString())
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (recentSubmissions && recentSubmissions.length > 0) {
      const lastSubmission = new Date(recentSubmissions[0].submitted_at);
      const timeSince = Date.now() - lastSubmission.getTime();
      const remainingSeconds = Math.ceil((60000 - timeSince) / 1000);

      return Response.json(
        { 
          error: `Please wait ${remainingSeconds} seconds before submitting again.`,
          remainingSeconds 
        },
        { status: 429 }
      );
    }

    // 3. Mark token as used
    await supabase
      .from('rate_limit_tokens')
      .update({ used: true })
      .eq('token', token);

    // 4. Insert registration submission
    const { error: insertError } = await supabase
      .from('bridgestone_incident_response_registration')
      .insert({
        full_name: formData.full_name?.trim(),
        company_name: formData.company_name?.trim(),
        division_role: formData.division_role?.trim(),
        email: formData.email?.trim().toLowerCase() || null,
        phone_number: formData.phone_number?.trim() || null
      });

    if (insertError) {
      console.error('Error inserting registration:', insertError);
      return Response.json({ error: `DB Error: ${insertError.message}` }, { status: 500 });
    }

    // 5. Log submission for rate limiting
    await supabase
      .from('submission_logs')
      .insert({
        ip_address: ip,
        submitted_at: new Date().toISOString()
      });

    return Response.json({ 
      success: true, 
      message: 'Registration submitted successfully'
    });

  } catch (error) {
    console.error('Error in submit-registration:', error);
    return Response.json(
      { error: error.message || 'Failed to submit registration. Check your environment variables in Vercel.' },
      { status: 500 }
    );
  }
}
