'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, Upload, PlayCircle, Trash2, RefreshCcw } from 'lucide-react'

type PromptDef = { filename: string, label: string, script?: string }

export default function PromptsManager({ expectedPrompts, initialBucketFiles }: { expectedPrompts: PromptDef[], initialBucketFiles: string[] }) {
    const supabase = createClient()
    const [bucketFiles, setBucketFiles] = useState<string[]>(initialBucketFiles)
    const [uploadingTarget, setUploadingTarget] = useState<string | null>(null)
    const [isBulkUploading, setIsBulkUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const bulkInputRef = useRef<HTMLInputElement>(null)

    async function fetchBucketState() {
        const { data } = await supabase.storage.from('prompts').list()
        if (data) {
            setBucketFiles(data.map(f => f.name))
        }
    }

    // Handle specific file upload
    async function completeUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0 || !uploadingTarget) return
        const file = e.target.files[0]

        // Force the file to upload strictly under the uploadingTarget filename!
        await supabase.storage.from('prompts').upload(uploadingTarget, file, {
            cacheControl: '0',
            upsert: true
        })

        setUploadingTarget(null)
        fetchBucketState()
    }

    function triggerUploadFor(filename: string) {
        setUploadingTarget(filename)
        // Delay slightly so state updates before clicking
        setTimeout(() => fileInputRef.current?.click(), 10)
    }

    async function deletePrompt(filename: string) {
        if (confirm(`Delete ${filename}? It will revert to Text-to-Speech fallback.`)) {
            await supabase.storage.from('prompts').remove([filename]);
            fetchBucketState();
        }
    }

    async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return
        setIsBulkUploading(true)

        const files = Array.from(e.target.files)
        for (const file of files) {
            let finalName = file.name;
            // Clean accidental double extensions if they occurred during terminal processing
            if (finalName.endsWith('.mp3.mp3')) finalName = finalName.replace('.mp3.mp3', '.mp3');
            if (finalName.endsWith('.wav.mp3')) finalName = finalName.replace('.wav.mp3', '.mp3');

            // Find if this file belongs to the dashboard slots
            const match = expectedPrompts.find(p => p.filename === finalName)
            if (match) {
                await supabase.storage.from('prompts').upload(finalName, file, {
                    cacheControl: '0',
                    upsert: true
                })
            }
        }

        setIsBulkUploading(false)
        if (bulkInputRef.current) bulkInputRef.current.value = '';
        fetchBucketState()
    }

    const getAudioUrl = (filename: string) => {
        // Adding a timestamp query bypasses the browser cache so you hear the latest upload immediately!
        return supabase.storage.from('prompts').getPublicUrl(filename).data.publicUrl + '?t=' + Date.now()
    }

    return (
        <div className="p-8 max-w-6xl">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Voice Prompt Checklist</h1>
                    <p className="text-gray-500 mt-1">Upload an MP3 for each required system prompt. The system automatically handles renaming the file for you.</p>
                </div>
                <div className="flex gap-3">
                    <input type="file" multiple accept="audio/*" ref={bulkInputRef} className="hidden" onChange={handleBulkUpload} />
                    <button onClick={() => bulkInputRef.current?.click()} disabled={isBulkUploading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex gap-2 items-center">
                        <Upload size={16} /> {isBulkUploading ? 'Uploading Folder...' : 'Bulk Upload Folder'}
                    </button>
                    <button onClick={fetchBucketState} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex gap-2 items-center">
                        <RefreshCcw size={16} /> Refresh List
                    </button>
                </div>
            </div>

            {/* Hidden file input used for the specific row uploads */}
            <input
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                className="hidden"
                onChange={completeUpload}
            />

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-slate-500">Status</th>
                            <th className="px-6 py-3 font-semibold text-slate-500">Prompt Purpose</th>
                            <th className="px-6 py-3 font-semibold text-slate-500">Required System Name</th>
                            <th className="px-6 py-3 font-semibold text-slate-500">Audio Playback</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                        {expectedPrompts.map(prompt => {
                            const isUploaded = bucketFiles.includes(prompt.filename);
                            const isCurrentlyUploading = uploadingTarget === prompt.filename;

                            return (
                                <tr key={prompt.filename} className={`hover:bg-slate-50 transition ${!isUploaded ? 'bg-red-50/20' : ''}`}>
                                    <td className="px-6 py-4">
                                        {isUploaded ? (
                                            <span className="flex items-center gap-2 text-emerald-600 font-medium">
                                                <CheckCircle2 size={18} /> Ready
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-red-500 font-medium">
                                                <XCircle size={18} /> Missing
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{prompt.label}</div>
                                        {prompt.script && (
                                            <div className="text-sm text-slate-500 mt-1" dir="rtl">{prompt.script}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-400 bg-slate-100 rounded px-2 w-max inline-flex mt-3 shadow-none">
                                        {prompt.filename}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isUploaded && (
                                            <audio controls className="h-8 w-48" src={getAudioUrl(prompt.filename)} />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isCurrentlyUploading ? (
                                            <span className="text-blue-500 text-xs font-semibold animate-pulse">Uploading...</span>
                                        ) : (
                                            <div className="flex justify-end gap-3 items-center">
                                                <button
                                                    onClick={() => triggerUploadFor(prompt.filename)}
                                                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded border transition
                                  ${isUploaded ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'}`}
                                                >
                                                    {isUploaded ? 'Replace' : <><Upload size={14} /> Upload</>}
                                                </button>

                                                {isUploaded && (
                                                    <button onClick={() => deletePrompt(prompt.filename)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
