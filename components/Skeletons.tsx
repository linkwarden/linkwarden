import clsx from "clsx";

export const PreservationSkeleton = ({ className }: { className?: string }) => (
  <div
    className={clsx(
      "p-5 m-auto w-full flex flex-col items-center gap-5 h-full bg-base-200",
      className
    )}
  >
    <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
    <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
    <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
    <div className="w-3/4 mr-auto h-4 skeleton rounded-md"></div>
    <div className="w-5/6 mr-auto h-4 skeleton rounded-md"></div>
    <div className="w-3/4 mr-auto h-4 skeleton rounded-md"></div>
    <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
    <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
    <div className="w-5/6 mr-auto h-4 skeleton rounded-md"></div>
  </div>
);

export const ImageSkeleton = () => (
  <div className="w-[80%] h-[80%] bg-neutral-content rounded-2xl mx-auto"></div>
);
