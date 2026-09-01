import WholeContainer from "../../@/components/WholeContainer.tsx";
import Container from "../../@/components/Container.tsx";
import { Separator } from "../../@/components/ui/Separator.tsx";
import OptionsForm from "../../@/components/OptionsForm.tsx";

const App = () => {
  return (
    <WholeContainer className="max-h-[750px]">
      <Container>
        <div className="justify-center items-center p-2 flex">
          <h1 className="text-lg">Options configuration</h1>
        </div>
        <div>
          <Separator />
        </div>
        <OptionsForm />
      </Container>
    </WholeContainer>
  );
};

export default App;
