import { FC } from 'react';

interface ContainerProps {
  children: React.ReactNode;
}

const Container: FC<ContainerProps> = ({ children }) => {
  return <div className="flex flex-col w-[386px] h-full px-6 py-3 overflow-y-hidden">{children}</div>;
};

export default Container;
