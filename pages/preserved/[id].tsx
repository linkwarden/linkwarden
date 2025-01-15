import getServerSideProps from "@/lib/client/getServerSideProps";
import Preservation from "@/components/Preservation";

export default function Index() {
  return <Preservation />;
}

export { getServerSideProps };
