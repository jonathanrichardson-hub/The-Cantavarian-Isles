'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from './utils/supabase';

export default function HomePage() {
  const [latestRecap, setLatestRecap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLatestRecap();
  }, []);

  const fetchLatestRecap = async () => {
    setIsLoading(true);
    // Fetch only the single most recent PUBLISHED recap
    const { data } = await supabase
      .from('recaps')
      .select('*')
      .eq('is_published', true)
      .order('session_date', { ascending: false })
      .limit(1)
      .single();

    if (data) setLatestRecap(data);
    setIsLoading(false);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12 border-b-2 border-[#4b5e40]">
        <h1 className="text-5xl md:text-7xl font-extrabold text-[#d4af37] tracking-widest uppercase drop-shadow-lg">
          The Cantavarian Isles
        </h1>
        <p className="text-xl text-[#a3b19b] italic max-w-2xl mx-auto">
          "Where the tides hold secrets, and every map edge hides a monster."
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Links */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-2xl font-bold text-[#e8dcc4] border-b border-[#4b5e40] pb-2">
            Explore the Realm
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Link
              href="/pcs"
              className="p-4 bg-[#1a241b] border border-[#4b5e40] rounded-lg hover:border-[#d4af37] hover:bg-[#2c3e2d] transition-all group flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-[#d4af37]">The Party</h3>
                <p className="text-sm text-[#a3b19b]">View the heroes</p>
              </div>
              <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                ⚔️
              </span>
            </Link>

            <Link
              href="/maps"
              className="p-4 bg-[#1a241b] border border-[#4b5e40] rounded-lg hover:border-[#d4af37] hover:bg-[#2c3e2d] transition-all group flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-[#d4af37]">
                  Cartography
                </h3>
                <p className="text-sm text-[#a3b19b]">View the world maps</p>
              </div>
              <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                🗺️
              </span>
            </Link>

            <Link
              href="/glossary"
              className="p-4 bg-[#1a241b] border border-[#4b5e40] rounded-lg hover:border-[#d4af37] hover:bg-[#2c3e2d] transition-all group flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-[#d4af37]">
                  Grand Glossary
                </h3>
                <p className="text-sm text-[#a3b19b]">Search items and lore</p>
              </div>
              <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                📖
              </span>
            </Link>
          </div>
        </div>

        {/* Right Column: Last Time On... */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-[#e8dcc4] border-b border-[#4b5e40] pb-2">
            Last Time On...
          </h2>

          <div className="bg-[#1a241b] border-2 border-[#d4af37] rounded-lg p-6 shadow-2xl relative overflow-hidden">
            {/* A subtle watermark icon in the background */}
            <div className="absolute -bottom-10 -right-10 text-[150px] opacity-5 select-none pointer-events-none">
              🐉
            </div>

            {isLoading ? (
              <p className="text-[#a3b19b] italic text-center py-8">
                Consulting the archives...
              </p>
            ) : latestRecap ? (
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-[#d4af37]">
                    {latestRecap.title}
                  </h3>
                  <span className="text-sm text-[#a3b19b] bg-black/40 px-2 py-1 rounded border border-[#4b5e40]">
                    {latestRecap.session_date}
                  </span>
                </div>
                <p className="text-[#e8dcc4] whitespace-pre-wrap leading-relaxed line-clamp-6">
                  {latestRecap.summary}
                </p>
                <div className="mt-6 pt-4 border-t border-[#4b5e40]/50 text-right">
                  <Link
                    href="/recaps"
                    className="text-[#d4af37] hover:text-[#e8dcc4] text-sm font-bold uppercase tracking-wider transition-colors"
                  >
                    Read Full Chronicles →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 relative z-10">
                <p className="text-[#a3b19b] italic mb-2">
                  The campaign has just begun, and the ink is not yet dry.
                </p>
                <p className="text-sm text-gray-500">
                  (The DM has not published any recaps yet!)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
