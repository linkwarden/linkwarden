import { ReactNode, useState } from "react";

type Props = {
  src: string;
  className: string;
  children: ReactNode;
};

const ImageWithFallback = ({ src, className, children, ...rest }: Props) => {
  const [error, setError] = useState(false);

  return error ? (
    <>{children}</>
  ) : (
    <img
      alt=""
      {...rest}
      src={src}
      className={className}
      onError={() => {
        setError(true);
      }}
    />
  );
};

export default ImageWithFallback;
