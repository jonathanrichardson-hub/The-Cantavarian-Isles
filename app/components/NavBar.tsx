'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

export default function NavBar() {
  const [user, setUser] = useState<any>(null);
  const [isDM, setIsDM] = useState(false);

  useEffect(() => {
    // 1. We added ": any" here to satisfy the TypeScript rules lawyer
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      checkIfDM(session?.user?.email);
    });

    // 2. We added ": any" to _event and session here as well!
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      checkIfDM(session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkIfDM = (email?: string) => {
    if (!email) {
      setIsDM(false);
      return;
    }
    const dmEmails = process.env.NEXT_PUBLIC_DM_EMAILS?.split(',') || [];
    setIsDM(dmEmails.includes(email));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const tabs = [
    { name: 'Home', path: '/' },
    { name: 'PCs', path: '/pcs' },
    { name: 'NPCs', path: '/npcs' },
    { name: 'Maps', path: '/maps' },
    { name: 'Recap', path: '/recaps' },
    { name: 'Notes', path: '/notes' },
    { name: 'Inbox', path: '/inbox' }, // <-- The new Inbox tab has been added here!
    { name: 'Planning', path: '/planning', dmOnly: true },
    { name: 'Glossary', path: '/glossary' },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.dmOnly || isDM);

  return (
    <header className="bg-[#1a241b] border-b-2 border-[#d4af37] p-4 shadow-lg shadow-black/50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-[#d4af37] tracking-wider">
          The Cantavarian Isles
        </h1>

        <nav className="flex flex-wrap gap-2 md:gap-4 justify-center">
          {visibleTabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.path}
              className="px-3 py-1 rounded border border-[#4b5e40] bg-[#2c3e2d] hover:bg-[#4b5e40] hover:text-[#d4af37] hover:border-[#d4af37] transition-all text-sm md:text-base font-semibold shadow-md"
            >
              {tab.name}
            </Link>
          ))}
        </nav>

        <div>
          {user ? (
            <div className="flex items-center gap-4">
              {isDM && (
                <span className="text-red-400 text-sm font-bold tracking-widest uppercase">
                  DM Mode
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#2c3e2d] text-[#e8dcc4] border border-[#4b5e40] font-bold rounded hover:bg-[#4b5e40] hover:text-[#d4af37] transition-colors inline-block"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-[#d4af37] text-[#1a241b] font-bold rounded hover:bg-[#e8dcc4] transition-colors inline-block"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}