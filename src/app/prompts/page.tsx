import { createClient } from '@/lib/supabase/server'
import PromptsManager from './PromptsManager'



export default async function PromptsPage() {
    const supabase = await createClient()

    // 1. Fetch Drivers (for dynamic voice prompts)
    const { data: drivers } = await supabase
        .from('drivers')
        .select('id, riders(name)')

    // 2. We need unique times to know what time prompts to record
    // Assuming times are in default_departure_time, we can just grab unique ones
    const { data: driverTimes } = await supabase
        .from('drivers')
        .select('default_departure_time')

    const uniqueTimes = Array.from(new Set(driverTimes?.map(d => d.default_departure_time.substring(0, 5)) || []))

    // Fetch the bucket files safely on the server side
    const { data: bucketData } = await supabase.storage.from('prompts').list()
    const initialBucketFiles = bucketData?.map(f => f.name) || []

    // 3. Build Checklist of EXPECTED files
    const expectedPrompts = [
        { filename: 'staff-rider-menu.mp3', label: 'Staff Menu Intro ("Press 1 to cancel")' },
        { filename: 'staff-cancel-confirmed.mp3', label: 'Staff Cancellation Confirmed' },
        { filename: 'no-active-preset.mp3', label: 'Staff Error: No Preset for Today' },

        { filename: 'no-rides-today.mp3', label: 'Bochur Error: No Rides Available Today' },
        { filename: 'no-seats.mp3', label: 'Bochur Error: Cars are Full' },
        { filename: 'rider-menu-intro.mp3', label: 'Bochur Menu Intro ("Available cars...")' },
        { filename: 'booking-confirmed.mp3', label: 'Bochur Booking Confirmed!' },

        { filename: 'to-travel-with.mp3', label: 'Fragment: "To travel with..."' },
        { filename: 'leaving-at.mp3', label: 'Fragment: "Leaving at..."' },
        { filename: 'press.mp3', label: 'Fragment: "Press..."' },

        { filename: 'not-driving.mp3', label: 'Driver Menu Error: Not Scheduled' },
        { filename: 'you-have.mp3', label: 'Driver Menu: "You have..."' },
        { filename: 'passengers.mp3', label: 'Driver Menu: "...passengers today"' },
        { filename: 'driver-menu.mp3', label: 'Driver Menu Intro ("Press 1 to depart")' },
    ]

    // Add numbers 1-9
    for (let i = 1; i <= 9; i++) {
        expectedPrompts.push({ filename: `${i}.mp3`, label: `Digit: ${i}` })
    }

    // Add Dynamic Driver Names
    drivers?.forEach(d => {
        expectedPrompts.push({ filename: `r-${d.id}.mp3`, label: `Driver Name: ${(d.riders as any)?.name}` })
    })

    // Add Dynamic Times
    uniqueTimes.forEach(t => {
        const formattedFileName = `time-${t.replace(':', '')}.mp3` // e.g. time-0730.mp3
        expectedPrompts.push({ filename: formattedFileName, label: `Time: ${t}` })
    })

    return <PromptsManager expectedPrompts={expectedPrompts} initialBucketFiles={initialBucketFiles} />
}
