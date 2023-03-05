import { useRouter } from "next/router";

export default function () {
  const router = useRouter();

  const tagId = Number(router.query.id);

  return <div>{"HI"}</div>;
}
