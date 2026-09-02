'use client'
import { useState } from 'react'
import { addRiderAction } from './actions'

export function AddUserForm() {
    const [role, setRole] = useState<'bochur' | 'staff' | 'driver'>('bochur')

    return (
        <form action={addRiderAction} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" type="text" required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input name="phone" type="tel" placeholder="e.g. 845-555-1234" required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                <select
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    <option value="bochur">Bochur (Rider)</option>
                    <option value="staff">Staff (Preset Seat Rider)</option>
                    <option value="driver">Driver</option>
                </select>
            </div>

            {role === 'driver' && (
                <div className="p-4 bg-indigo-50 rounded-lg space-y-4 border border-indigo-100">
                    <div>
                        <label className="block text-sm font-medium text-indigo-900 mb-1">Car Capacity</label>
                        <input name="capacity" type="number" min="1" defaultValue="4" required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                </div>
            )}

            <button type="submit" className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3 font-bold text-sm tracking-wide hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 btn-animate">
                Add User
            </button>
        </form>
    )
}
