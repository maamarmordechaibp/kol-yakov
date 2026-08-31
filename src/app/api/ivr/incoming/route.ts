import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';



export async function POST(req: Request) {
    try {
        // SignalWire sends data either as x-www-form-urlencoded or JSON based on webhook config
        // Usually it's formData (x-www-form-urlencoded) for voice webhooks.
        let fromNumber = '';

        // Parse the body
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            fromNumber = formData.get('From')?.toString() || '';
        } else {
            const json = await req.json();
            fromNumber = json.From || '';
        }

        if (!fromNumber) {
            return generateVoiceXML('<Reject reason="rejected"/>');
        }

        // Connect to DB
        const supabase = await createClient();

        // Log the call
        await supabase.from('call_logs').insert({
            phone: fromNumber,
            direction: 'inbound',
            flow: 'incoming_routing'
        } as any);

        // Look up the user
        // Make sure we format the number. SignalWire usually sends numbers in E.164 format (e.g. +1845...)
        const { data: rider } = await supabase
            .from('riders')
            .select('id, role')
            .eq('phone', fromNumber)
            .single();

        if (!rider) {
            // Unknown caller - go to registration
            return generateVoiceXML('<Redirect method="POST">/api/ivr/registration</Redirect>');
        }

        // Known Caller Logic
        if (rider.role === 'staff') {
            // Check if this staff member is a driver
            const { data: driver } = await supabase
                .from('drivers')
                .select('id')
                .eq('rider_id', rider.id)
                .single();

            if (driver) {
                // It's a Driver
                return generateVoiceXML('<Redirect method="POST">/api/ivr/driver-menu</Redirect>');
            } else {
                // It's a Staff Rider
                return generateVoiceXML('<Redirect method="POST">/api/ivr/staff-menu</Redirect>');
            }
        }

        // Default to Bochur (Rider)
        return generateVoiceXML('<Redirect method="POST">/api/ivr/rider-menu</Redirect>');

    } catch (error) {
        console.error('Incoming Webhook Error:', error);
        // In case of error, play a fallback message 
        return generateVoiceXML('<Say language="yi">עס איז דא אן ערראר. ביטע פראבירט שפעטער.</Say><Hangup/>');
    }
}
