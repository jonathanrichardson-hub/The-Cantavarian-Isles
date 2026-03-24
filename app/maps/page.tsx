'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type MapEntry = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  is_published: boolean;
};

export default function MapsPage() {
  const [maps, setMaps] = useState<MapEntry[]>([]);
  const [isDM, setIsDM] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('World');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    checkUserAndFetchMaps();
  }, []);

  const checkUserAndFetchMaps = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const email = session?.user?.email;
    const dmEmails = process.env.NEXT_PUBLIC_DM_EMAILS?.split(',') || [];
    setIsDM(!!email && dmEmails.includes(email));

    const { data } = await supabase
      .from('maps')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMaps(data);
    setIsLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `maps/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('character-art')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('character-art')
        .getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
    } catch (error: any) {
      alert('Cartography error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !title) return;

    const { data, error } = await supabase
      .from('maps')
      .insert([
        {
          title,
          description,
          category,
          image_url: imageUrl,
          is_published: false,
        },
      ])
      .select();

    if (data) {
      setMaps([data[0], ...maps]);
      setTitle('');
      setDescription('');
      setImageUrl('');
    }
  };

  // The Fog of War Toggle
  const togglePublish = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('maps')
      .update({ is_published: !currentValue })
      .eq('id', id);
    if (!error) {
      setMaps(
        maps.map((m) =>
          m.id === id ? { ...m, is_published: !currentValue } : m
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Burn this map forever?')) return;
    const { error } = await supabase.from('maps').delete().eq('id', id);
    if (!error) setMaps(maps.filter((m) => m.id !== id));
  };

  if (isLoading)
    return (
      <div className="text-center text-[#d4af37] text-xl mt-10">
        Unrolling the parchments...
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-[#4b5e40] pb-2 mb-6">
        <h2 className="text-3xl font-bold text-[#d4af37]">
          Cartographer's Vault
        </h2>
        <p className="text-[#a3b19b] mt-1">
          Geography of the Cantavarian Isles.
        </p>
      </div>

      {isDM && (
        <div className="bg-[#1a241b] border-2 border-[#d4af37] p-6 rounded-lg shadow-xl mb-8">
          <h3 className="text-xl font-bold text-[#e8dcc4] mb-4">
            Add New Map (Starts Hidden)
          </h3>
          <form onSubmit={handleAddMap} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Map Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4]"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4]"
              >
                <option value="World">World Map</option>
                <option value="Region">Regional Map</option>
                <option value="City">City/Town</option>
                <option value="Dungeon">Dungeon/Battlemap</option>
              </select>
            </div>
            <textarea
              placeholder="Brief description or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] h-20"
            />
            <div className="p-4 border border-dashed border-[#4b5e40] rounded bg-[#2c3e2d]/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="text-sm text-[#e8dcc4]"
              />
              {uploading && (
                <span className="ml-4 text-[#d4af37]">
                  Uploading parchment...
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!imageUrl}
              className="px-6 py-2 bg-[#d4af37] text-[#1a241b] font-bold rounded hover:bg-[#e8dcc4] disabled:opacity-50"
            >
              Upload Map to Vault
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {maps.map((map) => {
          // The Magical Bouncer: If it's hidden and you aren't the DM, it doesn't render at all.
          if (!map.is_published && !isDM) return null;

          return (
            <div
              key={map.id}
              className={`group bg-[#1a241b] border rounded-lg overflow-hidden flex flex-col shadow-lg transition-all ${
                !map.is_published
                  ? 'border-gray-600 opacity-80'
                  : 'border-[#4b5e40] hover:border-[#d4af37]'
              }`}
            >
              <div className="relative aspect-video overflow-hidden bg-black">
                <img
                  src={map.image_url}
                  alt={map.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    map.is_published
                      ? 'group-hover:scale-105 cursor-zoom-in'
                      : 'grayscale cursor-not-allowed'
                  }`}
                  onClick={() =>
                    map.is_published || isDM
                      ? window.open(map.image_url, '_blank')
                      : null
                  }
                />

                {/* Labels floating on the image */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                  <div className="bg-black/70 text-[#d4af37] text-[10px] font-bold px-2 py-1 rounded border border-[#d4af37]/50 uppercase">
                    {map.category}
                  </div>
                  {!map.is_published && (
                    <div className="bg-red-900/90 text-red-200 text-[10px] font-bold px-2 py-1 rounded border border-red-500 uppercase flex items-center gap-1">
                      <span>🙈</span> Hidden
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 flex-grow">
                <h3
                  className={`text-xl font-bold mb-2 ${
                    !map.is_published ? 'text-gray-400' : 'text-[#d4af37]'
                  }`}
                >
                  {map.title}
                </h3>
                <p className="text-[#a3b19b] text-sm italic">
                  {map.description}
                </p>
              </div>

              {/* DM Controls */}
              {isDM && (
                <div className="p-3 bg-black/40 flex justify-between items-center border-t border-[#4b5e40]/30">
                  <button
                    onClick={() => togglePublish(map.id, map.is_published)}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      map.is_published
                        ? 'bg-green-900/50 border-green-500 text-green-300 hover:bg-green-800'
                        : 'bg-yellow-900/50 border-yellow-500 text-yellow-300 hover:bg-yellow-800'
                    }`}
                  >
                    {map.is_published
                      ? '👁️ Hide from Party'
                      : '📜 Reveal to Party'}
                  </button>
                  <button
                    onClick={() => handleDelete(map.id)}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {maps.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#a3b19b] italic">
            The vault is empty. No maps have been drawn.
          </div>
        )}
      </div>
    </div>
  );
}
