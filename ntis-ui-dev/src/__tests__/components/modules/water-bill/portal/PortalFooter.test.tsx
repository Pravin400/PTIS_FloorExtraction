import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import PortalFooter, { formatSocialMediaUrl } from "@/components/modules/water-bill/portal/components/PortalFooter";
import { mockPortalConfig } from "./portalTestFixtures";

const t = (en: string, _local: string) => en;

describe("PortalFooter Component", () => {
  it("renders nothing when showFooter is false", () => {
    const config = { ...mockPortalConfig, footer: { ...mockPortalConfig.footer, showFooter: false } };
    const { container } = render(<PortalFooter config={config} lang="en" t={t} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the about section and copyright text", () => {
    render(<PortalFooter config={mockPortalConfig} lang="en" t={t} />);

    expect(screen.getByText("Panvel Municipal Corporation")).toBeInTheDocument();
    expect(
      screen.getByText("Official citizen services portal of Panvel Municipal Corporation.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Copyright © 2026 Panvel Municipal Corporation. All Rights Reserved.")
    ).toBeInTheDocument();
  });

  it("renders footer links sorted by displayOrder", () => {
    render(<PortalFooter config={mockPortalConfig} lang="en" t={t} />);

    expect(screen.getByText("Quick Links")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy").closest("a")).toHaveAttribute("href", "/privacy-policy");
    expect(screen.getByText("Disclaimer").closest("a")).toHaveAttribute("href", "/disclaimer");
  });

  it("renders the contact section with email and helpline", () => {
    render(<PortalFooter config={mockPortalConfig} lang="en" t={t} />);

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText(mockPortalConfig.contact.email)).toBeInTheDocument();
    expect(screen.getByText(mockPortalConfig.contact.helplineNo)).toBeInTheDocument();
  });

  it("renders social media links opening in a new tab for Facebook, Instagram, YouTube, and X", () => {
    const config = {
      ...mockPortalConfig,
      footer: {
        ...mockPortalConfig.footer,
        socialMedia: [
          {
            platform: "Facebook",
            icon: "facebook",
            url: "www.facebook.com",
          },
          {
            platform: "Instagram",
            icon: "instagram",
            url: "www.instagram.com",
          },
          {
            platform: "YouTube",
            icon: "youtube",
            url: "www.youtube.com",
          },
          {
            platform: "X",
            icon: "twitter",
            url: "https://twitter.com",
          },
        ],
      },
    };
    render(<PortalFooter config={config} lang="en" t={t} />);

    const fbLink = screen.getByLabelText("Facebook");
    expect(fbLink).toHaveAttribute("href", "https://www.facebook.com");
    expect(fbLink).toHaveAttribute("target", "_blank");
    expect(fbLink).toHaveAttribute("rel", "noopener noreferrer");

    const instaLink = screen.getByLabelText("Instagram");
    expect(instaLink).toHaveAttribute("href", "https://www.instagram.com");
    expect(instaLink).toHaveAttribute("target", "_blank");
    expect(instaLink).toHaveAttribute("rel", "noopener noreferrer");

    const youtubeLink = screen.getByLabelText("YouTube");
    expect(youtubeLink).toHaveAttribute("href", "https://www.youtube.com");
    expect(youtubeLink).toHaveAttribute("target", "_blank");
    expect(youtubeLink).toHaveAttribute("rel", "noopener noreferrer");

    const xLink = screen.getByLabelText("X");
    expect(xLink).toHaveAttribute("href", "https://twitter.com");
    expect(xLink).toHaveAttribute("target", "_blank");
    expect(xLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("hides social media links when showSocialMedia is false", () => {
    const config = {
      ...mockPortalConfig,
      footer: { ...mockPortalConfig.footer, showSocialMedia: false },
    };
    render(<PortalFooter config={config} lang="en" t={t} />);

    expect(screen.queryByLabelText("Facebook")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Instagram")).not.toBeInTheDocument();
  });

  it("handles empty or hash social media URLs without opening new tabs", () => {
    const config = {
      ...mockPortalConfig,
      footer: {
        ...mockPortalConfig.footer,
        socialMedia: [
          { platform: "Instagram", icon: "instagram", url: "" },
          { platform: "Facebook", icon: "facebook", url: "#" },
        ],
      },
    };
    render(<PortalFooter config={config} lang="en" t={t} />);

    const instaLink = screen.getByLabelText("Instagram");
    expect(instaLink).toHaveAttribute("href", "#");
    expect(instaLink).not.toHaveAttribute("target");
    expect(instaLink).not.toHaveAttribute("rel");

    const fbLink = screen.getByLabelText("Facebook");
    expect(fbLink).toHaveAttribute("href", "#");
    expect(fbLink).not.toHaveAttribute("target");
  });

  it("normalizes supported URLs to HTTPS and rejects invalid or unsafe URLs", () => {
    expect(formatSocialMediaUrl("www.facebook.com")).toBe("https://www.facebook.com");
    expect(formatSocialMediaUrl("//www.instagram.com/profile")).toBe("https://www.instagram.com/profile");
    expect(formatSocialMediaUrl("HTTP://www.youtube.com")).toBe("https://www.youtube.com");
    expect(formatSocialMediaUrl("https://twitter.com/example?source=portal")).toBe(
      "https://twitter.com/example?source=portal"
    );

    expect(formatSocialMediaUrl("javascript:alert(1)")).toBeNull();
    expect(formatSocialMediaUrl("data:text/html,unsafe")).toBeNull();
    expect(formatSocialMediaUrl("ftp://example.com")).toBeNull();
    expect(formatSocialMediaUrl("https://[invalid")).toBeNull();
    expect(formatSocialMediaUrl("https://user:password@example.com")).toBeNull();
    expect(formatSocialMediaUrl("")).toBeNull();
  });
});
