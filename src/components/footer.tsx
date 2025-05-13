import { SiGithub, SiYoutube } from "@icons-pack/react-simple-icons";
import { Book, Globe, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import germany from "src/assets/germany.png";
import england from "src/assets/united-kingdom.png";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const Footer = () => {
  return (
    <>
      <div className="bg-card-foreground text-foreground block h-48 justify-between text-xl lg:flex lg:h-24">
        <div className="flex w-full justify-around pt-7 lg:mt-8 lg:ml-20 lg:w-1/6 lg:pt-0">
          <Link
            href="https://github.com/FleetAdmiralJakob/chat-io"
            aria-label="See our project's code on GitHub"
          >
            <SiGithub />
          </Link>
          <Link
            href="https://www.youtube.com/@JakobTheCoder"
            aria-label="The YouTube channel of one of the creators of Chat.io"
          >
            <SiYoutube />
          </Link>
          <Link
            href="/contributors"
            aria-label="See who worked on making this project happen"
          >
            <UsersRound className="h-6 w-6" />
          </Link>
        </div>
        <div className="flex w-full flex-col gap-3 pt-8 pl-14 lg:w-2/5 lg:flex-row lg:justify-around lg:pt-0">
          <div className="flex items-center gap-1">
            <Globe />
            <Select>
              <SelectTrigger
                className="flex w-[180px] items-center py-0"
                aria-label="Trigger this to change the language of Chat.io"
              >
                <SelectValue placeholder="Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Languages</SelectLabel>
                  <SelectItem value="English">
                    <div className="flex">
                      <p>English</p>
                      <Image
                        src={england}
                        alt="British flag"
                        width={20}
                        height={20}
                        className={"ml-2.5"}
                      />
                    </div>
                  </SelectItem>
                  <SelectItem value="German">
                    <div className="flex">
                      <p>German</p>
                      <Image
                        src={germany}
                        alt="German flag"
                        width={20}
                        height={20}
                        className="ml-2.5"
                      />
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Link href="/legal" className="flex items-center gap-1">
            <Book /> Legal
          </Link>
        </div>
      </div>
    </>
  );
};

export default Footer;
