import { useRouter } from "next/router";

export default function () {
  const router = useRouter();

  const collectionId = Number(router.query.id);

  console.log(collectionId);

  return <div>{"HI"}</div>;
}
