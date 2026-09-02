import { createClient } from '@/lib/supabase/server';

export async function generateRidesForToday(supabase: any) {
    const today = new Date();
    // Use New York time to determine the current local date
    const options: Intl.DateTimeFormatOptions = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' };
    const localeDateStr = today.toLocaleString('en-US', options);
    // Format parses as MM/DD/YYYY, we need to convert to YYYY-MM-DD
    const [month, day, year] = localeDateStr.split('/');
    const isoDate = `${year}-${month}-${day}`;

    const jsDayIndex = today.getDay(); // 0 is Sun, 6 is Sat

    // 1. Get all schedules that fall on today
    const { data: schedules } = await supabase.from('driver_weekly_schedules').select('*');
    if (!schedules) return;

    const todaySchedules = schedules.filter((s: any) => s.days_of_week.includes(jsDayIndex));

    for (const sched of todaySchedules) {
        // Upsert to ensure we don't duplicate rides if ran twice
        const { data: existing } = await supabase.from('daily_rides')
            .select('id')
            .eq('driver_id', sched.driver_id)
            .eq('ride_date', isoDate)
            .eq('direction', sched.direction)
            .eq('seder', sched.seder)
            .maybeSingle(); // Prevents multiple row crashes

        if (!existing) {
            await supabase.from('daily_rides').insert({
                driver_id: sched.driver_id,
                ride_date: isoDate,
                estimated_departure_time: sched.departure_time,
                direction: sched.direction,
                seder: sched.seder,
                status: 'scheduled'
            });
        }
    }
}
