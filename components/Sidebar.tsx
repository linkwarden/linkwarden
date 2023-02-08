import { useSession } from "next-auth/react";

export default function Sidebar() {
  const { data: session, status } = useSession();

  const user = session?.user;

  return (
    <div className="fixed bg-gray-100 top-0 bottom-0 left-0 w-80">
      <p>{user?.name}</p>
    </div>
  );
}
