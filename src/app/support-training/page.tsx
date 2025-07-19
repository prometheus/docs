import { getPageMetadata } from "@/page-metadata";
import {
  Title,
  Text,
  Image,
  Card,
  CardProps,
  SimpleGrid,
  Button,
  Stack,
} from "@mantine/core";
import { Metadata } from "next";

export const metadata: Metadata = getPageMetadata({
  pageTitle: "Support & Training",
  pageDescription:
    "Support and training providers for the Prometheus monitoring system and time series database.",
  pagePath: "/support-training/",
});

type ProviderCardProps = {
  name: string;
  logo?: string;
  url: string;
  cardProps?: CardProps;
  aspectRatio?: string;
};

const trainingProviders: ProviderCardProps[] = [
  {
    name: "Linux Foundation",
    logo: "/assets/commercial-support-logos/linux-foundation.png",
    url: "https://training.linuxfoundation.org/training/monitoring-systems-and-services-with-prometheus-lfs241/",
  },
  {
    name: "PromLabs",
    logo: "/assets/commercial-support-logos/promlabs.svg",
    url: "https://training.promlabs.com/",
  },
  {
    name: "Robust Perception",
    logo: "/assets/commercial-support-logos/robust-perception.png",
    url: "https://training.robustperception.io/",
  },
  {
    name: "acend",
    logo: "/assets/commercial-support-logos/acend.svg",
    url: "https://acend.ch/en/trainings/prometheus/",
  },
  {
    name: "KodeKloud",
    logo: "/assets/commercial-support-logos/kodekloud-logo.svg",
    url: "https://kodekloud.com/courses/prometheus-certified-associate-pca/",
  },
];

const commercialSupportProviders: ProviderCardProps[] = [
  {
    name: "Container Solutions",
    logo: "/assets/commercial-support-logos/container-solutions.svg",
    url: "https://www.container-solutions.com/",
    cardProps: {
      bg: "light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))",
    },
  },
  {
    name: "Cloudraft",
    logo: "/assets/commercial-support-logos/cloudraft.png",
    url: "https://cloudraft.io/",
  },
  {
    name: "Fullstaq",
    logo: "/assets/commercial-support-logos/fullstaq.png",
    url: "https://fullstaq.com/",
  },
  {
    name: "Grafana Labs",
    logo: "/assets/commercial-support-logos/grafana-labs.svg",
    url: "https://grafana.com/oss/prometheus/",
  },
  {
    name: "InfraCloud",
    logo: "/assets/commercial-support-logos/infracloud.svg",
    url: "https://www.infracloud.io/prometheus-commercial-support/",
  },
  {
    name: "IT-Schulungen.com",
    logo: "/assets/commercial-support-logos/it-schulungen.png",
    url: "https://www.it-schulungen.com/seminare/netzwerktechnologien/prometheus/index.html",
  },
  {
    name: "LabyrinthLabs",
    logo: "/assets/commercial-support-logos/lablabs.svg",
    url: "https://lablabs.io/",
  },
  {
    name: "Martina Ferrari (Independent Contractor)",
    url: "https://tina.pm/",
  },
  {
    name: "CGI",
    logo: "/assets/commercial-support-logos/cgi.png",
    url: "https://www.cgi.com/en",
  },
  {
    name: "O11y",
    logo: "/assets/commercial-support-logos/o11y.svg",
    url: "https://o11y.eu/prometheus-support/",
  },
  {
    name: "OpenObserve",
    logo: "/assets/commercial-support-logos/openobserve.png",
    url: "https://openobserve.ai",
  },
  {
    name: "PlatformEngineers.io",
    logo: "/assets/commercial-support-logos/platformengineers.png",
    url: "https://platformengineers.io/",
  },
  {
    name: "PromLabs",
    logo: "/assets/commercial-support-logos/promlabs.svg",
    url: "https://promlabs.com/",
  },
  {
    name: "Puzzle ITC",
    logo: "/assets/commercial-support-logos/puzzle.svg",
    url: "https://www.puzzle.ch/de/prometheus",
  },
  {
    name: "Robust Perception",
    logo: "/assets/commercial-support-logos/robust-perception.png",
    url: "https://www.robustperception.io/",
  },
  {
    name: "SentinelFox",
    logo: "/assets/commercial-support-logos/sentinelfox.svg",
    url: "https://sentinelfox.com/services/observability/prometheus/",
  },
  {
    name: "Sysdig",
    logo: "/assets/commercial-support-logos/sysdig.svg",
    url: "https://sysdig.com/solutions/prometheus-monitoring/",
  },
  {
    name: "Tasrie IT Services",
    logo: "/assets/commercial-support-logos/tasrie-it-services.png",
    url: "https://tasrieit.com/cloudnativeconsulting/",
  },
  {
    name: "xamira networks",
    logo: "/assets/commercial-support-logos/xamira_networks.png",
    url: "https://www.xamira.de/en/technologies/monitoring/",
  },
];

function ProviderCard({
  name,
  logo,
  url,
  cardProps,
  aspectRatio = "2/1",
}: ProviderCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      style={{ textDecoration: "none" }}
    >
      <Card
        withBorder
        style={{
          display: "flex",
          justifyContent: "center",
          aspectRatio,
        }}
        bg="light-dark(white, var(--mantine-color-dark-2))"
        {...cardProps}
      >
        {logo ? (
          <Image src={logo} alt={`${name} logo`} />
        ) : (
          <Text fz="sm" ta="center">
            {name}
          </Text>
        )}
      </Card>
    </a>
  );
}

export default function SupportTrainingPage() {
  return (
    <>
      <Title order={1}>Support and Training</Title>
      <Text>
        This page lists organizations and companies that provide support,
        training, or other services around Prometheus. This list is provided in
        alphabetical order.
      </Text>
      <Title order={2}>Certifications</Title>
      <Card
        withBorder
        bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
      >
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }}>
          <ProviderCard
            name="PCA"
            logo="/assets/certification-logos/pca-logo.png"
            url="https://www.cncf.io/training/certification/pca/"
            aspectRatio="1/1"
          />
        </SimpleGrid>
      </Card>
      <Text mt="lg">
        <strong>Note:</strong> While the Linux Foundation as the trademark owner
        is the only organization offering an official certification exam for
        Prometheus, there are multiple independent training providers (listed
        below) that can help you prepare for the PCA certification.
      </Text>

      <Title order={2} mt={65}>
        Courses and Trainings
      </Title>

      <Card
        withBorder
        bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
      >
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }}>
          {trainingProviders.map((provider) => (
            <ProviderCard key={provider.name} {...provider} />
          ))}
        </SimpleGrid>
      </Card>

      <Title order={2} mt={65}>
        Commercial support
      </Title>
      <Card
        withBorder
        bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
      >
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }}>
          {commercialSupportProviders.map((provider) => (
            <ProviderCard key={provider.name} {...provider} />
          ))}
        </SimpleGrid>
      </Card>

      <Title order={2} mt={65}>
        Add a resource
      </Title>
      <Stack gap="xl">
        <Text>
          If you are a training provider or a company that provides commercial
          support for Prometheus and would like to be listed here, please open a
          pull request to add yourself to the list.
        </Text>
        <Button
          size="xl"
          component="a"
          href="https://github.com/prometheus/docs"
          target="_blank"
          w="fit-content"
          m="auto"
        >
          Add your company
        </Button>
      </Stack>
    </>
  );
}
