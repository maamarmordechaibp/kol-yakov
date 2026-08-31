import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function RidersPage() {
    const supabase = await createClient()

    // Fetch all riders
    const { data: riders } = await supabase.from('riders').select('*').order('created_at', { ascending: false })

    // Simple Server Action to Add Rider
    async function addRider(formData: FormData) {
        'use server'
        const name = formData.get('name') as string
        const phone = formData.get('phone') as string
        const role = formData.get('role') as 'staff' | 'bochur'

        // Convert to simple E164 if they just typed digits
        let formattedPhone = phone.replace(/\D/g, '')
        if (formattedPhone.length === 10) {
            formattedPhone = '+1' + formattedPhone
        } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
            formattedPhone = '+' + formattedPhone
        }

        const sb = await createClient()
        await sb.from('riders').insert({ name, phone: formattedPhone, role })
        revalidatePath('/riders')
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Users &amp; Staff</h1>
                    <p className="text-gray-500 mt-1">Manage bochurim, staff, and drivers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border p-6 h-fit">
                    <h2 className="font-semibold text-lg mb-4">Add New User</h2>
                    <form action={addRider} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input name="name" type="text" required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input name="phone" type="tel" placeholder="e.g. 845-555-1234" required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select name="role" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option value="bochur">Bochur (Rider)</option>
                                <option value="staff">Staff (Preset/Driver)</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition">
                            Add User
                        </button>
                    </form>
                </div>

                {/* Data Table */}
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {riders?.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{r.phone}</td>
                                    <td className="px-6 py-4">
                                        {r.role === 'staff'
                                            ? <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-1 rounded">Staff</span>
                                            : <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded">Bochur</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">${r.balance}</td>
                                </tr>
                            ))}
                            {(!riders || riders.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-gray-500">No users found. Add one above!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
