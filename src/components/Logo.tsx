import { GraduationCap } from 'lucide-react';

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <GraduationCap className="h-6 w-6" />
      </div>
      <span className="font-bold text-xl tracking-tight">
        Edu<span className="text-primary">Core</span>
      </span>
    </div>
  );
};
