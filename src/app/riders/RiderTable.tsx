'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Trash2, Mic, Volume2, Save } from 'lucide-react'

export default function RiderTable({ initialRiders }: { initialRiders: any[] }) {
    const supabase = createClient()
    const [riders, setRiders] = useState(initialRiders)
    const [editingTts, setEditingTts] = useState<string | null>(null)
    const [ttsValue, setTtsValue] = useState('')

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
        if (!confirm('Are you certain you want to permanently delete this user?')) return
        setRiders(prev => prev.filter(r => r.id !== id))
        await supabase.from('riders').delete().eq('id', id)
    }

    return (
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden h-fit overflow-y-auto max-h-[80vh]">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role / Status</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Audio Type</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y text-sm">
                    {riders.map(r => {
                        const isDriver = r.drivers && r.drivers.length > 0
                        const driverId = isDriver ? r.drivers[0].id : null
                        const audioType = isDriver ? (r.drivers[0].audio_type || 'mp3') : null

                        return (
                            <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.is_active === false ? 'opacity-50 grayscale' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900 text-base">{r.name}</div>
                                    <div className="text-gray-500 font-mono text-xs">{r.phone}</div>
                                </td>

                                <td className="px-6 py-4 space-y-2">
                                    <div className="flex gap-2">
                                        {r.role === 'staff'
                                            ? <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-1 rounded">Staff</span>
                                            : <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded">Bochur</span>
                                        }
                                        {isDriver && (
                                            <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-1 rounded">Driver</span>
                                        )}
                                    </div>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                                        <input type="checkbox" checked={r.is_active !== false} onChange={() => toggleActive(r.id, r.is_active !== false)} className="rounded text-blue-600" />
                                        Active Account
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
                                    <button onClick={() => deleteUser(r.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                    {riders.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center p-8 text-gray-500">No users found in system.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
