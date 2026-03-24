'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type PC = {
  id: string;
  name: string;
  player_email: string;
  public_backstory: string;
  secret_backstory: string;
  inventory: string;
  image_url: string;
  created_at: string;
};

export default function PCsPage() {
  const [pcs, setPcs] = useState<PC[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [isDM, setIsDM] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [publicBackstory, setPublicBackstory] = useState('');
  const [secretBackstory, setSecretBackstory] = useState('');
  const [inventory, setInventory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkUserAndFetchPCs();
  }, []);

  const checkUserAndFetchPCs = async () => {
    setIsLoading(true);

    // 1. Identify the User
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const email = session?.user?.email || '';
    setCurrentUserEmail(email);

    const dmEmails = process.env.NEXT_PUBLIC_DM_EMAILS?.split(',') || [];
    setIsDM(!!email && dmEmails.includes(email));

    // 2. Fetch the Party
    const { data } = await supabase
      .from('pcs')
      .select('*')
      .order('created_at', { ascending: true });

    if (data) setPcs(data);
    setIsLoading(false);
  };

  // The Magic Image Uploader
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Toss the image into the bag of holding
      const { error: uploadError } = await supabase.storage
        .from('character-art')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the magical link to the image
      const { data } = supabase.storage
        .from('character-art')
        .getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Save or Update a Character
  const handleSavePC = async (e: React.FormEvent) => {
    e.preventDefault();

    const pcData = {
      name,
      player_email: playerEmail.toLowerCase().trim(),
      public_backstory: publicBackstory,
      secret_backstory: secretBackstory,
      inventory,
      image_url: imageUrl,
    };

    if (editingId) {
      // Update existing
      const { data, error } = await supabase
        .from('pcs')
        .update(pcData)
        .eq('id', editingId)
        .select();
      if (data) setPcs(pcs.map((pc) => (pc.id === editingId ? data[0] : pc)));
    } else {
      // Create new
      const { data, error } = await supabase
        .from('pcs')
        .insert([pcData])
        .select();
      if (data) setPcs([...pcs, data[0]]);
    }

    resetForm();
  };

  const handleEdit = (pc: PC) => {
    setEditingId(pc.id);
    setName(pc.name);
    setPlayerEmail(pc.player_email);
    setPublicBackstory(pc.public_backstory || '');
    setSecretBackstory(pc.secret_backstory || '');
    setInventory(pc.inventory || '');
    setImageUrl(pc.image_url || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, pcName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${pcName}? This cannot be undone.`
      )
    )
      return;
    const { error } = await supabase.from('pcs').delete().eq('id', id);
    if (!error) setPcs(pcs.filter((pc) => pc.id !== id));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setPlayerEmail(isDM ? '' : currentUserEmail); // Default to their own email if player
    setPublicBackstory('');
    setSecretBackstory('');
    setInventory('');
    setImageUrl('');
  };

  if (isLoading)
    return (
      <div className="text-center text-[#d4af37] text-xl mt-10">
        Gathering the party...
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b-2 border-[#4b5e40] pb-2 mb-6">
        <h2 className="text-3xl font-bold text-[#d4af37]">The Heroes</h2>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-[#4b5e40] text-[#e8dcc4] font-bold rounded hover:bg-[#d4af37] hover:text-[#1a241b] transition-colors"
          >
            + Register Character
          </button>
        )}
      </div>

      {/* The Character Forge (Form) */}
      {showForm && (
        <div className="bg-[#1a241b] border-2 border-[#d4af37] p-6 rounded-lg shadow-xl mb-8">
          <h3 className="text-xl font-bold text-[#e8dcc4] mb-4">
            {editingId ? 'Edit Character Sheet' : 'Forge New Character'}
          </h3>
          <form onSubmit={handleSavePC} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Character Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4]"
              />
              <input
                type="email"
                placeholder="Player Email (Important for access!)"
                required
                value={playerEmail}
                onChange={(e) => setPlayerEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4]"
              />
            </div>

            {/* Image Upload Area */}
            <div className="p-4 border border-dashed border-[#4b5e40] rounded bg-[#2c3e2d]/50">
              <label className="block text-[#a3b19b] text-sm font-semibold mb-2">
                Character Portrait Upload
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="text-[#e8dcc4] text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#4b5e40] file:text-[#e8dcc4] hover:file:bg-[#d4af37] hover:file:text-[#1a241b]"
              />
              {uploading && (
                <span className="ml-4 text-[#d4af37]">Uploading...</span>
              )}
              {imageUrl && (
                <p className="text-green-400 text-sm mt-2">
                  ✓ Image uploaded successfully!
                </p>
              )}
            </div>

            <textarea
              placeholder="Public Backstory (Everyone sees this)"
              required
              value={publicBackstory}
              onChange={(e) => setPublicBackstory(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] h-24"
            />

            <div className="border-l-4 border-red-900 pl-4 py-2">
              <p className="text-red-400 text-sm font-bold uppercase mb-2">
                Private DM Notes & Secrets (Only Player & DM can see)
              </p>
              <textarea
                placeholder="Secret Backstory, Hidden Agendas, etc."
                value={secretBackstory}
                onChange={(e) => setSecretBackstory(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] h-24 mb-4"
              />
              <textarea
                placeholder="Inventory & Gold (Keep your loot safe)"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] h-24"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#d4af37] text-[#1a241b] font-bold rounded hover:bg-[#e8dcc4] transition-colors"
              >
                {editingId ? 'Save Changes' : 'Add to Party'}
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

      {/* The Party Roster */}
      <div className="grid grid-cols-1 gap-8">
        {pcs.map((pc) => {
          // THE MAGIC BOUNCER: Are you the DM or the specific player?
          const hasSecretAccess = isDM || currentUserEmail === pc.player_email;

          return (
            <div
              key={pc.id}
              className="bg-[#2c3e2d] border border-[#4b5e40] p-6 rounded-lg shadow-lg flex flex-col md:flex-row gap-6"
            >
              {/* Left Column: Portrait */}
              <div className="w-full md:w-1/3 flex flex-col items-center shrink-0">
                <div className="w-48 h-48 bg-[#1a241b] border-2 border-[#d4af37] rounded-full overflow-hidden flex items-center justify-center mb-4">
                  {pc.image_url ? (
                    <img
                      src={pc.image_url}
                      alt={pc.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#a3b19b] text-sm">No Image</span>
                  )}
                </div>
                <h3 className="text-3xl font-bold text-[#d4af37] text-center mb-1">
                  {pc.name}
                </h3>
                <p className="text-[#a3b19b] text-sm text-center">
                  Played by: {pc.player_email}
                </p>

                {/* Controls (Only visible to owner or DM) */}
                {hasSecretAccess && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(pc)}
                      className="text-xs px-3 py-1 bg-blue-900/50 border border-blue-900 text-blue-300 rounded hover:bg-blue-800 hover:text-white transition-colors"
                    >
                      Edit Sheet
                    </button>
                    {isDM && (
                      <button
                        onClick={() => handleDelete(pc.id, pc.name)}
                        className="text-xs px-3 py-1 bg-red-900/50 border border-red-900 text-red-300 rounded hover:bg-red-800 hover:text-white transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Lore & Stats */}
              <div className="w-full md:w-2/3 space-y-4">
                <div>
                  <h4 className="text-[#a3b19b] font-semibold text-sm uppercase tracking-wider mb-1">
                    Public Legend
                  </h4>
                  <p className="text-[#e8dcc4] whitespace-pre-wrap bg-[#1a241b] p-4 rounded border border-[#4b5e40]">
                    {pc.public_backstory}
                  </p>
                </div>

                {/* SECRET SECTIONS - Rendered ONLY if the magical bouncer allows it */}
                {hasSecretAccess ? (
                  <>
                    <div className="border-l-2 border-red-900 pl-4 py-2 mt-4">
                      <h4 className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span>👁️</span> Secret Backstory
                      </h4>
                      <p className="text-[#e8dcc4] whitespace-pre-wrap bg-[#1a241b] p-4 rounded border border-red-900/30">
                        {pc.secret_backstory || 'No secrets recorded... yet.'}
                      </p>
                    </div>
                    <div className="border-l-2 border-[#d4af37] pl-4 py-2">
                      <h4 className="text-[#d4af37] font-semibold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span>🎒</span> Inventory & Wealth
                      </h4>
                      <p className="text-[#e8dcc4] whitespace-pre-wrap bg-[#1a241b] p-4 rounded border border-[#d4af37]/30">
                        {pc.inventory || 'Pockets are empty.'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="mt-6 p-4 border border-dashed border-[#4b5e40] rounded text-center">
                    <p className="text-[#a3b19b] italic text-sm">
                      🔒 Secrets and Inventory are hidden from prying eyes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {pcs.length === 0 && (
          <p className="text-[#a3b19b] italic text-center mt-8">
            The tavern is empty. No heroes have gathered yet.
          </p>
        )}
      </div>
    </div>
  );
}
