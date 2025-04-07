import getServerSideProps from "@/lib/client/getServerSideProps";
import PreservationPageContent from "@/components/Preservation/PreservationPageContent";

export default function Index() {
  return <PreservationPageContent />;
}

export { getServerSideProps };
