import { FC } from 'react';
import { openOptions } from '../lib/utils.ts';
import { Button } from './ui/Button.tsx';

const NotConfigured: FC<{ open: boolean }> = ({ open }) => {
  if (!open) return null;

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 inset-0 bg-white z-10">
      <div className="container flex flex-col gap-3 justify-center items-center h-full max-w-lg mx-auto">
        <img
          src="./128.png"
          height="40px"
          width="40px"
          className="rounded"
          alt="Linkwarden Logo"
        />
        <h1
          className="font-medium text-lg text-zinc-700"
          style={{ fontSize: '1.65rem' }}
        >
          Initial Setup
        </h1>

        <div className="flex justify-center items-center">
          <Button
            onClick={() => openOptions()}
            className="w-40"
            variant="outline"
          >
            Configure
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotConfigured;
