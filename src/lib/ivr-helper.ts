import fs from 'fs';
import path from 'path';
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
 * Returns a <Play> tag if the MP3 exists in the public directory, 
 * otherwise falls back to a <Say> tag with Yiddish (yi) language.
 */
export function playOrSay(fileName: string, fallbackText: string): string {
    // We assume prompts are stored in public/prompts/
    const publicPath = path.join(process.cwd(), 'public', 'prompts', fileName);

    // NOTE: In production (like Vercel), we need the base URL to pass to SignalWire.
    // We grab it from NEXT_PUBLIC_BASE_URL or just use a placeholder for now since SignalWire can handle relative paths 
    // IF the webhook was called on the same domain, but absolute is safer.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.ngrok-free.app';

    if (fs.existsSync(publicPath)) {
        return `<Play>${baseUrl}/prompts/${fileName}</Play>`;
    } else {
        // Fallback to Text-to-Speech
        return `<Say language="he">${fallbackText}</Say>`;
        // Note: Twilio/SignalWire TTS support for "yi" (Yiddish) might vary. 
        // Sometimes "he" (Hebrew) or "de" (German) sounds closer or is better supported if "yi" fails.
    }
}
