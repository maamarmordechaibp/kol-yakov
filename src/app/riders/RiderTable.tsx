'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useMemo } from 'react'
import { Trash2, Mic, Volume2, Save, Search, Edit2, X, AlertTriangle } from 'lucide-react'

export default function RiderTable({ initialRiders }: { initialRiders: any[] }) {
    const supabase = createClient()
    const [riders, setRiders] = useState(initialRiders)
    const [editingTts, setEditingTts] = useState<string | null>(null)
    const [ttsValue, setTtsValue] = useState('')

    // New Advanced Features State
    const [searchQuery, setSearchQuery] = useState('')
    const [sortField, setSortField] = useState<'name' | 'role' | 'active'>('name')
    const [editingUserId, setEditingUserId] = useState<string | null>(null)

    // Edit Form State
    const [editName, setEditName] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [editRole, setEditRole] = useState<'bochur' | 'staff' | 'driver'>('bochur')
    const [editCapacity, setEditCapacity] = useState(4)

    const toggleActive = async (id: string, currentVal: boolean) => {
        const newVal = !currentVal
        setRiders(prev => prev.map(r => r.id === id ? { ...r, is_active: newVal } : r))
        await supabase.from('riders').update({ is_active: newVal }).eq('id', id)
    }

    const toggleAudioType = async (driverId: string, currentVal: string, currentTts: string) => {
        const newVal = currentVal === 'tts' ? 'mp3' : 'tts'

        // Update local state by finding the rider that holds this driver
        setRiders(prev => prev.map(r => {
            if (r.drivers && r.drivers.length > 0 && r.drivers[0].id === driverId) {
                return {
                    ...r,
                    drivers: [{ ...r.drivers[0], audio_type: newVal }]
                }
            }
            return r
        }))

        await supabase.from('drivers').update({ audio_type: newVal }).eq('id', driverId)

        if (newVal === 'tts' && !currentTts) {
            setEditingTts(driverId)
            setTtsValue('English Name')
        }
    }

    const saveTtsName = async (driverId: string) => {
        setRiders(prev => prev.map(r => {
            if (r.drivers && r.drivers.length > 0 && r.drivers[0].id === driverId) {
                return {
                    ...r,
                    drivers: [{ ...r.drivers[0], tts_name: ttsValue }]
                }
            }
            return r
        }))
        await supabase.from('drivers').update({ tts_name: ttsValue }).eq('id', driverId)
        setEditingTts(null)
    }

    const deleteUser = async (id: string) => {
        if (!confirm('Are you certain you want to permanently delete this user? ALL of their data (schedules, rides, audio settings) will be wiped!')) return
        setRiders(prev => prev.filter(r => r.id !== id))
        await supabase.from('riders').delete().eq('id', id)
    }

    const startEditing = (r: any) => {
        setEditingUserId(r.id)
        setEditName(r.name)
        setEditPhone(r.phone)
        const isDriver = r.drivers && r.drivers.length > 0
        setEditRole(isDriver ? 'driver' : r.role)
        setEditCapacity(isDriver ? r.drivers[0].car_capacity : 4)
    }

    const saveUserEdit = async (id: string) => {
        const payloadPhone = editPhone.replace(/\D/g, '')
        const formattedPhone = payloadPhone.length === 10 ? '+1' + payloadPhone : (payloadPhone.length === 11 && payloadPhone.startsWith('1') ? '+' + payloadPhone : editPhone)

        const dbRole = editRole === 'driver' ? 'staff' : editRole

        // Update rider core
        await supabase.from('riders').update({ name: editName, phone: formattedPhone, role: dbRole }).eq('id', id)

        // Handle Driver table modifications
        const currentUser = riders.find(r => r.id === id)
        const wasDriver = currentUser?.drivers?.length > 0

        let newDriverObj = currentUser?.drivers || []

        if (editRole === 'driver' && !wasDriver) {
            const { data: nd } = await supabase.from('drivers').insert({ rider_id: id, car_capacity: editCapacity }).select('id, audio_type, car_capacity').single()
            if (nd) newDriverObj = [nd]
        } else if (editRole === 'driver' && wasDriver) {
            await supabase.from('drivers').update({ car_capacity: editCapacity }).eq('rider_id', id)
            newDriverObj[0] = { ...newDriverObj[0], car_capacity: editCapacity }
        } else if (editRole !== 'driver' && wasDriver) {
            await supabase.from('drivers').delete().eq('rider_id', id)
            newDriverObj = []
        }

        setRiders(prev => prev.map(r => r.id === id ? {
            ...r,
            name: editName,
            phone: formattedPhone,
            role: dbRole,
            drivers: newDriverObj
        } : r))

        setEditingUserId(null)
    }

    // Filter and Sort Logic
    const filteredRiders = useMemo(() => {
        let result = riders.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.phone.includes(searchQuery)
        )
        if (sortField === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
        if (sortField === 'active') result.sort((a, b) => (a.is_active === b.is_active) ? 0 : a.is_active ? -1 : 1)
        if (sortField === 'role') result.sort((a, b) => {
            const getRank = (user: any) => user.drivers?.length > 0 ? 1 : user.role === 'staff' ? 2 : 3
            return getRank(a) - getRank(b)
        })
        return result
    }, [riders, searchQuery, sortField])

    return (
        <div className="md:col-span-3 lg:col-span-2 glass-panel rounded-2xl shadow-sm border overflow-hidden flex flex-col h-[80vh]">

            {/* Control Bar (Find & Sort) */}
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between z-10 shrink-0">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Find user by name or phone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border-none rounded-lg text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-2 items-center text-sm">
                    <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Sort List By:</span>
                    <select value={sortField} onChange={e => setSortField(e.target.value as any)} className="bg-slate-800 text-white border-none rounded-lg px-3 py-2 outline-none font-medium cursor-pointer">
                        <option value="name">Alphabetical Name</option>
                        <option value="role">System Role Rank</option>
                        <option value="active">Active Accounts First</option>
                    </select>
                </div>
            </div>

            <div className="overflow-y-auto flex-1">
                <table className="w-full text-left">
                    <thead className="bg-white/90 backdrop-blur sticky top-0 border-b z-10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Global Details</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">System Authorization</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Voice Control</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm bg-white/50 backdrop-blur-md">
                        {filteredRiders.map(r => {
                            const isDriver = r.drivers && r.drivers.length > 0
                            const driverId = isDriver ? r.drivers[0].id : null
                            const audioType = isDriver ? (r.drivers[0].audio_type || 'mp3') : null
                            const isEditingThis = editingUserId === r.id

                            if (isEditingThis) return (
                                <tr key={r.id} className="bg-indigo-50/50">
                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 block mb-1">Full Legal Name</label>
                                                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="w-full text-sm font-bold bg-white border border-indigo-200 rounded-md px-3 py-2 outline-none focus:border-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 block mb-1">Cellular Node</label>
                                                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full text-sm font-mono bg-white border border-indigo-200 rounded-md px-3 py-2 outline-none focus:border-indigo-500" />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 block mb-1">Platform Role</label>
                                                <select value={editRole} onChange={e => setEditRole(e.target.value as any)} className="w-full text-sm font-bold bg-white border border-indigo-200 rounded-md px-3 py-2 outline-none focus:border-indigo-500">
                                                    <option value="bochur">Bochur (Standard)</option>
                                                    <option value="staff">Staff (Preset Seat)</option>
                                                    <option value="driver">Driver Array</option>
                                                </select>
                                                {editRole !== (isDriver ? 'driver' : r.role) && <span className="text-[10px] text-orange-500 font-bold block mt-1"><AlertTriangle size={10} className="inline mr-1" />Role Shift Warning</span>}
                                            </div>
                                            {editRole === 'driver' && (
                                                <div className="animate-fade-in-up">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 block mb-1">Max Car Capacity</label>
                                                    <input type="number" min="1" value={editCapacity} onChange={e => setEditCapacity(parseInt(e.target.value))} className="w-full text-sm font-bold bg-white border border-indigo-200 rounded-md px-3 py-2 outline-none focus:border-indigo-500" />
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-top">
                                        <span className="text-xs text-slate-400 font-medium">Locked during edit mode</span>
                                    </td>

                                    <td className="px-6 py-4 text-right align-top space-y-2">
                                        <button onClick={() => saveUserEdit(r.id)} className="w-full flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold shadow-md transition-colors">
                                            <Save size={16} /> Save Node
                                        </button>
                                        <button onClick={() => setEditingUserId(null)} className="w-full flex justify-center items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg font-bold transition-colors">
                                            <X size={16} /> Cancel
                                        </button>
                                    </td>
                                </tr>
                            )

                            return (
                                <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${r.is_active === false ? 'opacity-40 grayscale' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 text-base">{r.name}</div>
                                        <div className="text-slate-500 font-mono text-xs font-medium">{r.phone}</div>
                                    </td>

                                    <td className="px-6 py-4 space-y-2">
                                        <div className="flex gap-2">
                                            {r.role === 'staff'
                                                ? <span className="text-[10px] uppercase tracking-widest bg-purple-100 text-purple-700 font-black px-2.5 py-1 rounded-md shadow-sm">Staff</span>
                                                : <span className="text-[10px] uppercase tracking-widest bg-slate-100 text-slate-600 font-black px-2.5 py-1 rounded-md shadow-sm">Bochur</span>
                                            }
                                            {isDriver && (
                                                <span className="text-[10px] uppercase tracking-widest bg-blue-100 text-blue-700 font-black px-2.5 py-1 rounded-md shadow-sm relative pr-6">Driver <span className="absolute right-2 text-blue-400 border-l border-blue-200 pl-1 ml-1">{r.drivers[0].car_capacity}</span></span>
                                            )}
                                        </div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer w-fit hover:text-slate-800 transition">
                                            <input type="checkbox" checked={r.is_active !== false} onChange={() => toggleActive(r.id, r.is_active !== false)} className="rounded text-indigo-600" />
                                            Active Engine Status
                                        </label>
                                    </td>

                                    <td className="px-6 py-4">
                                        {isDriver ? (
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => toggleAudioType(driverId, audioType, isDriver ? (r.drivers[0].tts_name || '') : '')}
                                                    className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition w-fit ${audioType === 'tts' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}
                                                >
                                                    {audioType === 'tts' ? <><Volume2 size={14} /> Auto-TTS </> : <><Mic size={14} /> MP3 Upload</>}
                                                </button>

                                                {audioType === 'tts' && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {editingTts === driverId ? (
                                                            <>
                                                                <input autoFocus value={ttsValue} onChange={e => setTtsValue(e.target.value)} className="text-xs border rounded px-2 py-1 w-24" />
                                                                <button onClick={() => saveTtsName(driverId)} className="text-blue-600 hover:text-blue-800"><Save size={14} /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 rounded">"{r.drivers[0].tts_name || 'English Name'}"</span>
                                                                <button onClick={() => { setEditingTts(driverId); setTtsValue(r.drivers[0].tts_name || '') }} className="text-xs text-blue-500 underline">Edit Word</button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Not Applicable</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col gap-2 w-max ml-auto">
                                            <button onClick={() => startEditing(r)} className="px-3 py-1.5 flex items-center justify-center gap-2 text-indigo-600 font-bold bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition">
                                                <Edit2 size={14} /> Edit Identity
                                            </button>
                                            <button onClick={() => deleteUser(r.id)} className="px-3 py-1.5 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition">
                                                <Trash2 size={14} /> Terminate
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {riders.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center p-12 text-slate-500 font-medium">No users found in system matching search configuration.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
