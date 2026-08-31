import { NextResponse } from 'next/server';

/**
 * Generates the wrapper for SignalWire/Twilio XML
 */
export function generateVoiceXML(content: string) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`, {
        status: 200,
        headers: {
            'Content-Type': 'text/xml',
            'Cache-Control': 'no-cache'
        }
    });
}

/**
 * Returns a <Say> tag as a TTS fallback since Cloudflare Edge cannot read the filesystem.
 */
export function playOrSay(fileName: string, fallbackText: string): string {
    // Edge runtime cannot read the local filesystem.
    // Once you record MP3s, replace this function code with: 
    // return `<Play>https://kol-yakov.pages.dev/prompts/${fileName}</Play>`
    return `<Say language="he">${fallbackText}</Say>`;
}
