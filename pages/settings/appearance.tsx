
import SettingsLayout from "@/layouts/SettingsLayout";
import { useState, useEffect } from "react";
import useAccountStore from "@/store/account";
import { AccountSettings } from "@/types/global";
import { toast } from "react-hot-toast";
import useLocalSettingsStore from "@/store/localSettings";

export default function Appearance() {
   const { updateSettings } = useLocalSettingsStore();
   const { account, updateAccount } = useAccountStore();
   const submit = async () => {
    setSubmitLoader(true);
    const load = toast.loading("Applying...");
    
    const response = await updateAccount({
      ...user,
    });

    toast.dismiss(load);
    if (response.ok) {
       toast.success("Settings Applied!");
    } else toast.error(response.data as string);
        setSubmitLoader(false);
 };
   const [submitLoader, setSubmitLoader] = useState(false);
   const [user, setUser] = useState<AccountSettings>(
      !objectIsEmpty(account)
         ? account
         : ({
            // @ts-ignore
            id: null,
            name: "",
            username: "",
            email: "",
            emailVerified: null,
            blurredFavicons: null,
            image: "",
            isPrivate: true,
            // @ts-ignore
            createdAt: null,
            whitelistedUsers: [],
         } as unknown as AccountSettings)
   );

   // Combine colorTheme and mode into a single state
   const [theme, setTheme] = useState(localStorage.getItem("theme") || "default-dark");

   function objectIsEmpty(obj: object) {
      return Object.keys(obj).length === 0;
   }

   useEffect(() => {
      if (!objectIsEmpty(account)) setUser({ ...account });
   }, [account]);

   const handleThemeChange = (newThemePart: string, isColorTheme: boolean) => {
      const currentTheme = localStorage.getItem("theme") || "default-light";
      const [currentColorTheme, currentMode] = currentTheme.split('-');
      const newTheme = isColorTheme ? `${newThemePart}-${currentMode}` : `${currentColorTheme}-${newThemePart}`;

      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      updateSettings({ theme: newTheme });

      // Update the theme state
      setTheme(newTheme);
   };





   return (
      <SettingsLayout>
         <p className="capitalize text-3xl font-thin inline">Appearance</p>
         <div className="divider my-3"></div>

         <div className="flex flex-col gap-5">

            <div>
               <p className="mb-3">Select Mode</p>
               <div className="grid grid-cols-2 gap-3">
                  {["light", "dark"].map((modeOption) => (
                     <button
                        key={modeOption}
                        onClick={() => handleThemeChange(modeOption, false)}
                        className={`w-full text-center h-36 duration-100 rounded-md flex items-center justify-center cursor-pointer select-none ${theme.endsWith(modeOption) ? "ring-2 ring-primary" : "ring-2 ring-neutral"}`}
                     >
                        {modeOption === 'light' ?
                           <i className={`bi-sun-fill text-6xl ${theme.endsWith(modeOption) ? "text-primary" : ""}`}></i> :
                           <i className={`bi-moon-fill text-6xl ${theme.endsWith(modeOption) ? "text-primary" : ""}`}></i>}
                        <p className="ml-2 text-2xl">{modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}</p>
                     </button>
                  ))}
               </div>
            </div>

            <div>
               <p className="mb-3">Select Color Theme</p>
               <div className="grid grid-cols-4 gap-3">
                  {["default", "red", "green", "orange"].map((colorTheme) => (
                     <button
                        key={colorTheme}
                        onClick={() => handleThemeChange(colorTheme, true)}
                        className={`w-full text-center h-36 duration-100 rounded-md flex items-center justify-center cursor-pointer select-none ${theme.startsWith(colorTheme) ? "ring-2 ring-primary" : "ring-2 ring-neutral"}`}
                     >
                        {colorTheme.charAt(0).toUpperCase() + colorTheme.slice(1)}
                     </button>
                  ))}
               </div>
            </div>

            <button
               onClick={submit}
               disabled={submitLoader}
               className="mt-2 mx-auto lg:mx-0 bg-primary text-white rounded-md px-4 py-2"
            >
               {submitLoader ? "Saving..." : "Save"}
            </button>
         </div>
      </SettingsLayout>
   );
}

