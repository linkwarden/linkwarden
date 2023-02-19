import { useSession } from "next-auth/react";
import CollectionCards from "@/components/CollectionCards";

export default function Dashboard() {
  const { data: session, status } = useSession();

  const user = session?.user;

  return (
    // ml-80
    <div className="p-5">
      <CollectionCards />
    </div>
  );
}
