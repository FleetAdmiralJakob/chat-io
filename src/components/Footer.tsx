import Link from "next/link";
import { FaGithub, FaYoutube, FaUserGroup, FaBook } from "react-icons/fa6";
import { MdLanguage } from "react-icons/md";
import { IoIosHelpCircle } from "react-icons/io";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import React from "react";

const Footer = () => {
  const [selectedKeys, setSelectedKeys] = React.useState(new Set(["text"]));

  const selectedValue = React.useMemo(
    () => Array.from(selectedKeys).join(", ").replaceAll("_", " "),
    [selectedKeys],
  );

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
            <MdLanguage className={"mr-1 mt-1"} /> Languages
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
