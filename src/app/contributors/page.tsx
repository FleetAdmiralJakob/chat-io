"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { LinkedInLogoIcon } from "@radix-ui/react-icons";
import Footer from "~/components/footer";
import { cn } from "~/lib/utils";
import {
  ArrowLeft,
  CircleChevronUp,
  Link as LinkChain,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface ContributorsProps {
  name: string;
  job: string;
  image: string;
  github?: string;
  website?: string;
  linkedin?: string;
}

const contributorList: ContributorsProps[] = [
  {
    name: "Fabius Schurig",
    job: "Engineer & Designer",
    image: "/contributors/fabius-profile.png",
    github: "https://github.com/Gamius00",
    website: "https://schurig.tech",
    linkedin: "https://www.linkedin.com/in/fabius-schurig-80713b284/",
  },
  {
    name: "Jakob Rössner",
    job: "Engineer",
    image: "/contributors/jakob-profile.png",
    github: "https://github.com/FleetAdmiralJakob",
    website: "https://roessner.tech",
    linkedin: "https://www.linkedin.com/in/jakobroessner/",
  },
];

const ContributorCard = (props: { contributor: ContributorsProps }) => {
  const [cardOpen, setCardOpen] = useState(false);
  return (
    <div className="flex w-11/12 justify-between rounded-2xl border-2 border-secondary-foreground bg-card-foreground p-5 sm:w-7/12 lg:block lg:w-6/12 2xl:w-4/12">
      <div className="flex items-center lg:justify-between">
        <div className="flex flex-wrap items-center justify-start">
          <Image
            src={props.contributor.image}
            alt={props.contributor.name}
            width={50}
            height={50}
            className="order-0 rounded-full lg:flex"
          />

          <div className="order-1 ml-4 mt-0.5 lg:flex lg:justify-between">
            <p className="text-xl font-bold lg:mt-3">
              {props.contributor.name}
            </p>
            <p className="mt-2.5 h-9 rounded-sm border-2 border-secondary-foreground bg-primary px-3 pt-1 font-medium text-secondary-foreground lg:ml-4">
              {props.contributor.job}
            </p>
          </div>
        </div>
        <CircleChevronUp
          onClick={() => setCardOpen(!cardOpen)}
          className={cn(
            "ml-5 mt-2.5 hidden h-7 w-7 cursor-pointer transition-transform duration-300 ease-in-out lg:flex",
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
            "transition-max-height duration-300 ease-in-out lg:max-h-0 lg:overflow-hidden":
              !cardOpen,
            "transition-max-height max-h-screen duration-300 ease-in-out":
              cardOpen,
          },
        )}
      >
        {props.contributor.website ? (
          <Link
            className={cn("hidden", {
              flex: props.contributor.website,
            })}
            href={props.contributor.website}
          >
            <p className="hidden cursor-pointer lg:flex">Website</p>
            <LinkChain className="ml-1 mt-1 h-5 w-5" />
          </Link>
        ) : null}

        {props.contributor.linkedin ? (
          <Link className="flex" href={props.contributor.linkedin}>
            <p className="hidden cursor-pointer lg:flex">LinkedIn</p>
            <LinkedInLogoIcon className="ml-1 mt-2.5 h-5 w-5 lg:mt-1" />
          </Link>
        ) : null}

        {props.contributor.github ? (
          <Link
            className={cn("hidden", { flex: props.contributor.github })}
            href={props.contributor.github}
          >
            <p className="hidden cursor-pointer lg:flex">GitHub</p>
            <SiGithub className="ml-1 mt-2.5 h-5 w-5 lg:mt-1" />
          </Link>
        ) : null}
      </div>
    </div>
  );
};

const Contributors = () => {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-5 mt-6 flex text-3xl lg:text-4xl">
          <div
            onClick={() => {
              router.back();
            }}
            className="absolute left-4 top-6 flex cursor-pointer items-center gap-1 text-xl font-bold"
          >
            <ArrowLeft />
            <span className="hidden xl:block">Back</span>
          </div>
          <div className="flex border-b-2 border-white">
            <UsersRound className="mt-0.5 h-8 w-8" />
            <p className="mb-1 ml-2 font-bold">Contributors</p>
          </div>
        </div>
        <p className="mb-20 text-xl">Made with ❤️ by </p>
        <div className="flex w-full flex-col items-center justify-center gap-4">
          {contributorList.map((contributor, id) => {
            return <ContributorCard key={id} contributor={contributor} />;
          })}
        </div>
      </div>
      <Footer />
    </main>
  );
};
export default Contributors;
