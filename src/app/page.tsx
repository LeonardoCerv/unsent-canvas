import UnsentCanvas from '@/components/UnsentCanvas';
import { CanvasProvider } from '@/contexts/CanvasContext';

export default function Home() {
  return (
    <CanvasProvider>
      <div className="w-full h-screen overflow-hidden">
        <UnsentCanvas />
      </div>
    </CanvasProvider>
  );
}
