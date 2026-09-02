'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addScheduleAction(payload: any) {
    const supabase = await createClient()

    const { data: inserted, error } = await supabase
        .from('driver_weekly_schedules')
        .insert(payload)
        .select(`
            *,
            drivers ( riders(name) )
        `)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/schedules')
    revalidatePath('/prompts')
    return { data: inserted }
}

export async function removeScheduleAction(id: string) {
    const supabase = await createClient()
    await supabase.from('driver_weekly_schedules').delete().eq('id', id)
    revalidatePath('/schedules')
    revalidatePath('/prompts')
}
