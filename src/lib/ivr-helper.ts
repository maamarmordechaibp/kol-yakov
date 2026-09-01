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
    // 1. Force Male TTS for pure numbers (e.g. 1.wav)
    if (fileName.match(/^\d+\.wav$/)) {
        return `<Say voice="man">${fallbackText}</Say>`;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // 2. ONLY play the MP3! (Removed the <Say> fallback)
    // SignalWire executes <Play> and <Say> sequentially (not as a fallback).
    // Because the <Say> had Yiddish characters, SignalWire was crashing immediately after the MP3 played!
    if (supabaseUrl) {
        const bucketUrl = `${supabaseUrl}/storage/v1/object/public/prompts/${fileName}`;
        return `<Play>${bucketUrl}</Play>`;
    }

    return `<Say voice="man">Audio missing</Say>`;
}

