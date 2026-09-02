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
    // 1. Force Male TTS for pure numbers (e.g. 1.mp3)
    if (fileName.match(/^\d+\.mp3$/)) {
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

export async function triggerOutboundCall(toNumber: string, webhookUrl: string) {
    const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;
    const projectId = process.env.SIGNALWIRE_PROJECT_ID;
    const token = process.env.SIGNALWIRE_TOKEN;
    const fromNumber = process.env.SIGNALWIRE_PHONE_NUMBER;

    if (!spaceUrl || !projectId || !token || !fromNumber) {
        console.error('SignalWire credentials missing for outbound calls.');
        return false;
    }

    const basicAuth = Buffer.from(`${projectId}:${token}`).toString('base64');

    // Format number to highly strict E.164
    let cleanNumber = toNumber.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '1' + cleanNumber;
    if (!cleanNumber.startsWith('+')) cleanNumber = '+' + cleanNumber;

    // Use absolute URL for the webhook
    const customSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const baseHost = customSiteUrl ? customSiteUrl : 'https://kol-yakov-cars.vercel.app';
    const absoluteWebhook = baseHost + webhookUrl;

    const url = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Calls.json`;

    const body = new URLSearchParams({
        To: cleanNumber,
        From: fromNumber,
        Url: absoluteWebhook,
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        if (!response.ok) {
            console.error('SignalWire Outbound Failed:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Fetch error during outbound call:', error);
        return false;
    }
}


