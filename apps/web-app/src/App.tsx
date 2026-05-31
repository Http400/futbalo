import { useState } from 'react';
import { AuthForm, type SignInData, type SignUpData } from '@futbalo/ui';
import { useAppSelector } from './store/hooks';
import { useLoginMutation, useRegisterMutation } from './store/api/authApi';
import { GlobeWrapper } from './components/GlobeWrapper';

function App() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

  const [login, { isLoading: isLoginLoading, error: loginError }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading, error: registerError }] = useRegisterMutation();

  const isLoading = isLoginLoading || isRegisterLoading;
  const rawError = loginError ?? registerError;
  const errorMessage =
    rawError && 'data' in rawError
      ? (rawError.data as { message?: string })?.message ?? 'Something went wrong'
      : undefined;

  function handleSubmit(data: SignInData | SignUpData) {
    if (mode === 'signIn') {
      login(data as SignInData);
    } else {
      register(data as SignUpData);
    }
  }

  if (true) {
    return (
      <main style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#ffffff',
        position: 'fixed',
        // inset: 0,
        fontFamily: 'sans-serif',
      }}>
        <GlobeWrapper />
      </main>
    );
  }

  // return (
  //   <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 64 }}>
  //     <AuthForm
  //       mode={mode}
  //       onSubmit={handleSubmit}
  //       isLoading={isLoading}
  //       {...(errorMessage !== undefined && { error: errorMessage })}
  //     />
  //     <button
  //       type="button"
  //       onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
  //       style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
  //     >
  //       {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
  //     </button>
  //   </main>
  // );
}

export default App;
