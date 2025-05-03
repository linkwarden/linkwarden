import { useState, useEffect } from "react";

const useDetectPageBottom = () => {
  const [reachedBottom, setReachedBottom] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight;
      const scrolledHeight = window.scrollY + window.innerHeight;

      if (scrolledHeight >= totalHeight) {
        setReachedBottom(true);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { reachedBottom, setReachedBottom };
};

export default useDetectPageBottom;
