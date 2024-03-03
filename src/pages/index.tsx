import { SignInButton, useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { api, type RouterOutputs } from "~/utils/api";
dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");

  if (!user) return null;

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.post.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) toast.error(errorMessage[0]);
      else toast.error("Failed to post");
    },
  });

  return (
    <div className="flex w-full gap-3 ">
      <Image
        width={56}
        height={56}
        src={user.imageUrl}
        alt={`${user.fullName} profile image`}
        className="h-16 w-16 rounded-full"
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        value={input}
        type="text"
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const content = input;
            if (content) {
              mutate({ content: input.trim() });
              setInput("");
            }
          }
        }}
      />
      {!!input.length && (
        <button onClick={() => mutate({ content: input.trim() })}>Post</button>
      )}
    </div>
  );
};
const PostLoader = () => {
  return (
    <div className="mx-auto w-full rounded-md border border-blue-300 p-4 shadow">
      <div className="flex animate-pulse space-x-4">
        <div className="h-10 w-10 rounded-full bg-slate-700"></div>
        <div className="flex-1 space-y-6 py-1">
          <div className="h-2 rounded bg-slate-700"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 h-2 rounded bg-slate-700"></div>
              <div className="col-span-1 h-2 rounded bg-slate-700"></div>
            </div>
            <div className="h-2 rounded bg-slate-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

type PostWithUser = RouterOutputs["post"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div key={post.id} className="flex gap-2 border-b border-slate-400 p-4 ">
      <Image
        width={56}
        height={56}
        src={author.profilePicture}
        alt={`${author.username} profile image`}
        className="h-8 w-8 rounded-full"
      />
      <div className="flex flex-col">
        <div className="flex text-slate-400">
          <span>{`@${author.username}`}</span>
          <span className="font-thin">{`· ${dayjs(post.createdAt).fromNow()}`}</span>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading) return <PostLoader />;
  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

export default function Home() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // Begin fetching early, so we can use cached data in the Feed
  api.post.getAll.useQuery();

  // Usually the user will be loaded before the posts, so this case should not last long
  if (!userLoaded) return <div />;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
          <div className="flex border-b border-slate-400 p-4">
            {isSignedIn ? <CreatePostWizard /> : <SignInButton />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
}
