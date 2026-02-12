import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/admin/user-administration",
      permanent: false,
    },
  };
};

export default function AdminRedirect() {
  return null;
}
