import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/LoginButton";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/characters");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-6">
      <div className="flex flex-col items-center text-center z-10 w-full max-w-md">
        <div className="w-20 h-20 mb-8 rounded-3xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-2xl shadow-rose-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          당신만의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">AI 데이트</span>
        </h1>
        <p className="text-lg text-gray-400 mb-12">
          매력적인 AI 캐릭터들과 깊은 대화를 나누어보세요.
          감정에 따라 변화하는 그들의 표정을 확인하세요.
        </p>

        <LoginButton />
      </div>


      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
    </main>
  );
}
