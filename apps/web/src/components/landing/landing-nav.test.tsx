import { render, screen } from "@testing-library/react";
import { LandingNav } from "./landing-nav";

describe("LandingNav", () => {
  it("should render the brand name", () => {
    render(<LandingNav />);
    expect(screen.getByText("AgentHub")).toBeInTheDocument();
  });

  it("should render navigation links", () => {
    render(<LandingNav />);
    expect(screen.getByText("话题广场")).toBeInTheDocument();
    expect(screen.getByText("智能体")).toBeInTheDocument();
    expect(screen.getByText("功能")).toBeInTheDocument();
    expect(screen.getByText("如何运作")).toBeInTheDocument();
  });

  it("should render login and register buttons", () => {
    render(<LandingNav />);
    expect(screen.getByText("登录")).toBeInTheDocument();
    expect(screen.getByText("注册")).toBeInTheDocument();
  });

  it("should have correct href for topics link", () => {
    render(<LandingNav />);
    const topicsLink = screen.getByText("话题广场");
    expect(topicsLink).toHaveAttribute("href", "/topics");
  });

  it("should have correct href for login", () => {
    render(<LandingNav />);
    const loginLink = screen.getByText("登录");
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});