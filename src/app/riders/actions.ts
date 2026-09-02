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

        await supabase.from('drivers').insert({
            rider_id: newRider.id,
            car_capacity: capacity
        })
    }

    // Refresh page
    revalidatePath('/riders')
}

export async function editUserAction(
    id: string,
    editName: string,
    editPhone: string,
    editRole: string,
    editCapacity: number,
    wasDriver: boolean
) {
    const supabase = await createClient()

    // Format phone
    let formattedPhone = editPhone.replace(/\D/g, '')
    if (formattedPhone.length === 10) formattedPhone = '+1' + formattedPhone
    else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) formattedPhone = '+' + formattedPhone

    const dbRole = editRole === 'driver' ? 'staff' : editRole

    // Update rider core
    const { error: riderErr } = await supabase.from('riders').update({ name: editName, phone: formattedPhone, role: dbRole }).eq('id', id)
    if (riderErr) console.error("RIDER UPDATE ERROR:", riderErr)

    // Handle Driver Table
    if (editRole === 'driver' && !wasDriver) {
        const { error: drvErr } = await supabase.from('drivers').insert({
            rider_id: id,
            car_capacity: editCapacity
        })
        if (drvErr) console.error("DRIVER INSERT ERROR:", drvErr)
    } else if (editRole === 'driver' && wasDriver) {
        await supabase.from('drivers').update({ car_capacity: editCapacity }).eq('rider_id', id)
    } else if (editRole !== 'driver' && wasDriver) {
        await supabase.from('drivers').delete().eq('rider_id', id)
    }

    revalidatePath('/riders')
    revalidatePath('/schedules')
    revalidatePath('/prompts')
}
