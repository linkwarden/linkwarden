import Container from '../../@/components/Container.tsx';
import WholeContainer from '../../@/components/WholeContainer.tsx';
import BookmarkForm from '../../@/components/BookmarkForm.tsx';
import { openOptions } from '../../@/lib/utils.ts';
import { useEffect, useState } from 'react';
import { getConfig, isConfigured } from '../../@/lib/config.ts';
import NotConfigured from '../../@/components/NotConfigured.tsx';
import { ModeToggle } from '../../@/components/ModeToggle.tsx';
import { Button } from '@/@/components/ui/Button.tsx';
import { Settings } from 'lucide-react';

function App() {
  const [isAllConfigured, setIsAllConfigured] = useState<boolean>();
  const [baseUrl, setBaseUrl] = useState<string>();

  useEffect(() => {
    (async () => {
      const cachedOptions = await isConfigured();
      const cachedConfig = await getConfig();

      setBaseUrl(cachedConfig.baseUrl);
      setIsAllConfigured(cachedOptions);
    })();
  }, []);

  return (
    <WholeContainer>
      <Container>
        <div className="flex justify-between w-full items-center">
          <div className="flex space-x-2 w-full items-center">
            <a
              href={baseUrl}
              rel="noopener"
              target="_blank"
              referrerPolicy="no-referrer"
              className="hover:opacity-80 duration-200 rounded ease-in-out"
            >
              <img
                src="./128.png"
                height="30px"
                width="30px"
                className="rounded"
                alt="Linkwarden Logo"
              />
            </a>
            <h1 className="text-lg">Add Link</h1>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="ring-0 focus:ring-0 outline-none focus:outline-none ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus-visible:ring-0 focus-visible:outline-none"
              onClick={openOptions}
            >
              <Settings className="h-[1.2rem] w-[1.2rem] transition-colors" />
            </Button>
          </div>
        </div>
        <BookmarkForm />
        <NotConfigured open={!isAllConfigured} />
      </Container>
    </WholeContainer>
  );
}

export default App;
