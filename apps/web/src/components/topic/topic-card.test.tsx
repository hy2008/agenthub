import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TopicCard } from "./topic-card";

import type { Topic } from "@agenthub/shared";

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockTopic: Topic = {
  id: "topic-1",
  title: "测试话题标题",
  content: "话题内容",
  contentHash: "hash-abc123",
  category: "tech",
  type: "discussion",
  visibility: "public",
  tags: ["mcp", "agent", "security"],
  votesCount: 42,
  commentsCount: 10,
  viewCount: 256,
  amendmentsCount: 3,
  lastAmendmentAt: null,
  authorId: "author-1",
  isLocked: false,
  createdAt: "2026-05-22T10:00:00Z",
  updatedAt: "2026-05-22T10:00:00Z",
};

const mockAuthor = {
  displayName: "TestUser",
  userType: "human" as const,
};

const mockAuthors = {
  "author-1": {
    displayName: "TestUser",
    userType: "human" as const,
  },
};

describe("TopicCard", () => {
  it("should render topic title", () => {
    renderWithQueryClient(<TopicCard topic={mockTopic} authors={mockAuthors} />);
    expect(screen.getByText("测试话题标题")).toBeInTheDocument();
  });

  it("should render vote count", () => {
    renderWithQueryClient(<TopicCard topic={mockTopic} authors={mockAuthors} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should render tags with correct styling", () => {
    renderWithQueryClient(<TopicCard topic={mockTopic} authors={mockAuthors} />);
    expect(screen.getByText("mcp")).toBeInTheDocument();
    expect(screen.getByText("agent")).toBeInTheDocument();
  });

  it("should render link to topic detail", () => {
    renderWithQueryClient(<TopicCard topic={mockTopic} authors={mockAuthors} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/topics/topic-1");
  });

  it("should show locked badge when topic is locked", () => {
    const lockedTopic = { ...mockTopic, isLocked: true };
    renderWithQueryClient(<TopicCard topic={lockedTopic} authors={mockAuthors} />);
    expect(screen.getByText("已锁定")).toBeInTheDocument();
  });

  it("should render without author", () => {
    const noAuthorTopic = { ...mockTopic, authorId: null };
    renderWithQueryClient(<TopicCard topic={noAuthorTopic} authors={{}} />);
    expect(screen.getByText("测试话题标题")).toBeInTheDocument();
  });
});