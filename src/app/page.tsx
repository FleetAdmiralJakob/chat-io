"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import icon from "~/assets/chatio.png";
import { DevMode } from "~/components/dev-mode-info";
import Footer from "~/components/footer";
import { AuroraBackground } from "~/components/ui/aurora-background";
import { Button } from "~/components/ui/button";
import { devMode$ } from "~/states";
import { motion } from "framer-motion";
import { ArrowDown, CloudDownload, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useRef, useState } from "react";

export default function PublicHomepage() {
  const aboutRef = useRef<HTMLParagraphElement | null>(null);
  const scrollCallback = () => {
    if (aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  const [devModeClick, setDevModeClick] = useState<number>(0);

  const handleDevModeClick = () => {
    setDevModeClick((prevState) => prevState + 1);
    if (devModeClick >= 9) {
      devMode$.set(true);
    }
  };

  return (
    <>
      <AuroraBackground>
        <div className="text-foreground z-10 mb-10 flex min-h-screen flex-col items-center">
          <DevMode>
            <div onClick={() => devMode$.set(false)}>Disable dev mode</div>
          </DevMode>
          <motion.div
            initial={{ opacity: 0.0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
          >
            <div className="container flex min-h-screen flex-col items-center justify-center gap-12 py-14">
              <div className="flex items-center justify-center">
                <Image
                  src={icon}
                  alt="logo of Chat.io"
                  className="h-1/4 w-1/4"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleDevModeClick();
                    }
                  }}
                  onMouseDown={() => {
                    handleDevModeClick();
                  }}
                />
                <h2 className="text-foreground mr-8 text-3xl font-bold tracking-tight sm:text-[5rem]">
                  Chat.io
                </h2>
              </div>
              <p className="w-3/4 bg-gradient-to-b from-gray-600 via-gray-500 to-gray-800 bg-clip-text text-2xl text-transparent sm:w-7/12 dark:from-gray-300 dark:to-gray-600">
                Introducing Chat.io, the next evolution in messaging apps from
                the creators of the beloved Weather.io. Building on our
                experience crafting intuitive and feature-rich applications, we
                have designed Chat.io to revolutionize the way you connect with
                others.
              </p>
              <div className="flex flex-col items-center gap-1 py-11">
                <Link href="/sign-up">
                  <Button className="bg-foreground hover:bg-secondary-foreground p-6 text-2xl transition delay-150 duration-200 ease-in-out hover:text-amber-50">
                    Sign Up
                  </Button>
                </Link>
              </div>

              <p className="h-0 text-xl">Why us ?</p>
              <button
                onClick={() => {
                  scrollCallback();
                }}
                aria-label="Automatically scroll down to all the features of Chat.io"
                aria-controls="features-section"
                className="bg-foreground text-primary-foreground flex aspect-square h-7 animate-bounce items-center justify-center rounded-full"
              >
                <ArrowDown className="h-6" />
              </button>
            </div>
          </motion.div>

          <p
            id="features-section"
            ref={aboutRef}
            className="mt-16 mb-20 w-3/4 text-center text-2xl md:w-1/2 lg:w-1/4"
          >
            Discover the multitude of features packed into Chat.io
          </p>

          <section
            aria-label="Feature: Installation"
            className="flex w-3/4 flex-col items-center md:w-1/2 lg:w-1/4"
          >
            <div>
              <CloudDownload className="mb-2 ml-7 h-10 w-10" />
              <h2 className="mb-5 text-xl">Installable</h2>
            </div>
            <p className="text-secondary-foreground">
              Whether you have on iOS, Android, Windows, or Mac, Chat.io
              installs smoothly across all major platforms, ensuring a
              consistent and reliable messaging experience across all your
              devices.
            </p>
          </section>
          <section
            aria-label="Feature: Open Source"
            className="flex w-3/4 flex-col items-center md:w-1/2 lg:w-1/4"
          >
            <div>
              <SiGithub className="mt-16 mb-2 ml-10 h-9 w-9" />
              <p className="mb-5 text-xl">Open Source</p>
            </div>
            <p className="text-secondary-foreground">
              By embracing open-source principles, Chat.io invites collaboration
              and innovation from a global community of developers, ensuring a
              robust and customizable chat solution tailored to your needs.
            </p>
          </section>
          <section
            aria-label="Feature: Privacy"
            className="flex w-3/4 flex-col items-center md:w-1/2 lg:w-1/4"
          >
            <div>
              <ShieldCheck className="mt-16 mb-2 ml-4 h-10 w-10" />
              <p className="mb-5 text-xl">Privacy</p>
            </div>
            <p className="text-secondary-foreground">
              Chat.io boasts strong security measures, including robust
              encryption and strict access controls, ensuring user data is
              always safeguarded.
            </p>
          </section>
        </div>
      </AuroraBackground>
      <Footer />
    </>
  );
}
