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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Force Male TTS completely bypassing the 404 Play for numbers
    if (fileName.match(/^\d+\.mp3$/)) {
        return `<Say voice="man">${fallbackText}</Say>`;
    }

    if (supabaseUrl) {
        const bucketUrl = `${supabaseUrl}/storage/v1/object/public/prompts/${fileName}`;
        return `
      <Play>${bucketUrl}</Play>
      <Say voice="man">${fallbackText}</Say>
    `;
    }

    return `<Say voice="man">${fallbackText}</Say>`;
}
