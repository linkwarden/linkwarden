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
    <div className="flex items-center">
      <div className="w-[4rem] aspect-square flex justify-center items-center bg-primary/20 rounded-xl select-none">
        <i className={`${icon} text-primary text-3xl drop-shadow`}></i>
      </div>
      <div className="ml-4 flex flex-col justify-center">
        <p className="text-neutral text-xs tracking-wider">{name}</p>
        <p className="font-thin text-5xl text-primary mt-0.5">{value}</p>
      </div>
    </div>
  );
}
