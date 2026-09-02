import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const timeHH = url.searchParams.get('hh') || '';
        const timeMM = url.searchParams.get('mm') || '';

        // Play the automated alert message
        const xml = `
            ${playOrSay('driver-is-delayed.mp3', 'א גוטן. מיר רופן צו לאזן וויסן אז די קאר וועט זיך פארשפעטיגן. דער דרייווער וועט ארויספארן אום')}
            <Say voice="man">${timeHH}:${timeMM}</Say>
            <Hangup/>
        `;

        return generateVoiceXML(xml);
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
