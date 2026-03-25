"use client";

import { useState } from 'react';
import { supabase } from './utils/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // New toggle state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (isSignUp) {
      // The Sign-Up Spell
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setMessage("Sign Up Failed: " + error.message);
      } else {
        setMessage("Account created! Unlocking doors...");
        window.location.reload(); 
      }
    } else {
      // The Log-In Spell
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage("Access Denied: " + error.message);
      } else {
        setMessage("Welcome back! Unlocking doors...");
        window.location.reload(); 
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-[#1a241b] border-2 border-[#d4af37] p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-3xl font-bold text-[#d4af37] text-center mb-6">
          {isSignUp ? 'Register for the Campaign' : 'Enter the Tavern'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-[#a3b19b] mb-1">Email Address</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#d4af37]/50 rounded text-[#e8dcc4] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-[#a3b19b] mb-1">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#2c3e2d] border border-[#d4af37]/50 rounded text-[#e8dcc4] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-3 bg-[#8b0000] text-[#e8dcc4] font-bold rounded hover:bg-[#660000] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Create Character Account' : 'Unlock Door')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#a3b19b] hover:text-[#d4af37] text-sm transition-colors underline"
          >
            {isSignUp ? 'Already have an account? Log in here.' : 'Need an account? Sign up here.'}
          </button>
        </div>

        {message && (
          <p className="mt-4 text-center text-[#d4af37] font-semibold">{message}</p>
        )}
      </div>
    </div>
  );
}