import { FC } from 'react';
import { cn } from '../lib/utils.ts';

interface WholeContainerProps extends React.HTMLAttributes<HTMLDivElement>{
  children: React.ReactNode;
  className?: string;
}

const WholeContainer: FC<WholeContainerProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('inset-0 w-full flex justify-center max-h-[600px] overflow-y-hidden relative', className)} {...props}>
      {children}
    </div>
  );
};

export default WholeContainer;
