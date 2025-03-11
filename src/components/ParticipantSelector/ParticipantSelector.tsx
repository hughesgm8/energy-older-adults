import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ParticipantSelector() {
  const navigate = useNavigate();
  
  // Replace this with a real data source if needed
  const participants = ['P0', 'P1', 'P2', 'P3'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <Card className="shadow">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-center">
              Select Participant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.map((participant) => (
                <Button
                  key={participant}
                  onClick={() => navigate(`/participant/${participant}`)}
                  className="w-full text-base py-6"
                >
                  Participant {participant}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}