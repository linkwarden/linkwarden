export default function dashboardItem({
  name,
  value,
  icon,
}: {
  name: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between w-full rounded-2xl border border-neutral-content p-3 bg-gradient-to-tr from-neutral-content/70 to-50% to-base-200">
      <div className="w-14 aspect-square flex justify-center items-center bg-primary/20 rounded-xl select-none">
        <i className={`${icon} text-primary text-3xl drop-shadow`}></i>
      </div>
      <div className="ml-4 flex flex-col justify-center">
        <p className="text-neutral text-xs tracking-wider text-right">{name}</p>
        <p className="font-thin text-4xl text-primary mt-0.5 text-right">
          {value || 0}
        </p>
      </div>
    </div>
  );
}
