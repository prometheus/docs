"use client";

import {
  Button,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  ScrollAreaAutosize,
} from "@mantine/core";
import { IconMenu2 } from "@tabler/icons-react";
import LeftNav from "./LeftNav";

export default function DocsMobileNav() {
  return (
    <Popover position="bottom" withArrow shadow="md">
      <PopoverTarget>
        <Button
          hiddenFrom="sm"
          variant="outline"
          mb="lg"
          leftSection={<IconMenu2 stroke={1.5} />}
          color="light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-4))"
          fw="normal"
          bd="1px solid var(--mantine-color-gray-5)"
        >
          Show nav
        </Button>
      </PopoverTarget>
      <PopoverDropdown mah="calc(100vh - var(--header-height) - var(--header-to-content-margin))">
        <ScrollAreaAutosize
          mah="calc(80vh - var(--header-height))"
          type="never"
        >
          <LeftNav />
        </ScrollAreaAutosize>
      </PopoverDropdown>
    </Popover>
  );
}
