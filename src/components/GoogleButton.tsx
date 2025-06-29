import { useAuth } from "@/contexts/AuthContext";
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';

const GoogleButton = () => {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      className="w-full"
    >
      <FcGoogle className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  );
};

export default GoogleButton;
