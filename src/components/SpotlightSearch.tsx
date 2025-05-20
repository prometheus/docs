"use client";

import { Spotlight } from "@mantine/spotlight";
import { IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Divider, Group, Highlight, Loader, Space, Text } from "@mantine/core";
import React, { useState, useEffect } from "react";
import { decode } from "html-entities";

// Extend Window interface to include pagefind
declare global {
  interface Window {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
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
    <Spotlight.ActionsGroup label={data.meta.title}>
      <Space h="xs" />
      {data.sub_results.slice(0, 4).map((subResult, subIdx) => (
        <Spotlight.Action
          key={`${result.id}-${subIdx}`}
          id={`${result.id}-${subIdx}`}
          label={subResult.title}
          description={subResult.excerpt}
          onClick={() => {
            router.push(
              subResult.url.replace(/(\/[^?#]+)\.html(?=[?#]|$)/, "$1")
            );
          }}
        >
          <Group wrap="nowrap" gap="xs" align="flex-start" w="100%">
            <Highlight
              highlight={query}
              fw="bold"
              fz="sm"
              w="30%"
              display="block"
            >
              {subResult.title}
            </Highlight>
            <Highlight
              highlight={query}
              size="xs"
              display="block"
              opacity={0.7}
              flex="1"
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
  const [searchInput, setSearchInput] = useState("");
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
            search: () => ({
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
        setSearchInput(query);
        console.log("searching for", query);
        const search = await window.pagefind.debouncedSearch(query);
        if (search === null) {
          // A more recent search call has been made, nothing to do.
          console.log("search cancelled");
          return;
        }
        console.log(`Found ${search.results.length} results`);
        setResults(search.results as PagefindResult[]);
      }}
    >
      <Spotlight.Search
        placeholder="Search..."
        leftSection={<IconSearch stroke={1.5} />}
      />
      <Spotlight.ActionsList>
        {results.length > 0 ? (
          results.map((result, idx) => (
            <React.Fragment key={result.id}>
              |{result.id}|{idx > 0 && <Divider my="xs" />}
              <SearchResult query={searchInput} result={result} />
            </React.Fragment>
          ))
        ) : (
          <Spotlight.Empty>Nothing found...</Spotlight.Empty>
        )}
      </Spotlight.ActionsList>
    </Spotlight.Root>
  );
}
