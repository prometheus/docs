"use client";

import {
  Anchor,
  type AnchorProps,
  Button,
  type ButtonProps,
  Card,
  type CardProps,
  Image,
  type ImageProps,
  type PolymorphicComponentProps,
} from "@mantine/core";
import Link from "next/link";
import NextImage from "next/image";

// Client-only wrappers around Mantine's polymorphic components. Next.js 16 /
// React 19 no longer allow passing a component (a function) as a prop across
// the server/client boundary, so the `component={Link}` / `component={NextImage}`
// pattern has to live inside a Client Component. These small wrappers let the
// surrounding pages stay Server Components.

export function LinkAnchor(
  props: PolymorphicComponentProps<typeof Link, AnchorProps>
) {
  return <Anchor {...props} component={Link} />;
}

export function LinkButton(
  props: PolymorphicComponentProps<typeof Link, ButtonProps>
) {
  return <Button {...props} component={Link} />;
}

export function LinkCard(
  props: PolymorphicComponentProps<typeof Link, CardProps>
) {
  return <Card {...props} component={Link} />;
}

export function NextMantineImage(
  props: PolymorphicComponentProps<typeof NextImage, ImageProps>
) {
  // `alt` is provided by callers and forwarded via `props`, but eslint can't
  // statically see it through the spread.
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} component={NextImage} />;
}
