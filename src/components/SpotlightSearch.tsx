"use client";

import { Spotlight } from "@mantine/spotlight";
import { IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Divider, Group, Highlight, Loader, Space } from "@mantine/core";
import React, { useState, useEffect } from "react";
import { decode } from "html-entities";

// Extend Window interface to include pagefind
declare global {
  interface Window {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    pagefind: any;
  }
}

const SearchResult = ({
  query,
  result,
}: {
  query: string;
  result: PagefindResult;
}) => {
  const [data, setData] = useState<PagefindResultData | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await result.data();
        setData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, [result]);

  if (data === null) {
    return (
      <Group justify="center" my="sm">
        <Loader size="sm" color="gray" variant="dots" />
      </Group>
    );
  }

  return (
    <Spotlight.ActionsGroup
      label={data.meta.breadcrumbs || data.meta.title || "No page title"}
    >
      <Space h="xs" />
      {data.sub_results.slice(0, 4).map((subResult, subIdx) => (
        <Spotlight.Action
          key={subIdx}
          id={`${result.id}-${subIdx}`}
          onClick={() => {
            router.push(
              subResult.url.replace(/(\/[^?#]+)\.html(?=[?#]|$)/, "$1")
            );
          }}
        >
          <Group
            gap="xs"
            align="flex-start"
            w="100%"
            style={{ wordBreak: "break-word" }}
          >
            <Highlight
              highlight={query}
              fw="bold"
              fz="sm"
              flex={1}
              display="block"
            >
              {subResult.title}
            </Highlight>
            <Highlight
              highlight={query}
              size="xs"
              display="block"
              opacity={0.7}
              flex={2}
            >
              {decode(subResult.excerpt.replace(/<\/?mark>/g, ""))}
            </Highlight>
          </Group>
        </Spotlight.Action>
      ))}
    </Spotlight.ActionsGroup>
  );
};

type PagefindSubResult = {
  title: string;
  url: string;
  excerpt: string;
  anchor?: {
    element: string;
    id: string;
    text: string;
    location: number;
  };
};

type PagefindResultData = {
  url: string;
  content: string;
  excerpt: string;
  meta: {
    title: string;
    breadcrumbs?: string;
  };
  sub_results: PagefindSubResult[];
};

type PagefindResult = {
  id: string;
  score: number;
  words: string[];
  data: () => Promise<PagefindResultData>;
};

export default function SpotlightSearch() {
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState<PagefindResult[]>([]);

  useEffect(() => {
    async function loadPagefind() {
      if (typeof window.pagefind === "undefined") {
        try {
          window.pagefind = await import(
            // @ts-expect-error pagefind.js generated after build
            /* webpackIgnore: true */ "/pagefind/pagefind.js"
          );
          await window.pagefind.options({
            ranking: {
              pageLength: 0,
            },
          });
        } catch (e) {
          window.pagefind = {
            debouncedSearch: () => ({
              results: [
                {
                  id: "error",
                  score: 0,
                  words: [],
                  data: () =>
                    Promise.resolve({
                      url: "",
                      content: "",
                      excerpt: "",
                      meta: {
                        title: `Error importing pagefind.js`,
                      },
                      sub_results: [
                        {
                          title: "Error",
                          url: "",
                          excerpt: `NOTE: Search only works with a static build, not in dev mode. Error: ${e}`,
                        },
                      ],
                    }),
                },
              ],
            }),
          };
        }
      }
    }
    loadPagefind();
  }, []);

  return (
    <Spotlight.Root
      size="xl"
      maxHeight="90vh"
      scrollable
      onQueryChange={async (query) => {
        const search = await window.pagefind.debouncedSearch(query);
        if (search === null) {
          // A more recent search call has been made, nothing to do.
          return;
        }
        setResults(search.results as PagefindResult[]);
        setActiveQuery(query);
      }}
    >
      <Spotlight.Search
        placeholder="Search..."
        leftSection={<IconSearch stroke={1.5} />}
      />
      <Spotlight.ActionsList>
        {results.length > 0 ? (
          results.map((result, idx) => (
            // The result ID can be the same between search terms and is not sufficient
            // as a React key, see https://github.com/CloudCannon/pagefind/issues/816
            <React.Fragment key={`${activeQuery}-${result.id}`}>
              {idx > 0 && <Divider my="xs" />}
              <SearchResult query={activeQuery} result={result} />
            </React.Fragment>
          ))
        ) : (
          <Spotlight.Empty>
            {activeQuery.trim() === ""
              ? "Type to search the documentation and blog content..."
              : "Nothing found..."}
          </Spotlight.Empty>
        )}
      </Spotlight.ActionsList>
    </Spotlight.Root>
  );
}
