import AuthShell, { AuthPageIntro } from "../_components/AuthShell";

const LoginFallback = () => {
  return (
    <AuthShell visualMode="login" visualKicker="Secure access">
      <div className="auth-success-panel">
        <AuthPageIntro
          eyebrow="Loading"
          title="Opening Acuity Commerce"
          description="Preparing your secure sign-in experience."
        />
      </div>
    </AuthShell>
  );
};

export default LoginFallback;
