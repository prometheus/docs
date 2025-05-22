"use client";

import { Button, NumberFormatter, Pill, Stack } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/prometheus/prometheus")
      .then((res) => res.json())
      .then((data) => setStars(data.stargazers_count));
  }, []);

  return (
    <Stack align="center" gap="lg" my="lg">
      <Button
        component="a"
        href="https://github.com/prometheus/prometheus"
        target="_blank"
        size="lg"
        variant="light"
        leftSection={<IconBrandGithub />}
        w="fit-content"
      >
        Star us on GitHub
      </Button>
      <Pill fw="bold" size="md">
        {stars ? (
          <NumberFormatter value={stars} thousandSeparator suffix=" stars" />
        ) : (
          "Loading stars..."
        )}
      </Pill>
    </Stack>
  );
}
