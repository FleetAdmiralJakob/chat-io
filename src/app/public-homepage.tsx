"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import icon from "~/assets/chatio.png";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { FaCircleArrowDown, FaGithub } from "react-icons/fa6";
import { IoCloudDownloadOutline } from "react-icons/io5";
import { MdPrivacyTip } from "react-icons/md";
import Footer from "~/components/footer";
import { devMode$ } from "~/states";
import { DevMode } from "~/components/dev-mode-info";

export default function PublicHomepage() {
  const aboutRef = useRef<HTMLParagraphElement | null>(null);
  const scrollCallback = () => {
    if (aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  const [devModeClick, setDevModeClick] = useState<number>(0);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center text-foreground">
        <DevMode>
          <div onClick={() => devMode$.set(false)}>Disable dev mode</div>
        </DevMode>
        <div
          className={
            "container flex min-h-screen flex-col items-center justify-center gap-12 py-14"
          }
        >
          <div className={"flex items-center justify-center"}>
            <Image
              src={icon}
              alt="logo of Chat.io"
              className={"h-1/4 w-1/4"}
              onClick={() => {
                setDevModeClick((prevState) => prevState + 1);
                if (devModeClick >= 9) {
                  devMode$.set(true);
                }
              }}
            />
            <h2 className="mr-8 text-3xl font-bold tracking-tight text-foreground sm:text-[5rem]">
              Chat.io
            </h2>
          </div>
          <p
            className={
              "w-3/4 bg-gradient-to-b from-gray-600 via-gray-500 to-gray-800 bg-clip-text text-2xl text-transparent sm:w-7/12"
            }
          >
            Introducing Chat.io, the next evolution in messaging apps from the
            creators of the beloved Weather.io. Building on our experience
            crafting intuitive and feature-rich applications, we have designed
            Chat.io to revolutionize the way you connect with others.
          </p>
          <div className="flex flex-col items-center gap-1 py-11">
            <Link href="/sign-up">
              <Button
                className={
                  "b bg-foreground p-6 text-2xl transition delay-150 duration-200 ease-in-out hover:bg-secondary-foreground hover:text-amber-50"
                }
              >
                Sign Up
              </Button>
            </Link>
          </div>

          <p className={"h-0 text-xl"}>Why us ?</p>
          <button
            onClick={() => {
              scrollCallback();
            }}
          >
            <FaCircleArrowDown className={"h-7 animate-bounce text-2xl"} />
          </button>
        </div>

        <p
          ref={aboutRef}
          className={"mb-20 mt-16 w-3/4 text-2xl md:w-1/2 lg:w-1/4"}
        >
          Discover the multitude of features packed into Chat.io
        </p>

        <div className={"block"}>
          <IoCloudDownloadOutline className={"mb-2 ml-7 text-4xl"} />
          <p className={"mb-5 text-xl"}>Installable</p>
        </div>
        <p className={"w-3/4 text-secondary-foreground  md:w-1/2 lg:w-1/4"}>
          Whether you have on iOS, Android, Windows, or Mac, Weather.io installs
          smoothly across all major platforms, ensuring a consistent and
          reliable weather experience across all your devices.
        </p>
        <div>
          <FaGithub className={"mb-2 ml-10 mt-16 text-4xl"} />
          <p className={"mb-5 text-xl"}>Open Source</p>
        </div>
        <p className={"w-3/4 text-secondary-foreground  md:w-1/2 lg:w-1/4"}>
          By embracing open-source principles, Weather.io invites collaboration
          and innovation from a global community of developers, ensuring a
          robust and customizable weather solution tailored to your needs.
        </p>
        <div>
          <MdPrivacyTip className={"mb-2 ml-4 mt-16 text-4xl"} />
          <p className={"mb-5 text-xl"}>Privacy</p>
        </div>
        <p
          className={"mb-20 w-3/4 text-secondary-foreground md:w-1/2 lg:w-1/4 "}
        >
          Chat.io boasts strong security measures, including robust encryption
          and strict access controls, ensuring user data is always safeguarded.
        </p>
      </main>
      <Footer />
    </>
  );
}
