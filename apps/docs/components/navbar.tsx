import { GitHubLogoIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu"
import { Expand } from "lucide-react"

export const Navbar = () => {
  return (
    <div className="w-full h-16 flex items-center justify-between px-5">
      <div className="flex items-center">
        <div className="flex items-center space-x-2">
          <Expand className="" />
          <h1 className="font-bold mr-4">Exirdjs</h1>
        </div>
        {/* Links */}
        <div>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/docs" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Getting Started</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      <Link href={"https://github.com/didirb/exirdjs"} target={"_blank"}>
        <GitHubLogoIcon className="w-6 h-6" />
      </Link>
    </div>
  )
}
