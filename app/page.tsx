export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <div className="bg-[#1a241b]/80 border-2 border-[#d4af37] p-10 rounded-lg shadow-2xl shadow-black max-w-3xl w-full backdrop-blur-sm">
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#d4af37] mb-6 tracking-wider drop-shadow-md">
          The Cantavarian Isles
        </h1>
        
        <div className="w-32 h-1 bg-[#8b0000] mx-auto mb-8 rounded-full"></div>
        
        <p className="text-xl md:text-2xl text-[#e8dcc4] mb-8 leading-relaxed font-serif">
          Where the tides hold secrets, and the depths hunger for the unwary. 
          Gather your party, check your inventory, and prepare for the journey ahead.
        </p>

        <p className="text-[#a3b19b] italic">
          "Death may one day claim us all, but until then: we adventure."
        </p>
      </div>
    </div>
  );
}