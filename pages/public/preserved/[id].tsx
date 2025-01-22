import { useRouter } from "next/router";
export default function Index() {
  const router = useRouter();
  const { id } = router.query;

  return router.push(`/public/links/${id}`);
}
