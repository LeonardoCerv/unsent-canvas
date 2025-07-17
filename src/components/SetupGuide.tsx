'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SetupGuide() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full m-4 p-6">
        <h2 className="text-2xl font-bold mb-4">Setup Required</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Set up Supabase</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a> and create a new project</li>
              <li>Copy your project URL and anon key from Settings → API</li>
              <li>Create a `.env.local` file in your project root</li>
              <li>Add your Supabase credentials to `.env.local`</li>
            </ol>
          </div>
          
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <div className="text-gray-600 mb-2">.env.local</div>
            <div>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">2. Run Database Migration</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Open your Supabase dashboard</li>
              <li>Go to the SQL Editor</li>
              <li>Copy and paste the contents of `supabase-migration.sql`</li>
              <li>Run the migration</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">3. Restart the Development Server</h3>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              npm run dev
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              I&apos;ve completed the setup - Refresh Page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
