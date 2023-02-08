import { useSession } from "next-auth/react";
import Collections from "@/components/Collections";

export default function Dashboard() {
  const { data: session, status } = useSession();

  const user = session?.user;

  return (
    <div className="p-5">
      <p className="text-3xl font-bold text-center mb-10">Linkwarden</p>
      <Collections />
    </div>
  );
}
