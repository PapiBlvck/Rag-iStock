import { useState } from 'react';
import { useForm, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignUpSchema, type SignUpInput } from '@istock/shared';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

interface SignUpProps {
  onSwitchToSignIn: () => void;
  onSuccess: () => void;
}

export function SignUp({ onSwitchToSignIn, onSuccess }: SignUpProps) {
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');
  
  // Check if passwords match
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Always use 'Farmer' role for all accounts (handled automatically in AuthContext)
      await signup(data.email, data.password, data.fullName);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border bg-card/95 backdrop-blur-sm">
      <CardHeader className="space-y-3 pb-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-base">
            Join iStock and start managing your livestock
          </CardDescription>
          </div>
          <ThemeToggle />
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }: { field: ControllerRenderProps<SignUpInput, 'fullName'> }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }: { field: ControllerRenderProps<SignUpInput, 'email'> }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }: { field: ControllerRenderProps<SignUpInput, 'password'> }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        {...field}
                        className="pr-10"
                        aria-describedby="password-requirements"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription id="password-requirements">
                    Password must be at least 6 characters long
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }: { field: ControllerRenderProps<SignUpInput, 'confirmPassword'> }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        {...field}
                        className="pr-10"
                        aria-describedby="confirm-password-hint"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription id="confirm-password-hint">
                    Re-enter your password to confirm
                  </FormDescription>
                  {confirmPassword && password && (
                    <div className="flex items-center gap-2 text-xs">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500" aria-hidden="true" />
                          <span className="text-green-600 dark:text-green-500">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-destructive" aria-hidden="true" />
                          <span className="text-destructive">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-primary font-semibold hover:underline transition-colors"
              >
                Sign in
              </button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

