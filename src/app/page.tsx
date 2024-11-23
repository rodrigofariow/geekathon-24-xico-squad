import { PageMain } from '@/components/page-main';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-900 via-red-700 to-red-500 p-4 bg-[url('/wine-bg.png')] bg-blend-overlay bg-cover">
      <PageMain />
    </main>
  );
}
