"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

type Message = {
  id: string;
  created_at: string;
  sender_email: string;
  receiver_email: string;
  content: string;
};

type Profile = {
  email: string;
  nickname: string | null;
};

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState('');
  const [isDM, setIsDM] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [dmEmail, setDmEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // New search state

  useEffect(() => {
    setupInbox();
  }, []);

  const setupInbox = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email || '';
    setCurrentUser(email);

    const dmEmails = process.env.NEXT_PUBLIC_DM_EMAILS || '';
    const mainDm = dmEmails.split(',')[0];
    setDmEmail(mainDm);
    
    const userIsDM = dmEmails.includes(email);
    setIsDM(userIsDM);

    if (!userIsDM && email) {
      setRecipientEmail(mainDm);
      // Auto-register the player if they aren't in the system yet
      const { data: existing } = await supabase.from('profiles').select('email').eq('email', email).single();
      if (!existing) {
        await supabase.from('profiles').insert([{ email: email, nickname: '' }]);
      }
    }

    fetchProfiles();
    fetchMessages();
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setProfiles(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (data) setMessages(data);
  };

  const handleUpdateNickname = async (playerEmail: string, currentNickname: string | null) => {
    const newName = window.prompt(`Enter a nickname/character name for ${playerEmail}:`, currentNickname || '');
    if (newName !== null) {
      // Update the database
      await supabase.from('profiles').upsert({ email: playerEmail, nickname: newName });
      // Refresh the list
      fetchProfiles();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage || !recipientEmail) return;

    const { data } = await supabase.from('messages').insert([{
      sender_email: currentUser,
      receiver_email: recipientEmail,
      content: newMessage
    }]).select();

    if (data) {
      setMessages([data[0], ...messages]);
      setNewMessage('');
    }
  };

  // Helper to figure out what name to display
  const getDisplayName = (email: string) => {
    if (email === dmEmail) return "The Dungeon Master";
    if (email === currentUser && !isDM) return "You";
    const profile = profiles.find(p => p.email === email);
    return profile?.nickname ? `${profile.nickname} (${email})` : email;
  };

  // Filter messages based on the search bar
  const filteredMessages = messages.filter(msg => {
    const searchLower = searchTerm.toLowerCase();
    const senderName = getDisplayName(msg.sender_email).toLowerCase();
    const content = msg.content.toLowerCase();
    return content.includes(searchLower) || senderName.includes(searchLower);
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <div className="border-b-2 border-[#d4af37] pb-4 mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#d4af37]">Private Whispers</h2>
          <p className="text-[#a3b19b] mt-1">Secret correspondence between the DM and the party.</p>
        </div>
        
        {/* The Search Bar */}
        <div className="w-full md:w-64">
          <input 
            type="text" 
            placeholder="Search whispers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-[#1a241b] border border-[#d4af37]/50 rounded text-[#e8dcc4] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
          />
        </div>
      </div>

      {/* Message Composer */}
      <div className="bg-[#1a241b] border-2 border-purple-900 p-6 rounded-lg shadow-xl">
        <form onSubmit={sendMessage} className="space-y-4">
          <div>
            <label className="block text-[#a3b19b] mb-1">To:</label>
            {isDM ? (
              <div className="flex gap-2">
                <select 
                  value={recipientEmail} 
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  className="flex-grow px-4 py-2 bg-[#2c3e2d] border border-purple-900/50 rounded text-[#e8dcc4] focus:outline-none"
                >
                  <option value="" disabled>Select a player...</option>
                  {profiles.filter(p => p.email !== dmEmail).map(p => (
                    <option key={p.email} value={p.email}>
                      {p.nickname ? `${p.nickname} (${p.email})` : p.email}
                    </option>
                  ))}
                </select>
                
                {/* Nickname Editor Button */}
                {recipientEmail && (
                  <button 
                    type="button"
                    onClick={() => handleUpdateNickname(recipientEmail, profiles.find(p => p.email === recipientEmail)?.nickname || null)}
                    className="px-4 py-2 bg-[#4b5e40] text-[#e8dcc4] rounded hover:bg-[#5c734e] transition-colors text-sm font-bold"
                  >
                    Edit Name
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full px-4 py-2 bg-[#2c3e2d] border border-purple-900/50 rounded text-purple-300 font-bold">
                The Dungeon Master
              </div>
            )}
          </div>
          <div>
            <textarea 
              placeholder="Write your secret message..." required
              value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
              className="w-full h-24 px-4 py-2 bg-[#2c3e2d] border border-purple-900/50 rounded text-[#e8dcc4] focus:outline-none"
            />
          </div>
          <button type="submit" className="px-6 py-2 bg-purple-800 text-white font-bold rounded hover:bg-purple-700 transition-colors">
            Send Whisper
          </button>
        </form>
      </div>

      {/* The Inbox */}
      <div className="space-y-4">
        {filteredMessages.map((msg) => {
          const isMine = msg.sender_email === currentUser;
          return (
            <div key={msg.id} className={`p-4 rounded-lg border max-w-2xl ${isMine ? 'bg-[#2c3e2d] border-[#d4af37]/30 ml-auto' : 'bg-purple-900/20 border-purple-500/30 mr-auto'}`}>
              <div className="flex justify-between text-xs mb-2 opacity-70 text-[#a3b19b]">
                <span className="font-bold">{isMine ? 'From: You' : `From: ${getDisplayName(msg.sender_email)}`}</span>
                <span>{new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <p className="text-[#e8dcc4] whitespace-pre-wrap">{msg.content}</p>
            </div>
          );
        })}
        {filteredMessages.length === 0 && (
          <p className="text-center text-[#a3b19b] italic py-8">
            {searchTerm ? "No whispers match your search." : "No whispers have been sent or received."}
          </p>
        )}
      </div>
    </div>
  );
}