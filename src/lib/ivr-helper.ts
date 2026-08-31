import { NextResponse } from 'next/server';

export function generateVoiceXML(content: string) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`, {
        status: 200,
        headers: {
            'Content-Type': 'text/xml',
            'Cache-Control': 'no-cache'
        }
    });
}

export function playOrSay(fileName: string, fallbackText: string): string {
    // If the user configures Vercel and Supabase correctly, this will play the MP3!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl) {
        const bucketUrl = `${supabaseUrl}/storage/v1/object/public/prompts/${fileName}`;
        // We output a <Play> tag for the MP3, and if the MP3 is missing, 
        // SignalWire skips it and reads the <Say> tag as a backup!
        // (Removed language="he" from Say because SignalWire default voice crashes on unknown languages)
        return `
      <Play>${bucketUrl}</Play>
      <Say>${fallbackText}</Say>
    `;
    }

    return `<Say>${fallbackText}</Say>`;
}
