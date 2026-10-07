import logo from '@/assets/images/flatpax-utility-logo.png';
import { PlannerActions } from '@/features/landing/components/PlannerActions';
import { PlannerIntroduction } from '@/features/landing/components/PlannerIntroduction';

export function Component() {
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
