'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type GlossaryEntry = {
  id: string;
  term: string;
  definition: string;
  category: string;
};

export default function GlossaryPage() {
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [category, setCategory] = useState('Person');

  useEffect(() => {
    fetchGlossary();
  }, []);

  const fetchGlossary = async () => {
    setIsLoading(true);
    // Notice the order magic here: it automatically sorts alphabetically A-Z!
    const { data } = await supabase
      .from('glossary')
      .select('*')
      .order('term', { ascending: true });

    if (data) setEntries(data);
    setIsLoading(false);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term || !definition) return;

    const entryData = { term, definition, category };

    if (editingId) {
      const { data, error } = await supabase
        .from('glossary')
        .update(entryData)
        .eq('id', editingId)
        .select();
      if (data) {
        // Update and re-sort alphabetically
        const updatedList = entries.map((entry) =>
          entry.id === editingId ? data[0] : entry
        );
        setEntries(updatedList.sort((a, b) => a.term.localeCompare(b.term)));
      }
    } else {
      const { data, error } = await supabase
        .from('glossary')
        .insert([entryData])
        .select();
      if (data) {
        // Add and re-sort alphabetically
        const updatedList = [...entries, data[0]];
        setEntries(updatedList.sort((a, b) => a.term.localeCompare(b.term)));
      }
    }

    resetForm();
  };

  const startEditing = (entry: GlossaryEntry) => {
    setEditingId(entry.id);
    setTerm(entry.term);
    setDefinition(entry.definition);
    setCategory(entry.category);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, termName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to strike "${termName}" from the records?`
      )
    )
      return;
    const { error } = await supabase.from('glossary').delete().eq('id', id);
    if (!error) setEntries(entries.filter((e) => e.id !== id));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTerm('');
    setDefinition('');
    setCategory('Person');
  };

  // The Search Filter logic
  const filteredEntries = entries.filter(
    (entry) =>
      entry.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function for category colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Person':
        return 'bg-blue-900/50 border-blue-500 text-blue-200';
      case 'Location':
        return 'bg-emerald-900/50 border-emerald-500 text-emerald-200';
      case 'Item':
        return 'bg-purple-900/50 border-purple-500 text-purple-200';
      default:
        return 'bg-gray-800 border-gray-500 text-gray-200';
    }
  };

  if (isLoading)
    return (
      <div className="text-center text-[#d4af37] text-xl mt-10">
        Consulting the index...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-[#4b5e40] pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#d4af37]">
            The Grand Glossary
          </h2>
          <p className="text-[#a3b19b] mt-1 text-sm">
            A collaborative encyclopedia of People, Places, and Things.
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto flex-col md:flex-row">
          {/* Search Bar */}
          <div className="relative flex-grow md:w-64">
            <input
              type="text"
              placeholder="Search the index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a241b] border border-[#d4af37] rounded text-[#e8dcc4] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
            />
            <span className="absolute left-3 top-2.5 text-[#d4af37]">🔍</span>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#4b5e40] text-[#e8dcc4] font-bold rounded hover:bg-[#d4af37] hover:text-[#1a241b] whitespace-nowrap transition-colors w-full md:w-auto"
            >
              + Add Term
            </button>
          )}
        </div>
      </div>

      {/* The Scribe's Desk (Form) */}
      {showForm && (
        <div className="bg-[#1a241b] border-2 border-[#d4af37] p-6 rounded-lg shadow-xl">
          <h3 className="text-xl font-bold text-[#e8dcc4] mb-4">
            {editingId ? 'Edit Term' : 'Define New Term'}
          </h3>
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Term (e.g., The Prancing Pony)"
                required
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4]"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4]"
              >
                <option value="Person">Person / Faction</option>
                <option value="Location">Location</option>
                <option value="Item">Notable Item</option>
              </select>
            </div>
            <textarea
              placeholder="Definition / Notes..."
              required
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] h-24"
            />
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#d4af37] text-[#1a241b] font-bold rounded hover:bg-[#e8dcc4] transition-colors"
              >
                {editingId ? 'Update Record' : 'Add to Index'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-transparent border border-[#4b5e40] text-[#a3b19b] rounded hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* The Index (List) */}
      <div className="bg-[#1a241b]/50 rounded-lg border border-[#4b5e40] overflow-hidden">
        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className="group border-b last:border-0 border-[#4b5e40] p-4 hover:bg-[#2c3e2d] transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center"
          >
            {/* Term and Category */}
            <div className="md:w-1/4 shrink-0">
              <h3 className="text-xl font-bold text-[#d4af37]">{entry.term}</h3>
              <span
                className={`inline-block mt-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getCategoryColor(
                  entry.category
                )}`}
              >
                {entry.category}
              </span>
            </div>

            {/* Definition */}
            <div className="md:w-2/4 flex-grow text-[#e8dcc4] text-sm whitespace-pre-wrap">
              {entry.definition}
            </div>

            {/* Controls */}
            <div className="md:w-1/4 flex justify-end gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity w-full">
              <button
                onClick={() => startEditing(entry)}
                className="text-xs px-3 py-1 bg-[#4b5e40] text-white rounded hover:bg-[#d4af37] hover:text-[#1a241b] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(entry.id, entry.term)}
                className="text-xs px-3 py-1 border border-red-900 text-red-400 rounded hover:bg-red-900 hover:text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="p-8 text-center text-[#a3b19b] italic">
            No terms found. The pages are blank.
          </div>
        )}
      </div>
    </div>
  );
}
