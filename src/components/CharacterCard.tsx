import Image from "next/image";

interface CharacterCardProps {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  onClick: (id: string) => void;
}

export function CharacterCard({ id, name, description, avatarUrl, onClick }: CharacterCardProps) {
  return (
    <div 
      onClick={() => onClick(id)}
      className="group relative flex flex-col items-center justify-center p-6 bg-gray-900 rounded-3xl border border-gray-800 cursor-pointer overflow-hidden transition-all hover:border-rose-500/50 hover:bg-gray-800/80 hover:shadow-2xl hover:shadow-rose-500/10 hover:-translate-y-1 active:translate-y-0"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950/80 z-0" />
      
      <div className="relative z-10 w-32 h-32 mb-5 rounded-full overflow-hidden border-4 border-gray-800 shadow-xl group-hover:border-rose-500 transition-colors">
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">{name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 px-2">{description}</p>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
    </div>
  );
}
