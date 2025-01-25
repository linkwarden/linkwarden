import getServerSideProps from "@/lib/client/getServerSideProps";
import PreservationStandalone from "@/components/PreservationStandalone";

export default function Index() {
  return <PreservationStandalone />;
}

export { getServerSideProps };
