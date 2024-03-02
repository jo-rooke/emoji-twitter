import { clerkClient, type User } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserFromClient = (user: User) => {
  return {
    id: user.id,
    username: `${user.fullName}`,
    profilePicture: user.imageUrl,
  };
};

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({ take: 100 });

    const users = await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    });

    const filteredUsers = users.data.map(filterUserFromClient);
    return posts.map((post) => {
      const author = filteredUsers.find((user) => user.id === post.authorId);

      if (!author?.username) {
        throw new TRPCError({
          message: "Author not found",
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      return {
        post,
        author: { ...author, username: author.username },
      };
    });
  }),

  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }),
});
