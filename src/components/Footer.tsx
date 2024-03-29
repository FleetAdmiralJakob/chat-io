import Link from "next/link";
import { FaGithub, FaYoutube, FaUserGroup, FaBook } from "react-icons/fa6";
import { MdLanguage } from "react-icons/md";
import { IoIosHelpCircle } from "react-icons/io";
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
          "mt-10 block h-24 justify-between bg-card-foreground text-xl text-secondary-foreground md:flex"
        }
      >
        <div
          className={
            "mt-8 flex w-full justify-around text-3xl md:ml-20 md:w-1/6"
          }
        >
          <FaGithub />
          <FaYoutube />
          <FaUserGroup />
        </div>
        <div className={"mt-8 flex w-full justify-around md:w-2/5"}>
          <Link href={"/"} className={"flex"}>
            <MdLanguage className={"mr-1 mt-1"} />{" "}
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a Language" />
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
          </Link>
          <Link href={"/"} className={"flex"}>
            <FaBook className={"mr-1 mt-1"} /> Legal
          </Link>
          <Link href={"/"} className={"flex"}>
            <IoIosHelpCircle className={"mr-1 mt-1"} /> Help
          </Link>
        </div>
      </div>
    </>
  );
};

export default Footer;
