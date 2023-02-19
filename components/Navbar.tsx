import { signOut } from "next-auth/react";

export default function Navbar() {
  return (
    <div className="flex justify-between p-5 border-solid border-b-sky-100 border border-l-white">
      <p>Navbar</p>
      <div onClick={() => signOut()} className="cursor-pointer w-max">
        Sign Out
      </div>
    </div>
  );
}
