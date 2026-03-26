"use client";

import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';

type Recap = {
  id: string;
  title: string;
  summary: string;
  created_at: string;
};

export default function HomePage() {
  const [latestRecap, setLatestRecap] = useState<Recap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLatestRecap();
  }, []);

  const fetchLatestRecap = async () => {
    // This spell asks Supabase to sort recaps by newest first, and only hand us the top 1
    const { data, error } = await supabase
      .from('recaps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      setLatestRecap(data);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center space-y-8">
      
      {/* The Grand Entrance */}
      <div className="bg-[#1a241b]/80 border-2 border-[#d4af37] p-10 rounded-lg shadow-2xl shadow-black max-w-3xl w-full backdrop-blur-sm">
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#d4af37] mb-6 tracking-wider drop-shadow-md">
          The Cantavarian Isles
        </h1>
        
        <div className="w-32 h-1 bg-[#8b0000] mx-auto mb-8 rounded-full"></div>
        
        <p className="text-xl md:text-2xl text-[#e8dcc4] mb-8 leading-relaxed font-serif">
          Where the tides hold secrets, and the depths hunger for the weary. 
          Gather your party, check your inventory, and prepare for the journey ahead.
        </p>

        <p className="text-[#a3b19b] italic">
          "Death will one day claim us all, until then: we adventure."
        </p>
      </div>

      {/* The Town Crier (Latest Recap) */}
      <div className="bg-[#2c3e2d]/90 border border-[#4b5e40] p-6 rounded-lg shadow-xl max-w-3xl w-full text-left">
        <h2 className="text-2xl font-bold text-[#d4af37] border-b border-[#4b5e40] pb-2 mb-4">
          Latest from the Campaign...
        </h2>
        
        {isLoading ? (
          <p className="text-[#a3b19b] animate-pulse">Consulting the archives...</p>
        ) : latestRecap ? (
          <div>
            <h3 className="text-xl font-bold text-[#e8dcc4] mb-2">{latestRecap.title}</h3>
            <p className="text-[#a3b19b] text-sm mb-4">
              Recorded on {new Date(latestRecap.created_at).toLocaleDateString()}
            </p>
            {/* We use line-clamp to ensure a massive recap doesn't take over the whole home page */}
            <p className="text-[#e8dcc4] whitespace-pre-wrap line-clamp-4">
              {latestRecap.summary}
            </p>
          </div>
        ) : (
          <p className="text-[#a3b19b] italic">No tales have been recorded yet. The adventure begins soon...</p>
        )}
      </div>

    </div>
  );
}