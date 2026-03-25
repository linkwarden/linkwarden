import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/admin/background-jobs",
      permanent: false,
    },
  };
};

export default function BackgroundJobsRedirect() {
  return null;
}
