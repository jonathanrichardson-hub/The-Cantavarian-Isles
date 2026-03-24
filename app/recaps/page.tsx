'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type Recap = {
  id: string;
  title: string;
  session_date: string;
  summary: string;
  is_published: boolean;
};

export default function RecapsPage() {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [isDM, setIsDM] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    checkUserAndFetchRecaps();
  }, []);

  const checkUserAndFetchRecaps = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const email = session?.user?.email;
    const dmEmails = process.env.NEXT_PUBLIC_DM_EMAILS?.split(',') || [];
    setIsDM(!!email && dmEmails.includes(email));

    // Fetch recaps, ordering by the session date (newest at the top)
    const { data } = await supabase
      .from('recaps')
      .select('*')
      .order('session_date', { ascending: false });

    if (data) setRecaps(data);
    setIsLoading(false);
  };

  const handleAddRecap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sessionDate) return;

    const { data, error } = await supabase
      .from('recaps')
      .insert([
        {
          title,
          session_date: sessionDate,
          summary,
          is_published: false, // Always starts as a hidden draft
        },
      ])
      .select();

    if (data) {
      // Sort the new list so the dates stay in the correct order
      const newRecaps = [...recaps, data[0]].sort(
        (a, b) =>
          new Date(b.session_date).getTime() -
          new Date(a.session_date).getTime()
      );
      setRecaps(newRecaps);
      setTitle('');
      setSessionDate('');
      setSummary('');
    }
  };

  const togglePublish = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('recaps')
      .update({ is_published: !currentValue })
      .eq('id', id);
    if (!error) {
      setRecaps(
        recaps.map((recap) =>
          recap.id === id ? { ...recap, is_published: !currentValue } : recap
        )
      );
    }
  };

  const handleDelete = async (id: string, recapTitle: string) => {
    if (
      !window.confirm(
        `Are you sure you want to burn the record of "${recapTitle}"?`
      )
    )
      return;
    const { error } = await supabase.from('recaps').delete().eq('id', id);
    if (!error) setRecaps(recaps.filter((recap) => recap.id !== id));
  };

  if (isLoading)
    return (
      <div className="text-center text-[#d4af37] text-xl mt-10">
        Dusting off the old tomes...
      </div>
    );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b-2 border-[#4b5e40] pb-2 mb-6">
        <h2 className="text-3xl font-bold text-[#d4af37]">The Chronicle</h2>
        <p className="text-[#a3b19b] mt-2">
          The official record of the party's deeds, as recorded by the Dungeon
          Master.
        </p>
      </div>

      {/* DM ONLY: Add New Recap */}
      {isDM && (
        <div className="bg-[#1a241b] border-2 border-[#d4af37] p-6 rounded-lg shadow-xl mb-8">
          <h3 className="text-xl font-bold text-[#e8dcc4] mb-4">
            Draft New Entry
          </h3>
          <form onSubmit={handleAddRecap} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Session Title (e.g. The Goblin Cave)"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4]"
              />
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] [color-scheme:dark]"
              />
            </div>
            <textarea
              placeholder="What happened? Keep it brief, or write a novel. It is your world."
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] h-32"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[#d4af37] text-[#1a241b] font-bold rounded hover:bg-[#e8dcc4] transition-colors"
            >
              Save Draft
            </button>
          </form>
        </div>
      )}

      {/* The Timeline of Recaps */}
      <div className="space-y-6">
        {recaps.map((recap) => {
          // If it's not published and the user isn't the DM, hide it completely
          if (!recap.is_published && !isDM) return null;

          return (
            <div
              key={recap.id}
              className={`p-6 rounded-lg border-l-4 shadow-md ${
                !recap.is_published
                  ? 'bg-[#1a241b] border-gray-600'
                  : 'bg-[#2c3e2d] border-[#d4af37]'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-[#d4af37]">
                    {recap.title}
                  </h3>
                  <p className="text-[#a3b19b] text-sm">
                    Session Date: {recap.session_date}
                  </p>
                </div>

                {/* DM Controls */}
                {isDM && (
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={() =>
                        togglePublish(recap.id, recap.is_published)
                      }
                      className={`text-xs px-3 py-1 rounded border transition-colors ${
                        recap.is_published
                          ? 'bg-green-900 border-green-500 text-green-200'
                          : 'bg-yellow-900 border-yellow-500 text-yellow-200'
                      }`}
                    >
                      {recap.is_published
                        ? '👁️ Published to Party'
                        : '📝 Hidden Draft'}
                    </button>
                    <button
                      onClick={() => handleDelete(recap.id, recap.title)}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-[#e8dcc4] whitespace-pre-wrap leading-relaxed">
                  {recap.summary}
                </p>
              </div>
            </div>
          );
        })}

        {recaps.length === 0 && (
          <p className="text-[#a3b19b] italic text-center mt-8">
            No chronicles have been penned yet.
          </p>
        )}
      </div>
    </div>
  );
}
