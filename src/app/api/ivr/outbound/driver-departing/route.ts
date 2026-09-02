import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const driverName = url.searchParams.get('driverName') || '';

        // Play the automated alert message
        const xml = `
            ${playOrSay('driver-is-outside.mp3', 'א גוטן. מיר רופן צו לאזן וויסן אז דער קאר איז יעצט ארויסגעפארן. ביטע קומט אראפ.')}
            <Say voice="man">${driverName}</Say>
            <Hangup/>
        `;

        return generateVoiceXML(xml);
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
