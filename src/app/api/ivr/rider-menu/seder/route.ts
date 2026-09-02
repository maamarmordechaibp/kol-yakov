import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';

export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const digits = formData.get('Digits')?.toString() || '';
        const riderId = new URL(req.url).searchParams.get('riderId');

        if (!riderId) return generateVoiceXML('<Hangup/>');

        let dir = '';
        if (digits === '1') dir = 'up';
        else if (digits === '2') dir = 'down';
        else return generateVoiceXML(`<Redirect method="POST">/api/ivr/rider-menu?riderId=${riderId}</Redirect>`);

        let xml = `
          <Gather action="/api/ivr/rider-menu/list?riderId=${riderId}&amp;dir=${dir}" method="POST" numDigits="1" timeout="7">
             ${playOrSay('seder-menu.mp3', 'פאר פארטאגס סדר דרוקט 1. פאר שיעור עיון דרוקט 2. פאר שיעור פשוט דרוקט 3. פאר נאכט סדר דרוקט 4.')}
          </Gather>
          <Hangup/>
        `;

        return generateVoiceXML(xml);
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
