'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addRiderAction(formData: FormData) {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const roleSelection = formData.get('role') as string // 'bochur', 'staff', 'driver'

    // Format phone
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.length === 10) formattedPhone = '+1' + formattedPhone
    else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) formattedPhone = '+' + formattedPhone

    const supabase = await createClient()

    // 1. Insert into riders table first (role is either 'staff' or 'bochur')
    const dbRole = roleSelection === 'driver' ? 'staff' : roleSelection

    const { data: newRider, error } = await supabase
        .from('riders')
        .insert({ name, phone: formattedPhone, role: dbRole })
        .select('id')
        .single()

    if (error || !newRider) {
        console.error(error)
        return
    }

    // 2. If they were selected as a Driver, automatically insert into drivers table!
    if (roleSelection === 'driver') {
        const capacity = parseInt(formData.get('capacity') as string) || 4
        const time = formData.get('time') as string // '07:30'

        await supabase.from('drivers').insert({
            rider_id: newRider.id,
            car_capacity: capacity,
            default_departure_time: time + ':00' // Append seconds for SQL Time
        })
    }

    // Refresh page
    revalidatePath('/riders')
}
