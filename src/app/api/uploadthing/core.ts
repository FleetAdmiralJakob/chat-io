import { auth } from "@clerk/nextjs/server";
import { log } from "next-axiom";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  fileUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 20,
    },
    video: {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },
    blob: {
      maxFileSize: "8MB",
      maxFileCount: 20,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user.userId)
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError({
          message: "Unauthorized",
          code: "FORBIDDEN",
        });

      // TODO: This deserves a rate limiter + a check for not creating a bunch of trash files to spam us. Example: https://github.com/t3dotgg/t3gallery/blob/main/src/server/ratelimit.ts

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata }) => {
      // This code RUNS ON YOUR SERVER after upload
      log.info("Upload complete");

      // TODO: Call Convex to store the file in the db

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
