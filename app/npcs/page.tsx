'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type NPC = {
  id: string;
  name: string;
  info: string;
  stat_block: string;
  is_name_revealed: boolean;
  is_info_revealed: boolean;
  is_stats_revealed: boolean;
  created_at: string; // Added this so we can sort by encounter time!
};

export default function NPCsPage() {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [isDM, setIsDM] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // Our new sorting state

  const [newName, setNewName] = useState('');
  const [newInfo, setNewInfo] = useState('');
  const [newStats, setNewStats] = useState('');

  useEffect(() => {
    checkUserAndFetchNPCs();
  }, []);

  const checkUserAndFetchNPCs = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const email = session?.user?.email;
    const dmEmails = process.env.NEXT_PUBLIC_DM_EMAILS?.split(',') || [];
    setIsDM(!!email && dmEmails.includes(email));

    const { data, error } = await supabase
      .from('npcs')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setNpcs(data);
    setIsLoading(false);
  };

  const handleAddNPC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const { data, error } = await supabase
      .from('npcs')
      .insert([
        {
          name: newName,
          info: newInfo,
          stat_block: newStats,
          is_name_revealed: false,
          is_info_revealed: false,
          is_stats_revealed: false,
        },
      ])
      .select();

    if (data) {
      setNpcs([data[0], ...npcs]);
      setNewName('');
      setNewInfo('');
      setNewStats('');
    }
  };

  const toggleVisibility = async (
    id: string,
    field: string,
    currentValue: boolean
  ) => {
    const { error } = await supabase
      .from('npcs')
      .update({ [field]: !currentValue })
      .eq('id', id);

    if (!error) {
      setNpcs(
        npcs.map((npc) =>
          npc.id === id ? { ...npc, [field]: !currentValue } : npc
        )
      );
    }
  };

  // NEW: The Smite Function
  const handleDeleteNPC = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete ${name}?`
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from('npcs').delete().eq('id', id);

    if (!error) {
      setNpcs(npcs.filter((npc) => npc.id !== id));
    } else {
      alert('Failed to delete NPC. The magical ward held strong.');
    }
  };

  // NEW: The Sorting Logic
  const sortedNpcs = [...npcs].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'oldest') {
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
    // Default is 'newest'
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (isLoading)
    return (
      <div className="text-center text-[#d4af37] text-xl mt-10">
        Consulting the archives...
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-[#4b5e40] pb-2 mb-6">
        <h2 className="text-3xl font-bold text-[#d4af37]">Dramatis Personae</h2>

        {/* NEW: Sorting Dropdown */}
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <label
            htmlFor="sort"
            className="text-[#a3b19b] text-sm font-semibold uppercase tracking-wider"
          >
            Sort By:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#1a241b] text-[#e8dcc4] border border-[#4b5e40] rounded px-2 py-1 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="newest">Newest Added</option>
            <option value="oldest">Encounter Order (Oldest)</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {isDM && (
        <div className="bg-[#1a241b] border-2 border-[#d4af37] p-6 rounded-lg shadow-xl mb-8">
          <h3 className="text-xl font-bold text-[#e8dcc4] mb-4">
            DM Control: Forge New NPC
          </h3>
          <form onSubmit={handleAddNPC} className="space-y-4">
            <input
              type="text"
              placeholder="NPC Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] focus:outline-none focus:border-[#d4af37]"
              required
            />
            <textarea
              placeholder="Lore & Information"
              value={newInfo}
              onChange={(e) => setNewInfo(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] h-24 focus:outline-none focus:border-[#d4af37]"
            />
            <textarea
              placeholder="Stat Block (HP, AC, Attacks, etc.)"
              value={newStats}
              onChange={(e) => setNewStats(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] h-24 font-mono text-sm focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[#d4af37] text-[#1a241b] font-bold rounded hover:bg-[#e8dcc4] transition-colors shadow-md"
            >
              Add to World
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedNpcs.map((npc) => (
          <div
            key={npc.id}
            className="bg-[#2c3e2d] border border-[#4b5e40] p-6 rounded-lg shadow-lg relative flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-[#d4af37]">
                {npc.is_name_revealed || isDM
                  ? npc.name
                  : '??? (Unknown Figure)'}
              </h3>
              {isDM && (
                <button
                  onClick={() =>
                    toggleVisibility(
                      npc.id,
                      'is_name_revealed',
                      npc.is_name_revealed
                    )
                  }
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    npc.is_name_revealed
                      ? 'bg-green-900 border-green-500 text-green-200 hover:bg-green-800'
                      : 'bg-gray-800 border-gray-500 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {npc.is_name_revealed ? '👁️ Name' : '🙈 Name'}
                </button>
              )}
            </div>

            <div className="mb-4 flex-grow">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[#a3b19b] font-semibold text-sm uppercase tracking-wider">
                  Lore
                </span>
                {isDM && (
                  <button
                    onClick={() =>
                      toggleVisibility(
                        npc.id,
                        'is_info_revealed',
                        npc.is_info_revealed
                      )
                    }
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      npc.is_info_revealed
                        ? 'bg-green-900 border-green-500 text-green-200 hover:bg-green-800'
                        : 'bg-gray-800 border-gray-500 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {npc.is_info_revealed ? '👁️ Lore' : '🙈 Lore'}
                  </button>
                )}
              </div>
              <p className="text-[#e8dcc4] whitespace-pre-wrap bg-[#1a241b] p-3 rounded border border-[#4b5e40]">
                {npc.is_info_revealed || isDM
                  ? npc.info || 'No lore recorded.'
                  : 'You do not know much about this person yet.'}
              </p>
            </div>

            {(npc.is_stats_revealed || isDM) && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-red-400 font-semibold text-sm uppercase tracking-wider">
                    Combat Stats
                  </span>
                  {isDM && (
                    <button
                      onClick={() =>
                        toggleVisibility(
                          npc.id,
                          'is_stats_revealed',
                          npc.is_stats_revealed
                        )
                      }
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        npc.is_stats_revealed
                          ? 'bg-green-900 border-green-500 text-green-200 hover:bg-green-800'
                          : 'bg-gray-800 border-gray-500 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {npc.is_stats_revealed ? '👁️ Stats' : '🙈 Stats'}
                    </button>
                  )}
                </div>
                <pre className="text-red-200 whitespace-pre-wrap bg-black/50 p-3 rounded border border-red-900/50 font-mono text-sm overflow-x-auto">
                  {npc.stat_block || 'No combat stats recorded.'}
                </pre>
              </div>
            )}

            {/* NEW: The Smite Button (DM Only) */}
            {isDM && (
              <div className="mt-4 pt-4 border-t border-[#4b5e40] flex justify-end">
                <button
                  onClick={() => handleDeleteNPC(npc.id, npc.name)}
                  className="text-xs px-3 py-1 bg-red-900/50 border border-red-900 text-red-300 rounded hover:bg-red-800 hover:text-white transition-colors"
                >
                  Delete NPC
                </button>
              </div>
            )}
          </div>
        ))}

        {npcs.length === 0 && (
          <p className="text-[#a3b19b] italic col-span-full text-center mt-8">
            The realm is currently empty. No souls have been recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
