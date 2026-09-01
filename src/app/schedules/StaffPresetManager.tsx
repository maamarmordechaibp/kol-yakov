'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus } from 'lucide-react'

export default function StaffPresetManager({ initialPresets, staff, drivers }: { initialPresets: any[], staff: any[], drivers: any[] }) {
    const supabase = createClient()
    const [presets, setPresets] = useState(initialPresets)

    // Form state
    const [selectedStaff, setSelectedStaff] = useState('')
    const [selectedDriver, setSelectedDriver] = useState('')
    const [selectedDay, setSelectedDay] = useState(0) // Sunday
    const [direction, setDirection] = useState('up')

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this permanent assignment?')) return
        setPresets(prev => prev.filter(p => p.id !== id))
        await supabase.from('staff_presets').delete().eq('id', id)
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStaff || !selectedDriver) return

        const payload = {
            rider_id: selectedStaff,
            driver_id: selectedDriver,
            day_of_week: selectedDay,
            direction: direction
        }

        const { data, error } = await supabase.from('staff_presets').insert(payload).select(`
            id, day_of_week, direction,
            drivers ( riders(name) ),
            riders ( name )
        `).single();

        if (error) {
            alert('Error adding preset. They might already be booked for this direction on this day.')
            console.error(error)
        } else if (data) {
            setPresets(prev => [...prev, data])
        }
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    return (
        <div>
            {/* Add New Preset */}
            <form onSubmit={handleAdd} className="mb-6 bg-slate-50 border p-4 rounded-lg flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Staff Member</label>
                    <select required value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className="text-sm border rounded px-3 py-2 bg-white">
                        <option value="">-- Select Staff --</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Assign to Driver</label>
                    <select required value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="text-sm border rounded px-3 py-2 bg-white">
                        <option value="">-- Select Driver --</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{(d.riders as any)?.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Day</label>
                    <select value={selectedDay} onChange={e => setSelectedDay(parseInt(e.target.value))} className="text-sm border rounded px-3 py-2 bg-white">
                        {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Direction</label>
                    <select value={direction} onChange={e => setDirection(e.target.value)} className="text-sm border rounded px-3 py-2 bg-white font-medium">
                        <option value="up">Going UP (To School)</option>
                        <option value="down">Going DOWN (To Home)</option>
                    </select>
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium text-sm flex gap-2 items-center">
                    <Plus size={16} /> Assign Run
                </button>
            </form>

            <table className="w-full text-left bg-white border rounded">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-4 py-2 font-semibold text-sm">Staff Member</th>
                        <th className="px-4 py-2 font-semibold text-sm">Assigned Driver</th>
                        <th className="px-4 py-2 font-semibold text-sm">Day of Week</th>
                        <th className="px-4 py-2 font-semibold text-sm">Direction</th>
                        <th className="px-4 py-2 font-semibold text-sm text-right">Delete</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {presets?.map(p => (
                        <tr key={p.id}>
                            <td className="px-4 py-3 font-medium text-indigo-700">{(p.riders as any)?.name}</td>
                            <td className="px-4 py-3 text-gray-800">{((p.drivers as any)?.riders as any)?.name}</td>
                            <td className="px-4 py-3 text-gray-500">{days[p.day_of_week]}</td>
                            <td className="px-4 py-3">
                                {p.direction === 'up' ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold w-max">⬆️ UP</span> : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold w-max">⬇️ DOWN</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                    {presets.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No staff presets assigned across any day.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
