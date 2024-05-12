import Link from "next/link";
import { FaGithub, FaYoutube, FaUserGroup, FaBook } from "react-icons/fa6";
import { MdLanguage } from "react-icons/md";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Image from "next/image";
import america from "src/assets/united-states.png";
import germany from "src/assets/germany.png";

const Footer = () => {
  return (
    <>
      <div
        className={
          "mt-10 block h-48 justify-between bg-card-foreground text-xl text-foreground lg:flex lg:h-24"
        }
      >
        <div
          className={
            "flex w-full justify-around pt-7 text-3xl lg:ml-20 lg:mt-8 lg:w-1/6 lg:pt-0"
          }
        >
          <Link href={"https://github.com/FleetAdmiralJakob/chat-io"}>
            <FaGithub />
          </Link>
          <Link href={"https://www.youtube.com/@JakobTheCoder"}>
            <FaYoutube />
          </Link>
          <Link href={"/contributors"}>
            <FaUserGroup />
          </Link>
        </div>
        <div
          className={
            " mt-8 block w-full pl-14 lg:flex lg:w-2/5 lg:justify-around"
          }
        >
          <div className={"flex"}>
            <MdLanguage className={"mr-1 mt-0.5"} />{" "}
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Languages</SelectLabel>
                  <SelectItem value="English">
                    <div className={"flex"}>
                      <p>English</p>
                      <Image
                        src={america}
                        alt={"Test"}
                        width={20}
                        height={20}
                        className={"ml-2.5"}
                      />
                    </div>
                  </SelectItem>
                  <SelectItem value="German">
                    <div className={"flex"}>
                      <p>German</p>
                      <Image
                        src={germany}
                        alt={"Test"}
                        width={20}
                        height={20}
                        className={"ml-2.5"}
                      />
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Link href={"/legal"} className={"flex"}>
            <FaBook className={"mb-5 mr-1 mt-1"} /> Legal
          </Link>
        </div>
      </div>
    </>
  );
};

export default Footer;
