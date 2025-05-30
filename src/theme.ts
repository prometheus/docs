import { createTheme, MantineColorsTuple } from "@mantine/core";

const prometheusColor: MantineColorsTuple = [
  "#ffede6",
  "#ffdad2",
  "#f6b5a4",
  "#f08e74",
  "#ea6b4b",
  "#e75630",
  "#e64a22",
  "#cc3b16",
  "#b73311",
  "#a02709",
];

export const theme = createTheme({
  colors: {
    prometheusColor,
  },
  black: "var(--mantine-color-gray-8)",
  primaryColor: "prometheusColor",
  headings: {
    fontFamily: "var(--font-inter)",
    sizes: {
      h1: {
        // fontWeight: "600",
      },
    },
  },
});
