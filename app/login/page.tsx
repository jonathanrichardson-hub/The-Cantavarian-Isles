'use client';

import { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(
        'A magical missive has been sent! Check your email for the login link.'
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      <div className="bg-[#1a241b] border-2 border-[#d4af37] p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h2 className="text-3xl font-bold text-[#d4af37] mb-6 text-center border-b border-[#4b5e40] pb-4">
          Enter the Realm
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-[#e8dcc4] mb-2 font-semibold"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#4b5e40] rounded text-[#e8dcc4] focus:outline-none focus:border-[#d4af37] transition-colors"
              placeholder="player@adventuringparty.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#d4af37] text-[#1a241b] font-bold rounded hover:bg-[#e8dcc4] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Casting sending spell...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div className="mt-6 p-4 border border-[#4b5e40] bg-[#2c3e2d] rounded text-center text-[#e8dcc4]">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
