import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ParticipantSelector() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Select Participant</h1>
      <div className="grid gap-4 max-w-md">
        <Button onClick={() => navigate('/participant/P0')}>
          Participant P0
        </Button>
      </div>
    </div>
  );
}