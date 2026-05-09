"use client";

import { useState } from "react";
import { Composer } from "./Composer";
import { Feed } from "./Feed";
import type { PostWithVariants } from "@/lib/persist-post";

interface AppProps {
  initialPosts: PostWithVariants[];
  tenant: { id: string; slug: string; name: string };
}

export function App({ initialPosts, tenant }: AppProps) {
  const [tab, setTab] = useState<"compose" | "feed">(
    initialPosts.length > 0 ? "feed" : "compose",
  );
  const [posts, setPosts] = useState<PostWithVariants[]>(initialPosts);

  function handleSaved(saved: PostWithVariants) {
    setPosts((prev) => [saved, ...prev]);
    setTab("feed");
  }

  function patchVariant(variantId: string, patch: any) {
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        variants: p.variants.map((v) =>
          v.id === variantId ? { ...v, ...patch } : v,
        ),
      })),
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Syndication</h1>
          <p className="text-sm text-gray-500 mt-2">
            Tenant: <span className="font-mono">{tenant.slug}</span> · One post
            in, five platform-tailored variants out. Each variant publishes
            independently.
          </p>
        </div>
        <div className="flex gap-2">
          <TabButton
            label="Feed"
            active={tab === "feed"}
            onClick={() => setTab("feed")}
            count={posts.length}
          />
          <TabButton
            label="Compose"
            active={tab === "compose"}
            onClick={() => setTab("compose")}
          />
        </div>
      </header>
      {tab === "compose" ? (
        <Composer onSaved={handleSaved} />
      ) : (
        <Feed posts={posts} onPatch={patchVariant} />
      )}
    </div>
  );
}

function TabButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={props.onClick}
      className={`px-3 py-1.5 rounded text-sm border ${
        props.active
          ? "bg-black text-white border-black"
          : "bg-white text-gray-700 border-gray-300"
      }`}
    >
      {props.label}
      {props.count !== undefined && (
        <span className={props.active ? "text-gray-300 ml-1" : "text-gray-400 ml-1"}>
          {props.count}
        </span>
      )}
    </button>
  );
}
