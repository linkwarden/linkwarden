import type { GetServerSideProps } from "next";
import getServerSideProps from "@/lib/client/getServerSideProps";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/admin/background-jobs",
      permanent: false,
    },
  };

export { getServerSideProps };
};

export default function WorkerRedirect() {
  return null;
}
