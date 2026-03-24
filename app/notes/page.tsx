'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type Note = {
  id: string;
  title: string;
  content: string;
  author_email: string;
  created_at: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    fetchUserAndNotes();
  }, []);

  const fetchUserAndNotes = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setCurrentUserEmail(session?.user?.email || '');

    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setNotes(data);
    setIsLoading(false);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle) return;

    const noteData = {
      title: noteTitle,
      content: noteContent,
      author_email: currentUserEmail,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from('notes')
        .update(noteData)
        .eq('id', editingId)
        .select();
      if (data) setNotes(notes.map((n) => (n.id === editingId ? data[0] : n)));
    } else {
      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select();
      if (data) setNotes([data[0], ...notes]);
    }

    setEditingId(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Is this lore no longer relevant? (Delete note?)'))
      return;
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) setNotes(notes.filter((n) => n.id !== id));
  };

  // The Search Filter logic
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading)
    return (
      <div className="text-center text-[#d4af37] text-xl mt-10">
        Searching the party's scribblings...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-[#4b5e40] pb-4 gap-4">
        <h2 className="text-3xl font-bold text-[#d4af37]">
          Adventurer's Journal
        </h2>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a241b] border border-[#d4af37] rounded text-[#e8dcc4] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
          />
          <span className="absolute left-3 top-2.5 text-[#d4af37]">🔍</span>
        </div>
      </div>

      {/* The Notepad (Add/Edit Form) */}
      <div className="bg-[#1a241b] border border-[#d4af37] p-6 rounded-lg shadow-inner">
        <h3 className="text-[#e8dcc4] font-bold mb-4">
          {editingId ? '✍️ Update Note' : '🖋️ Scribble New Note'}
        </h3>
        <form onSubmit={handleSaveNote} className="space-y-3">
          <input
            type="text"
            placeholder="Title (e.g. Mystery of the Red Door)"
            required
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4]"
          />
          <textarea
            placeholder="Write your notes here... everyone in the party can see and edit these!"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] h-32"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-6 py-2 bg-[#d4af37] text-[#1a241b] font-bold rounded hover:bg-[#e8dcc4] transition-colors"
            >
              {editingId ? 'Update Note' : 'Pin to Board'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setNoteTitle('');
                  setNoteContent('');
                }}
                className="px-6 py-2 bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* The Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="bg-[#2c3e2d] border border-[#4b5e40] p-5 rounded shadow-lg flex flex-col hover:border-[#d4af37] transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-xl font-bold text-[#d4af37] leading-tight">
                {note.title}
              </h4>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEditing(note)}
                  title="Edit Note"
                  className="text-blue-400 hover:text-blue-300"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  title="Delete Note"
                  className="text-red-400 hover:text-red-300"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="text-[#e8dcc4] text-sm whitespace-pre-wrap flex-grow line-clamp-6 mb-4 italic">
              "{note.content}"
            </p>
            <div className="mt-auto pt-3 border-t border-[#4b5e40] text-[10px] uppercase tracking-widest text-[#a3b19b] flex justify-between">
              <span>By: {note.author_email.split('@')[0]}</span>
              <span>{new Date(note.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#a3b19b] italic">
            No notes match your search. Perhaps the knowledge is lost to time?
          </div>
        )}
      </div>
    </div>
  );
}
