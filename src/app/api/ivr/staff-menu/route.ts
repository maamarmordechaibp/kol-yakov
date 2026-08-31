import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const fromNumber = formData.get('From')?.toString() || '';

        // We assume the user exists because /incoming routed them here.
        // They are staff riders (not drivers).

        // Create the SignalWire XML
        // Plays the staff menu MP3. If they press '1', it sends it to /process
        const xml = `
      <Gather action="/api/ivr/staff-menu/process" method="POST" numDigits="1" timeout="5">
        ${playOrSay('staff-rider-menu.mp3', 'שלום עליכם. אויב איר פארט נישט היינט מיט די קאר, ביטע דרוקט איינס.')}
      </Gather>
      <!-- If they didn't press anything, hangup -->
      <Say language="he">זייט מצליח. א גוטן טאג.</Say>
      <Hangup/>
    `;

        return generateVoiceXML(xml);
    } catch (error) {
        return generateVoiceXML('<Say>Error.</Say><Hangup/>');
    }
}
