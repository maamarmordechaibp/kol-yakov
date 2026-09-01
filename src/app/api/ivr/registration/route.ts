import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';

export async function POST(req: Request) {
    try {
        // We prompt the unrecognized caller to enter their 10-digit home phone number.
        const xml = `
          <Gather action="/api/ivr/registration/process" method="POST" numDigits="10" timeout="10">
             ${playOrSay('enter-home-phone.mp3', 'מיר דערקענען נישט אייער נומער. ביטע דרוקט אייער צען ציפערן היים טעלעפאן נומער.')}
          </Gather>
          <Redirect method="POST">/api/ivr/registration</Redirect>
        `;
        return generateVoiceXML(xml);
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
