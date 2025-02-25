import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ParticipantSelector() {
  const navigate = useNavigate();
  
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
              <Button 
                onClick={() => navigate('/participant/P0')}
                className="w-full text-base py-6"
              >
                Participant P0
              </Button>
              {/* Add more participants here as needed */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}