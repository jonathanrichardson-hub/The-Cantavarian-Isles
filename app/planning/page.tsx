'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type PlanEntry = {
  id: string;
  title: string;
  content: string;
  category: string;
};

export default function PlanningPage() {
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDM, setIsDM] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Plot Hook');

  useEffect(() => {
    checkDMAndFetchPlans();
  }, []);

  const checkDMAndFetchPlans = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const email = session?.user?.email;
    const dmEmails = process.env.NEXT_PUBLIC_DM_EMAILS?.split(',') || [];

    const userIsDM = !!email && dmEmails.includes(email);
    setIsDM(userIsDM);

    if (userIsDM) {
      const { data } = await supabase
        .from('planning')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setPlans(data);
    }
    setIsLoading(false);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const planData = { title, content, category };

    if (editingId) {
      const { data, error } = await supabase
        .from('planning')
        .update(planData)
        .eq('id', editingId)
        .select();
      if (data) setPlans(plans.map((p) => (p.id === editingId ? data[0] : p)));
    } else {
      const { data, error } = await supabase
        .from('planning')
        .insert([planData])
        .select();
      if (data) setPlans([data[0], ...plans]);
    }

    resetForm();
  };

  const startEditing = (plan: PlanEntry) => {
    setEditingId(plan.id);
    setTitle(plan.title);
    setContent(plan.content);
    setCategory(plan.category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Scrap this devious plan?')) return;
    const { error } = await supabase.from('planning').delete().eq('id', id);
    if (!error) setPlans(plans.filter((p) => p.id !== id));
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('Plot Hook');
  };

  // The Search Filter logic
  const filteredPlans = plans.filter(
    (plan) =>
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading)
    return (
      <div className="text-center text-[#d4af37] text-xl mt-10">
        Checking behind the DM screen...
      </div>
    );

  // The Ultimate Bouncer: If they aren't the DM, they get a blank wall.
  if (!isDM) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <span className="text-6xl">🛑</span>
        <h2 className="text-3xl font-bold text-red-500">The DM's Screen</h2>
        <p className="text-[#a3b19b] italic">
          You try to peek behind the cardboard screen, but a sudden gust of wind
          blows sand in your eyes. (Access Denied)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-purple-900 pb-4 gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-purple-400">
            The DM's Sanctum
          </h2>
          <p className="text-[#a3b19b] mt-1">
            Private workspace for long-term campaign plotting.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-end">
          <div className="text-purple-400 text-sm border border-purple-900 bg-purple-900/20 px-3 py-1 rounded hidden md:block mb-1 md:mb-0">
            👁️ DM Eyes Only
          </div>
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search your schemes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a241b] border border-purple-900/50 rounded text-[#e8dcc4] focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <span className="absolute left-3 top-2.5 text-purple-400 opacity-70">
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* The Plotting Board (Form) */}
      <div className="bg-[#1a241b] border-2 border-purple-900 p-6 rounded-lg shadow-xl mb-8">
        <h3 className="text-xl font-bold text-[#e8dcc4] mb-4">
          {editingId ? 'Modify Scheme' : 'Draft New Scheme'}
        </h3>
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Idea Title (e.g. The King's Betrayal)"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-purple-900/50 rounded text-[#e8dcc4] focus:ring-1 focus:ring-purple-500 outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-purple-900/50 rounded text-[#e8dcc4] focus:ring-1 focus:ring-purple-500 outline-none"
            >
              <option value="Plot Hook">Plot Hook</option>
              <option value="Encounter">Combat / Encounter</option>
              <option value="Secret Lore">Secret Lore</option>
              <option value="NPC Idea">NPC Idea</option>
              <option value="Loot">Planned Loot</option>
            </select>
          </div>
          <textarea
            placeholder="Write out your sinister plans here..."
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2 bg-[#2c3e2d] border border-purple-900/50 rounded text-[#e8dcc4] h-32 focus:ring-1 focus:ring-purple-500 outline-none"
          />
          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-purple-800 text-white font-bold rounded hover:bg-purple-700 transition-colors"
            >
              {editingId ? 'Update Master Plan' : 'Save Note to Sanctum'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-transparent border border-gray-600 text-gray-400 rounded hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* The Vault of Ideas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-[#2c3e2d] border border-purple-900/50 p-5 rounded shadow-lg flex flex-col hover:border-purple-500 transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-xl font-bold text-purple-300 leading-tight">
                  {plan.title}
                </h4>
                <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold text-purple-200 opacity-70">
                  {plan.category}
                </span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEditing(plan)}
                  title="Edit Note"
                  className="text-blue-400 hover:text-blue-300"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  title="Delete Note"
                  className="text-red-400 hover:text-red-300"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="text-[#e8dcc4] text-sm whitespace-pre-wrap flex-grow mt-2">
              {plan.content}
            </p>
          </div>
        ))}

        {filteredPlans.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#a3b19b] italic">
            {searchQuery
              ? 'No schemes match your search.'
              : 'The plotting board is currently empty.'}
          </div>
        )}
      </div>
    </div>
  );
}
