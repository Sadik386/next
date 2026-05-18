import React, { Suspense } from 'react';
import LoginAuthLogic from './LoginAuthLogic';
import LoginFallback from './LoginFallback';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginAuthLogic />
    </Suspense>
  );
}
