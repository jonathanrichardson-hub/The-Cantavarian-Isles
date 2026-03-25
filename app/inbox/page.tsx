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

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState('');
  const [isDM, setIsDM] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [dmEmail, setDmEmail] = useState('');

  useEffect(() => {
    setupInbox();
  }, []);

  const setupInbox = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email || '';
    setCurrentUser(email);

    const dmEmails = process.env.NEXT_PUBLIC_DM_EMAILS || '';
    const mainDm = dmEmails.split(',')[0]; // Grab the first DM email
    setDmEmail(mainDm);
    
    const userIsDM = dmEmails.includes(email);
    setIsDM(userIsDM);

    // If they are a player, they always message the DM.
    if (!userIsDM) {
      setRecipientEmail(mainDm);
    }

    fetchMessages(email);
  };

  const fetchMessages = async (userEmail: string) => {
    // Because of our SQL rules, this will ONLY return messages they are allowed to see
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage || !recipientEmail) return;

    const { data, error } = await supabase.from('messages').insert([{
      sender_email: currentUser,
      receiver_email: recipientEmail,
      content: newMessage
    }]).select();

    if (data) {
      setMessages([data[0], ...messages]);
      setNewMessage('');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b-2 border-[#d4af37] pb-4 mb-6">
        <h2 className="text-3xl font-bold text-[#d4af37]">Private Whispers</h2>
        <p className="text-[#a3b19b] mt-1">Secret correspondence between the DM and the party.</p>
      </div>

      {/* Message Composer */}
      <div className="bg-[#1a241b] border-2 border-purple-900 p-6 rounded-lg shadow-xl">
        <form onSubmit={sendMessage} className="space-y-4">
          <div>
            <label className="block text-[#a3b19b] mb-1">To:</label>
            {isDM ? (
              <input 
                type="email" placeholder="player@email.com" required
                value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#2c3e2d] border border-purple-900/50 rounded text-[#e8dcc4] focus:outline-none"
              />
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
        {messages.map((msg) => {
          const isMine = msg.sender_email === currentUser;
          return (
            <div key={msg.id} className={`p-4 rounded-lg border max-w-2xl ${isMine ? 'bg-[#2c3e2d] border-[#d4af37]/30 ml-auto' : 'bg-purple-900/20 border-purple-500/30 mr-auto'}`}>
              <div className="flex justify-between text-xs mb-2 opacity-70 text-[#a3b19b]">
                <span>{isMine ? 'From: You' : `From: ${msg.sender_email}`}</span>
                <span>{new Date(msg.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-[#e8dcc4] whitespace-pre-wrap">{msg.content}</p>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-[#a3b19b] italic py-8">No whispers have been sent or received.</p>
        )}
      </div>
    </div>
  );
}