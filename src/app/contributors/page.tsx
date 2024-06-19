"use client";

import Footer from "~/components/footer";
import { IoIosArrowDropupCircle } from "react-icons/io";
import jakobProfile from "/src/assets/jakob-profile.png";
import fabiusProfile from "/src/assets/fabius-profile.png";
import { IoChevronBackSharp } from "react-icons/io5";
import { FaLinkedin } from "react-icons/fa";
import Image, { type StaticImageData } from "next/image";
import { cn } from "~/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaLink } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";
import Link from "next/link";

interface ContributorsProps {
  name: string;
  job: string;
  image: StaticImageData;
  github?: string;
  website?: string;
  linkedin?: string;
}

const contributorList: ContributorsProps[] = [
  {
    name: "Fabius Schurig",
    job: "Engineer & Designer",
    image: fabiusProfile,
    github: "https://github.com/Gamius00",
    website: "https://schurig.tech",
    linkedin: "https://www.linkedin.com/in/fabius-schurig-80713b284/",
  },
  {
    name: "Jakob Rössner",
    job: "Engineer",
    image: jakobProfile,
    github: "https://github.com/FleetAdmiralJakob",
    website: "https://roessner.tech",
    linkedin: "https://www.linkedin.com/in/jakobroessner/",
  },
];

const Contributors = () => {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-5 mt-6 flex text-3xl lg:text-4xl">
          <IoChevronBackSharp
            onClick={() => {
              router.back();
            }}
            className="absolute left-4 top-6 cursor-pointer text-3xl"
          />
          <div className="flex border-b-2 border-white">
            <BsPeopleFill />
            <p className="mb-1 ml-2 font-bold">Contributors</p>
          </div>
        </div>
        <p className="mb-20 text-xl">Made with ❤️ by </p>
        {contributorList.map((contributor, id) => {
          const [cardOpen, setCardOpen] = useState(false);
          return (
            <>
              <div
                className={
                  "mt-4 flex w-11/12 justify-between rounded-2xl border-2 border-secondary-foreground bg-card-foreground p-5 sm:w-7/12 lg:block lg:w-6/12 2xl:w-4/12"
                }
              >
                <div className="flex lg:justify-between" key={id}>
                  <div className="flex flex-wrap items-start justify-start">
                    <Image
                      src={contributor.image}
                      alt={contributor.name}
                      width={50}
                      height={50}
                      className="order-0 rounded-full lg:flex"
                    />

                    <div className="order-1 ml-4 mt-0.5 lg:flex lg:justify-between">
                      <p className="text-xl font-bold lg:mt-3">
                        {contributor.name}
                      </p>
                      <p className="mt-2.5 h-9 rounded-sm border-2 border-secondary-foreground bg-primary px-3 pt-1 font-medium text-secondary-foreground lg:ml-4">
                        {contributor.job}
                      </p>
                    </div>
                  </div>
                  <IoIosArrowDropupCircle
                    onClick={() => setCardOpen(!cardOpen)}
                    className={cn(
                      "ml-5 mt-2.5 hidden text-4xl transition-transform duration-300 ease-in-out lg:flex",
                      {
                        "rotate-180 transform": cardOpen,
                      },
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "justify-around text-xl text-secondary-foreground underline lg:mt-3 lg:flex",
                    {
                      "transition-max-height max-h-0 duration-300 ease-in-out lg:overflow-hidden":
                        !cardOpen,
                      "transition-max-height max-h-screen duration-300 ease-in-out":
                        cardOpen,
                    },
                  )}
                >
                  {contributor.website ? (
                    <Link
                      className={cn("hidden", {
                        flex: contributor.website,
                      })}
                      href={contributor.website}
                    >
                      <p className={"hidden cursor-pointer lg:flex"}>Website</p>
                      <FaLink className="ml-1 mt-1" />
                    </Link>
                  ) : null}

                  {contributor.linkedin ? (
                    <Link className="flex" href={contributor.linkedin}>
                      <p className={"hidden cursor-pointer lg:flex"}>
                        LinkedIn
                      </p>
                      <FaLinkedin className="ml-1 mt-2.5 lg:mt-1" />
                    </Link>
                  ) : null}

                  {contributor.github ? (
                    <Link
                      className={cn("hidden", { flex: contributor.github })}
                      href={contributor.github}
                    >
                      <p className={"hidden cursor-pointer lg:flex"}>GitHub</p>
                      <FaGithub className="ml-1 mt-2.5 lg:mt-1" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </>
          );
        })}
      </div>
      <Footer />
    </main>
  );
};
export default Contributors;
