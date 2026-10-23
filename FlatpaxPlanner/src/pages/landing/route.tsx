// LANDING PAGE
import { useEffect } from 'react';
import logo from '@/assets/images/flatpax-utility-logo.png';
import { env } from '@/config/env';
import { loginForDevelopment } from '@/features/auth/services/development-login';
import { PlannerActions } from '@/features/landing/components/PlannerActions';
import { PlannerIntroduction } from '@/features/landing/components/PlannerIntroduction';

export function Component() {
  useEffect(() => {
    if (!env.developmentLogin) return;
    void loginForDevelopment(env.developmentLogin).catch((error: unknown) => {
      console.error('Development login failed.', error);
    });
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-header flex items-start justify-center bg-surface px-6">
        <img
          src={logo}
          width={330}
          height={111}
          alt="Flatpax Utility"
          className="landing-logo h-auto w-full"
          fetchPriority="high"
        />
      </header>
      <div className="landing-backdrop">
        <PlannerIntroduction />
        <PlannerActions />
      </div>
    </div>
  );
}
